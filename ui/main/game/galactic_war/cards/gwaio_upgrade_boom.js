define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Boom Upgrade Tech",
    description:
      "!LOC:Boom Upgrade Tech replaces Dox with Booms in the Lob. Enables the building of Lobs.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    requires: gwoUnit.boom,
    buff: function (inventory) {
      inventory.addUnits(gwoUnit.lob);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.lobAmmo, "replace", {
            spawn_unit_on_death: gwoUnit.boom,
          })
          .concat([
            { file: gwoUnit.lobAmmo, path: "spawn_unit_on_death", op: "tag" },
          ])
      );
    },
  });
});
