define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Lob Upgrade Tech",
    describe: _.constant(
      gwoCard.withSlot(
        loc("!LOC:Lob Upgrade Tech increases the range of the Lob by 150%.") +
          " " +
          loc(
            "!LOC:Fires twice as fast and no longer costs metal to recharge its ammo."
          )
      )
    ),
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.lob,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.lobWeapon, "multiply", {
            max_range: 2.5,
            max_firing_velocity: 2.5,
          })
          .concat(
            gwoCard.mods(gwoUnit.lobWeapon, "replace", {
              ammo_source: "time",
              ammo_capacity: 17,
              ammo_demand: 0,
              ammo_per_shot: 2,
            })
          )
      );
    },
  });
});
