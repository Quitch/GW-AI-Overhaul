// The Guardians fight with every player's tech (gw_play/referee_game_files.js
// guardianMods), so a co-op AI player's held card can help them more than it
// helps the AI. This module says when The Guardians are the last boss, and
// what a card's mods and AI mods are worth to them. Pure. See coop.md,
// "Before The Guardians".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
], function (coopAiCards) {
  var COMMANDER = "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";
  // The ops a second identical copy adds nothing to: spec ops
  // (gw_play/specs.js), and AI-mod ops (gw_play/referee_ai.js aiModOps,
  // where a load's file is written once however often it is loaded).
  var NON_STACKING = ["replace", "merge", "tag", "pull", "clone"];
  var NON_STACKING_AI = ["load", "replace", "unset", "remove", "silence"];
  var MAX_CACHED = 16;

  // ais: every star's ai().
  var last = function (ais) {
    var standing = _.compact(ais);
    return (
      _.some(standing, "mirrorMode") &&
      !_.some(standing, function (ai) {
        return ai.boss && !ai.mirrorMode;
      })
    );
  };

  var opIn = function (mod, ops) {
    return !!mod && _.includes(ops, mod.op);
  };

  // A filter of mods: each one whose op is in ops and that an identical mod
  // in supplied already gives is dropped. It returns mods itself where none
  // is.
  var heldBy = function (supplied, ops) {
    var given = {};
    _.forEach(supplied || [], function (mod) {
      if (opIn(mod, ops)) {
        given[JSON.stringify(mod)] = true;
      }
    });
    var none = _.isEmpty(given);
    return function (mods) {
      if (none) {
        return mods;
      }
      var kept = _.reject(mods || [], function (mod) {
        return opIn(mod, ops) && given[JSON.stringify(mod)] === true;
      });
      return kept.length === (mods || []).length ? mods : kept;
    };
  };

  var held = function (mods, supplied, ops) {
    return heldBy(supplied, ops)(mods);
  };

  // The Guardians as the scorer's fielded view: every unit, all of them
  // reached, and the mods and AI mods of the inventory it is handed, less
  // those the humans give them already (human: the mods and aiMods of the
  // host and the connected viewers). With no units, minions or slots of
  // their own, a card's worth to them is its mods and AI mods alone.
  // raceView: the host race's shared/coop_ai_fielded.js view, which lands
  // the mods as the referee does. everyCopy: the view without human.
  var view = function (units, raceView, human) {
    var heldMods = heldBy(human && human.mods, NON_STACKING);
    var heldAiMods = heldBy(human && human.aiMods, NON_STACKING_AI);
    var copies = [];

    var land = function (saved) {
      return raceView ? raceView.inventory(saved) : saved;
    };

    // The saved inventory less the humans' mods, compared before landing:
    // landing depends on the units held. One copy per inventory, so the
    // race view's cache keeps it. The AI mods are aimed with every mod.
    var unheld = function (saved) {
      var hit = _.find(
        copies,
        // By instance, not by the deep equality the shorthand would use.
        // eslint-disable-next-line lodash/matches-prop-shorthand
        function (entry) {
          return entry.saved === saved;
        }
      );
      if (hit) {
        return hit.copy;
      }
      var mods = heldMods(saved.mods);
      var copy =
        mods === saved.mods ? saved : _.assign({}, saved, { mods: mods });
      copies.push({ saved: saved, copy: copy });
      if (copies.length > MAX_CACHED) {
        copies.shift();
      }
      return copy;
    };

    var guardians = {
      inventory: function (applied) {
        var landed = land(applied);
        var copy = unheld(applied);
        return {
          units: units,
          mods: (copy === applied ? landed : land(copy)).mods || [],
          aiMods: heldAiMods(landed.aiMods) || [],
          minions: [],
          cards: [],
          maxCards: 0,
          strippedUnits: [],
          removedUnits: [],
        };
      },
      obtainable: [],
      reachable: _.identity,
    };
    guardians.everyCopy = human ? view(units, raceView) : guardians;
    return guardians;
  };

  // What a held card is worth to the Guardians: without and withCard are
  // the applied inventories either side of it.
  var gain = function (guardians, without, withCard, lookup) {
    return coopAiCards.scoreCard(without, withCard, {
      lookup: lookup,
      commander: COMMANDER,
      teamDomains: [],
      memo: {},
      fielded: guardians,
      fixedUnits: true,
      namesUnits: true,
      chance: 0,
    }).total;
  };

  // One log line per prune: each held card judged, its worth to the AI and
  // to the Guardians, and what the AI deleted or kept.
  var describePrune = function (params) {
    var refused = _.map(params.refused, function (entry) {
      return entry.id + " (" + entry.why + ")";
    });
    return (
      "[GW COOP AI] " +
      params.name +
      " prune deal=" +
      params.deal +
      " via=" +
      params.via +
      " threshold=" +
      params.threshold +
      " held: " +
      (_.map(params.judged, function (card) {
        return (
          card.id +
          "=" +
          card.worth +
          " (guardians " +
          card.gain +
          (card.humanHeld ? ", human-held" : "") +
          ")"
        );
      }).join(", ") || "none") +
      " -> " +
      (params.deleted.length
        ? "deleted " + params.deleted.join(", ")
        : "kept all") +
      (refused.length ? " kept " + refused.join(", ") : "")
    );
  };

  return {
    COMMANDER: COMMANDER,
    NON_STACKING: NON_STACKING,
    NON_STACKING_AI: NON_STACKING_AI,
    last: last,
    held: held,
    view: view,
    gain: gain,
    describePrune: describePrune,
  };
});
