// Legion Expansion as a Galactic War race. Commanders and AI data are what the
// mod ships; the unit table maps GWO's vanilla unit keys to Legion's units so
// the card and tech pipeline can address them. See races.md.
define(function () {
  return {
    id: "legion",
    name: "!LOC:Legion",
    serverMods: [
      "com.pa.legion-expansion-server",
      "com.pa.legion-expansion-server-dev",
    ],
    unitTypeBit: "Custom1",
    commanderTypes: {
      unitType: "UNITTYPE_Custom1",
      buildable: "CmdBuild & Custom1",
    },
    commanders: [
      { spec: "/pa/units/commanders/l_overwatch/l_overwatch.json" },
      { spec: "/pa/units/commanders/l_cyclops/l_cyclops.json" },
      { spec: "/pa/units/commanders/l_cataphract/l_cataphract.json" },
      { spec: "/pa/units/commanders/l_raptor/l_raptor.json" },
      { spec: "/pa/units/commanders/l_quad/l_quad.json" },
      { spec: "/pa/units/commanders/l_tank/l_tank.json" },
    ],
    playerIcon: {
      fill: "coui://ui/mods/com.pa.legion-expansion/img/icon_player_fill_l.png",
      outline:
        "coui://ui/mods/com.pa.legion-expansion/img/icon_player_outline_l.png",
    },
    ai: {
      // Flat legion_* files beside the stock ones, one unit map.
      titans: {
        unitMaps: ["/pa/ai/unit_maps/legion.json"],
        sources: [
          { dir: "/pa/ai/fabber_builds/", match: "legion_" },
          { dir: "/pa/ai/factory_builds/", match: "legion_" },
          { dir: "/pa/ai/platoon_builds/", match: "legion_" },
          { dir: "/pa/ai/platoon_templates/", match: "legion_" },
        ],
      },
      // Queller carries Legion beside MLA in every tier; the tree is the tier
      // minus the MLA side.
      queller: {
        unitMaps: ["unit_maps/legion.json"],
        exclude: ["/mla/", "/unit_maps/mla.json"],
      },
    },
    units: {},
  };
});
