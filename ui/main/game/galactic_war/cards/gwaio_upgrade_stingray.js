define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stingray Upgrade Tech enables interception of tactical missiles by the missile ship and increases vision and radar radius by 50%."
    ),
    summarize: _.constant("!LOC:Stingray Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_naval.png"
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
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory")) &&
        gwaioFunctions.hasUnit("/pa/units/sea/missile_ship/missile_ship.json")
      )
        chance = 30;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/sea/missile_ship/missile_ship.json",
          path: "tools",
          op: "push",
          value: {
            spec_id:
              "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
            aim_bone: "socket_missile_muzzle01",
            record_index: 0,
            muzzle_bone: ["socket_missile_muzzle01", "socket_missile_muzzle02"],
          },
        },
        {
          file: "/pa/units/sea/missile_ship/missile_ship.json",
          path: "recon.observer.items.0.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/sea/missile_ship/missile_ship.json",
          path: "recon.observer.items.1.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/sea/missile_ship/missile_ship.json",
          path: "recon.observer.items.2.radius",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "/pa/units/sea/missile_ship/missile_ship.json",
          path: "recon.observer.items.3.radius",
          op: "multiply",
          value: 1.5,
        },
      ]);
    },
    dull: function () {},
  };
});
