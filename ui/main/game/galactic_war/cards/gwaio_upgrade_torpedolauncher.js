define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Torpedo Launcher Upgrade Tech",
    description:
      "!LOC:Torpedo Launcher Upgrade Tech enables the targeting of hover and coastal naval units by the Torpedo Launcher.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_turret_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.torpedoLauncher,
    chance: 30,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.torpedoLauncherWeapon, "replace", {
          exclude_unit_types: "",
        })
      );
    },
  });
});
