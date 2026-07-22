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

      var healthMods = _.map(gwoGroup.units, function (unit) {
        return gwoCard.mods(unit, "multiply", { max_health: 1.3 });
      });
      var rangeMods = _.map(gwoGroup.weapons, function (weapon) {
        return gwoCard.mods(weapon, "multiply", {
          max_range: rangePercentageIncrease,
        });
      });
      // Try to make sure that units can use their full range
      var ammoMods = _.map(gwoGroup.ammo, function (ammo) {
        return gwoCard.mods(ammo, "multiply", {
          lifetime: rangePercentageIncrease,
          max_velocity: rangePercentageIncrease,
        });
      });

      // We have to exclude radar due to the ordering of their vision
      // being different from other units.
      var unitsExcludingRadarScoutsCommanders = _.reject(
        gwoGroup.units,
        function (unit) {
          return _.includes(
            [
              gwoUnit.antiNukeLauncher,
              gwoUnit.arkyd,
              gwoUnit.commander,
              gwoUnit.firefly,
              gwoUnit.hermes,
              gwoUnit.manhattan,
              gwoUnit.nyx,
              // gwoUnit.planetaryRadar - uses slot 3+ for radar vision
              gwoUnit.radar,
              gwoUnit.radarAdvanced,
              gwoUnit.radarSatelliteAdvanced,
              gwoUnit.skitter,
              // gwoUnit.stingray - uses slot 2+ for radar vision
              gwoUnit.torpedoLauncher,
              gwoUnit.torpedoLauncherAdvanced,
              gwoUnit.ward,
            ],
            unit
          );
        }
      );
      var radarsWithRadarVisionInSlot0 = [
        gwoUnit.arkyd,
        gwoUnit.radarSatelliteAdvanced,
      ];
      var radarsWithRadarVisionInSlot1 = [
        gwoUnit.antiNukeLauncher,
        gwoUnit.manhattan,
        gwoUnit.nyx,
        gwoUnit.radar,
        gwoUnit.radarAdvanced,
        gwoUnit.torpedoLauncher,
        gwoUnit.torpedoLauncherAdvanced,
        gwoUnit.ward,
      ];

      var blindMods = _.map(
        unitsExcludingRadarScoutsCommanders,
        function (unit) {
          // can't use replace due to Planetary Radar using it - multiply runs later
          return gwoCard.mods(unit, "multiply", {
            "recon.observer.items.0.radius": 0,
            "recon.observer.items.1.radius": 0,
          });
        }
      );
      var radarsWithRadarVisionInSlot1Mods = _.map(
        radarsWithRadarVisionInSlot1,
        function (unit) {
          return gwoCard.mods(unit, "replace", {
            "recon.observer.items.0.radius": 0,
          });
        }
      );
      var radarsWithRadarVisionInSlot0Mods = _.map(
        radarsWithRadarVisionInSlot0,
        function (unit) {
          return gwoCard.mods(unit, "replace", {
            "recon.observer.items.1.radius": 0,
          });
        }
      );

      // unit specific fixes required to accommodate the range
      var aresFixMods = gwoCard.mods(gwoUnit.aresWeapon, "replace", {
        pitch_range: 89,
        arc_type: "ARC_high",
      });

      inventory.addMods(
        _.flatten(
          healthMods.concat(
            rangeMods,
            ammoMods,
            blindMods,
            radarsWithRadarVisionInSlot1Mods,
            radarsWithRadarVisionInSlot0Mods,
            aresFixMods
          )
        )
      );
    },
    dull: function () {},
  };
});
