define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Enables the building of the Planetary Radar which provides complete planetary radar coverage."
    ),
    summarize: _.constant("!LOC:Planetary Radar Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_intelligence_fabrication.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_efficiency",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.conditionalDeal(
        gwoCard.hasUnit(inventory.units(), gwoGroup.fabbersAdvanced),
        100
      );
    },
    buff: function (inventory) {
      inventory.addUnits(gwoUnit.deepSpaceOrbitalRadar);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.deepSpaceOrbitalRadar, "replace", {
            unit_name: "Planetary Radar",
            display_name: "!LOC:Planetary Radar",
            description:
              "!LOC:Planetary Radar - Detects enemy land, sea, and air units across the planet.",
            unit_types: [
              "UNITTYPE_Land",
              "UNITTYPE_Structure",
              "UNITTYPE_Advanced",
              "UNITTYPE_Recon",
              "UNITTYPE_FabAdvBuild",
              "UNITTYPE_Radar",
              "UNITTYPE_Important",
              "UNITTYPE_Custom58",
            ],
          })
          .concat(
            gwoCard.mods(gwoUnit.deepSpaceOrbitalRadar, "multiply", {
              max_health: 3,
              build_metal_cost: 8,
              "consumption.energy": 50,
            }),
            gwoCard.mods(gwoUnit.deepSpaceOrbitalRadar, "replace", {
              "recon.observer.items": [
                {
                  layer: "surface_and_air",
                  channel: "sight",
                  shape: "capsule",
                  radius: 300,
                  uses_energy: true,
                },
                {
                  layer: "underwater",
                  channel: "sight",
                  shape: "capsule",
                  radius: 300,
                  uses_energy: true,
                },
                {
                  layer: "orbital",
                  channel: "sight",
                  shape: "capsule",
                  radius: 1200,
                  uses_energy: true,
                },
                {
                  layer: "surface_and_air",
                  channel: "radar",
                  shape: "capsule",
                  radius: 9999,
                  uses_energy: true,
                },
                {
                  layer: "underwater",
                  channel: "radar",
                  shape: "capsule",
                  radius: 9999,
                  uses_energy: true,
                },
              ],
              "selection_icon.diameter": 55,
            })
          )
      );

      inventory.addAIMods([
        {
          type: "fabber",
          op: "load",
          value: "gwaio_enable_planetaryradar.json",
        },
      ]);
    },
    dull: function () {},
  };
});
