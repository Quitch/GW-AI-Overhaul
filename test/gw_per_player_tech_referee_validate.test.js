"use strict";

// Branch tests for gw_per_player_tech_referee.js's validatePerPlayerTechInputs - the
// pure precondition validator apply() delegates its ~14 guard clauses to. Reached via
// the file's test-only module.exports hook (its define() depends on base-game modules
// GWO doesn't ship). The validator touches only referee/options and the game/inventory
// objects they expose, so plain fakes drive every branch with no game runtime.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const hook = requireShippedModule(
  "coui://ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js"
);
const validate = hook.validatePerPlayerTechInputs;

// A fully valid two-player (host + one viewer) setup. Each test mutates one facet to
// exercise a single rejection branch; unmutated, it is the happy path.
function validArgs() {
  const config = {
    armies: [{ slots: [{}] }, { slots: [{}] }], // two human armies (no ai slot)
    player: { commander: "commander_uef.player" },
  };
  const inventory = {
    units: () => [],
    mods: () => [],
    minions: () => [],
    getTag: (scope, key) =>
      key === "playerColor"
        ? [
            [255, 0, 0],
            [0, 255, 0],
          ]
        : undefined,
  };
  const game = { inventory: () => inventory };
  const referee = {
    config: () => config,
    files: () => ({}),
    game: () => game,
  };
  const options = {
    active: true,
    perPlayerTechCards: true,
    sharedControl: false,
    connectedClients: [
      { id: "h", name: "Host", role: "host" },
      { id: "v", name: "Viewer", role: "viewer" },
    ],
  };
  return { referee, options, config, inventory, game };
}

describe("validatePerPlayerTechInputs - rejection branches", () => {
  it("rejects (resolve false, no config write) an invalid battle config", () => {
    const { options } = validArgs();
    const result = validate({ config: () => null }, options);
    assert.equal(result.ok, false);
    assert.equal(result.resolveValue, false);
    assert.equal(result.writeFailure, false);
    assert.match(result.message, /invalid battle config/);
  });

  it("rejects a config whose armies is not an array", () => {
    const { options } = validArgs();
    const result = validate({ config: () => ({ armies: "nope" }) }, options);
    assert.equal(result.ok, false);
    assert.equal(result.writeFailure, false);
    assert.match(result.message, /invalid battle config/);
  });

  it("resolves TRUE (out of a job) when there are no co-op options", () => {
    const { referee } = validArgs();
    const result = validate(referee, null);
    assert.equal(result.ok, false);
    assert.equal(result.resolveValue, true);
    assert.equal(result.writeFailure, false);
    assert.match(result.message, /without co-op options/);
  });

  it("resolves TRUE when the fight is not active", () => {
    const { referee, options } = validArgs();
    options.active = false;
    const result = validate(referee, options);
    assert.equal(result.resolveValue, true);
    assert.match(result.message, /without co-op options/);
  });

  it("resolves TRUE when per-player tech is disabled", () => {
    const { referee, options } = validArgs();
    options.perPlayerTechCards = false;
    const result = validate(referee, options);
    assert.equal(result.ok, false);
    assert.equal(result.resolveValue, true);
    assert.equal(result.writeFailure, false);
    assert.match(result.message, /without per-player tech enabled/);
  });

  it("rejects (resolve false, config write) when there are no connected players", () => {
    const { referee, options } = validArgs();
    options.connectedClients = [];
    const result = validate(referee, options);
    assert.equal(result.ok, false);
    assert.equal(result.resolveValue, false);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /no connected players/);
  });

  it("rejects shared control", () => {
    const { referee, options } = validArgs();
    options.sharedControl = true;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /does not support shared control/);
  });

  it("rejects when there are no human armies", () => {
    const { referee, options, config } = validArgs();
    config.armies = [{ slots: [{ ai: true }] }, { slots: [{ ai: true }] }];
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /no human armies/);
  });

  it("rejects a mismatch between connected players and human armies", () => {
    const { referee, options, config } = validArgs();
    // Two connected players but only one human army.
    config.armies = [{ slots: [{}] }, { slots: [{ ai: true }] }];
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /mismatch between connected players/);
  });

  it("rejects when the referee has no files", () => {
    const { referee, options } = validArgs();
    referee.files = () => null;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no files/);
  });

  it("rejects when the referee has no game", () => {
    const { referee, options } = validArgs();
    referee.game = () => null;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no game/);
  });

  it("rejects when the game has no inventory", () => {
    const { referee, options, game } = validArgs();
    game.inventory = () => null;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no inventory/);
  });

  it("rejects an inventory missing units/mods/minions accessors", () => {
    const { referee, options, inventory } = validArgs();
    inventory.units = null;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /invalid inventory units, mods, or minions/);
  });

  it("rejects when the config has no player", () => {
    const { referee, options, config } = validArgs();
    config.player = null;
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no player\./);
  });

  it("rejects when the player has no commander", () => {
    const { referee, options, config } = validArgs();
    config.player = {};
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no player commander/);
  });

  it("rejects a player color that is missing or too short", () => {
    const { referee, options, inventory } = validArgs();
    inventory.getTag = () => [[255, 0, 0]];
    const result = validate(referee, options);
    assert.equal(result.writeFailure, true);
    assert.match(result.message, /has no player color/);
  });
});

describe("validatePerPlayerTechInputs - happy path", () => {
  it("accepts a valid two-player setup and returns the derived context", () => {
    const { referee, options, config, inventory } = validArgs();
    const result = validate(referee, options);

    assert.equal(result.ok, true);
    const ctx = result.context;
    assert.equal(ctx.config, config);
    assert.equal(ctx.playerCount, 2);
    assert.equal(ctx.connectedClients, options.connectedClients);
    assert.equal(ctx.humanArmies.length, 2);
    assert.equal(ctx.inventory, inventory);
    assert.equal(ctx.player, config.player);
    // Commander tag stripped from the host's ".player"-tagged commander.
    assert.equal(ctx.baseCommander, "commander_uef");
    assert.deepEqual(ctx.playerColor, [
      [255, 0, 0],
      [0, 255, 0],
    ]);
  });
});
