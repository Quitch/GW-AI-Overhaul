define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Advanced Vehicle Factory Upgrade Tech decreases advanced vehicle unit costs by 25% but also decreases the factory's health by 50%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Advanced Vehicle Factory Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_vehicle",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.vehicleFactoryAdvanced),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    const mods = _.map(gwoGroup.vehiclesAdvancedMobile, (unit) => ({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.75,
    }));
    mods.push({
      file: gwoUnit.vehicleFactoryAdvanced,
      path: "max_health",
      op: "multiply",
      value: 0.5,
    });
    inventory.addMods(mods);
  },

  dull: function () {},
}));
