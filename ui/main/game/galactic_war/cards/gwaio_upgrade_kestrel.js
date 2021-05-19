define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Kestrel Upgrade Tech replaces the gunship's bullet weapons with flamethrowers."
    ),
    summarize: _.constant("!LOC:Kestrel Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/air/gunship/gunship.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/gunship/gunship.json",
          path: "events.fired.effect_spec",
          op: "replace",
          value:
            "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
        },
        {
          file: "/pa/units/air/gunship/gunship_tool_weapon.json",
          path: "max_range",
          op: "replace",
          value: 20,
        },
        {
          file: "/pa/units/air/gunship/gunship_tool_weapon.json",
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file: "/pa/units/air/gunship/gunship_ammo.json",
          path: "ammo_type",
          op: "replace",
          value: "AMMO_Beam",
        },
        {
          file: "/pa/units/air/gunship/gunship_ammo.json",
          path: "damage",
          op: "replace",
          value: 100,
        },
      ]);
    },
    dull: function () {},
  };
});
