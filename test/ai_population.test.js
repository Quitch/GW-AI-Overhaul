"use strict";

// Tests for gw_start/ai_population.js, with hand-built galaxies of the shape
// gw_start/setup.js hands it.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);
const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const population = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_population.js"
);

const CLUSTER = 4;

function observable(value) {
  return () => value;
}

function settingsWith(overrides) {
  const values = Object.assign(
    {
      econBase: "1",
      econRatePerDist: "0.1",
      mandatoryMinions: 1,
      minionMod: "0.5",
      bossCommanders: 2,
      factionTechHandicap: "0",
      landAnywhereChance: 0,
      suddenDeathChance: 0,
      bountyModeChance: 0,
      eradicationModeChance: 0,
      ffaChance: 0,
      alliedCommanderChance: 0,
      paLore: false,
    },
    overrides
  );
  const settings = {};
  Object.keys(values).forEach((key) => {
    settings[key] = observable(values[key]);
  });
  return settings;
}

function minion(name) {
  return {
    name: name,
    personalityId: "uber",
    personality: { works_with_queller: true, personality_tags: [] },
  };
}

function factions() {
  return [0, 1, 2, 3, 4].map(() => ({
    minions: [minion("Alpha"), minion("Worker"), minion("Security")],
  }));
}

function star(distance, ai) {
  const system = { name: "Stock", description: "Stock", planets: [] };
  system.planets.push({ generator: {} });
  return {
    distance: () => distance,
    ai: () => ai,
    system: () => system,
  };
}

// One team: a boss at distance 3 and one worker at distance 1, plus a neutral
// star and a second worker for the Guardians to take.
function warWith(options) {
  const opts = options || {};
  const faction = opts.faction === undefined ? 0 : opts.faction;
  const boss = Object.assign(minion("Boss"), {
    boss: true,
    faction: faction,
    race: "mla",
  });
  const worker = Object.assign(minion(opts.workerName || "Alpha"), {
    faction: faction,
    race: "mla",
  });
  const guardian = Object.assign(minion("Alpha"), {
    faction: faction,
    race: "mla",
    team: 0,
    minions: [],
  });
  const stars = [
    star(0),
    star(1, guardian),
    star(1, worker),
    star(3, boss),
    star(2),
  ];
  const war = {
    galaxy: { stars: () => stars },
    factions: opts.factions || factions(),
    aiFactions: [faction, 2],
    raceByFaction: { [faction]: "mla", 2: "mla" },
    playerRace: "mla",
    playerFaction: 3,
    playerCount: opts.playerCount || 1,
    settings: settingsWith(opts.settings),
    tier: { personality_tags: [] },
    brains: opts.brains || { aiByRace: {}, ai: "Titans", aiAlly: "Titans" },
    rng: gwoRng.create(opts.seed || "population"),
    lore: opts.lore || { neutral: [], ai: [] },
    startCardBreaksAllies: !!opts.startCardBreaksAllies,
    sharedSystems: !!opts.sharedSystems,
  };
  const teamInfo = opts.withoutBoss
    ? [{ faction: faction, workers: [] }]
    : [
        {
          faction: faction,
          boss: boss,
          workers: [
            { ai: guardian, star: stars[1] },
            { ai: worker, star: stars[2] },
          ],
        },
      ];
  return { war, teamInfo, stars, boss, worker, guardian };
}

describe("populate", () => {
  it("fails with a spawn shortage when a faction has no boss", () => {
    const { war, teamInfo } = warWith({ withoutBoss: true });
    const outcome = population.populate(war, teamInfo);
    assert.equal(outcome.failed, true);
    assert.equal(outcome.spawnShortage, true);
  });

  it("gives the boss and a worker a personality, economy, buffs, and minions", () => {
    const { war, teamInfo, boss, worker } = warWith();
    const outcome = population.populate(war, teamInfo);

    assert.equal(outcome.failed, false);
    assert.equal(outcome.spawnShortage, false);
    assert.ok(boss.personality);
    assert.ok(boss.econ_rate >= 1);
    assert.ok(Array.isArray(boss.typeOfBuffs));
    // floor(1 + 3 * 0.5) at the furthest star, distance 3.
    assert.equal(boss.minions.length, 2);
    // floor(1 + 1 * 0.5) at distance 1.
    assert.equal(worker.minions.length, 1);
    assert.equal(worker.minions[0].race, "mla");
    assert.ok(worker.minions[0].personality);
    // Only a Cluster AI's minions carry a commander count.
    boss.minions.concat(worker.minions).forEach((m) => {
      assert.equal(Object.hasOwn(m, "commanderCount"), false);
    });
    assert.equal(worker.landAnywhere, false);
    assert.equal(worker.foes, undefined);
    assert.equal(worker.ally, undefined);
  });

  it("scales minions and boss buffs by player count and handicap", () => {
    const { war, teamInfo, boss } = warWith({
      playerCount: 2,
      settings: { factionTechHandicap: "0.5" },
    });
    population.populate(war, teamInfo);
    // floor(2 + 3 * 1) with two players.
    assert.equal(boss.minions.length, 5);
    // floor(3 / 2 - 0.5) buffs.
    assert.equal(boss.typeOfBuffs.length, 1);
  });

  it("is repeatable for one seed", () => {
    const first = warWith({ seed: "same", settings: { ffaChance: 50 } });
    const second = warWith({ seed: "same", settings: { ffaChance: 50 } });
    population.populate(first.war, first.teamInfo);
    population.populate(second.war, second.teamInfo);
    assert.equal(
      JSON.stringify(first.teamInfo),
      JSON.stringify(second.teamInfo)
    );
  });

  it("turns the first non-boss AI star into the Guardians", () => {
    const { war, teamInfo, guardian, stars } = warWith();
    const outcome = population.populate(war, teamInfo);

    assert.equal(outcome.treasureStar, 1);
    assert.equal(guardian.name, "The Guardians");
    assert.equal(guardian.mirrorMode, true);
    assert.equal(guardian.treasurePlanet, true);
    assert.equal(guardian.boss, true);
    assert.equal(guardian.minions, undefined);
    assert.equal(guardian.team, undefined);
    assert.equal(guardian.race, "mla");
    assert.match(stars[1].system().description, /treasure planet/);
  });

  it("writes lore onto neutral stars, and onto AI stars only with System Lore on", () => {
    const lore = {
      neutral: [
        { name: "First", description: "first" },
        { name: "Second", description: "second" },
      ],
      ai: ["ai lore"],
    };
    const off = warWith({ lore });
    population.populate(off.war, off.teamInfo);
    assert.equal(off.stars[0].system().name, "First");
    assert.equal(off.stars[4].system().description, "second");
    assert.equal(off.stars[2].system().description, "Stock");

    const on = warWith({ lore, settings: { paLore: true } });
    population.populate(on.war, on.teamInfo);
    assert.equal(on.stars[2].system().description, "ai lore");
    // A boss star keeps its own description.
    assert.equal(on.stars[3].system().description, "Stock");
  });

  it("fields MLA Cluster minions by role, and Cluster Workers as commanders", () => {
    const { war, teamInfo, boss, worker } = warWith({
      faction: CLUSTER,
      workerName: "Worker",
      settings: { bossCommanders: 4 },
    });
    population.populate(war, teamInfo);

    assert.equal(boss.minions.length, 1);
    assert.equal(boss.minions[0].name, "Security");
    assert.equal(boss.minions[0].commanderCount, 2);
    // A Worker takes commanders in place of minions: max(1 + floor(4 / 2), 2).
    assert.deepEqual(worker.minions, []);
    assert.equal(worker.commanderCount, 3);
  });

  it("gives a Cluster Worker at least two commanders", () => {
    const { war, teamInfo, worker } = warWith({
      faction: CLUSTER,
      workerName: "Worker",
      settings: { bossCommanders: 1 },
    });
    population.populate(war, teamInfo);
    // max(1 + floor(1 / 2), 2).
    assert.equal(worker.commanderCount, 2);
  });

  it("gives a non-Worker Cluster AI one Worker minion", () => {
    const { war, teamInfo, worker } = warWith({
      faction: CLUSTER,
      settings: { bossCommanders: 4 },
    });
    population.populate(war, teamInfo);
    assert.equal(worker.minions.length, 1);
    assert.equal(worker.minions[0].name, "Worker");
    // 1 + floor(4 / 2).
    assert.equal(worker.minions[0].commanderCount, 3);
  });

  it("fails the war when a minion pool is empty", () => {
    const empty = factions().map(() => ({ minions: [] }));
    const { war, teamInfo } = warWith({ factions: empty });
    assert.equal(population.populate(war, teamInfo).failed, true);
  });

  it("fails the war on an unknown brain", () => {
    const { war, teamInfo } = warWith({
      brains: { aiByRace: {}, ai: "Bogus", aiAlly: "Titans" },
    });
    assert.equal(population.populate(war, teamInfo).failed, true);
  });

  it("adds foes carrying the worker's tech, and Queller's FFA tags", () => {
    const { war, teamInfo, worker } = warWith({
      settings: { ffaChance: 100 },
      brains: { aiByRace: {}, ai: "Queller", aiAlly: "Titans" },
    });
    population.populate(war, teamInfo);

    assert.equal(worker.foes.length, 1);
    const foe = worker.foes[0];
    assert.equal(foe.faction, 2);
    // round((1 + 1) / 2) at distance 1.
    assert.equal(foe.commanderCount, 1);
    assert.equal(foe.typeOfBuffs, worker.typeOfBuffs);
    gwoPersonality.FFA_TAGS.forEach((tag) => {
      assert.ok(worker.personality.personality_tags.includes(tag));
      assert.ok(foe.personality.personality_tags.includes(tag));
    });
  });

  it("gives an ally no economy of its own, unless the start card forbids allies", () => {
    const allowed = warWith({ settings: { alliedCommanderChance: 100 } });
    population.populate(allowed.war, allowed.teamInfo);
    const ally = allowed.worker.ally;
    assert.equal(ally.faction, 3);
    assert.equal(ally.race, "mla");
    assert.equal(ally.econ_rate, undefined);
    assert.ok(ally.personality);

    const forbidden = warWith({
      settings: { alliedCommanderChance: 100 },
      startCardBreaksAllies: true,
    });
    population.populate(forbidden.war, forbidden.teamInfo);
    assert.equal(forbidden.worker.ally, undefined);
  });

  it("raises the water on Foundation worker planets without Shared Systems", () => {
    const plain = warWith({ faction: 1 });
    population.populate(plain.war, plain.teamInfo);
    const workerPlanet = plain.stars[2].system().planets[0].generator;
    assert.equal(workerPlanet.shuffleLandingZones, true);
    assert.equal(workerPlanet.waterHeight, 50);
    assert.equal(
      plain.stars[3].system().planets[0].generator.waterHeight,
      undefined
    );

    const shared = warWith({ faction: 1, sharedSystems: true });
    population.populate(shared.war, shared.teamInfo);
    assert.equal(
      shared.stars[2].system().planets[0].generator.waterHeight,
      undefined
    );
  });
});

describe("giveRace", () => {
  it("records MLA and keeps the commander", () => {
    const ai = { commander: "/pa/units/commanders/x/x.json" };
    population.giveRace(gwoRng.create("race"), ai, "mla", false);
    assert.equal(ai.race, "mla");
    assert.equal(ai.commander, "/pa/units/commanders/x/x.json");
  });
});

describe("brainForRace", () => {
  it("falls back to the war-wide brain for each side", () => {
    const brains = { aiByRace: {}, ai: "Queller", aiAlly: "Titans" };
    assert.equal(population.brainForRace(brains, "mla", "enemy"), "Queller");
    assert.equal(population.brainForRace(brains, "mla", "ally"), "Titans");
  });
});
