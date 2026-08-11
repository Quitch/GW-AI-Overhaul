define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Catapult Upgrade Tech adds flak from the Storm flak tank to the tactical missile launcher."
        )
      )
    ),
    summarize: _.constant("!LOC:Catapult Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.catapult),
        30
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.catapult, "push", {
            tools: {
              spec_id: gwoUnit.stormWeapon,
              aim_bone: "bone_missile01",
              projectiles_per_fire: 4,
              muzzle_bone: [
                "bone_missile01",
                "bone_missile01",
                "bone_missile01",
                "bone_missile01",
              ],
            },
            unit_types: "UNITTYPE_AirDefense",
          })
          .concat([
            { file: gwoUnit.catapult, path: "tools.2.spec_id", op: "tag" },
          ])
      );
    },
    dull: function () {},
  };
});
