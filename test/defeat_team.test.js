"use strict";

// shared/defeat_team.js, GWO's defeatTeam. It is installed from the
// GWGamePatches.patch hijack in gw_inventory.js, so it reads nothing but the
// game it is handed. See architecture.md, "Returning from a battle".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable: observable,
} = require("../scripts/lib/fake-knockout.js");

const defeatTeam = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/defeat_team.js"
);

let stubs;

function makeStar(ai, cardList) {
  return { ai: observable(ai), cardList: observable(cardList || []) };
}

function setup(stars, overrides = {}) {
  const tallied = [];
  stubs = createGlobalStubs();
  stubs.setGlobal("api", {
    tally: { incStatInt: (stat) => tallied.push(stat) },
  });

  const game = Object.assign(
    {
      gameState: observable("active"),
      isTutorial: () => false,
      galaxy: () => ({ stars: () => stars }),
    },
    overrides
  );
  defeatTeam.install(game);

  return { game, tallied };
}

afterEach(() => {
  if (stubs) {
    stubs.restoreGlobals();
    stubs = undefined;
  }
});

describe("defeat_team - winning the war", () => {
  // The rule stock gets wrong for a GWO galaxy: it waits for every AI star.
  it("wins once the last boss falls, with other AI stars left", () => {
    const stars = [
      makeStar({ team: 0, boss: true }),
      makeStar({ team: 1 }),
      makeStar(undefined),
    ];
    const { game, tallied } = setup(stars);

    game.defeatTeam(0);

    assert.equal(game.gameState(), "won");
    assert.deepEqual(tallied, ["gw_eliminate_faction"]);
    assert.deepEqual(stars[1].ai(), { team: 1 });
  });

  it("stays active while another boss remains", () => {
    const stars = [
      makeStar({ team: 0, boss: true }),
      makeStar({ team: 1, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);

    assert.equal(game.gameState(), "active");
    assert.equal(stars[0].ai(), undefined);
    assert.deepEqual(stars[1].ai(), { team: 1, boss: true });
  });
});

describe("defeat_team - the defeated team's stars", () => {
  // gw_start/ai_population.js gives a foe a faction but no team, and team
  // indices differ from faction indices.
  it("promotes the first foe onto its faction's team, and drops the old owner's minions", () => {
    const foes = [
      { name: "First", faction: 2 },
      { name: "Second", faction: 3 },
    ];
    const stars = [
      makeStar(
        { name: "Owner", faction: 4, team: 0, minions: [{}], foes: foes },
        [{ id: "gwc_kept" }]
      ),
      makeStar({ faction: 4, team: 0, boss: true }),
      makeStar({ faction: 2, team: 1, boss: true }),
      makeStar({ faction: 3, team: 2, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);

    assert.deepEqual(stars[0].ai(), {
      name: "First",
      faction: 2,
      team: 1,
      foes: [foes[1]],
    });
    assert.deepEqual(stars[0].cardList(), [{ id: "gwc_kept" }]);
  });

  it("skips a foe of an eliminated faction and promotes the next", () => {
    const foes = [
      { name: "Eliminated", faction: 2 },
      { name: "Living", faction: 3 },
    ];
    const stars = [
      makeStar({ name: "Owner", faction: 4, team: 0, foes: foes }),
      makeStar({ faction: 4, team: 0, boss: true }),
      makeStar({ faction: 3, team: 2, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);

    assert.deepEqual(stars[0].ai(), {
      name: "Living",
      faction: 3,
      team: 2,
      foes: [foes[0]],
    });
  });

  it("clears the star and its cards when every foe's faction is eliminated", () => {
    const stars = [
      makeStar(
        {
          name: "Owner",
          faction: 4,
          team: 0,
          foes: [{ name: "Eliminated", faction: 2 }],
        },
        [{ id: "gwc_dealt" }]
      ),
      makeStar({ faction: 4, team: 0, boss: true }),
      makeStar({ faction: 3, team: 2, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);

    assert.equal(stars[0].ai(), undefined);
    assert.deepEqual(stars[0].cardList(), []);
  });

  it("clears a promoted star when the promoted faction's boss falls", () => {
    const stars = [
      makeStar({
        name: "Owner",
        faction: 4,
        team: 0,
        foes: [{ name: "First", faction: 2 }],
      }),
      makeStar({ faction: 4, team: 0, boss: true }),
      makeStar({ faction: 2, team: 1, boss: true }),
      makeStar({ faction: 3, team: 2, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);
    game.defeatTeam(1);

    assert.equal(stars[0].ai(), undefined);
    assert.equal(stars[2].ai(), undefined);
    assert.equal(game.gameState(), "active");
  });

  // A save from before the promoted owner took its faction's team: the star
  // holds a living faction on a dead team.
  it("clears a mis-teamed star along with its faction", () => {
    const stars = [
      makeStar({ name: "First", faction: 2, team: 0 }),
      makeStar({ faction: 2, team: 1, boss: true }),
      makeStar({ faction: 3, team: 2, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(1);

    assert.equal(stars[0].ai(), undefined);
    assert.equal(game.gameState(), "active");
  });

  // gw_start/ai_population.js converts a worker into the Guardians in place,
  // so they keep its faction.
  it("leaves the Guardians alone when their faction's boss falls", () => {
    const guardians = { faction: 2, mirrorMode: true, boss: true };
    const stars = [
      makeStar(guardians, [{ id: "gwc_treasure" }]),
      makeStar({ faction: 2, team: 1, boss: true }),
    ];
    const { game } = setup(stars);

    game.defeatTeam(1);

    assert.deepEqual(stars[0].ai(), guardians);
    assert.deepEqual(stars[0].cardList(), [{ id: "gwc_treasure" }]);
    assert.equal(game.gameState(), "active");
  });

  it("clears the pre-dealt cards of a star it empties", () => {
    const stars = [
      makeStar({ team: 0 }, [{ id: "gwc_dealt" }]),
      makeStar({ team: 1, boss: true }, [{ id: "gwc_other_team" }]),
    ];
    const { game } = setup(stars);

    game.defeatTeam(0);

    assert.equal(stars[0].ai(), undefined);
    assert.deepEqual(stars[0].cardList(), []);
    assert.deepEqual(stars[1].cardList(), [{ id: "gwc_other_team" }]);
  });

  // gw_start/ai_population.js deletes the Guardians' team, so their win
  // arrives as defeatTeam(undefined) and must match their star alone.
  it("clears only the Guardians' star for an undefined team, keeping its cards", () => {
    const stars = [
      makeStar({ mirrorMode: true, boss: true }, [{ id: "gwc_treasure" }]),
      makeStar({ team: 0, boss: true }),
      makeStar(undefined, [{ id: "gwc_unexplored" }]),
    ];
    const { game } = setup(stars);

    game.defeatTeam(undefined);

    assert.equal(stars[0].ai(), undefined);
    assert.deepEqual(stars[0].cardList(), [{ id: "gwc_treasure" }]);
    assert.deepEqual(stars[1].ai(), { team: 0, boss: true });
    assert.deepEqual(stars[2].cardList(), [{ id: "gwc_unexplored" }]);
    assert.equal(game.gameState(), "active");
  });
});

describe("defeat_team - where it installs", () => {
  it("leaves the tutorial on stock's defeatTeam", () => {
    const { game } = setup([], { isTutorial: () => true });

    assert.equal(game.defeatTeam, undefined);
  });
});
