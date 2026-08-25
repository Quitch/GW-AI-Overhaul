define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Wyrm Upgrade Tech",
    description:
      "!LOC:Wyrm Upgrade Tech replaces the siege bomber's bombs with drones.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.wyrm,
    buff: function (inventory) {
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
  });
});
