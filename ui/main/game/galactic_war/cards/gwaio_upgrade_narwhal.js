define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Narwhal Upgrade Tech doubles the rate of fire of all weapons."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Narwhal Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.narwhal)) {
        chance = 30;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.narwhalWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.narwhalAA,
          path: "rate_of_fire",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.narwhalTorpedo,
          path: "rate_of_fire",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
