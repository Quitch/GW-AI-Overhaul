define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Air Factory Upgrade Tech",
    description:
      "!LOC:Air Factory Upgrade Tech enables the building of advanced units by basic air manufacturing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_air",
    requires: gwoUnit.airFactory,
    unless: "gwaio_start_rapid",
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.airAdvancedCombat);

      var units = [
        "AdvancedBomber",
        "AdvancedFighter",
        "AdvancedGunship",
        "HeavyBomber",
        "Strafer",
        "SupportPlatform",
      ];
      var aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "BasicAirFactory",
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
        gwoCard.mods(gwoUnit.airFactory, "add", {
          buildable_types: " | (Air & Mobile & FactoryBuild & Custom58)",
        })
      );
      inventory.addAIMods(aiMods);
    },
  });
});
