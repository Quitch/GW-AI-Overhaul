// The loadout card ids, in one place. loadouts.js cannot serve deal.js directly:
// it touches model.makeKnown and GW.bank at load time, and gw_play has neither.
define(() => {
  const starting = [
    "gwc_start_vehicle",
    "gwc_start_air",
    "gwc_start_orbital",
    "gwc_start_bot",
    "gwaio_start_naval",
  ];

  // Base-game loadouts unlocked by winning a war with them.
  const lockedBase = [
    "gwc_start_artillery",
    "gwc_start_subcdr",
    "gwc_start_combatcdr",
    "gwc_start_allfactory",
    "gwc_start_storage",
  ];

  // Loadouts this mod adds, also unlocked by winning a war.
  const unlockable = [
    "gwaio_start_ceo",
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

  return {
    starting,
    lockedBase,
    unlockable,
    all: starting.concat(lockedBase, unlockable),
  };
});
