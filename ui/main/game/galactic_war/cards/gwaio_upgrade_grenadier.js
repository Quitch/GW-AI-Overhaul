define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Grenadier Upgrade Tech replaces this fire support's artillery with mine launchers, triples its cost and reduces its rate of fire by 75%."
    ),
    summarize: _.constant("!LOC:Grenadier Upgrade Tech"),
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
      var chance = 0;
      if (gwaioCards.hasUnit(gwaioUnits.grenadier)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.grenadier,
          path: "build_metal_cost",
          op: "multiply",
          value: 3,
        },
        {
          file: gwaioUnits.grenadierWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 0.25,
        },
        {
          file: gwaioUnits.grenadierAmmo,
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.grenadierAmmo,
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.grenadierAmmo,
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.grenadierAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwaioUnits.grenadierAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwaioUnits.landMine,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
