define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Angel Upgrade Tech enables the targeting of enemy units and structures by the support platform's interception beam."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
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
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.angel)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.angel,
          path: "command_caps",
          op: "push",
          value: ["ORDER_Attack"],
        },
        {
          file: gwoUnit.angel,
          path: "unit_types",
          op: "push",
          value: ["UNITTYPE_Gunship", "UNITTYPE_Offense"],
        },
        {
          file: gwoUnit.angelBeam,
          path: "target_layers",
          op: "pull",
          value: ["WL_Orbital"],
        },
        {
          file: gwoUnit.angelBeam,
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwoUnit.angelBeam,
          path: "auto_task_type",
          op: "replace",
          value: null,
        },
        {
          file: gwoUnit.angelBeam,
          path: "manual_fire",
          op: "replace",
          value: false,
        },
        {
          file: gwoUnit.angelAmmo,
          path: "collision_check",
          op: "replace",
          value: "enemies",
        },
        {
          file: gwoUnit.angelAmmo,
          path: "collision_response",
          op: "replace",
          value: "impact",
        },
      ]);
    },
    dull: function () {},
  };
});
