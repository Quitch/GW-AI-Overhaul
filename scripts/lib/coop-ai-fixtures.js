"use strict";

// Shared stand-ins for the co-op AI player tests: an AI's saved record, the
// roster entry a battle is hired with, and a colour resolver shaped like the
// base game's GWCoopPlayerColors.resolvePlayerColorPairs.

const COMMANDER = "/pa/units/commanders/imperial_able/imperial_able.json";

// An AI player's co-op record as coop_ai_lobby.js writes it under shared tech:
// no playerName and no inventory.
function aiRecord(serial, extra) {
  return Object.assign(
    {
      playerId: "gwo_ai_" + serial,
      commander: COMMANDER,
      updatedAt: 1,
      gwaioAi: {
        serial: serial,
        name: "AI" + serial,
        personalityId: "absurd",
        createdAt: 1,
      },
    },
    extra
  );
}

// One entry of coop_ai_roster.launchAis's roster.
function coopAiEntry(overrides) {
  return Object.assign(
    {
      id: "gwo_ai_1",
      serial: 1,
      name: "Sorian",
      slot: 0,
      tag: ".player",
      scopeToken: "coopai",
      race: "mla",
      brain: "Titans",
      source: "/pa/ai/",
      path: "/pa/ai/player_coopai/",
      commander: COMMANDER,
      colour: [
        [10, 20, 30],
        [40, 50, 60],
      ],
      personalityId: "absurd",
      penchantName: undefined,
      character: "!LOC:Absurd",
      inventory: { aiMods: () => [] },
    },
    overrides
  );
}

// count distinct pairs whose first channel is the pair's index, so a test can
// read off which pair landed where. Records every count it was asked for.
function colourResolver(calls) {
  return function (count, faction, factionColour) {
    if (calls) {
      calls.push({ count, faction, factionColour });
    }
    return Array.from({ length: count }, (unused, index) => [
      [index, 0, 0],
      [255, 255, 255],
    ]);
  };
}

module.exports = { COMMANDER, aiRecord, coopAiEntry, colourResolver };
