define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Leveler Upgrade Tech",
    description:
      "!LOC:Leveler Upgrade Tech enables the building of assault tanks by the Unit Cannon.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    available: function (inventory) {
      return (
        gwoCard.hasUnit(inventory.units(), gwoUnit.leveler) &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.unitCannon) &&
        !inventory.hasCard("gwaio_start_paratrooper")
      );
    },
    buff: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.leveler, "push", {
          unit_types: "UNITTYPE_CannonBuildable",
        })
      );

      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_leveler.json",
        },
      ]);
    },
  });
});
