define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Sheller Upgrade Tech causes mines to be left by the mortar tank's attacks."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Sheller Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.sheller)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods(
        gwoCard.mods(gwoUnit.shellerAmmo, "replace", {
          spawn_unit_on_death: gwoUnit.landMine,
        })
      );
    },
    dull: function () {},
  };
});
