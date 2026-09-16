define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (module, GWCStart, gwoBank, gwoCard, gwoUnit) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  const loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addMods(
        gwoCard.mods(gwoUnit.commander, "multiply", {
          "storage.metal": 200,
        }),
      );
      inventory.addAIMods([
        {
          type: "fabber",
          op: "load",
          value: `${CARD.id}.json`,
        },
      ]);
    },
    dulls: [
      gwoUnit.metalExtractorAdvanced,
      gwoUnit.metalExtractor,
      gwoUnit.jig,
    ],
  });
  return {
    visible: () => false,
    summarize: () => "!LOC:Tourist Commander",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      return "!LOC:You turned up with a fat wallet, but little else. Huge amounts of storage, but no Metal Extractors, no Mining Platforms, and no basic land or air factories.";
    },
    hint: gwoCard.lockedHint("!LOC:Tourist Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
