// A co-op AI player's tech under per-player tech. Every deal the host has
// recorded since the AI's last is settled on the host, in history order: the
// hand dealt as a viewer's would be, each card judged by what applying it
// does, then rerolled, taken, swapped or declined, and the result written to
// the AI's record in one patch. An AI with no basic land factory is assigned
// a T1 factory card in place of a hand. Only settled results are written, so
// a reload mid-decision reruns to the same result. While The Guardians are
// the last boss, an AI also deletes the held cards worth little to it that
// help them, and takes no such card in a deal. See coop.md, "AI players'
// tech".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_guardians.js",
], function (coopAiCards, coopAiEffects, gwoPromise, coopAiGuardians) {
  var LOG = "[GW COOP AI] ";
  // A deal not settled in this long falls back to a quick pick.
  var DECISION_TIMEOUT_MS = 20000;
  // A write the campaign queue has not run in this long is given up on.
  var WRITE_TIMEOUT_MS = 60000;
  // An AI whose decisions time out this often declines the rest of its deals
  // for the session.
  var DEGRADED_AFTER = 2;
  // A decision whose record changed before it was written is redone this
  // often at most for each deal.
  var MAX_REDOS = 3;

  // One line: PA's log keeps a console call's first argument only.
  var describe = function (error) {
    return (error && error.message) || String(error);
  };

  var timedOut = function (error) {
    return !!(error && error.gwoTimedOut);
  };

  var withTimeout = gwoPromise.within;

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
  var fullnessOf = function (applied) {
    return applied.maxCards
      ? (applied.cards || []).length / applied.maxCards
      : 1;
  };

  var holdsCards = function (swapped, incomingSlots) {
    return (
      (swapped.cards || []).length <= (swapped.maxCards || 0) - incomingSlots
    );
  };

  var overflowOf = function (applied) {
    return Math.max(0, (applied.cards || []).length - (applied.maxCards || 0));
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

  // params: see coop.md, "Settling deals".
  var factory = function (params) {
    var defer = params.defer || _.defer;
    var decisionTimeoutMs = params.decisionTimeoutMs || DECISION_TIMEOUT_MS;
    var fieldedFor = params.fielded || _.constant(Promise.resolve());
    var writeTimeoutMs = params.writeTimeoutMs || WRITE_TIMEOUT_MS;
    var holdSave = params.holdSave || _.constant(_.noop);
    var guardiansLast = params.guardiansLast || _.constant(false);
    var guardianView =
      params.guardianView ||
      function (lookup) {
        return Promise.resolve(coopAiGuardians.view(lookup.obtainable || []));
      };
    var canDelete = params.canDelete || _.constant(true);
    var timeouts = {};
    var running;
    var again = false;

    // A throw from step rejects, so the pass still ends.
    var later = function (step) {
      return new Promise(function (resolve) {
        defer(function () {
          resolve(Promise.resolve().then(step));
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

    var prunedAt = function (record) {
      return _.get(record, "gwaioAi.guardiansPrunedAt");
    };

    // Whether the AI has yet to judge its held cards against The Guardians
    // at its deal count.
    var owesPrune = function (record) {
      return (
        !!record &&
        !!record.inventory &&
        !owes(record) &&
        prunedAt(record) !== params.dealCount(record) &&
        guardiansLast()
      );
    };

    var clientOf = function (record) {
      return { id: record.playerId, name: record.gwaioAi.name };
    };

    // Resolves the scoring context for the AI's hands.
    var contextFor = function (record, lookup) {
      return fieldedFor(record.inventory, lookup).then(function (fielded) {
        return {
          lookup: lookup,
          commander: commanderOf(record),
          teamDomains: params.teamDomains(record.playerId, lookup),
          memo: {},
          fielded: fielded,
        };
      });
    };

    // The debug lines' via: how the AI's units were judged.
    var viaOf = function (context) {
      return context.fielded ? "fielded" : context.lookup.via;
    };

    var cardContext = function (context, card, before, star) {
      return _.assign({}, context, {
        namesUnits: params.namesUnits(card.id),
        chance: function () {
          return params.chanceOf(card, before, star);
        },
      });
    };

    // A card's worth to the AI as the prune scores it: no deal chance.
    var pruneContext = function (context) {
      return _.assign({}, context, { namesUnits: false, chance: 0 });
    };

    var deletable = function (card, index) {
      return index > 0 && !params.isLoadout(card.id) && canDelete(card);
    };

    // Whether the prune would pick the card, last in withCard, as one to
    // delete: deletable, worth less than the threshold to the AI, more than
    // nothing to the Guardians (gain), and a deletion that holds. The greedy
    // pass may still keep it.
    var pruneWouldPick = function (card, without, withCard, context, gain) {
      return (
        gain > 0 &&
        deletable(card, (withCard.cards || []).length - 1) &&
        !deletionRefusal(withCard, without, params.armyGap(withCard.units)) &&
        coopAiCards.scoreCard(without, withCard, pruneContext(context)).total <
          coopAiCards.rerollThreshold(fullnessOf(withCard), 0)
      );
    };

    // While The Guardians are last: the card's worth to them, and, for a card
    // the bank has room for, whether the prune would delete it once taken.
    // A card that needs a swap is judged once the swap is chosen
    // (judgeSwap).
    var markForGuardians = function (scored, pair, context, guardians) {
      var without = pair[0];
      var withCard = pair[1];
      scored.guardians = coopAiGuardians.gain(
        guardians,
        without,
        withCard,
        context.lookup
      );
      scored.wouldPrune =
        fits(without, scored.card) &&
        pruneWouldPick(
          scored.card,
          without,
          withCard,
          context,
          scored.guardians
        );
      return scored;
    };

    // Whether the prune would delete a swap's incoming card from the bank
    // the swap leaves.
    var judgeSwap = function (record, decision, chosen, context, guardians) {
      var removed = coopAiEffects.removeCard(
        record.inventory,
        decision.deleteIndex
      );
      return Promise.all([
        params.effects.apply(removed),
        params.effects.apply(coopAiEffects.addCard(removed, chosen.card)),
      ]).then(function (pair) {
        return pruneWouldPick(
          chosen.card,
          pair[0],
          pair[1],
          context,
          coopAiGuardians.gain(guardians, pair[0], pair[1], context.lookup)
        );
      });
    };

    // guardians: their view while they are last, else undefined.
    var scoreHand = function (record, hand, context, star, guardians) {
      var saved = record.inventory;
      return Promise.all(
        _.map(hand.cards, function (card, index) {
          var loadout = params.isLoadout(card.id);
          return params.effects
            .withCard(saved, card, loadout)
            .then(function (pair) {
              var scored = _.assign(
                { index: index, id: card.id, card: card, loadout: loadout },
                coopAiCards.scoreCard(
                  pair[0],
                  pair[1],
                  cardContext(context, card, pair[0], star)
                )
              );
              return guardians
                ? markForGuardians(scored, pair, context, guardians)
                : scored;
            });
        })
      );
    };

    // The Guardians' view for a deal while they are last, else undefined. A
    // view that fails leaves the hand judged as at any other time.
    var dealGuardians = function (record, entry, lookup) {
      if (!guardiansLast()) {
        return Promise.resolve(undefined);
      }
      return Promise.resolve()
        .then(function () {
          return guardianView(lookup);
        })
        .then(null, function (error) {
          console.error(
            LOG +
              record.gwaioAi.name +
              " deal=" +
              entry.dealIndex +
              " judged without the Guardians: " +
              describe(error)
          );
          return undefined;
        });
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
      var assignDealt = function (card) {
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
      };

      return Promise.resolve(params.dealCard(id, applied, star)).then(
        assignDealt,
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
      var guardians;

      // A decision that timed out stops at its next step, so it queues no
      // apply or reroll ahead of the next deal's, and logs no choice that is
      // never written.
      var live = function () {
        if (progress.abandoned) {
          throw new Error("deal " + entry.dealIndex + " abandoned");
        }
      };

      var roomFor = function (card) {
        return fits(applied, card.card);
      };

      // Logs the decision on a hand, then rerolls or settles it.
      var act = function (hand, scored, decision) {
        live();
        console.log(
          coopAiCards.describeHand({
            name: client.name,
            deal: entry.dealIndex,
            star: entry.star,
            via: viaOf(context),
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
      };

      var judge = function (hand) {
        live();
        progress.hand = hand;
        progress.scored = undefined;
        // A thin deck deals a short hand, and each card it lacks counts as a
        // reroll spent.
        var rerollsUsed = Math.max(
          hand.rerollsUsed || 0,
          params.computeRerollDeal(
            hand.cardsOffered || 0,
            (hand.cards || []).length
          ).rerollsUsed
        );
        var decide = function (scored, held) {
          return coopAiCards.decide({
            scored: scored,
            rerollsLeft: params.rerollsRemain(rerollsUsed, hand.cardsOffered)
              ? 1
              : 0,
            rerollsUsed: rerollsUsed,
            fullness: fullnessOf(applied),
            roomFor: roomFor,
            held: held,
            rng: params.decisionRng(record, entry.dealIndex, rerollsUsed),
          });
        };

        return scoreHand(record, hand, context, star, guardians).then(
          function (scored) {
            progress.scored = scored;
            return settleOn(scored, decide).then(_.partial(act, hand, scored));
          }
        );
      };

      // The decision on a scored hand. decide(scored, held) is the hand's.
      var settleOn = function (scored, decide) {
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
              ).then(_.partial(decide, scored))
            : Promise.resolve(first);

        return decided.then(function (decision) {
          return settleSwap(decision, scored, decide);
        });
      };

      // While The Guardians are last, a swap whose incoming card the prune
      // would delete marks that card, and the hand is decided again.
      var settleSwap = function (decision, scored, decide) {
        if (!guardians || decision.action !== "swap") {
          return decision;
        }
        var chosen = _.find(scored, { index: decision.index });
        return judgeSwap(record, decision, chosen, context, guardians).then(
          function (pruned) {
            if (!pruned) {
              return decision;
            }
            chosen.wouldPrune = true;
            return settleOn(scored, decide);
          }
        );
      };

      var dealAndJudge = function () {
        return dealGuardians(record, entry, lookup)
          .then(function (view) {
            live();
            guardians = view;
            return params.dealHand({
              client: client,
              record: record,
              dealIndex: entry.dealIndex,
              starIndex: entry.star,
              star: star,
            });
          })
          .then(judge);
      };

      return params.effects
        .apply(record.inventory)
        .then(function (inventory) {
          live();
          applied = inventory;
          return contextFor(record, lookup);
        })
        .then(function (built) {
          live();
          context = built;
          return params.armyGap(applied.units) === "landFactory"
            ? assignFactory(record, entry, applied, star, live)
            : undefined;
        })
        .then(function (assigned) {
          live();
          if (assigned) {
            return assigned;
          }
          return dealAndJudge();
        });
    };

    // After a timeout or an error: the first card that fits, if its apply
    // lands, else nothing but the deal counted. A card the prune would
    // delete, where the hand got that far, is passed over.
    var fallback = function (record, entry, progress) {
      var cards = (progress.hand && progress.hand.cards) || [];
      var pick = _.find(cards, function (card, index) {
        return (
          !params.isLoadout(card.id) &&
          !_.some(progress.scored, { index: index, wouldPrune: true })
        );
      });
      if (!pick) {
        return Promise.resolve({ summary: "declined (fallback, no card)" });
      }

      var takeIfRoom = function (applied) {
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
      };

      return params.effects
        .apply(record.inventory)
        .then(takeIfRoom)
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
        return fallback(record, entry, progress).then(function (outcome) {
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
    // Resolves "written", or why not: the AI is gone, or refusal(fresh)'s
    // reason, such as "settled" when the write was made meanwhile, or
    // "stale" when the record changed under the decision.
    var commitPatch = function (record, label, refusal, patchOf) {
      var queued = new Promise(function (resolve) {
        params.enqueue(label, function () {
          try {
            var fresh = params.find(record.playerId);
            if (!fresh) {
              resolve("gone");
              return;
            }
            var refused = refusal(fresh);
            if (refused) {
              resolve(refused);
              return;
            }
            resolve(
              params.write(fresh, patchOf(fresh)) ? "written" : "refused"
            );
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

    var commit = function (record, dealIndex, outcome) {
      return commitPatch(
        record,
        "gwo_coop_ai_deal",
        function (fresh) {
          if (params.dealCount(fresh) >= dealIndex) {
            return "settled";
          }
          return _.isEqual(cardsOf(fresh), cardsOf(record))
            ? undefined
            : "stale";
        },
        function () {
          var patch = { techCardDealCount: dealIndex };
          if (outcome.inventory) {
            patch.inventory = storedInventory(outcome.inventory);
          }
          return patch;
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

    // Why a deletion cannot stand: it leaves more cards without a slot than
    // the bank has now, or opens a gap the AI lacks now. undefined when it can.
    var deletionRefusal = function (applied, next, gapNow) {
      if (overflowOf(next) > overflowOf(applied)) {
        return "slots";
      }
      var gap = params.armyGap(next.units);
      return gap && gap !== gapNow ? gap : undefined;
    };

    // The held cards the AI deletes before The Guardians: each worth less to
    // it than a reroll's threshold and more than nothing to the Guardians,
    // judged against the inventory as it stands, then deleted one at a time,
    // most help to the Guardians first, while each deletion still holds and
    // the card is still worth less than the threshold once those before it
    // are gone. Resolves the outcome to write. For a timeout, progress.result
    // holds the deletions accepted so far, and progress.line(deleted) the
    // prune's log line.
    var decidePrune = function (record, lookup, progress) {
      var saved = record.inventory;
      var applied;
      var context;
      var guardians;
      var threshold;
      var gapNow;
      var refused = [];

      var live = function () {
        if (progress.abandoned) {
          throw new Error("prune abandoned");
        }
      };

      var judgeHeld = function (card, index) {
        return params.effects
          .apply(coopAiEffects.removeCard(saved, index))
          .then(function (without) {
            live();
            var why = deletionRefusal(applied, without, gapNow);
            var judged = {
              index: index,
              id: card.id,
              worth: coopAiCards.scoreCard(without, applied, context).total,
              gain: coopAiGuardians.gain(guardians, without, applied, lookup),
            };
            judged.candidate = judged.worth < threshold && judged.gain > 0;
            judged.humanHeld =
              judged.worth < threshold &&
              judged.gain <= 0 &&
              !!guardians.everyCopy &&
              guardians.everyCopy !== guardians &&
              coopAiGuardians.gain(
                guardians.everyCopy,
                without,
                applied,
                lookup
              ) > 0;
            if (judged.candidate && why) {
              judged.candidate = false;
              refused.push({ id: card.id, why: why });
            }
            return judged;
          });
      };

      var deleteGreedily = function (candidates) {
        var deleted = [];
        var current = applied;
        var accept = function (candidate, next) {
          live();
          var worth = coopAiCards.scoreCard(next, current, context).total;
          var why =
            deletionRefusal(applied, next, gapNow) ||
            (worth < threshold ? undefined : "worth " + worth);
          if (why) {
            refused.push({ id: candidate.id, why: why });
            return;
          }
          deleted.push(candidate);
          current = next;
          progress.result = { deleted: deleted, inventory: current };
        };
        var tryDeleting = function (candidate) {
          live();
          var indices = _.pluck(deleted, "index").concat(candidate.index);
          return params.effects
            .apply(coopAiEffects.removeCard(saved, indices))
            .then(_.partial(accept, candidate));
        };
        return _.reduce(
          candidates,
          function (chain, candidate) {
            return chain.then(_.partial(tryDeleting, candidate));
          },
          Promise.resolve()
        ).then(function () {
          return { deleted: deleted, inventory: current };
        });
      };

      return params.effects
        .apply(saved)
        .then(function (inventory) {
          live();
          applied = inventory;
          threshold = coopAiCards.rerollThreshold(fullnessOf(applied), 0);
          gapNow = params.armyGap(applied.units);
          return Promise.all([
            contextFor(record, lookup),
            guardianView(lookup),
          ]);
        })
        .then(function (built) {
          live();
          context = pruneContext(built[0]);
          guardians = built[1];
          return Promise.all(
            _.map(cardsOf(record), function (card, index) {
              return deletable(card, index)
                ? judgeHeld(card, index)
                : undefined;
            })
          );
        })
        .then(function (results) {
          live();
          var judged = _.compact(results);
          var candidates = _.sortByOrder(
            _.filter(judged, "candidate"),
            ["gain", "worth", "index"],
            [false, true, true]
          );
          progress.line = function (deleted) {
            return coopAiGuardians.describePrune({
              name: record.gwaioAi.name,
              deal: params.dealCount(record),
              via: viaOf(context),
              threshold: threshold,
              judged: judged,
              deleted: _.pluck(deleted, "id"),
              refused: refused,
            });
          };
          return deleteGreedily(candidates);
        })
        .then(function (result) {
          live();
          console.log(progress.line(result.deleted));
          return pruneOutcome(result);
        });
    };

    // What a prune writes: the inventory its deletions leave, if any.
    var pruneOutcome = function (result) {
      return result.deleted.length ? { inventory: result.inventory } : {};
    };

    var settlePrune = function (record, lookup) {
      var name = record.gwaioAi.name;
      var progress = {};

      if ((timeouts[record.playerId] || 0) >= DEGRADED_AFTER) {
        console.log(
          LOG +
            name +
            " prune -> kept all (timed out " +
            DEGRADED_AFTER +
            " times this session)"
        );
        return Promise.resolve({});
      }

      return withTimeout(
        Promise.resolve().then(function () {
          return decidePrune(record, lookup, progress);
        }),
        decisionTimeoutMs,
        "prune"
      ).then(null, function (error) {
        progress.abandoned = true;
        if (timedOut(error)) {
          timeouts[record.playerId] = (timeouts[record.playerId] || 0) + 1;
          if (progress.result) {
            console.log(progress.line(progress.result.deleted));
            console.error(
              LOG +
                name +
                " " +
                describe(error) +
                " -> deleted " +
                _.pluck(progress.result.deleted, "id").join(", ") +
                " (greedy pass unfinished)"
            );
            return pruneOutcome(progress.result);
          }
        }
        console.error(
          LOG + name + " prune fell back: " + describe(error) + " -> kept all"
        );
        return {};
      });
    };

    // An owed prune, decided and written with the deal count it was judged
    // at. Resolves whether the AI moved on, redoing a decision whose record
    // changed under it.
    var prune = function (playerId, lookup, redos) {
      var record = params.find(playerId);
      if (!owesPrune(record)) {
        return Promise.resolve(false);
      }
      var count = params.dealCount(record);

      return settlePrune(record, lookup)
        .then(function (outcome) {
          return commitPatch(
            record,
            "gwo_coop_ai_prune",
            function (fresh) {
              if (prunedAt(fresh) === params.dealCount(fresh)) {
                return "settled";
              }
              return params.dealCount(fresh) === count &&
                _.isEqual(cardsOf(fresh), cardsOf(record))
                ? undefined
                : "stale";
            },
            function (fresh) {
              var patch = {
                gwaioAi: _.assign({}, fresh.gwaioAi, {
                  guardiansPrunedAt: count,
                }),
              };
              if (outcome.inventory) {
                patch.inventory = storedInventory(outcome.inventory);
              }
              return patch;
            }
          );
        })
        .then(function (result) {
          if (result === "written" || result === "settled") {
            return true;
          }
          if (result === "stale" && redos < MAX_REDOS) {
            return prune(playerId, lookup, redos + 1);
          }
          console.error(
            LOG + record.gwaioAi.name + " prune not written: " + result
          );
          return false;
        });
    };

    var run = function () {
      if (running) {
        again = true;
        return running;
      }
      if (!params.canRun()) {
        return Promise.resolve(false);
      }

      var owing = _.pluck(
        _.filter(params.records(), function (record) {
          return owes(record) || owesPrune(record);
        }),
        "playerId"
      );
      if (!owing.length) {
        return Promise.resolve(false);
      }

      var lookup = params.lookup();
      var wroteAny = false;
      var releaseSave = holdSave();
      var noteWrote = function (wrote) {
        wroteAny = wroteAny || wrote;
      };
      var serveEach = function (serve) {
        return _.reduce(
          owing,
          function (chain, playerId) {
            return chain
              .then(_.partial(serve, playerId, lookup))
              .then(noteWrote);
          },
          Promise.resolve()
        );
      };
      var pruneAi = function (playerId) {
        return later(function () {
          return prune(playerId, lookup, 0);
        });
      };
      params.running(true);
      running = serveEach(serveAi)
        .then(function () {
          return serveEach(pruneAi);
        })
        .then(function () {
          return wroteAny ? params.afterPass() : undefined;
        })
        .then(null, function (error) {
          console.error(LOG + "pass failed: " + describe(error));
        })
        .then(function () {
          running = undefined;
          params.running(false);
          releaseSave();
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
      var context;
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

      // The candidates scored so far, and `id` once it scores.
      var scoreNext = function (before, id, scored) {
        return scoreCandidate(before, id).then(function (entry) {
          return entry ? scored.concat(entry) : scored;
        });
      };

      return fieldedFor(options.baseline, lookup)
        .then(function (fielded) {
          context = {
            lookup: lookup,
            commander: options.commander,
            teamDomains: options.teamDomains,
            memo: {},
            fielded: fielded,
          };
          return params.effects.apply(options.baseline);
        })
        .then(function (before) {
          return _.reduce(
            options.candidates,
            function (chain, id) {
              return chain.then(_.partial(scoreNext, before, id));
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
              via: viaOf(context),
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
      owesPrune: owesPrune,
      chooseStartingLoadout: chooseStartingLoadout,
    };
  };

  factory.storedInventory = storedInventory;

  return factory;
});
