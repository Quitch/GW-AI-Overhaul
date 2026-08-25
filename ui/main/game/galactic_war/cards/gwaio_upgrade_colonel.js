define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Colonel Upgrade Tech causes support commanders to explode on death."
        )
      )
    ),
    summarize: _.constant("!LOC:Colonel Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), [
          gwoUnit.colonel,
          gwoUnit.clusterCeoColonel,
        ])
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      var colonel =
        gwoCard.playerIsCluster(inventory) &&
        inventory.hasCard("gwaio_start_ceo")
          ? gwoUnit.clusterCeoColonel
          : gwoUnit.colonel;
      inventory.addMods(
        gwoCard
          .mods(colonel, "replace", {
            "death_weapon.ground_ammo_spec": gwoUnit.commanderDeath,
            "death_weapon.air_ammo_spec": gwoUnit.commanderDeathAir,
            "death_weapon.air_height_threshold": 50,
          })
          .concat([
            { file: colonel, path: "death_weapon.ground_ammo_spec", op: "tag" },
            { file: colonel, path: "death_weapon.air_ammo_spec", op: "tag" },
          ])
      );
    },
    dull: function () {},
  };
});
