define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Laser Defense Tower Upgrade Tech increases the range of the turret by 50%."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.laserDefenseTower)) {
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
      inventory.addMods([
        {
          file: gwoUnit.laserDefenseTowerWeapon,
          path: "max_range",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {},
  };
});
