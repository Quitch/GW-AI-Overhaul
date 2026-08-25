define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Nyx Upgrade Tech",
    description:
      "!LOC:Nyx Upgrade Tech doubles the jamming and radar radius of the jamming vehicle.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_intelligence_fabrication_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_efficiency",
    requires: gwoUnit.nyx,
    buff: function (inventory) {
      inventory.addMods(
        _.map([1, 2], function (i) {
          return {
            file: gwoUnit.nyx,
            path: "recon.observer.items." + i + ".radius",
            op: "multiply",
            value: 2,
          };
        })
      );
    },
  });
});
