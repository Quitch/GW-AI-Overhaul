define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Boom Upgrade Tech replaces Dox with Booms in the Lob. Enables the building of Lobs.",
      ),
    ),
  ),

  summarize: () => "!LOC:Boom Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.boom),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoUnit.lob);

    inventory.addMods(
      gwoCard
        .mods(gwoUnit.lobAmmo, "replace", {
          spawn_unit_on_death: gwoUnit.boom,
        })
        .concat([
          { file: gwoUnit.lobAmmo, path: "spawn_unit_on_death", op: "tag" },
        ]),
    );
  },

  dull: function () {},
}));
