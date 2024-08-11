define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Colonel Upgrade Tech causes support commanders to explode on death."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Colonel Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.colonel)) {
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
          file: gwoUnit.colonel,
          path: "death_weapon.ground_ammo_spec",
          op: "replace",
          value: gwoUnit.commanderDeath,
        },
        {
          file: gwoUnit.colonel,
          path: "death_weapon.air_ammo_spec",
          op: "replace",
          value: gwoUnit.commanderDeathAir,
        },
        {
          file: gwoUnit.colonel,
          path: "death_weapon.air_height_threshold",
          op: "replace",
          value: 50,
        },
      ]);
    },
    dull: function () {},
  };
});
