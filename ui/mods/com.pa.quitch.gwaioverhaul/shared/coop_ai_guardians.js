// The Guardians fight with every player's tech (gw_play/referee_game_files.js
// guardianMods), so a co-op AI player's held card can help them more than it
// helps the AI. This module says when The Guardians are the last boss, and
// what a card's mods and AI mods are worth to them. Pure. See coop.md,
// "Before The Guardians".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
], function (coopAiCards) {
  var COMMANDER = "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";

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

  // The Guardians as the scorer's fielded view: every unit, all of them
  // reached, and the mods and AI mods of the inventory it is handed. With
  // no units, minions or slots of their own, a card's worth to them is its
  // mods and AI mods alone. raceView: the host race's
  // shared/coop_ai_fielded.js view, which lands the mods as the referee
  // does.
  var view = function (units, raceView) {
    return {
      inventory: function (applied) {
        var landed = raceView ? raceView.inventory(applied) : applied;
        return {
          units: units,
          mods: landed.mods || [],
          aiMods: landed.aiMods || [],
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
        return card.id + "=" + card.worth + " (guardians " + card.gain + ")";
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
    last: last,
    view: view,
    gain: gain,
    describePrune: describePrune,
  };
});
