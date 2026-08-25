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
      inventory.addUnits(gwoGroup.botsBasic);

      inventory.addMods(
        gwoCard
          .flatMapMods(
            gwoGroup.mobile,
            "multiply",
            _.assign(gwoCard.eachPath(gwoCard.paths.navigation, 2), {
              build_metal_cost: 0.7,
            })
          )
          .concat(
            gwoCard.flatMapMods(
              gwoGroup.ammo,
              "multiply",
              gwoCard.eachPath(gwoCard.paths.damage, 0.5)
            ),
            gwoCard.flatMapMods(gwoGroup.immobile, "multiply", {
              build_metal_cost: 0.7,
            })
          )
      );
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Swarm Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander likes to raid and has modified its blueprints to that end. Units are twice as fast and 30% cheaper but have damage output decreased by 50%."
    ),
    hint: gwoCard.lockedHint("!LOC:Swarm Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
