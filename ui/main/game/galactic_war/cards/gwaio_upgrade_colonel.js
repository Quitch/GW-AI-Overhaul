define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Colonel Upgrade Tech",
    description:
      "!LOC:Colonel Upgrade Tech causes support commanders to explode on death.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: [gwoUnit.colonel, gwoUnit.clusterCeoColonel],
    buff: function (inventory) {
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
  });
});
