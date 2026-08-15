// Every seeded stream key the gw_play scene uses, in one file so the key layout
// documented in galaxy.md has a single place to be checked against.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
], function (gwoRng) {
  // gwo_rng joins a label and index with a space, so a label carrying one could
  // make stream("a b") collide with stream("a", "b"). Player names carry spaces.
  var safeLabel = function (value) {
    return String(value).replace(/\s+/g, "_");
  };

  // A non-number would degrade stream(label, undefined) into stream(label),
  // colliding with the parent.
  var index = function (value) {
    return _.isNumber(value) ? value : -1;
  };

  var counter = function (value) {
    return _.isNumber(value) && value > 0 ? value : 0;
  };

  return {
    // Wars saved before seeds were recorded have none, and must keep drawing
    // unseeded rather than all sharing one empty-string seed.
    warRng: function (gwoSettings) {
      var seed = gwoSettings && gwoSettings.seed;
      return seed === undefined || seed === null || seed === ""
        ? undefined
        : gwoRng.create(seed);
    },

    // record.playerId is the uberId and survives a reconnect; client.id is a
    // per-connection value and does not.
    coopPlayerKey: function (record, client) {
      var id = record && record.playerId;
      if (id === undefined || id === null) {
        id = client && client.id;
      }
      if (id === undefined || id === null) {
        id = client && client.name;
      }
      return safeLabel(id === undefined || id === null ? "unknown" : id);
    },

    generalCommanderRng: function (warRng, playerKey) {
      return (
        warRng &&
        warRng.stream("general_commander", safeLabel(playerKey || "host"))
      );
    },

    exploreDealRng: function (warRng, starIndex, turns, rerollsUsed) {
      return (
        warRng &&
        warRng
          .stream("explore", index(starIndex))
          .stream("turn", counter(turns))
          .stream("reroll", counter(rerollsUsed))
      );
    },

    aiStarDealRng: function (warRng, starIndex, turns) {
      return (
        warRng &&
        warRng
          .stream("ai_star", index(starIndex))
          .stream("turn", counter(turns))
      );
    },

    coopDealRng: function (warRng, playerKey, dealIndex) {
      return (
        warRng &&
        warRng
          .stream("coop_deal", safeLabel(playerKey))
          .stream("deal", index(dealIndex))
      );
    },

    coopStarDealRng: function (warRng, playerKey, starIndex, turns) {
      return (
        warRng &&
        warRng
          .stream("coop_ai_star", safeLabel(playerKey))
          .stream("star", index(starIndex))
          .stream("turn", counter(turns))
      );
    },

    // No turn or deal component: the offer must be identical however often the
    // star is re-explored or replayed as a catch-up deal.
    treasureLoadoutRng: function (warRng, playerKey, starIndex) {
      return (
        warRng &&
        warRng
          .stream("treasure_loadout", safeLabel(playerKey || "host"))
          .stream("star", index(starIndex))
      );
    },

    coopRerollRng: function (warRng, playerKey, dealIndex, rerollsUsed) {
      return (
        warRng &&
        warRng
          .stream("coop_deal", safeLabel(playerKey))
          .stream("deal", index(dealIndex))
          .stream("reroll", counter(rerollsUsed))
      );
    },

    battleRng: function (warRng, starIndex, turns) {
      return (
        warRng &&
        warRng.stream("battle", index(starIndex)).stream("turn", counter(turns))
      );
    },

    iterationRng: function (dealRng, iteration) {
      return dealRng && dealRng.stream("iteration", index(iteration));
    },

    // Per card id, not draw order: a deal calls every card in the deck and keeps
    // one, so sequential draws would couple them all together.
    cardRng: function (iterationRng, cardId) {
      return iterationRng && iterationRng.stream(safeLabel(cardId));
    },
  };
});
