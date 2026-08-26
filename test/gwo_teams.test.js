"use strict";

// gw_start/gwo_teams.js: seeded copies of the two gw_teams.js methods war
// creation uses. Both take an rng stock does not have, which is the whole point
// of the copy - so what these pin is that the draws and the boss system come
// from that rng rather than from _.sample and an unseeded generate.
//
// The faction data lives in coverage-excluded files that read api at define
// time, so a hand-built faction list of the same shape stands in for it, as in
// faction_seed.test.js.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const FACTIONS = [
  {
    name: "Legonis Machina",
    color: [0.1, 0.2, 0.3],
    teams: [{ name: "First" }, { name: "Second" }, { name: "Third" }],
    minions: [{ name: "Able" }, { name: "Baker" }],
  },
  {
    name: "Foundation",
    color: [0.4, 0.5, 0.6],
    teams: [{ name: "Only" }],
    minions: [],
  },
];

// Every system the boss generator would build comes from here instead, so the
// config gwo_teams hands it can be asserted directly.
const generated = [];
const sharedSystemsLoader = function () {
  return {
    generate: function (config) {
      generated.push(config);
      return Promise.resolve({
        name: config.name,
        planets: [{ generator: { biome: "lava" } }],
      });
    },
  };
};
// chooseFor defers to a base loader carrying loadOptions, which is the seam this
// test drives the generator through.
sharedSystemsLoader.loadOptions = function () {};

registerModuleStub(
  "main/game/galactic_war/shared/js/systems/template-loader",
  sharedSystemsLoader
);
registerModuleStub("shared/gw_factions", FACTIONS);
["pa-easy", "pa-normal", "titans-easy", "titans-normal"].forEach((name) => {
  registerModuleStub("main/game/galactic_war/shared/js/systems/" + name, []);
});

const stubs = createGlobalStubs();

before(() => installFakeJQuery(stubs));

after(() => stubs.restoreGlobals());

const teams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/gwo_teams.js"
);

// Picks by position, so a test says which team it expects rather than which
// number the real stream happens to draw.
const rngPicking = (position) => ({ pick: (list) => list[position] });

describe("gwo_teams getTeam", () => {
  it("draws the team from the rng, not from the faction order", () => {
    assert.equal(teams.getTeam(0, rngPicking(0)).name, "First");
    assert.equal(teams.getTeam(0, rngPicking(2)).name, "Third");
  });

  it("stamps the faction's colour and the faction itself onto the team", () => {
    const team = teams.getTeam(1, rngPicking(0));
    assert.equal(team.name, "Only");
    assert.deepEqual(team.color, [0.4, 0.5, 0.6]);
    assert.equal(team.faction, FACTIONS[1]);
  });

  // The war spends these as it goes, so a team holding the faction's own array
  // would empty it for every later war in the session.
  it("gives the team its own copy of the faction's minions", () => {
    const team = teams.getTeam(0, rngPicking(0));

    assert.deepEqual(team.remainingMinions, FACTIONS[0].minions);
    assert.notEqual(team.remainingMinions, FACTIONS[0].minions);

    team.remainingMinions.pop();
    assert.equal(FACTIONS[0].minions.length, 2);
  });

  it("does not write the faction back into the team it drew", () => {
    teams.getTeam(0, rngPicking(1));
    assert.deepEqual(FACTIONS[0].teams[1], { name: "Second" });
  });
});

describe("gwo_teams makeBoss", () => {
  const star = () => {
    const cards = [];
    const systems = [];
    return {
      cardList: () => cards,
      system: (value) => systems.push(value),
      cards,
      systems,
    };
  };

  it("takes the boss's own stats where the team defines them", async () => {
    const ai = { econ_rate: 3, name: "Minion" };

    await teams.makeBoss(star(), ai, { boss: { econ_rate: 10, name: "Boss" } });

    assert.equal(ai.econ_rate, 10);
    assert.equal(ai.name, "Boss");
  });

  // A faction with no boss of its own still has to field something harder than
  // the minions guarding the rest of its space.
  it("doubles the economy of a team with no boss defined", async () => {
    const ai = { econ_rate: 3 };
    await teams.makeBoss(star(), ai, {});
    assert.equal(ai.econ_rate, 6);
  });

  it("resolves with the ai it was given", async () => {
    const ai = { econ_rate: 1 };
    assert.equal(await teams.makeBoss(star(), ai, {}), ai);
  });

  it("adds the team's boss card to the star", async () => {
    const target = star();

    await teams.makeBoss(target, { econ_rate: 1 }, { bossCard: "gwb_boss" });

    assert.deepEqual(target.cards, ["gwb_boss"]);
  });

  it("leaves the star's cards alone for a team with no boss card", async () => {
    const target = star();
    await teams.makeBoss(target, { econ_rate: 1 }, {});
    assert.deepEqual(target.cards, []);
  });
});

describe("gwo_teams makeBoss - the boss system", () => {
  const star = () => {
    const systems = [];
    return {
      cardList: () => [],
      system: (value) => systems.push(value),
      systems,
    };
  };

  const team = {
    systemTemplate: { name: "Fortress", Planets: [{ mass: 5000 }] },
    systemDescription: "The seat of the boss",
  };

  it("builds the team's own system and hands it to the star", async () => {
    generated.length = 0;
    const target = star();

    const ai = await teams.makeBoss(
      target,
      { econ_rate: 1 },
      team,
      undefined,
      42
    );

    assert.equal(generated.length, 1);
    assert.equal(generated[0].name, "Fortress");
    assert.deepEqual(generated[0].template.Planets, [{ mass: 5000 }]);
    assert.equal(target.systems.length, 1);
    assert.equal(target.systems[0].name, "Fortress");
    assert.deepEqual(ai, { econ_rate: 2 });
  });

  // Stock omits the seed, so every boss system re-rolled its terrain on load.
  it("seeds the generator, so the system survives a reload", async () => {
    generated.length = 0;

    await teams.makeBoss(
      star(),
      { econ_rate: 1 },
      team,
      undefined,
      "boss-seed"
    );

    assert.equal(generated[0].seed, "boss-seed");
  });

  it("describes the system and takes its biome from the first planet", async () => {
    const target = star();

    await teams.makeBoss(target, { econ_rate: 1 }, team, undefined, 1);

    assert.equal(target.systems[0].description, "The seat of the boss");
    assert.equal(target.systems[0].biome, "lava");
  });

  it("leaves an undescribed system undescribed", async () => {
    const target = star();

    await teams.makeBoss(
      target,
      { econ_rate: 1 },
      { systemTemplate: team.systemTemplate },
      undefined,
      1
    );

    assert.equal(target.systems[0].description, undefined);
    assert.equal(target.systems[0].biome, "lava");
  });

  it("builds no system for a team that brings none", async () => {
    generated.length = 0;
    const target = star();

    await teams.makeBoss(target, { econ_rate: 1 }, {});

    assert.deepEqual(generated, []);
    assert.deepEqual(target.systems, []);
  });
});
