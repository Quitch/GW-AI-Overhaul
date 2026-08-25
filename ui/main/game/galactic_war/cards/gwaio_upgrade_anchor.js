define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Anchor Upgrade Tech",
    description:
      "!LOC:Anchor Upgrade Tech increases the range of the defense satellite's weapons by 25%.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_defense_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.anchor,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.flatMapMods(
          [gwoUnit.anchorWeaponAG, gwoUnit.anchorWeaponAO],
          "multiply",
          { max_range: 1.25 }
        )
      );
    },
  });
});
