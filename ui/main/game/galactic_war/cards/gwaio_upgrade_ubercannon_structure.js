define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Upgrade Tech increases Uber Cannon damage to structures and commanders by 300%."
    ),
    summarize: _.constant("!LOC:Commander Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function () {
      return { chance: 30 };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.commanderSecondaryAmmo,
          path: "armor_damage_map.AT_Structure",
          op: "multiply",
          value: 4,
        },
        {
          file: gwaioUnits.commanderSecondaryAmmo,
          path: "armor_damage_map.AT_Commander",
          op: "multiply",
          value: 4,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
