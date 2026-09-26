// A co-op AI player's tech under per-player tech. Every deal the host has
// recorded since the AI's last is settled on the host, in history order: the
// hand dealt as a viewer's would be, each card judged by what applying it
// does, then rerolled, taken, swapped or declined, and the result written to
// the AI's record in one patch. An AI with no basic land factory is assigned
// a T1 factory card in place of a hand. Only settled results are written, so
// a reload mid-decision reruns to the same result. See coop.md, "AI players'
// tech".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js",
], function (coopAiCards, coopAiEffects) {
  var LOG = "[GW COOP AI] ";
  // A deal not settled in this long falls back to a quick pick.
  var DECISION_TIMEOUT_MS = 20000;
  // A write the campaign queue has not run in this long is given up on.
  var WRITE_TIMEOUT_MS = 60000;
  // An AI whose decisions time out this often declines the rest of its deals
  // for the session.
  var DEGRADED_AFTER = 2;
  // A decision whose record changed before it was written is redone this
  // often at most in one pass.
  var MAX_REDOS = 3;

  // One line: PA's log keeps a console call's first argument only.
  var describe = function (error) {
    return (error && error.message) || String(error);
  };

  var timedOut = function (error) {
    return !!(error && error.gwoTimedOut);
  };

  var withTimeout = function (promise, ms, what) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        var error = new Error(what + " timed out after " + ms + "ms");
        error.gwoTimedOut = true;
        reject(error);
      }, ms);
      promise.then(
        function (value) {
          clearTimeout(timer);
          resolve(value);
        },
        function (error) {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  };

  // As the server stores a viewer's: plain data, and only the global tags,
  // since card-context tags are rebuilt by every apply.
  var storedInventory = function (saved) {
    var next = coopAiEffects.plain(saved);
    next.tags = { global: (next.tags && next.tags.global) || {} };
    return next;
  };

  var cardsOf = function (record) {
    return _.get(record, "inventory.cards") || [];
  };

  var commanderOf = function (record) {
    return (
      _.get(record, "inventory.tags.global.commander") ||
      (record && record.commander)
    );
  };

  // Whether the bank takes a card as it stands, as GWInventory.canFitCard
  // asks.
  var fits = function (applied, card) {
    return (
      !!(card && card.allowOverflow) ||
      (applied.cards || []).length < (applied.maxCards || 0)
    );
  };

  // Whether a swap's bank holds its cards: the deleted card must have freed
  // a slot, before any slot the incoming card adds.
  var holdsCards = function (swapped, incomingSlots) {
    return (
      (swapped.cards || []).length <= (swapped.maxCards || 0) - incomingSlots
    );
  };

  // The scored loadouts a draw takes from. used: under Unique AI loadouts,
  // the loadouts in use, left out unless that leaves none above 0.
  var loadoutPool = function (scored, used) {
    if (!used) {
      return { pool: scored };
    }
    var pool = _.reject(scored, function (entry) {
      return _.includes(used, entry.id);
    });
    return _.some(pool, function (entry) {
      return entry.total > 0;
    })
      ? { pool: pool }
      : { pool: scored, fullPool: true };
  };

  // params:
  // - records() - the AI records to serve now, slot order; empty outside a
  //   hosted per-player-tech session
  // - find(playerId) - that AI's record as it stands
  // - dealCount(record), hostDealCount(), entryFor(dealIndex) - the stock
  //   deal counters and history
  // - starAt(starIndex) - the galaxy star
  // - dealHand(params), rerollHand(params) - cards_coop_deal.js's and
  //   cards_coop_reroll.js's cores
  // - effects - a coop_ai_effects.js instance
  // - lookup() - the current shared/coop_ai_units.js lookup
  // - teamDomains(playerId, lookup) - the domains the AI's teammates field
  // - namesUnits(cardId), chanceOf(card, applied, star) - for a card with no
  //   effect to see
  // - isLoadout(cardId), rerollsRemain(rerollsUsed, cardsOffered)
  // - armyGap(units), armyGapClosable(gap, strippedUnits) - shared/ai.js's
  //   rule for an army that can fight
  // - factoryCards(record, applied) - the T1 factory card ids the AI may be
  //   assigned
  // - dealCard(cardId, applied, star) - resolves that card as dealt
  // - decisionRng(record, dealIndex, rerollsUsed), factoryRng(record,
  //   dealIndex)
  // - enqueue(label, apply) - the campaign state queue
  // - write(record, patch) - stores a patched copy, returns it or undefined
  // - canRun() - nothing the pass must wait for is in flight
  // - running - an observable the pass holds true
  // - afterPass() - saves and publishes; runs once per pass that wrote
  // - defer, decisionTimeoutMs, writeTimeoutMs - for tests
  var factory = function (params) {
    var defer = params.defer || _.defer;
    var decisionTimeoutMs = params.decisionTimeoutMs || DECISION_TIMEOUT_MS;
    var writeTimeoutMs = params.writeTimeoutMs || WRITE_TIMEOUT_MS;
    var timeouts = {};
    var running;
    var again = false;

    var later = function (step) {
      return new Promise(function (resolve) {
        defer(function () {
          resolve(step());
        });
      });
    };

    var owes = function (record) {
      return (
        !!record &&
        !!record.inventory &&
        params.dealCount(record) < params.hostDealCount()
      );
    };

    var clientOf = function (record) {
      return { id: record.playerId, name: record.gwaioAi.name };
    };

    var contextFor = function (record, lookup) {
      return {
        lookup: lookup,
        commander: commanderOf(record),
        teamDomains: params.teamDomains(record.playerId, lookup),
        memo: {},
      };
    };

    var cardContext = function (context, card, before, star) {
      return _.assign({}, context, {
        namesUnits: params.namesUnits(card.id),
        chance: function () {
          return params.chanceOf(card, before, star);
        },
      });
    };

    var scoreHand = function (record, hand, context, star) {
      var saved = record.inventory;
      return Promise.all(
        _.map(hand.cards, function (card, index) {
          var loadout = params.isLoadout(card.id);
          return params.effects
            .withCard(saved, card, loadout)
            .then(function (pair) {
              return _.assign(
                { index: index, id: card.id, card: card, loadout: loadout },
                coopAiCards.scoreCard(
                  pair[0],
                  pair[1],
                  cardContext(context, card, pair[0], star)
                )
              );
            });
        })
      );
    };

    // One held card's worth for a swap: what deleting it loses once the
    // incoming card is in. undefined when it cannot go: its deletion must
    // make room, and must open no gap the AI lacks now.
    var heldWorth = function (swap, card, index) {
      return params.effects
        .apply(
          coopAiEffects.addCard(
            coopAiEffects.removeCard(swap.saved, index),
            swap.incoming
          )
        )
        .then(function (swapped) {
          var gap = params.armyGap(swapped.units);
          if (
            !holdsCards(swapped, swap.incomingSlots) ||
            (gap && gap !== swap.gapNow)
          ) {
            return undefined;
          }
          return {
            index: index,
            id: card.id,
            total: coopAiCards.scoreCard(
              swapped,
              swap.after,
              cardContext(swap.context, card, swapped, swap.star)
            ).total,
          };
        });
    };

    // What each held card is worth for a swap with the incoming card. The
    // loadout in first place never goes. applied: the inventory as it
    // stands.
    var scoreHeld = function (record, context, star, incoming, applied) {
      var saved = record.inventory;
      return params.effects
        .apply(coopAiEffects.addCard(saved, incoming))
        .then(function (after) {
          var swap = {
            saved: saved,
            incoming: incoming,
            after: after,
            incomingSlots: Math.max(
              0,
              (after.maxCards || 0) - (applied.maxCards || 0)
            ),
            gapNow: params.armyGap(applied.units),
            context: context,
            star: star,
          };
          return Promise.all(
            _.map(cardsOf(record), function (card, index) {
              return index === 0 || params.isLoadout(card.id)
                ? undefined
                : heldWorth(swap, card, index);
            })
          );
        })
        .then(_.compact);
    };

    // The inventory a decision leaves, applied: nothing unapplied is written.
    var outcomeOf = function (record, decision, scored) {
      var chosen = _.find(scored, { index: decision.index });
      if (decision.action === "take") {
        return params.effects
          .apply(coopAiEffects.addCard(record.inventory, chosen.card))
          .then(function (applied) {
            return { inventory: applied };
          });
      }
      if (decision.action === "swap") {
        return params.effects
          .apply(
            coopAiEffects.addCard(
              coopAiEffects.removeCard(record.inventory, decision.deleteIndex),
              chosen.card
            )
          )
          .then(function (applied) {
            return { inventory: applied };
          });
      }
      return Promise.resolve({});
    };

    // A deal that finds no basic land factory assigns a T1 factory card in
    // place of a hand: the least the AI needs to fight. Resolves the outcome,
    // or undefined to deal a hand as usual, having logged why.
    var assignFactory = function (record, entry, applied, star, live) {
      var line =
        LOG +
        record.gwaioAi.name +
        " deal=" +
        entry.dealIndex +
        " star=" +
        entry.star +
        " ";
      var dealingHand = function (why) {
        console.log(
          line + "no basic land factory, " + why + ": dealing a hand"
        );
        return undefined;
      };
      var ids = params.factoryCards(record, applied);
      if (!ids.length) {
        return Promise.resolve(dealingHand("no factory card to assign"));
      }
      var rng = params.factoryRng(record, entry.dealIndex);
      var id = rng ? rng.pick(ids) : _.sample(ids);

      return Promise.resolve(params.dealCard(id, applied, star)).then(
        function (card) {
          live();
          if (!fits(applied, card)) {
            return dealingHand("no room for " + id);
          }
          return params.effects
            .apply(coopAiEffects.addCard(record.inventory, card))
            .then(function (inventory) {
              live();
              if (params.armyGap(inventory.units) === "landFactory") {
                return dealingHand("still none with " + id);
              }
              console.log(
                line + "-> assigned " + id + " (no basic land factory)"
              );
              return { inventory: inventory };
            });
        },
        function (error) {
          console.error(
            line +
              "no basic land factory, " +
              id +
              " not dealt: " +
              describe(error) +
              ": dealing a hand"
          );
          return undefined;
        }
      );
    };

    // The hand the AI settles on, rerolled while its best card is poor.
    // Resolves the outcome to write. progress.hand tracks the hand in play,
    // for the fallback, and progress.abandoned ends a decision that is over.
    var decideDeal = function (record, entry, lookup, progress) {
      var star = params.starAt(entry.star);
      var client = clientOf(record);
      var context;
      var applied;

      // A decision that timed out stops at its next step, so it queues no
      // apply or reroll ahead of the next deal's, and logs no choice that is
      // never written.
      var live = function () {
        if (progress.abandoned) {
          throw new Error("deal " + entry.dealIndex + " abandoned");
        }
      };

      var judge = function (hand) {
        live();
        progress.hand = hand;
        // As cards_coop_reroll.js counts them: a thin deck deals a short
        // hand, and each card it lacks counts as a reroll spent.
        var rerollsUsed = Math.max(
          hand.rerollsUsed || 0,
          (hand.cardsOffered || 0) - (hand.cards || []).length
        );
        var decide = function (scored, held) {
          return coopAiCards.decide({
            scored: scored,
            rerollsLeft: params.rerollsRemain(rerollsUsed, hand.cardsOffered)
              ? 1
              : 0,
            rerollsUsed: rerollsUsed,
            fullness: applied.maxCards
              ? (applied.cards || []).length / applied.maxCards
              : 1,
            roomFor: function (card) {
              return fits(applied, card.card);
            },
            held: held,
            rng: params.decisionRng(record, entry.dealIndex, rerollsUsed),
          });
        };

        return scoreHand(record, hand, context, star).then(function (scored) {
          live();
          var first = decide(scored, []);
          var decided =
            first.action === "decline" && first.reason === "bank full"
              ? scoreHeld(
                  record,
                  context,
                  star,
                  _.find(scored, { index: first.index }).card,
                  applied
                ).then(function (held) {
                  return decide(scored, held);
                })
              : Promise.resolve(first);

          return decided.then(function (decision) {
            live();
            console.log(
              coopAiCards.describeHand({
                name: client.name,
                deal: entry.dealIndex,
                star: entry.star,
                via: lookup.via,
                scored: scored,
                decision: decision,
              })
            );

            if (decision.action === "reroll") {
              return Promise.resolve(
                params.rerollHand({
                  record: record,
                  client: client,
                  pendingTechCards: hand,
                  star: star,
                })
              ).then(function (rerolled) {
                return judge(rerolled.pendingTechCards);
              });
            }
            return outcomeOf(record, decision, scored);
          });
        });
      };

      return params.effects
        .apply(record.inventory)
        .then(function (inventory) {
          live();
          applied = inventory;
          context = contextFor(record, lookup);
          return params.armyGap(applied.units) === "landFactory"
            ? assignFactory(record, entry, applied, star, live)
            : undefined;
        })
        .then(function (assigned) {
          live();
          if (assigned) {
            return assigned;
          }
          return Promise.resolve(
            params.dealHand({
              client: client,
              record: record,
              dealIndex: entry.dealIndex,
              starIndex: entry.star,
              star: star,
            })
          ).then(judge);
        });
    };

    // After a timeout or an error: the first card that fits, if its apply
    // lands, else nothing but the deal counted.
    var fallback = function (record, entry, hand) {
      var cards = (hand && hand.cards) || [];
      var pick = _.find(cards, function (card) {
        return !params.isLoadout(card.id);
      });
      if (!pick) {
        return Promise.resolve({ summary: "declined (fallback, no card)" });
      }

      return params.effects
        .apply(record.inventory)
        .then(function (applied) {
          if (!fits(applied, pick)) {
            return { summary: "declined (fallback, bank full)" };
          }
          return params.effects
            .apply(coopAiEffects.addCard(record.inventory, pick))
            .then(function (inventory) {
              return {
                inventory: inventory,
                summary: "took " + pick.id + " (fallback)",
              };
            });
        })
        .then(null, function (error) {
          return {
            summary: "declined (fallback failed: " + describe(error) + ")",
          };
        });
    };

    var settle = function (record, entry, lookup) {
      var name = record.gwaioAi.name;
      var progress = {};

      if ((timeouts[record.playerId] || 0) >= DEGRADED_AFTER) {
        console.log(
          LOG +
            name +
            " deal=" +
            entry.dealIndex +
            " -> declined (timed out " +
            DEGRADED_AFTER +
            " times this session)"
        );
        return Promise.resolve({});
      }

      return withTimeout(
        Promise.resolve().then(function () {
          return decideDeal(record, entry, lookup, progress);
        }),
        decisionTimeoutMs,
        "deal " + entry.dealIndex
      ).then(null, function (error) {
        progress.abandoned = true;
        if (timedOut(error)) {
          timeouts[record.playerId] = (timeouts[record.playerId] || 0) + 1;
        }
        return fallback(record, entry, progress.hand).then(function (outcome) {
          console.error(
            LOG +
              name +
              " deal=" +
              entry.dealIndex +
              " fell back: " +
              describe(error) +
              " -> " +
              outcome.summary
          );
          return outcome;
        });
      });
    };

    // Runs in the campaign state queue, where every host record write runs.
    // Resolves "written", or why not: the AI is gone, the deal was settled
    // meanwhile, or its cards changed under the decision ("stale").
    var commit = function (record, dealIndex, outcome) {
      var queued = new Promise(function (resolve) {
        params.enqueue("gwo_coop_ai_deal", function () {
          try {
            var fresh = params.find(record.playerId);
            if (!fresh) {
              resolve("gone");
              return;
            }
            var count = params.dealCount(fresh);
            if (count >= dealIndex) {
              resolve("settled");
              return;
            }
            if (!_.isEqual(cardsOf(fresh), cardsOf(record))) {
              resolve("stale");
              return;
            }

            var patch = { techCardDealCount: Math.max(count, dealIndex) };
            if (outcome.inventory) {
              patch.inventory = storedInventory(outcome.inventory);
            }
            resolve(params.write(fresh, patch) ? "written" : "refused");
          } catch (error) {
            console.error(LOG + "write failed: " + describe(error));
            resolve("failed");
          }
        });
      });

      return withTimeout(queued, writeTimeoutMs, "write").then(
        null,
        function () {
          return "stalled";
        }
      );
    };

    // One owed deal, decided and written. Resolves whether the AI moved on,
    // redoing a decision whose record changed under it.
    var settleDeal = function (playerId, lookup, redos) {
      var record = params.find(playerId);
      if (!owes(record)) {
        return Promise.resolve(false);
      }

      var dealIndex = params.dealCount(record) + 1;
      var entry = params.entryFor(dealIndex);
      var decided;

      if (!entry || !_.isNumber(entry.star) || !params.starAt(entry.star)) {
        console.error(
          LOG +
            record.gwaioAi.name +
            " deal=" +
            dealIndex +
            " is not in the host's history -> declined"
        );
        decided = Promise.resolve({});
      } else {
        decided = settle(record, entry, lookup);
      }

      return decided
        .then(function (outcome) {
          return commit(record, dealIndex, outcome);
        })
        .then(function (result) {
          if (result === "written" || result === "settled") {
            return true;
          }
          if (result === "stale" && redos < MAX_REDOS) {
            return settleDeal(playerId, lookup, redos + 1);
          }
          console.error(
            LOG +
              record.gwaioAi.name +
              " deal=" +
              dealIndex +
              " not written: " +
              result
          );
          return false;
        });
    };

    // Every deal the AI owes, one at a time, yielding between them.
    var serveAi = function (playerId, lookup) {
      var wrote = false;
      var next = function () {
        return later(function () {
          return settleDeal(playerId, lookup, 0);
        }).then(function (moved) {
          if (!moved) {
            return wrote;
          }
          wrote = true;
          return next();
        });
      };
      return next();
    };

    var run = function () {
      if (running) {
        again = true;
        return running;
      }
      if (!params.canRun()) {
        return Promise.resolve(false);
      }

      var owing = _.pluck(_.filter(params.records(), owes), "playerId");
      if (!owing.length) {
        return Promise.resolve(false);
      }

      var lookup = params.lookup();
      var wroteAny = false;
      params.running(true);
      running = _.reduce(
        owing,
        function (chain, playerId) {
          return chain
            .then(function () {
              return serveAi(playerId, lookup);
            })
            .then(function (wrote) {
              wroteAny = wroteAny || wrote;
            });
        },
        Promise.resolve()
      )
        .then(function () {
          return wroteAny ? params.afterPass() : undefined;
        })
        .then(null, function (error) {
          console.error(LOG + "pass failed: " + describe(error));
        })
        .then(function () {
          running = undefined;
          params.running(false);
          if (again) {
            again = false;
            return run();
          }
          return wroteAny;
        });

      return running;
    };

    // The loadout a new AI starts with: every candidate built and scored
    // against the base start card, less those it could never fight with,
    // and one drawn by score from its loadout stream. options: name,
    // candidates (ids), build(id) (resolves the unapplied starting
    // inventory, General Commander's Sub Commanders included), baseline (the
    // same with the base start card alone), commander, teamDomains, rng, and
    // under Unique AI loadouts used (the loadouts in use). Resolves
    // { loadoutCardId, inventory }.
    var chooseStartingLoadout = function (options) {
      var lookup = params.lookup();
      var context = {
        lookup: lookup,
        commander: options.commander,
        teamDomains: options.teamDomains,
        memo: {},
      };
      var dropped = [];

      var scoreCandidate = function (before, id) {
        return Promise.resolve()
          .then(function () {
            return options.build(id);
          })
          .then(function (saved) {
            return params.effects.apply(saved);
          })
          .then(function (after) {
            var gap = params.armyGap(after.units);
            if (gap && !params.armyGapClosable(gap, after.strippedUnits)) {
              dropped.push({ id: id, gap: gap });
              return undefined;
            }
            return _.assign(
              { id: id, inventory: after },
              coopAiCards.scoreLoadout(
                before,
                after,
                _.assign({ namesUnits: false, chance: 0 }, context)
              )
            );
          })
          .then(null, function (error) {
            console.error(
              LOG +
                options.name +
                " loadout " +
                id +
                " not built: " +
                describe(error)
            );
            return undefined;
          });
      };

      return params.effects
        .apply(options.baseline)
        .then(function (before) {
          return _.reduce(
            options.candidates,
            function (chain, id) {
              return chain.then(function (scored) {
                return scoreCandidate(before, id).then(function (entry) {
                  return entry ? scored.concat(entry) : scored;
                });
              });
            },
            Promise.resolve([])
          );
        })
        .then(function (scored) {
          var drawn = loadoutPool(scored, options.used);
          var chosen = coopAiCards.chooseLoadout(drawn.pool, options.rng);
          console.log(
            coopAiCards.describeLoadouts({
              name: options.name,
              via: lookup.via,
              scored: scored,
              pool: drawn.pool,
              dropped: dropped,
              used: options.used,
              fullPool: drawn.fullPool,
              chosen: chosen && chosen.id,
            })
          );
          if (!chosen) {
            throw new Error("no starting loadout could be chosen");
          }
          return {
            loadoutCardId: chosen.id,
            inventory: storedInventory(chosen.inventory),
          };
        });
    };

    return {
      run: run,
      owes: owes,
      chooseStartingLoadout: chooseStartingLoadout,
    };
  };

  factory.storedInventory = storedInventory;

  return factory;
});
