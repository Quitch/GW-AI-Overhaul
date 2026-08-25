define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Kessler Upgrade Tech",
    description:
      "!LOC:Kessler Upgrade Tech allows orbital mines to explode without self-destructing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.kessler,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.kesslerWeapon, "replace", {
          self_destruct: false,
        })
      );
    },
  });
});
