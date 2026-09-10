// Second Wave as a Galactic War add-on: units for MLA, Legion and Bugs, and
// AI data for the first two. `units` keys every spec the mod adds by a name
// of its own (the same shape as shared/units.js) and `unitNames` carries the
// display names by the same keys. What a player fields follows from
// capability cells. See races.md, "Add-ons".
define(function () {
  return {
    id: "second_wave",
    name: "!LOC:Second Wave",
    serverMods: ["pa.mla.unit.addon"],
    layers: {
      // mla/ sub-directories under two build directories, a unit map, and an
      // aux map of builder aliases both layers' build files read.
      mla: {
        titans: {
          unitMaps: [
            "/pa/ai/unit_maps/second_wave.json",
            "/pa/ai/unit_maps/second_wave_aux.json",
          ],
          sources: [
            { dir: "/pa/ai/fabber_builds/", match: "mla/" },
            { dir: "/pa/ai/factory_builds/", match: "mla/" },
          ],
        },
      },
      legion: {
        titans: {
          unitMaps: [
            "/pa/ai/unit_maps/second_wave_legion.json",
            "/pa/ai/unit_maps/second_wave_aux.json",
          ],
          sources: [
            { dir: "/pa/ai/fabber_builds/", match: "legion/" },
            { dir: "/pa/ai/factory_builds/", match: "legion/" },
          ],
        },
      },
    },
    units: {},
    unitNames: {},
  };
});
