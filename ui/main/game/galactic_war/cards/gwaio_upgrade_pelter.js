define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Pelter Upgrade Tech",
    description:
      "!LOC:Pelter Upgrade Tech triples the number of shots fired per volley by the artillery while also tripling their deviation from target.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.pelter,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.pelter, "replace", {
            "tools.0.projectiles_per_fire": 3,
            "tools.0.muzzle_bone": [
              "socket_muzzle",
              "socket_muzzle",
              "socket_muzzle",
            ],
          })
          .concat(
            gwoCard.mods(gwoUnit.pelterWeapon, "multiply", {
              firing_standard_deviation: 3,
            })
          )
      );
    },
  });
});
