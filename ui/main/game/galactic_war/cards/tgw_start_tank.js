define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Buff Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander prefers quality over quantity and has modified its units to that end. 30% more health, 30% more damage and splash, but 25% slower, and with 30% higher build costs."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Buff Commander",
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.vehiclesBasic);

          const mods = [];
          _.forEach(gwoGroup.mobile, function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 0.75,
              },
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 1.3,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          _.forEach(gwoGroup.ammo, function (ammo) {
            mods.push(
              {
                file: ammo,
                path: "damage",
                op: "multiply",
                value: 1.3,
              },
              {
                file: ammo,
                path: "splash_damage",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          _.forEach(gwoGroup.immobile, function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 1.3,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 1.3,
              }
            );
          });
          inventory.addMods(mods);
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
