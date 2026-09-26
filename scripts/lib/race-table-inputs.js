"use strict";

// The hand-kept inputs to scripts/generate-race-tables.js: for each race and
// add-on file, which server mods its specs come from and the naming rules
// its table was generated with, plus every value a rule does not derive.
// scripts/harvest-race-specs.js reads `mods`, `baseGame`, `units` and
// `parts` to know what to record. See races.md, "Unit tables".

const MOD_DIR = "ui/mods/com.pa.quitch.gwaioverhaul/";

const LEGION_COMMANDER = "/pa/units/commanders/l_base/l_base.json";

const TABLES = [
  {
    id: "legion",
    file: MOD_DIR + "race/legion.js",
    strategy: "race",
    // The race's zip first; the base game fills whatever it does not ship.
    mods: ["com.pa.legion-expansion-server"],
    baseGame: true,
    bit: "Custom1",
    skipPaths: ["/commanders/", "/chain/"],
    stemPrefix: "^l_",
    // Legion's table predates the Bugs rules: an ammo_id array and a
    // death_weapon are not followed, so a part only those reach is keyed
    // below or not at all.
    followAmmoArrays: false,
    followDeathWeapons: false,
    // The keys the table first shipped with where the name rule reads badly:
    // Legion ships two units each called Purger, Spoiler and Meteoroid, and
    // names its storage "OmniSilo Storage Device".
    keys: {
      "/pa/units/land/l_storage/l_storage.json": "omniSilo",
      "/pa/units/land/l_necromancer/l_minion/l_minion.json":
        "necromancerPurger",
      "/pa/units/land/l_land_mine/triggered/l_land_mine.json":
        "spoilerTriggered",
      "/pa/units/orbital/l_orbital_battleship/l_drone/l_drone.json":
        "imperatorMeteoroid",
    },
    // Keyed before any rule runs, so a rule's key that collides with one of
    // these takes a suffix instead. They are the entries the table first
    // carried by hand (29a1c192) that no rule above reaches.
    units: { commander: LEGION_COMMANDER },
    parts: {
      infiltratorAmmo:
        "/pa/units/air/l_air_scout_adv/l_air_scout_adv_ammo.json",
      investigatorLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_land_ammo.json",
      investigatorRadarCollisionCheckLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_collision_check_land_ammo.json",
      investigatorRadarLandAmmo:
        "/pa/units/land/l_scout_bot/l_scout_bot_radar_mode_land_ammo.json",
      ironDomeAmmo:
        "/pa/units/land/l_anti_nuke_launcher/l_anti_nuke_launcher_ammo.json",
      necromancerAmmo: "/pa/units/land/l_necromancer/l_necromancer_ammo.json",
      peacekeeperAmmo: "/pa/units/land/l_assault_bot/l_assault_bot_ammo.json",
      stokeAmmo: "/pa/units/land/l_mortar_tank/l_mortar_tank_ammo.json",
      stokeTorpedoWaterAmmo:
        "/pa/units/land/l_mortar_tank/l_mortar_tank_torpedo_water_ammo.json",
    },
  },
  {
    id: "bugs",
    file: MOD_DIR + "race/bugs.js",
    strategy: "race",
    // commander-merge supplies files the bugs zip leans on; the race's own
    // zip shadows it, as it does at runtime.
    mods: ["com.pa.ferretmaster.bugs", "com.pa.ferretmaster.commander-merge"],
    bit: "Custom2",
    // A unit counts when its own unit_types carry the bit, as when the table
    // first shipped. That leaves out the commander, whose bit comes from
    // commander-merge's base spec.
    ownTypesOnly: true,
    namePrefix: "^Bug ",
    stemPrefix: "^bug_",
    research: true,
  },
  {
    id: "exiles",
    file: MOD_DIR + "race/exiles.js",
    strategy: "race",
    mods: ["com.pa.nik.exiles", "com.pa.ferretmaster.commander-merge"],
    bit: "Custom6",
    namePrefix: "^(Exiles?|Exile) ",
    stemPrefix: "^(t|r|a)_",
    // Exiles renamed Jelly to Navigator after the table shipped. A key is
    // what a race-only card addresses, so it stays; the name is held with
    // it until the table is regenerated on purpose.
    keys: { "/pa/units/land/jelly/jelly.json": "jelly" },
    names: { "/pa/units/land/jelly/jelly.json": "Jelly" },
  },
  {
    id: "second_wave",
    file: MOD_DIR + "addon/second_wave.js",
    strategy: "addon",
    mods: ["pa.mla.unit.addon", "pa.mla.unit.addon.companion"],
    baseGame: true,
  },
  {
    id: "section17",
    file: MOD_DIR + "addon/section17.js",
    strategy: "addon",
    mods: ["com.pa.daedelus.experimentals"],
    baseGame: true,
  },
  {
    id: "osmech",
    file: MOD_DIR + "addon/osmech.js",
    strategy: "addon",
    mods: ["com.pa.loloares.thorosmen", "com.pa.loloares.thorosmen-client"],
    baseGame: true,
  },
];

// An add-on key two of its units share takes the race word of the bit the
// unit carries. Custom17 is Section 17's exclusive bit, which no race owns.
const ADDON_BIT_WORDS = {
  Custom1: "Legion",
  Custom2: "Bugs",
  Custom6: "Exiles",
  Custom17: "",
};

module.exports = { TABLES, ADDON_BIT_WORDS };
