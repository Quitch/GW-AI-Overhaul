define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Sheller Upgrade Tech causes mines to be left by the mortar tank's attacks.",
      ),
    ),
  ),

  summarize: () => "!LOC:Sheller Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.sheller),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoUnit.landMine);

    inventory.addMods(
      gwoCard
        .mods(gwoUnit.shellerAmmo, "replace", {
          spawn_unit_on_death: gwoUnit.landMine,
        })
        .concat([
          {
            file: gwoUnit.shellerAmmo,
            path: "spawn_unit_on_death",
            op: "tag",
          },
        ]),
    );
  },

  dull: function () {},
}));
