define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Skitter Upgrade Tech adds a low powered laser to the land scout and increases its vision by 100%."
        )
      )
    ),
    summarize: _.constant("!LOC:Skitter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.skitter)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.skitter, "replace", {
            tools: [
              {
                spec_id: gwoUnit.skitterWeapon,
                aim_bone: "bone_root",
                muzzle_bone: "bone_root",
              },
            ],
          })
          .concat(
            [{ file: gwoUnit.skitter, path: "tools.0.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.skitter, "push", {
              command_caps: "ORDER_Attack",
            }),
            gwoCard.mods(
              gwoUnit.skitter,
              "multiply",
              gwoCard.eachPath(gwoCard.observerPaths(3, "radius"), 2)
            ),
            gwoCard.mods(gwoUnit.skitterAmmo, "multiply", {
              initial_velocity: 2,
              max_velocity: 2,
              damage: 2,
            })
          )
      );
    },
    dull: function () {},
  };
});
