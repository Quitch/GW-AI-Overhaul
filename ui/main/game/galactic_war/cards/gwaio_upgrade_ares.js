define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Ares Upgrade Tech increases the range of the rolling fortress by 25%."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Ares Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.ares)) {
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
          file: gwoUnit.aresWeapon,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
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
        },
        {
          file: gwoUnit.aresSecondary,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwoUnit.aresSecondaryAmmo,
          path: "max_velocity",
          op: "replace",
          value: 200,
        },
      ]);
    },
    dull: function () {},
  };
});
