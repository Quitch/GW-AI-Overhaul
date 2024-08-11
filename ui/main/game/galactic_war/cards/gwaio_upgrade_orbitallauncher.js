define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Orbital Launcher Upgrade Tech enables the building of advanced units by basic orbital manufacturing."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Orbital Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_orbital",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalLauncher)
      ) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoGroup.orbitalAdvanced);

      inventory.addMods([
        {
          file: gwoUnit.orbitalLauncher,
          path: "buildable_types",
          op: "add",
          value: "| (Orbital & FactoryBuild & Custom58)",
        },
      ]);

      const units = [
        "SolarArray",
        "OrbitalDeathLaser",
        "AdvancedRadarSattelite",
        "OrbitalRailgun",
        "OrbitalBattleShip",
      ];
      const aiMods = _.flatten(
        _.map(units, function (unit) {
          return [
            {
              type: "factory",
              op: "append",
              toBuild: unit,
              idToMod: "builders",
              value: "OrbitalLauncher",
            },
            {
              type: "factory",
              op: "replace",
              toBuild: unit,
              idToMod: "priority",
              value: 100,
            },
          ];
        })
      );
      inventory.addAIMods(aiMods);
    },
    dull: function () {},
  };
});
