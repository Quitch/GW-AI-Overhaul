// Co-op AI players' pings. Whenever the war settles, an AI that cares where the
// players go next pings the star it wants, and the host pings for it. Each AI
// judges a star's card as it would judge it in a hand, and weighs it against
// the star's threat as the intelligence panel shows it. See coop.md, "AI
// pings".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
], function (coopAiCards) {
  var LOG = "[GW COOP AI] ";
  // How much a star's threat counts against its card, both as a share of the
  // largest among the candidates.
  var THREAT_WEIGHT = 0.6;
  // A card worth this much is one an AI wants: about a factory's unlock.
  var PING_WANT = coopAiCards.WEIGHTS.classes.Factory;
  // A lead this large over the runner-up makes a clear favourite.
  var PING_LEAD = 0.25;
  // The first AI settles this long after a window opens, and each after it
  // this much later, so the pings do not land together.
  var FIRST_DELAY_MS = 1500;
  var STAGGER_MS = 1200;
  // An AI pings a new star only this long after its last ping.
  var REPING_MS = 20000;
  // A refused ping is tried again this much later, and a settle is retried
  // at most this often in one window.
  var REFUSED_RETRY_MS = 5000;
  var MAX_RETRIES = 3;

  var round = function (value) {
    return Math.round(value * 100) / 100;
  };

  // The stars an AI may ping: the treasure planet only when it is the only
  // one. list: [{ star, hops, threat, treasure }].
  var pickCandidates = function (list) {
    var ordinary = _.reject(list, "treasure");
    return ordinary.length ? ordinary : list;
  };

  // Each candidate scored: its card's value less THREAT_WEIGHT of its threat,
  // both as a share of the largest among the candidates. Best first, then the
  // nearer, then the lower index. candidates: [{ star, hops, threat, value }].
  var rank = function (candidates) {
    var topValue = _.max([0].concat(_.pluck(candidates, "value")));
    var topThreat = _.max([0].concat(_.pluck(candidates, "threat")));

    return _.map(candidates, function (candidate) {
      var value = topValue > 0 ? Math.max(candidate.value, 0) / topValue : 0;
      var threat = topThreat > 0 ? candidate.threat / topThreat : 0;
      return _.assign({}, candidate, {
        score: round(value - THREAT_WEIGHT * threat),
      });
    }).sort(function (a, b) {
      return b.score - a.score || a.hops - b.hops || a.star - b.star;
    });
  };

  var median = function (values) {
    var sorted = _.sortBy(values);
    var middle = Math.floor(sorted.length / 2);
    if (!sorted.length) {
      return 0;
    }
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  };

  // Why an AI pings its best star - "wants" its card, or has a clear "lead" -
  // or undefined when it does not care. A lone candidate is a clear favourite
  // only when it is less threatening than the median AI star. allThreats:
  // every AI star's threat.
  var reasonToPing = function (ranked, allThreats) {
    var best = ranked[0];
    if (!best) {
      return undefined;
    }
    if (best.value >= PING_WANT) {
      return "wants";
    }
    if (ranked.length > 1) {
      return best.score - ranked[1].score >= PING_LEAD ? "lead" : undefined;
    }
    return best.threat < median(allThreats) ? "lead" : undefined;
  };

  // A short, stable digest of the cards the AIs would find, so that a
  // re-deal of the stars' cards opens a new window. entries: strings.
  var cardsDigest = function (entries) {
    var text = entries.join("|");
    var hash = 5381;
    for (var i = 0; i < text.length; i++) {
      hash = (hash * 33 + text.charCodeAt(i)) % 4294967296;
    }
    return hash.toString(36);
  };

  // A window is the quiet stretch after a turn, a move, a deal, or a re-deal
  // of the stars' cards.
  var windowKey = function (turns, currentStar, hostDealCount, cards) {
    return (
      turns +
      ":" +
      currentStar +
      ":" +
      hostDealCount +
      (cards ? ":" + cards : "")
    );
  };

  // One line: PA's log keeps a console call's first argument only.
  var describe = function (name, key, ranked, outcome) {
    return (
      LOG +
      name +
      " ping window " +
      key +
      " candidates: " +
      (ranked.length
        ? _.map(ranked, function (candidate) {
            return (
              candidate.star +
              "=" +
              candidate.score +
              " (" +
              (candidate.card || "no card") +
              " " +
              round(candidate.value) +
              ", threat " +
              candidate.threat +
              ", hops " +
              candidate.hops +
              ")"
            );
          }).join(", ")
        : "none") +
      " -> " +
      outcome
    );
  };

  var describeError = function (error) {
    return String((error && error.message) || error);
  };

  // What a card is worth to an AI, judged as it would judge it in a hand.
  // judge: effects (a coop_ai_effects.js instance), lookup(),
  // teamDomains(playerId, lookup), namesUnits(cardId), chanceOf(card,
  // applied, star), isLoadout(cardId). holder: { playerId, inventory,
  // commander }, the saved inventory the card is judged against. star: the
  // galaxy star itself, which a card's deal() takes. memo: shared by the
  // cards an AI judges in one window.
  var valueOfCard = function (judge, holder, card, star, memo) {
    var lookup = judge.lookup();
    if (!lookup || !holder.inventory) {
      return Promise.resolve(0);
    }
    return judge.effects
      .withCard(holder.inventory, card, judge.isLoadout(card.id))
      .then(function (pair) {
        return coopAiCards.scoreCard(pair[0], pair[1], {
          lookup: lookup,
          commander: holder.commander,
          teamDomains: judge.teamDomains(holder.playerId, lookup),
          memo: memo || {},
          namesUnits: judge.namesUnits(card.id),
          chance: function () {
            return judge.chanceOf(card, pair[0], star);
          },
        }).total;
      });
  };

  // params:
  // - ais() - [{ id, name }], the AI players in the session, slot order
  // - windowKey(), windowOpen() - the current window, and whether the war is
  //   quiet enough to ping in it
  // - candidates() - [{ star, hops, threat }], the stars an AI may ping
  // - allThreats() - every AI star's threat
  // - cardFor(ai, star) - the card the AI would find there, if any
  // - valueOf(ai, card, star, memo) - its worth to the AI, or a promise of it
  // - ping(star, sender) - true when the ping went out
  // - delay(fn, ms), now() - for tests
  var factory = function (params) {
    var delay = params.delay || _.delay;
    var now = params.now || _.now;
    // Per AI: the window it last settled, and its last ping's star and time.
    var last = {};
    // Per AI, the window it is settling, and the retries it has made in it.
    var settling = {};
    var retries = {};
    // The stars pinged in a window, and by whom.
    var claimed = {};
    var claimedWindow;
    var current;

    var judge = function (ai) {
      var memo = {};
      return Promise.all(
        _.map(params.candidates(), function (candidate) {
          var card = params.cardFor(ai, candidate.star);
          if (!card) {
            return _.assign({ value: 0 }, candidate);
          }
          var scored = function (value) {
            return _.assign({ value: value, card: card.id }, candidate);
          };
          return Promise.resolve()
            .then(function () {
              return params.valueOf(ai, card, candidate.star, memo);
            })
            .then(scored, function () {
              return scored(0);
            });
        })
      ).then(rank);
    };

    var decide = function (ai, ranked, key) {
      var best = ranked[0];
      var reason = reasonToPing(ranked, params.allThreats());
      var mine = last[ai.id] || {};

      if (!best) {
        return { text: "no ping (no star)" };
      }
      if (!reason) {
        return { text: "no ping (indifferent)" };
      }
      if (claimed[best.star]) {
        return {
          text: "no ping (" + claimed[best.star] + " pinged " + best.star + ")",
        };
      }
      if (mine.star === best.star) {
        return { text: "no ping (pinged " + best.star + " already)" };
      }
      // Tried again once the wait is over, in the same window.
      if (_.isNumber(mine.at) && now() - mine.at < REPING_MS) {
        return {
          text: "no ping (pinged " + mine.star + " too recently)",
          retryIn: mine.at + REPING_MS - now(),
        };
      }
      if (!params.ping(best.star, { id: ai.id, name: ai.name })) {
        return { text: "no ping (refused)", retryIn: REFUSED_RETRY_MS };
      }
      claimed[best.star] = ai.name;
      last[ai.id] = { star: best.star, at: now(), window: key };
      return { text: "ping " + best.star + " (" + reason + ")" };
    };

    var stillOpen = function (key) {
      return (
        current === key && params.windowOpen() && params.windowKey() === key
      );
    };

    // A promise throughout, so a throw anywhere is logged, not left loose in a
    // timer. The AI is read again when it settles: its record may have been
    // rewritten, or the AI kicked, since the settle was scheduled. Resolves
    // with how long to wait before trying again, if the AI is to.
    var settle = function (scheduled, key) {
      return Promise.resolve().then(function () {
        var ai = _.find(params.ais(), { id: scheduled.id });
        if (!ai || !stillOpen(key)) {
          return undefined;
        }
        return judge(ai).then(function (ranked) {
          // Judging takes time, and the war may have moved on meanwhile.
          if (!stillOpen(key)) {
            return undefined;
          }
          var decision = decide(ai, ranked, key);
          console.log(describe(ai.name, key, ranked, decision.text));

          var tried = retries[ai.id];
          var count = tried && tried.window === key ? tried.count : 0;
          if (_.isNumber(decision.retryIn) && count < MAX_RETRIES) {
            retries[ai.id] = { window: key, count: count + 1 };
            return decision.retryIn;
          }
          last[ai.id] = _.assign({}, last[ai.id], { window: key });
          return undefined;
        });
      });
    };

    var schedule = function (ai, key, wait) {
      settling[ai.id] = key;
      delay(function () {
        settle(ai, key)
          .then(null, function (error) {
            console.error(
              LOG + ai.name + " ping failed: " + describeError(error)
            );
          })
          .then(function (retryIn) {
            if (_.isNumber(retryIn)) {
              schedule(ai, key, retryIn);
            } else if (settling[ai.id] === key) {
              delete settling[ai.id];
            }
          });
      }, wait);
    };

    // Called whenever anything the window depends on changes. A window runs
    // once for each AI, an AI added while it is open included; one closed
    // before an AI settled reopens for it.
    var update = function () {
      if (!params.windowOpen()) {
        current = undefined;
        return;
      }
      var key = params.windowKey();
      if (claimedWindow !== key) {
        claimed = {};
        claimedWindow = key;
      }
      current = key;

      _.forEach(params.ais(), function (ai, index) {
        var mine = last[ai.id];
        if ((mine && mine.window === key) || settling[ai.id] === key) {
          return;
        }
        schedule(ai, key, FIRST_DELAY_MS + STAGGER_MS * index);
      });
    };

    return { update: update };
  };

  factory.THREAT_WEIGHT = THREAT_WEIGHT;
  factory.PING_WANT = PING_WANT;
  factory.PING_LEAD = PING_LEAD;
  factory.FIRST_DELAY_MS = FIRST_DELAY_MS;
  factory.STAGGER_MS = STAGGER_MS;
  factory.REPING_MS = REPING_MS;
  factory.REFUSED_RETRY_MS = REFUSED_RETRY_MS;
  factory.MAX_RETRIES = MAX_RETRIES;
  factory.pickCandidates = pickCandidates;
  factory.rank = rank;
  factory.median = median;
  factory.reasonToPing = reasonToPing;
  factory.cardsDigest = cardsDigest;
  factory.windowKey = windowKey;
  factory.describe = describe;
  factory.valueOfCard = valueOfCard;

  return factory;
});
