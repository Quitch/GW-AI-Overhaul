define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Astraeus Upgrade Tech increases the orbital lander's interplanetary movement speed by 200% and increases its carry capacity to 12 units."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
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
        {
          file: gwoUnit.astraeus,
          path: "transporter.capacity",
          op: "multiply",
          value: 12,
        },
      ]);
    },
    dull: function () {},
  };
});
