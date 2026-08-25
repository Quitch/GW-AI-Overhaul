define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Naval Factory Upgrade Tech",
    description:
      "!LOC:Naval Factory Upgrade Tech enables the building of advanced units by basic naval manufacturing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_sea",
    requires: gwoUnit.navalFactory,
    unless: "gwaio_start_rapid",
    chance: function (inventory) {
      return gwoCard.navalWeight(inventory, 30);
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.navalAdvancedCombat);

      var units = [
        "Battleship",
        "MissleShip", // typo in the base AI files
        "MissileSub",
        "HoverShip",
        "DroneCarrier",
      ];
      var aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicNavalFactory",
              matchAll: true,
            },
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 97,
              matchAll: true,
            },
          ];
        })
      );

      inventory.addMods(
        gwoCard.mods(gwoUnit.navalFactory, "add", {
          buildable_types: " | (Naval & Mobile & FactoryBuild & Custom58)",
        })
      );
      inventory.addAIMods(aiMods);
    },
  });
});
