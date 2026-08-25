define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Swarm Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander likes to raid and has modified its blueprints to that end. Units are twice as fast and 30% cheaper but have damage output decreased by 50%."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Swarm Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
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
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
