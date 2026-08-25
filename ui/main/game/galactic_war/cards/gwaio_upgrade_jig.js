define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Jig Upgrade Tech",
    description:
      "!LOC:Jig Upgrade Tech adds storage to gas mining and doubles its energy production.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.jig,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.jig, "multiply", { "production.energy": 2 })
          .concat(
            gwoCard.mods(gwoUnit.jig, "add", {
              "storage.energy": 50000,
              "storage.metal": 10000,
            })
          )
      );
    },
  });
});
