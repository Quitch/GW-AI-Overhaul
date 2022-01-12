define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bumblebee Upgrade Tech causes the carpet bomber to drop a mine instead of bombs."
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
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwaioCards.hasUnit(inventory.units(), gwaioUnits.bumblebee)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwaioUnits.landMine);

      inventory.addMods([
        {
          file: gwaioUnits.bumblebeeAmmo,
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.bumblebeeAmmo,
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.bumblebeeAmmo,
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.bumblebeeAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.bumblebeeAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwaioUnits.landMine,
        },
        {
          file: gwaioUnits.bumblebeeWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 425,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
