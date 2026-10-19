// The loadout card ids, in one place, for modules that need only the ids. See
// tech-cards.md, "Loadouts".
define(function () {
  var starting = [
    "gwc_start_vehicle",
    "gwc_start_air",
    "gwc_start_orbital",
    "gwc_start_bot",
    "gwaio_start_naval",
  ];

  // Base-game loadouts unlocked by winning a war with them.
  var lockedBase = [
    "gwc_start_artillery",
    "gwc_start_subcdr",
    "gwc_start_combatcdr",
  ];

  // Loadouts this mod adds, also unlocked by winning a war.
  var unlockable = [
    "gwaio_start_paratrooper",
    "nem_start_deepspace",
    "nem_start_nuke",
    "nem_start_planetary",
    "nem_start_tower_rush",
    "gwaio_start_tourist",
    "gwaio_start_rapid",
    "tgw_start_speed",
    "tgw_start_tank",
    "gwaio_start_nomad",
    "gwaio_start_backpacker",
    "gwaio_start_hoarder",
    "gwaio_start_warp",
    "gwaio_start_terminal",
    "gwaio_start_lucky",
  ];

  // The loadouts above that MLA alone can use, as loadout entries. Loadouts on
  // hand-picked unit lists no cell reads, and loadouts that change what an MLA
  // unit is or builds, keep those changes on MLA. A race gets its own. See
  // races.md, "Which races a loadout reaches".
  var entries = [
    { id: "gwaio_start_paratrooper", races: ["mla"] }, // specific to Unit Cannon and Lob
    { id: "gwaio_start_nomad", races: ["mla"] },
    { id: "gwaio_start_rapid", races: ["mla"] }, // loads AI files specific to MLA
    { id: "nem_start_nuke", races: ["mla"] }, // pushes a build type and a description onto the MLA nuke
    { id: "nem_start_planetary", races: ["mla"] }, // its description change keeps the extractor changes on MLA
    { id: "nem_start_deepspace", races: ["mla"] }, // changes the Jig's description and model, and the orbital fabber's build list
    { id: "nem_start_tower_rush", races: ["mla"] }, // pushes build types onto MLA defences
    { id: "gwc_start_artillery", races: ["mla"] }, // pushes a build type onto MLA artillery
  ];

  return {
    starting: starting,
    lockedBase: lockedBase,
    unlockable: unlockable,
    entries: entries,
    all: starting.concat(lockedBase, unlockable),
  };
});
