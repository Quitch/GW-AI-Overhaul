define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  const prepareMods = function (mods) {
    const rangePercentageIncrease = 1.5;
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
    const unitsExcludingRadarScoutsCommanders = _.reject(
      gwoGroup.units,
      function (unit) {
        return _.includes(
          [
            gwoUnit.commander,
            gwoUnit.skitter,
            gwoUnit.hermes,
            gwoUnit.firefly,
            gwoUnit.radar,
            gwoUnit.radarAdvanced,
            gwoUnit.nyx,
            gwoUnit.radarSatelliteAdvanced,
            gwoUnit.arkyd,
            gwoUnit.stingray,
          ],
          unit
        );
      }
    );
    _.forEach(unitsExcludingRadarScoutsCommanders, function (unit) {
      mods.push({
        file: unit,
        path: "recon.observer.items.0.radius",
        op: "replace",
        value: 0,
      });
      mods.push({
        file: unit,
        path: "recon.observer.items.1.radius",
        op: "replace",
        value: 0,
      });
    });
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
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      const mods = [];
      prepareMods(mods);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
