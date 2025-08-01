define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Stinger Upgrade Tech replaces the anti-air bot's missiles with flak from the Flak Cannon. It fires two projectiles per volley as opposed to the Flak Cannons' four."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Stinger Upgrade Tech"),
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
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.stinger)) {
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
          file: gwoUnit.stinger,
          path: "tools",
          op: "replace",
          value: [
            {
              spec_id: gwoUnit.flakWeapon,
              aim_bone: "bone_turret",
              projectiles_per_fire: 2,
              muzzle_bone: ["socket_rightMuzzle", "socket_leftMuzzle"],
            },
          ],
        },
      ]);
    },
    dull: function () {},
  };
});
