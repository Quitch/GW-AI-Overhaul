define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Firefly Upgrade Tech adds a low powered laser to the air scout and increases its vision by 100%."
        )
      )
    ),
    summarize: _.constant("!LOC:Firefly Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.firefly)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.firefly, "replace", {
            tools: [
              {
                spec_id: gwoUnit.fireflyWeapon,
                aim_bone: "bone_root",
                muzzle_bone: "bone_root",
              },
            ],
          })
          .concat(
            [{ file: gwoUnit.firefly, path: "tools.0.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.firefly, "push", {
              command_caps: "ORDER_Attack",
            }),
            gwoCard.mods(
              gwoUnit.firefly,
              "multiply",
              gwoCard.eachPath(gwoCard.observerPaths(2, "radius"), 2)
            ),
            gwoCard.mods(gwoUnit.fireflyAmmo, "multiply", { damage: 3.34 })
          )
      );
    },
    dull: function () {},
  };
});
