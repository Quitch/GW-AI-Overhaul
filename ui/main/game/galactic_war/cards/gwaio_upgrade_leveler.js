define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Leveler Upgrade Tech enables the building of assault tanks by the Unit Cannon."
      )
    )
  ),

  summarize: () => "!LOC:Leveler Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.leveler) &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.unitCannon) &&
        !inventory.hasCard("gwaio_start_paratrooper")
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
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

  dull: function () {},
}));
