define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Air Factory Upgrade Tech enables the building of advanced units by basic air manufacturing.",
      ),
    ),
  ),

  summarize: () => "!LOC:Air Factory Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_air" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      !inventory.hasCard("gwaio_start_rapid") &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.airFactory),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoGroup.airAdvancedCombat);

    const units = [
      "AdvancedBomber",
      "AdvancedFighter",
      "AdvancedGunship",
      "HeavyBomber",
      "Strafer",
      "SupportPlatform",
    ];
    const aiMods = _.flatten(
      _.map(units, (unit) => [
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
      ]),
    );

    inventory.addMods(
      gwoCard.mods(gwoUnit.airFactory, "add", {
        buildable_types: " | (Air & Mobile & FactoryBuild & Custom58)",
      }),
    );
    inventory.addAIMods(aiMods);
  },

  dull: function () {},
}));
