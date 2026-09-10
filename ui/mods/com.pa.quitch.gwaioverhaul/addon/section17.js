// Section 17 as a Galactic War add-on: experimental units for MLA and Legion,
// four of them built only by its gantries, and AI data for MLA. `units` keys
// every spec the mod adds by a name of its own (the same shape as
// shared/units.js) and `unitNames` carries the display names by the same
// keys. What a player fields follows from capability cells. See races.md,
// "Add-ons".
define(function () {
  return {
    id: "section17",
    name: "!LOC:Section 17",
    serverMods: ["com.pa.daedelus.experimentals"],
    layers: {
      // Flat files named for the unit each builds, beside the stock ones, and
      // one unit map. A full filename is a prefix no base file shares.
      mla: {
        titans: {
          unitMaps: ["/pa/ai/unit_maps/s17_paeiou.json"],
          sources: [
            { dir: "/pa/ai/factory_builds/", match: "dolfin.json" },
            { dir: "/pa/ai/factory_builds/", match: "katrina.json" },
            { dir: "/pa/ai/factory_builds/", match: "spider.json" },
            { dir: "/pa/ai/factory_builds/", match: "yellowjacket.json" },
            { dir: "/pa/ai/fabber_builds/", match: "dox_materializer.json" },
            { dir: "/pa/ai/fabber_builds/", match: "energy_coil.json" },
            { dir: "/pa/ai/fabber_builds/", match: "solar_cell.json" },
          ],
        },
      },
    },
    units: {},
    unitNames: {},
  };
});
