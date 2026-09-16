define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) =>
  gwoCard.upgradeCard({
    name: "!LOC:Orbital Launcher Upgrade Tech",
    description:
      "!LOC:Orbital Launcher Upgrade Tech enables the building of advanced units by basic orbital manufacturing.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_orbital",
    requires: gwoUnit.orbitalLauncher,
    unless: "gwaio_start_rapid",
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.orbitalAdvanced);

      inventory.addMods(
        gwoCard.mods(gwoUnit.orbitalLauncher, "add", {
          buildable_types: "| (Orbital & FactoryBuild & Custom58)",
        }),
      );

      const units = [
        "SolarArray",
        "OrbitalDeathLaser",
        "AdvancedRadarSattelite",
        "OrbitalRailgun",
        "OrbitalBattleShip",
      ];
      const aiMods = _.flatten(
        _.map(units, (unit) => [
          {
            type: "factory",
            op: "append",
            toBuild: unit,
            idToMod: "builders",
            value: "OrbitalLauncher",
            matchAll: true,
          },
          {
            type: "factory",
            op: "replace",
            toBuild: unit,
            idToMod: "priority",
            value: 100,
            matchAll: true,
          },
        ]),
      );
      inventory.addAIMods(aiMods);
    },
  }));
