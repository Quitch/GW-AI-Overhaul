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
    summarize: _.constant("!LOC:Buff Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander prefers quality over quantity and has modified its units to that end. 30% more health, 30% more damage and splash, but 25% slower, and with 30% higher build costs."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Buff Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.vehiclesBasic);

          inventory.addMods(
            gwoCard
              .flatMapMods(gwoGroup.mobile, "multiply", {
                "navigation.move_speed": 0.75,
                "navigation.brake": 0.75,
                "navigation.acceleration": 0.75,
                "navigation.turn_speed": 0.75,
                build_metal_cost: 1.3,
                max_health: 1.3,
              })
              .concat(
                gwoCard.flatMapMods(gwoGroup.ammo, "multiply", {
                  damage: 1.3,
                  splash_damage: 1.3,
                }),
                gwoCard.flatMapMods(gwoGroup.immobile, "multiply", {
                  build_metal_cost: 1.3,
                  max_health: 1.3,
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
