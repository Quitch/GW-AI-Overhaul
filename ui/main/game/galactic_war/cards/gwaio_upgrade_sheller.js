define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Sheller Upgrade Tech",
    description:
      "!LOC:Sheller Upgrade Tech causes mines to be left by the mortar tank's attacks.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.sheller,
    buff: function (inventory) {
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.shellerAmmo, "replace", {
            spawn_unit_on_death: gwoUnit.landMine,
          })
          .concat([
            {
              file: gwoUnit.shellerAmmo,
              path: "spawn_unit_on_death",
              op: "tag",
            },
          ])
      );
    },
  });
});
