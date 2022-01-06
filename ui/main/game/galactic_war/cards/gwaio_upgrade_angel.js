define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Angel Upgrade Tech enables the targeting of enemy units and structures by the support platform's interception beam."
    ),
    summarize: _.constant("!LOC:Angel Upgrade Tech"),
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
      if (
        gwaioCards.hasUnit(gwaioUnits.angel) &&
        (gwaioCards.hasUnit(gwaioUnits.airFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_airfactory"))
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.angel,
          path: "command_caps",
          op: "push",
          value: ["ORDER_Attack"],
        },
        {
          file: gwaioUnits.angel,
          path: "unit_types",
          op: "push",
          value: ["UNITTYPE_Gunship", "UNITTYPE_Offense"],
        },
        {
          file: gwaioUnits.angelBeam,
          path: "target_layers",
          op: "pull",
          value: ["WL_Orbital"],
        },
        {
          file: gwaioUnits.angelBeam,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwaioUnits.angelBeam,
          path: "auto_task_type",
          op: "replace",
          value: null,
        },
        {
          file: gwaioUnits.angelBeam,
          path: "manual_fire",
          op: "replace",
          value: false,
        },
        {
          file: gwaioUnits.angelAmmo,
          path: "collision_check",
          op: "replace",
          value: "enemies",
        },
        {
          file: gwaioUnits.angelAmmo,
          path: "collision_response",
          op: "replace",
          value: "impact",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
