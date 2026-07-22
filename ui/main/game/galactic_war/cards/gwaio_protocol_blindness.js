define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  var prepareMods = function (mods) {
    var rangePercentageIncrease = 1.5;
    _.forEach(gwoGroup.units, function (unit) {
      mods.push({
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.3,
      });
    });
    _.forEach(gwoGroup.weapons, function (weapon) {
      mods.push({
        file: weapon,
        path: "max_range",
        op: "multiply",
        value: rangePercentageIncrease,
      });
    });
    // Try to make sure that units can use their full range
    _.forEach(gwoGroup.ammo, function (ammo) {
      mods.push(
        {
          file: ammo,
          path: "lifetime",
          op: "multiply",
          value: rangePercentageIncrease,
        },
        {
          file: ammo,
          path: "max_velocity",
          op: "multiply",
          value: rangePercentageIncrease,
        }
      );
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
    _.forEach(unitsExcludingRadarScoutsCommanders, function (unit) {
      mods.push(
        {
          file: unit,
          path: "recon.observer.items.0.radius",
          op: "multiply", // can't use replace due to Planetary Radar using it - multiply runs later
          value: 0,
        },
        {
          file: unit,
          path: "recon.observer.items.1.radius",
          op: "multiply", // can't use replace due to Planetary Radar using it - multiply runs later
          value: 0,
        }
      );
    });
    _.forEach(radarsWithRadarVisionInSlot1, function (unit) {
      mods.push({
        file: unit,
        path: "recon.observer.items.0.radius",
        op: "replace",
        value: 0,
      });
    });
    _.forEach(radarsWithRadarVisionInSlot0, function (unit) {
      mods.push({
        file: unit,
        path: "recon.observer.items.1.radius",
        op: "replace",
        value: 0,
      });
    });
    // unit specific fixes required to accommodate the range
    mods.push(
      {
        file: gwoUnit.aresWeapon,
        path: "pitch_range",
        op: "replace",
        value: 89,
      },
      {
        file: gwoUnit.aresWeapon,
        path: "arc_type",
        op: "replace",
        value: "ARC_high",
      }
    );
  };

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
      var mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
