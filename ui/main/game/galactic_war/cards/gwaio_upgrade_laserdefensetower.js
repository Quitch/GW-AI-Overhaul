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
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.laserDefenseTower)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.laserDefenseTowerWeapon, "multiply", {
          max_range: 1.5,
        })
      );
    },
    dull: function () {},
  };
});
