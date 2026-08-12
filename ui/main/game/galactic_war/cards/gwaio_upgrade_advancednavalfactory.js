define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Advanced Naval Factory Upgrade Tech decreases advanced naval unit costs by 25% but also decreases the factory's health by 50%."
      )
    )
  ),

  summarize: () => "!LOC:Advanced Naval Factory Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.navalFactoryAdvanced),
      gwoCard.navalWeight(inventory, 30)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    const mods = _.map(gwoGroup.navalAdvancedMobile, (unit) => ({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.75,
    }));
    mods.push({
      file: gwoUnit.navalFactoryAdvanced,
      path: "max_health",
      op: "multiply",
      value: 0.5,
    });
    inventory.addMods(mods);
  },

  dull: function () {},
}));
