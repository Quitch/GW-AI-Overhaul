define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anchor Upgrade Tech increases the range of the defense satellite's weapons by 25%."
    ),
    summarize: _.constant("!LOC:Anchor Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.anchor)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.anchorWeaponAG,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: gwoUnit.anchorWeaponAO,
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
