define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Advanced Laser Defense Tower Upgrade Tech increases the rate of fire of the advanced turret by 300%, but it fires in bursts and requires energy to recharge."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Advanced Laser Defense Tower Upgrade Tech"),
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
      if (
        gwoCard.hasUnit(inventory.units(), gwoUnit.laserDefenseTowerAdvanced)
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 4,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "ammo_source",
          op: "replace",
          value: "energy",
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "ammo_capacity",
          op: "replace",
          value: 1200,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "ammo_demand",
          op: "replace",
          value: 300,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "ammo_per_shot",
          op: "replace",
          value: 100,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "carpet_fire",
          op: "replace",
          value: true,
        },
        {
          file: gwoUnit.laserDefenseTowerAdvancedWeapon,
          path: "carpet_wait_for_full_ammo",
          op: "replace",
          value: true,
        },
      ]);
    },
    dull: function () {},
  };
});
