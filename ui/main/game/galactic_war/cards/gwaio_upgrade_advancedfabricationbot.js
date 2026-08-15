define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Advanced Fabrication Bot Upgrade Tech equips the advanced fabricator with the support commander's weapon."
        )
      )
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_bot" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.botFabberAdvanced)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.botFabberAdvanced, "push", {
            tools: {
              spec_id: gwoUnit.colonelWeapon,
              aim_bone: "bone_turret",
              muzzle_bone: "socket_rightMuzzle",
              primary_weapon: true,
            },
            command_caps: "ORDER_Attack",
          })
          .concat([
            {
              file: gwoUnit.botFabberAdvanced,
              path: "tools.1.spec_id",
              op: "tag",
            },
          ])
      );
    },
    dull: function () {},
  };
});
