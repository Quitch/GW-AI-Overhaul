define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Astraeus Upgrade Tech increases the orbital lander's interplanetary movement speed by 200%."
    ),
    summarize: _.constant("!LOC:Astraeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.astraeus)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.astraeus,
          path: "system_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
        {
          file: gwoUnit.astraeus,
          path: "gravwell_velocity_multiplier",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
