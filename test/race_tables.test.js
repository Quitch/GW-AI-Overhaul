"use strict";

// scripts/lib/race-tables.js: the generator reproduces every race/ and
// addon/ file from the harvested specs (test/fixtures/race_specs.json) and
// the hand-kept inputs, and its naming rules on small hand-built sources.
// scripts/harvest-race-specs.js, which writes that fixture, fails without
// writing it when a spec does not parse.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  REPO_ROOT,
  camelKeepCase,
  camelLower,
  buildTable,
  renderFile,
  generateAll,
} = require("../scripts/lib/race-tables.js");
const { TABLES } = require("../scripts/lib/race-table-inputs.js");
const fixture = require("./fixtures/race_specs.json");

const read = (file) => fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
const lf = (text) => text.replaceAll("\r\n", "\n");

describe("the race table generator", () => {
  it("reproduces every committed race and add-on file byte for byte", async () => {
    const files = await generateAll(fixture, read);

    assert.deepEqual(
      Object.keys(files).sort(),
      TABLES.map((table) => table.file).sort()
    );
    for (const [file, content] of Object.entries(files)) {
      assert.equal(lf(content), lf(read(file)), file);
    }
  });
});

describe("the race spec harvester", () => {
  it("fails, naming the mod and spec, when a spec does not parse", (t) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-harvest-"));
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const write = (file, text) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    };
    const media = path.join(tmp, "media");
    const userData = path.join(tmp, "user");
    const broken = "/pa/units/land/fx_tank/fx_tank.json";
    for (const dir of ["pa", "pa_ex1"]) {
      write(path.join(media, dir, "units", "unit_list.json"), '{"units":[]}');
    }
    for (const table of TABLES) {
      for (const mod of table.mods) {
        const pa = path.join(userData, "server_mods", mod, "pa");
        write(path.join(pa, "units", "unit_list.json"), '{"units":[]}');
      }
    }
    const own = path.join(userData, "server_mods", TABLES[0].mods[0], "pa");
    write(
      path.join(own, "units", "unit_list.json"),
      JSON.stringify({ units: [broken] })
    );
    write(path.join(own, broken.replace(/^\/pa\//, "")), '{"display_name": }');

    const run = spawnSync(
      process.execPath,
      [path.join(REPO_ROOT, "scripts", "harvest-race-specs.js")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PA_MEDIA: media,
          PA_USER_DATA: userData,
          GWO_HARVEST_OUT: path.join(tmp, "race_specs.json"),
        },
      }
    );

    assert.notEqual(run.status, 0);
    assert.ok(
      run.stderr.includes(TABLES[0].mods[0] + " " + broken + ": "),
      run.stderr
    );
    assert.equal(fs.existsSync(path.join(tmp, "race_specs.json")), false);
  });
});

describe("race naming rules", () => {
  const RACE = {
    id: "fx",
    strategy: "race",
    bit: "Custom9",
    namePrefix: "^Fx ",
    stemPrefix: "^fx_",
    research: true,
  };
  const OWN = "com.fx.race";
  const units = {
    "/pa/units/land/fx_tank/fx_tank.json": {
      display_name: "Fx Heavy AA Tank",
      unit_types: ["UNITTYPE_Custom9"],
      tools: ["/pa/units/land/fx_tank/fx_tank_tool_weapon.json"],
      death_weapon: {
        ground_ammo_spec: "/pa/units/land/fx_tank/fx_tank_death_ammo.json",
      },
    },
    "/pa/units/land/fx_tank/fx_tank_tool_weapon.json": {
      ammo_id: [
        "/pa/units/land/fx_tank/fx_tank_ammo.json",
        "/pa/units/land/fx_tank/fx_tank_water_ammo.json",
      ],
    },
    "/pa/units/land/fx_tank/fx_tank_ammo.json": {},
    "/pa/units/land/fx_tank/fx_tank_water_ammo.json": {},
    "/pa/units/land/fx_tank/fx_tank_death_ammo.json": {},
    "/pa/units/land/fx_tank_fast/fx_tank_fast.json": {
      display_name: "!LOC:Heavy AA Tank",
      base_spec: "/pa/units/land/base_fx/base_fx.json",
    },
    "/pa/units/land/base_fx/base_fx.json": {
      unit_types: ["UNITTYPE_Custom9"],
    },
    "/pa/units/structure/fx_factory_adv/fx_factory_adv.json": {
      display_name: "Advanced Fx Factory",
      unit_types: ["UNITTYPE_Custom9"],
    },
    "/pa/units/research/fx_tank_unlock/research_fx_tank.json": {
      display_name: "Tank Unlock",
      unit_types: ["UNITTYPE_Custom9"],
    },
    "/pa/units/research/fx_tank_unlock/fx_tank_unlock.json": {
      display_name: "Tank Unlock",
      unit_types: ["UNITTYPE_Custom9"],
    },
    "/pa/units/land/fx_nameless/fx_nameless.json": {
      unit_types: ["UNITTYPE_Custom9"],
    },
    "/pa/units/land/fx_other/fx_other.json": {
      display_name: "Other",
      unit_types: ["UNITTYPE_Custom1"],
    },
  };
  const source = () => ({
    mods: [OWN, "com.fx.companion"],
    unitList: [
      "/pa/units/land/fx_tank/fx_tank.json",
      "/pa/units/land/fx_tank_fast/fx_tank_fast.json",
      "/pa/units/structure/fx_factory_adv/fx_factory_adv.json",
      "/pa/units/research/fx_tank_unlock/research_fx_tank.json",
      "/pa/units/research/fx_tank_unlock/fx_tank_unlock.json",
      "/pa/units/land/fx_nameless/fx_nameless.json",
      "/pa/units/land/fx_other/fx_other.json",
    ],
    specs: { [OWN]: units, "com.fx.companion": {} },
  });
  const table = (input, src = source()) =>
    buildTable(input, { tables: { fx: src }, baseUnits: [] });

  it("keys units by display name, less the race prefix, Advanced last", () => {
    const { units: keyed } = table(RACE);
    const paths = keyed.map(([, unit]) => unit);

    assert.equal(
      new Map(keyed).get("heavyAATank"),
      "/pa/units/land/fx_tank/fx_tank.json"
    );
    assert.equal(
      new Map(keyed).get("fxFactoryAdvanced"),
      "/pa/units/structure/fx_factory_adv/fx_factory_adv.json"
    );
    assert.equal(
      new Map(keyed).get("nameless"),
      "/pa/units/land/fx_nameless/fx_nameless.json"
    );
    assert.equal(
      paths.includes("/pa/units/land/fx_other/fx_other.json"),
      false
    );
  });

  it("gives a shared name the unit's directory, and follows base_spec for the bit", () => {
    assert.equal(
      new Map(table(RACE).units).get("heavyAATankfxTankFast"),
      "/pa/units/land/fx_tank_fast/fx_tank_fast.json"
    );
  });

  it("reads only a unit's own types when told to", () => {
    const keyed = new Map(table({ ...RACE, ownTypesOnly: true }).units);

    assert.equal(keyed.has("heavyAATankfxTankFast"), false);
  });

  it("keys parts by owner plus role, from tools, ammo and death weapons", () => {
    const keyed = new Map(table(RACE).units);

    assert.equal(
      keyed.get("heavyAATankWeapon"),
      "/pa/units/land/fx_tank/fx_tank_tool_weapon.json"
    );
    assert.equal(
      keyed.get("heavyAATankAmmo"),
      "/pa/units/land/fx_tank/fx_tank_ammo.json"
    );
    assert.equal(
      keyed.get("heavyAATankWaterAmmo"),
      "/pa/units/land/fx_tank/fx_tank_water_ammo.json"
    );
    assert.equal(
      keyed.get("heavyAATankDeathAmmo"),
      "/pa/units/land/fx_tank/fx_tank_death_ammo.json"
    );
  });

  it("follows ammo arrays and death weapons only when allowed", () => {
    const keyed = new Map(
      table({ ...RACE, followAmmoArrays: false, followDeathWeapons: false })
        .units
    );

    assert.equal(keyed.has("heavyAATankAmmo"), false);
    assert.equal(keyed.has("heavyAATankDeathAmmo"), false);
    assert.equal(keyed.has("heavyAATankWeapon"), true);
  });

  it("keys a research factory <x>Research and its token <x>Unlock", () => {
    const keyed = new Map(table(RACE).units);

    assert.equal(
      keyed.get("tankResearch"),
      "/pa/units/research/fx_tank_unlock/research_fx_tank.json"
    );
    assert.equal(
      keyed.get("tankUnlock"),
      "/pa/units/research/fx_tank_unlock/fx_tank_unlock.json"
    );
  });

  it("keeps a unit the race's own mod does not ship out", () => {
    const own = { ...units };
    const moved = "/pa/units/structure/fx_factory_adv/fx_factory_adv.json";
    delete own[moved];
    const src = {
      ...source(),
      specs: { [OWN]: own, "com.fx.companion": { [moved]: units[moved] } },
    };

    assert.equal(
      new Map(table(RACE, src).units).has("fxFactoryAdvanced"),
      false
    );
  });

  it("takes pinned keys, names and extra entries from the input", () => {
    const tank = "/pa/units/land/fx_tank/fx_tank.json";
    const { units: keyed, unitNames } = table({
      ...RACE,
      keys: { [tank]: "tank" },
      names: { [tank]: "Old Tank" },
      parts: { extraAmmo: "/pa/units/land/fx_tank/fx_tank_ammo.json" },
    });
    const byKey = new Map(keyed);

    assert.equal(byKey.get("tank"), tank);
    assert.equal(byKey.get("tankWeapon"), units[tank].tools[0]);
    assert.equal(
      byKey.get("extraAmmo"),
      "/pa/units/land/fx_tank/fx_tank_ammo.json"
    );
    assert.equal(byKey.has("tankAmmo"), false);
    assert.equal(new Map(unitNames).get("tank"), "!LOC:Old Tank");
  });

  it("names every unit as a !LOC: key, bare or not in the spec", () => {
    const names = new Map(table(RACE).unitNames);

    assert.equal(names.get("heavyAATank"), "!LOC:Fx Heavy AA Tank");
    assert.equal(names.get("heavyAATankfxTankFast"), "!LOC:Heavy AA Tank");
  });

  it("sorts keys in code-point order", () => {
    const keys = table(RACE).units.map(([key]) => key);

    assert.deepEqual(keys, [...keys].sort());
  });

  it("numbers a part key past every key already taken", () => {
    const keyed = new Map(
      table({
        ...RACE,
        parts: {
          heavyAATankAmmo: "/pa/units/land/fx_x/fx_x_ammo.json",
          heavyAATankAmmo2: "/pa/units/land/fx_y/fx_y_ammo.json",
        },
      }).units
    );

    assert.equal(
      keyed.get("heavyAATankAmmo3"),
      "/pa/units/land/fx_tank/fx_tank_ammo.json"
    );
  });

  it("refuses a unit key its directory does not free", () => {
    assert.throws(
      () =>
        table({
          ...RACE,
          units: { heavyAATankfxTankFast: "/pa/units/land/fx_x/fx_x.json" },
        }),
      /fx: key heavyAATankfxTankFast for \/pa\/units\/land\/fx_tank_fast\/fx_tank_fast\.json is already taken/
    );
  });
});

describe("add-on naming rules", () => {
  const MOD = "com.fx.addon";
  const addon = (unitList, specs, baseUnits = []) =>
    buildTable(
      { id: "fx", strategy: "addon" },
      {
        tables: { fx: { mods: [MOD], unitList, specs: { [MOD]: specs } } },
        baseUnits,
      }
    );

  it("skips the base game's units, and splits a shared name by race, then directory", () => {
    const specs = {
      "/pa/units/land/tank/tank.json": { display_name: "Tank" },
      "/pa/units/addon/spear/spear.json": {
        display_name: "Spear",
        unit_types: ["UNITTYPE_Custom58"],
      },
      "/pa/units/addon/b_spear/b_spear.json": {
        display_name: "Spear",
        unit_types: ["UNITTYPE_Custom2"],
      },
      "/pa/units/addon/rig/rig.json": { display_name: "Rig" },
      "/pa/units/addon/rig_build/rig_build.json": { display_name: "Rig" },
    };
    const { units } = addon(Object.keys(specs), specs, [
      "/pa/units/land/tank/tank.json",
    ]);

    assert.deepEqual(units, [
      ["rig", "/pa/units/addon/rig/rig.json"],
      ["rigBuild", "/pa/units/addon/rig_build/rig_build.json"],
      ["spear", "/pa/units/addon/spear/spear.json"],
      ["spearBugs", "/pa/units/addon/b_spear/b_spear.json"],
    ]);
  });

  it("follows each unit with its parts, ammo read up the tool's base_spec", () => {
    const specs = {
      "/pa/units/addon/rex/rex.json": {
        display_name: "!LOC:Rex",
        tools: [
          "/pa/units/addon/rex/rex_tool_weapon.json",
          "/pa/units/addon/rex/rex_build_arm.json",
        ],
        death_weapon: {
          ground_ammo_spec: "/pa/units/addon/rex/rex_boom_ammo.json",
        },
      },
      "/pa/units/addon/rex/rex_tool_weapon.json": {
        base_spec: "/pa/units/addon/rex/base_weapon.json",
      },
      "/pa/units/addon/rex/base_weapon.json": {
        ammo_id: "/pa/units/addon/rex/rex_ammo.json",
      },
    };
    const { units, unitNames } = addon(["/pa/units/addon/rex/rex.json"], specs);

    assert.deepEqual(units, [
      ["rex", "/pa/units/addon/rex/rex.json"],
      ["rexWeapon", "/pa/units/addon/rex/rex_tool_weapon.json"],
      ["rexAmmo", "/pa/units/addon/rex/rex_ammo.json"],
      ["rexBuildArm", "/pa/units/addon/rex/rex_build_arm.json"],
      ["rexBoomDeathAmmo", "/pa/units/addon/rex/rex_boom_ammo.json"],
    ]);
    assert.deepEqual(unitNames, [["rex", "!LOC:Rex"]]);
  });

  it("refuses a unit key an earlier unit's part holds", () => {
    const specs = {
      "/pa/units/addon/rex/rex.json": {
        display_name: "Rex",
        tools: ["/pa/units/addon/rex/rex_build_arm.json"],
      },
      "/pa/units/addon/rex_arm/rex_arm.json": {
        display_name: "Rex Build Arm",
      },
    };

    assert.throws(
      () => addon(Object.keys(specs), specs),
      /fx: key rexBuildArm for \/pa\/units\/addon\/rex_arm\/rex_arm\.json is already taken/
    );
  });

  it("folds accents and lower-cases every word", () => {
    assert.equal(camelLower("Ægir"), "aegir");
    assert.equal(camelLower("Planet-wide Radar"), "planetWideRadar");
    assert.equal(camelLower("ARKYD Déjà"), "arkydDeja");
    assert.equal(camelKeepCase("Bug Heavy AA Turret"), "bugHeavyAATurret");
  });
});

describe("renderFile", () => {
  const input = { id: "fx", file: "ui/mods/fx/race/fx.js" };
  const table = {
    units: [["tank", "/pa/units/land/fx_tank/fx_tank.json"]],
    unitNames: [["tank", "!LOC:Tank"]],
  };
  const file = [
    "define(function () {",
    "  return {",
    '    id: "fx",',
    "    units: {},",
    "    unitNames: {},",
    "  };",
    "});",
    "",
  ];

  it("replaces only the two closing tables, keeping the file's line endings", async () => {
    const out = await renderFile(
      input,
      table,
      file.join("\r\n").replace("units: {}", "units: {\r\n    }")
    );

    assert.equal(
      out,
      [
        "define(function () {",
        "  return {",
        '    id: "fx",',
        "    units: {",
        '      tank: "/pa/units/land/fx_tank/fx_tank.json",',
        "    },",
        "    unitNames: {",
        '      tank: "!LOC:Tank",',
        "    },",
        "  };",
        "});",
        "",
      ].join("\r\n")
    );
  });

  it("refuses a file whose descriptor does not close with the tables", async () => {
    await assert.rejects(
      renderFile(input, table, file.join("\n")),
      /expected units and unitNames to close the descriptor/
    );
  });
});
