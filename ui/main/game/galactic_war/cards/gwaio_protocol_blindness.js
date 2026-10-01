define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Units gain +50% weapon range and +30% health, but only scouts and commanders can see."
    ),
    summarize: _.constant("!LOC:Protocol: Blindness"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var rangePercentageIncrease = 1.5;

      var healthMods = gwoCard.flatMapMods(gwoGroup.units, "multiply", {
        max_health: 1.3,
      });
      var rangeMods = gwoCard.flatMapMods(gwoGroup.weapons, "multiply", {
        max_range: rangePercentageIncrease,
      });
      // Try to make sure that units can use their full range
      var ammoMods = gwoCard.flatMapMods(gwoGroup.ammo, "multiply", {
        lifetime: rangePercentageIncrease,
        max_velocity: rangePercentageIncrease,
      });

      // Radars keep their orbital and underwater sight.
      var unitsExcludingRadarScoutsCommanders = _.difference(gwoGroup.units, [
        gwoUnit.antiNukeLauncher,
        gwoUnit.arkyd,
        gwoUnit.commander,
        gwoUnit.deepSpaceOrbitalRadar,
        gwoUnit.firefly,
        gwoUnit.hermes,
        gwoUnit.manhattan,
        gwoUnit.nyx,
        gwoUnit.radar,
        gwoUnit.radarAdvanced,
        gwoUnit.radarSatelliteAdvanced,
        gwoUnit.skitter,
        gwoUnit.torpedoLauncher,
        gwoUnit.torpedoLauncherAdvanced,
        gwoUnit.ward,
      ]);
      var radars = [
        gwoUnit.antiNukeLauncher,
        gwoUnit.arkyd,
        gwoUnit.manhattan,
        gwoUnit.nyx,
        gwoUnit.radar,
        gwoUnit.radarAdvanced,
        gwoUnit.radarSatelliteAdvanced,
        gwoUnit.torpedoLauncher,
        gwoUnit.torpedoLauncherAdvanced,
        gwoUnit.ward,
      ];

      var blindMods = gwoCard.flatMapMods(
        unitsExcludingRadarScoutsCommanders,
        "multiply",
        _.map(
          ["surface_and_air", "underwater", "orbital", "celestial"],
          function (layer) {
            return gwoCard.observerPath(layer, "sight", "radius");
          }
        ),
        0
      );
      // can't use replace due to Planetary Radar using it - multiply runs later
      var planetaryRadarMods = gwoCard.mods(
        gwoUnit.deepSpaceOrbitalRadar,
        "multiply",
        [
          gwoCard.observerPath("surface_and_air", "sight", "radius"),
          gwoCard.observerPath("underwater", "sight", "radius"),
        ],
        0
      );
      var radarMods = gwoCard.flatMapMods(
        radars,
        "replace",
        [gwoCard.observerPath("surface_and_air", "sight", "radius")],
        0
      );

      // Ares needs a high arc to reach the extended range
      var aresFixMods = gwoCard.mods(gwoUnit.aresWeapon, "replace", {
        pitch_range: 89,
        arc_type: "ARC_high",
      });

      inventory.addMods(
        healthMods.concat(
          rangeMods,
          ammoMods,
          blindMods,
          planetaryRadarMods,
          radarMods,
          aresFixMods
        )
      );
    },
    dull: function () {},
  };
});
