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

          const mods = [];
          _.forEach(gwoGroup.mobile, function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.7,
              }
            );
          });
          _.forEach(gwoGroup.ammo, function (ammo) {
            mods.push(
              {
                file: ammo,
                path: "damage",
                op: "multiply",
                value: 0.5,
              },
              {
                file: ammo,
                path: "splash_damage",
                op: "multiply",
                value: 0.5,
              }
            );
          });
          _.forEach(gwoGroup.immobile, function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.7,
            });
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
