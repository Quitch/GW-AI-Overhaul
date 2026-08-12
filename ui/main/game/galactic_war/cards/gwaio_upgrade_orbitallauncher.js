define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Orbital Launcher Upgrade Tech enables the building of advanced units by basic orbital manufacturing."
      )
    )
  ),

  summarize: () => "!LOC:Orbital Launcher Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_orbital",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.orbitalLauncher)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoGroup.orbitalAdvanced);

    inventory.addMods(
      gwoCard.mods(gwoUnit.orbitalLauncher, "add", {
        buildable_types: "| (Orbital & FactoryBuild & Custom58)",
      })
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
      ])
    );
    inventory.addAIMods(aiMods);
  },

  dull: function () {},
}));
