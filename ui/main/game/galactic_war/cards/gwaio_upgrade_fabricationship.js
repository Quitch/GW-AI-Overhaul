define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic naval fabricator.",
      ),
    ),
  ),

  summarize: () => "!LOC:Fabrication Ship Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_sea" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.navalFabber),
      gwoCard.navalWeight(inventory, 30),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoGroup.starterUnitsAdvanced);

    inventory.addMods(
      gwoCard.mods(gwoUnit.navalFabber, "add", {
        buildable_types:
          " | (Naval & Structure & Advanced | FabAdvBuild) & Custom58",
      }),
    );

    const units = [
      "AdvancedAirDefense",
      "AdvancedLandDefense",
      "AdvancedNavalDefense",
      "AdvancedRadar",
      "AntiNukeSilo",
      "ControlModule",
      "LongRangeArtillery",
      "NukeSilo",
      "PlanetEngine",
      "TML",
      "UnitCannon",
    ];
    if (inventory.hasCard("gwc_enable_titans")) {
      units.push("PlanetSplitter");
    }
    const aiMods = _.map(units, (unit) => ({
      type: "fabber",
      op: "append",
      toBuild: unit,
      idToMod: "builders",
      value: "BasicNavalFabber",
      matchAll: true,
    }));
    inventory.addAIMods(aiMods);
  },

  dull: function () {},
}));
