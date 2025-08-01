define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Advanced Vehicle Factory Upgrade Tech decreases advanced vehicle unit costs by 25% but also decreases the factory's health by 50%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Advanced Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.vehicleFactoryAdvanced)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      const mods = _.map(gwoGroup.vehiclesAdvanced, function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        };
      });
      mods.push({
        file: gwoUnit.vehicleFactoryAdvanced,
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
