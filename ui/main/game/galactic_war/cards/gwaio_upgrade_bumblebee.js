define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Bumblebee Upgrade Tech causes the carpet bomber to drop a mine instead of bombs."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Bumblebee Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.bumblebee)) {
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
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods([
        {
          file: gwoUnit.bumblebeeAmmo,
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bumblebeeAmmo,
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bumblebeeAmmo,
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bumblebeeAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bumblebeeAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwoUnit.landMine,
        },
        {
          file: gwoUnit.bumblebeeWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 425,
        },
      ]);
    },
    dull: function () {},
  };
});
