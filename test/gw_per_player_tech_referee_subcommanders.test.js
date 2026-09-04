"use strict";

// The per-player-tech referee's viewer subcommander armies, whose builder lives
// in the measured gw_play/per_player_tech.js. The host's equivalent path is
// covered by referee_config_ai_paths.test.js.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { makeInventory } = require("../scripts/lib/ai-path-fixtures.js");

const hook = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js"
);
const subcommanderTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js"
);
const gwoColour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);
const refereeCoop = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js"
);
const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const personalities = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js"
);

// As gw_per_player_tech_referee.js injects it, for the player faction below.
const resolvePersonality = (minion) =>
  gwoPersonality.resolve(minion, {
    side: "ally",
    faction: 1,
    penchantTags: minion.penchantName === "!LOC:Rush" ? ["Rush"] : [],
  });

const TACTICS_CARD = { id: "gwaio_upgrade_subcommander_tactics" };
const FABBER_CARD = { id: "gwaio_upgrade_subcommander_fabber" };
const DUPLICATION_CARD = { id: "gwaio_upgrade_subcommander_duplication" };

const PLAYER_COLOR = [
  [255, 0, 0],
  [128, 0, 0],
];

// A saved inventory minion, shaped as gwc_minion.js's buff() pushes it.
function makeMinion(overrides) {
  return Object.assign(
    {
      name: "Helper",
      commander: "/pa/units/commanders/imperial_alpha/imperial_alpha.json",
      personality: {
        max_basic_fabbers: 4,
        max_advanced_fabbers: 6,
        personality_tags: ["SlowerExpansion"],
      },
    },
    overrides || {}
  );
}

function build(overrides) {
  return hook.buildViewerSubcommanderArmies(
    Object.assign(
      {
        subcommanderTech,
        gwoColour,
        refereeCoop,
        playerTag: ".player0",
        playerCommander: "/pa/units/commanders/base_commander/base.json",
        playerFaction: 1,
        playerColor: PLAYER_COLOR,
        resolvePersonality,
        viewerAiPath: "/pa/ai_subcommander/player_.player0/",
        subcommanderEconRate: 1.5,
        colourPosition: 0,
      },
      overrides || {}
    )
  );
}

function snapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

describe("buildViewerSubcommanderArmies personalities", () => {
  it("builds a minion's personality from its id, as the host's referee does", () => {
    const result = build({
      playerInventory: makeInventory({
        minionsList: [
          makeMinion({
            personalityId: "armour",
            personality: { energy_demand_check: 0.48 },
          }),
        ],
      }),
    });
    const personality = result.armies[0].personality;
    assert.equal(
      personality.energy_demand_check,
      personalities.legonisMachina.energy_demand_check
    );
    assert.equal(personality.percent_vehicle, 1);
  });

  it("keeps a minion saved without an id as it was, on a copy", () => {
    const minion = makeMinion();
    const result = build({
      playerInventory: makeInventory({ minionsList: [minion] }),
    });
    const personality = result.armies[0].personality;
    assert.equal(personality.max_basic_fabbers, 4);
    assert.notEqual(personality, minion.personality);
  });
});

describe("buildViewerSubcommanderArmies", () => {
  it("applies subcommander tech to the army, not to the viewer's saved minion", () => {
    // The regression this guards: gwc_minion.js pushes the card's own params
    // object into inventory.minions(), so an in-place tech write would persist
    // into the saved war and outlive a discard of the card that granted it.
    const minions = [makeMinion()];
    const untouched = snapshot(minions);
    const inventory = makeInventory({
      minionsList: minions,
      cardsList: [TACTICS_CARD, FABBER_CARD],
    });

    const firstBattle = build({ playerInventory: inventory });
    const secondBattle = build({ playerInventory: inventory });

    assert.deepEqual(
      snapshot(minions),
      untouched,
      "a viewer's saved minion must survive a battle unchanged"
    );
    // x1.5 fabber caps once (not x2.25), PreventsWaste once (not twice).
    assert.equal(firstBattle.armies[0].personality.max_basic_fabbers, 6);
    assert.equal(firstBattle.armies[0].personality.max_advanced_fabbers, 9);
    assert.deepEqual(firstBattle.armies[0].personality.personality_tags, [
      "PreventsWaste",
    ]);
    assert.deepEqual(
      secondBattle.armies[0].personality,
      firstBattle.armies[0].personality,
      "a second battle must produce the same subcommander"
    );
  });

  it("leaves the minion's personality alone when no tech card is held", () => {
    const minions = [makeMinion()];
    const untouched = snapshot(minions);

    const result = build({
      playerInventory: makeInventory({ minionsList: minions, cardsList: [] }),
    });

    assert.deepEqual(snapshot(minions), untouched);
    assert.equal(result.armies[0].personality.max_basic_fabbers, 4);
    assert.deepEqual(result.armies[0].personality.personality_tags, [
      "SlowerExpansion",
    ]);
    // The ai_path is still a per-battle write, so it lands on the copy only.
    assert.equal(
      result.armies[0].personality.ai_path,
      "/pa/ai_subcommander/player_.player0/"
    );
    assert.equal(minions[0].personality.ai_path, undefined);
  });

  it("duplication adds an army per duplicate, sharing one colour and one personality", () => {
    const minions = [makeMinion()];
    const untouched = snapshot(minions);

    const result = build({
      playerInventory: makeInventory({
        minionsList: minions,
        cardsList: [DUPLICATION_CARD],
      }),
    });

    assert.deepEqual(snapshot(minions), untouched);
    assert.equal(result.armies.length, 2);
    assert.deepEqual(result.armies[0].color, result.armies[1].color);
    assert.equal(result.armies[0].personality, result.armies[1].personality);
    // One minion consumes one colour slot however many duplicates it fields.
    assert.equal(result.colourPosition, 1);
  });

  it("the host tag adds nothing and does not consume a colour slot", () => {
    // The main referee already added the host's minions - see referee_config.js.
    const result = build({
      playerTag: ".player",
      playerInventory: makeInventory({
        minionsList: [makeMinion(), makeMinion()],
        cardsList: [TACTICS_CARD],
      }),
      colourPosition: 3,
    });

    assert.deepEqual(result.armies, []);
    assert.equal(result.colourPosition, 3);
  });

  it("advances the colour position per minion, so two viewers never collide", () => {
    const firstViewer = build({
      playerInventory: makeInventory({
        minionsList: [makeMinion(), makeMinion()],
        cardsList: [DUPLICATION_CARD],
      }),
      colourPosition: 1,
    });
    const secondViewer = build({
      playerTag: ".player1",
      playerInventory: makeInventory({
        minionsList: [makeMinion()],
        cardsList: [],
      }),
      colourPosition: firstViewer.colourPosition,
    });

    assert.equal(firstViewer.colourPosition, 3);
    assert.equal(secondViewer.colourPosition, 4);

    const colours = firstViewer.armies
      .concat(secondViewer.armies)
      .map((army) => JSON.stringify(army.color));
    assert.equal(new Set(colours).size, 3, `expected 3 distinct: ${colours}`);
  });

  it("tags every slot and army with the viewer's spec tag", () => {
    const result = build({
      playerInventory: makeInventory({
        minionsList: [makeMinion()],
        cardsList: [],
      }),
    });

    assert.equal(result.armies[0].spec_tag, ".player0");
    assert.equal(result.armies[0].alliance_group, 1);
    assert.equal(result.armies[0].econ_rate, 1.5);
    assert.equal(result.armies[0].slots[0].ai, true);
    assert.equal(
      result.armies[0].slots[0].commander,
      "/pa/units/commanders/imperial_alpha/imperial_alpha.json.player0"
    );
  });

  it("falls back to the player's commander and colour for a bare minion", () => {
    const bareMinion = { personality: { personality_tags: [] } };

    const result = build({
      playerInventory: makeInventory({
        minionsList: [bareMinion],
        cardsList: [],
      }),
    });

    assert.equal(result.armies[0].slots[0].name, "Helper");
    assert.equal(
      result.armies[0].slots[0].commander,
      "/pa/units/commanders/base_commander/base.json.player0"
    );
    assert.deepEqual(
      result.armies[0].color,
      gwoColour.pick(1, PLAYER_COLOR, refereeCoop.alliedColourIndex(0))
    );
  });
});
