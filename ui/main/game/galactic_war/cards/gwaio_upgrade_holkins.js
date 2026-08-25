define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Holkins Upgrade Tech",
    description:
      "!LOC:Holkins Upgrade Tech triples the number of shots fired per volley by the advanced artillery while also tripling their deviation from target.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.holkins,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.holkins, "replace", {
            "tools.0.projectiles_per_fire": 3,
            "tools.0.muzzle_bone": [
              "socket_muzzle",
              "socket_muzzle",
              "socket_muzzle",
            ],
          })
          .concat(
            gwoCard.mods(gwoUnit.holkinsWeapon, "multiply", {
              firing_standard_deviation: 3,
            })
          )
      );
    },
  });
});
