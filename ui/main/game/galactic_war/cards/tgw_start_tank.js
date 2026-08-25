define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(gwoGroup.vehiclesBasic);

      inventory.addMods(
        gwoCard
          .flatMapMods(
            gwoGroup.mobile,
            "multiply",
            _.assign(gwoCard.eachPath(gwoCard.paths.navigation, 0.75), {
              build_metal_cost: 1.3,
              max_health: 1.3,
            })
          )
          .concat(
            gwoCard.flatMapMods(
              gwoGroup.ammo,
              "multiply",
              gwoCard.eachPath(gwoCard.paths.damage, 1.3)
            ),
            gwoCard.flatMapMods(gwoGroup.immobile, "multiply", {
              build_metal_cost: 1.3,
              max_health: 1.3,
            })
          )
      );
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Buff Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander prefers quality over quantity and has modified its units to that end. 30% more health, 30% more damage and splash, but 25% slower, and with 30% higher build costs."
    ),
    hint: gwoCard.lockedHint("!LOC:Buff Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
