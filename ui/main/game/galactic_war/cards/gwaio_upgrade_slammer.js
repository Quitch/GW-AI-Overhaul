define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioCards, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Slammer Upgrade Tech changes the advanced assault bot's torpedo into a rocket that targets surface units."
    ),
    summarize: _.constant("!LOC:Slammer Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioCards.hasUnit(gwaioUnits.botFactoryAdvanced) ||
          inventory.hasCard("gwaio_start_paratrooper") ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioCards.hasUnit(gwaioUnits.slammer)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.slammer,
          path: "tools.1.show_range",
          op: "replace",
          value: true,
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "base_spec",
          op: "replace",
          value:
            "/pa/tools/base_missile_tactical_turret/base_missile_tactical_turret.json",
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "ammo_id",
          op: "replace",
          value:
            "/pa/units/land/assault_bot_adv/assault_bot_adv_torpedo_ammo.json",
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "spawn_layers",
          op: "replace",
          value: "WL_Air",
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "target_layers",
          op: "replace",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
        {
          file: gwaioUnits.slammerTorpedo,
          path: "target_priorities",
          op: "replace",
          value: ["Mobile", "Structure - Wall", "Wall"],
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "base_spec",
          op: "replace",
          value: "/pa/ammo/base_missiles/base_missile_tactical.json",
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "damage",
          op: "replace",
          value: 250,
        },
        {
          file: gwaioUnits.slammerTorpedoAmmo,
          path: "cruise_height",
          op: "replace",
          value: 75,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
