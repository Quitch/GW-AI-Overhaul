define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Barnacle Upgrade Tech",
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Barnacle Upgrade Tech allows the assisting of all builds by the support barge."
        ) +
          " " +
          loc("!LOC:Disables the auto-repair feature.")
      )
    ),
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.barnacle,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.barnacleBuildArm, "replace", {
          can_only_assist_with_buildable_items: false,
          auto_repair: false,
        })
      );
    },
  });
});
