define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Bluehawk Upgrade Tech doubles the number of tactical missiles Bluehawks fire per volley."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Bluehawk Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.bluehawk)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.bluehawk,
          path: "tools.0.muzzle_bone",
          op: "replace",
          value: "socket_rightMuzzle",
        },
        {
          file: gwoUnit.bluehawk,
          path: "tools.0.record_index",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bluehawk,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwoUnit.bluehawkWeapon,
            aim_bone: "socket_leftMuzzle",
            muzzle_bone: "socket_leftMuzzle",
            record_index: 1,
          },
        },
        {
          file: gwoUnit.bluehawk,
          path: "tools.1.muzzle_bone",
          op: "replace",
          value: "socket_rightMuzzle",
        },
        {
          file: gwoUnit.bluehawk,
          path: "tools.1.record_index",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.bluehawk,
          path: "tools",
          op: "push",
          value: {
            spec_id: gwoUnit.bluehawkWeaponOrbital,
            aim_bone: "socket_leftMuzzle",
            muzzle_bone: "socket_leftMuzzle",
            record_index: 1,
          },
        },
      ]);
    },
    dull: function () {},
  };
});
