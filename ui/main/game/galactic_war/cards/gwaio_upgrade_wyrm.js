define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Wyrm Upgrade Tech replaces the siege bomber's bombs with drones."
        )
      )
    ),
    summarize: _.constant("!LOC:Wyrm Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.wyrm)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.squall);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.wyrm, "replace", {
            "tools.0.spec_id": gwoUnit.typhoonWeapon,
          })
          .concat(
            [{ file: gwoUnit.wyrm, path: "tools.0.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.wyrm, "replace", {
              "navigation.aggressive_distance": 250, // matches the Typhoon's drone launcher range
              "navigation.aggressive_behavior": "circle",
            })
          )
      );
    },
    dull: function () {},
  };
});
