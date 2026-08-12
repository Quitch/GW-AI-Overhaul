define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoUnit, gwoGroup) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Fabrication Vehicle Upgrade Tech enables the building of advanced structures by the basic vehicle fabricator."
      )
    )
  ),

  summarize: () => "!LOC:Fabrication Vehicle Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_vehicle",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.vehicleFabber)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoGroup.starterUnitsAdvanced);

    inventory.addMods(
      gwoCard.mods(gwoUnit.vehicleFabber, "add", {
        buildable_types:
          " | (Structure & Land & Advanced - Factory | FabAdvBuild) & Custom58",
      })
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
    // Titan Tech is the only card that puts a Ragnarok in the army.
    if (inventory.hasCard("gwc_enable_titans")) {
      units.push("PlanetSplitter");
    }
    const aiMods = _.map(units, (unit) => ({
      type: "fabber",
      op: "append",
      toBuild: unit,
      idToMod: "builders",
      value: "BasicVehicleFabber",
      matchAll: true,
    }));
    inventory.addAIMods(aiMods);
  },

  dull: function () {},
}));
