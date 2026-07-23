define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc("!LOC:Lob Upgrade Tech increases the range of the Lob by 150%.") +
        " " +
        loc(
          "!LOC:Fires twice as fast and no longer costs metal to recharge its ammo."
        ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Lob Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.lob)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.lobWeapon,
          path: "max_range",
          op: "multiply",
          value: 2.5,
        },
        {
          file: gwoUnit.lobWeapon,
          path: "max_firing_velocity",
          op: "multiply",
          value: 2.5,
        },
        {
          file: gwoUnit.lobWeapon,
          path: "ammo_source",
          op: "replace",
          value: "time",
        },
        {
          file: gwoUnit.lobWeapon,
          path: "ammo_capacity",
          op: "replace",
          value: 17,
        },
        {
          file: gwoUnit.lobWeapon,
          path: "ammo_demand",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.lobWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
