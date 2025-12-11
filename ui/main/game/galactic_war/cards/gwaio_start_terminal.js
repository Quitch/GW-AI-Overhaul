define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Terminal Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:You're dying, but you have one last war left in you. Your units' health decreases over time, and your commander's fastest of all. Life is short and must be lived to the full, so unit damage and movement is doubled and costs are halved. Life through victory, Commander!"
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Terminal Commander",
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

          const playerIsCluster =
            inventory.getTag("global", "playerFaction") === 4;
          const mods = [];
          const mobileUnits = gwoGroup.mobile.concat(gwoUnit.commander);

          if (playerIsCluster) {
            _.forEach(gwoGroup.unitsNoCluster, function (unit) {
              mods.push({
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.5,
              });
            });
          } else {
            _.forEach(gwoGroup.units, function (unit) {
              mods.push({
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.5,
              });
            });
          }

          mods.push({
            file: gwoUnit.commander,
            path: "passive_health_regen",
            op: "add",
            value: -15,
          });
          _.forEach(gwoGroup.immobile, function (unit) {
            mods.push({
              file: unit,
              path: "passive_health_regen",
              op: "add",
              value: -3,
            });
          });
          _.forEach(gwoGroup.factories, function (unit) {
            mods.push({
              file: unit,
              path: "passive_health_regen",
              op: "add",
              value: -7,
            });
          });
          _.forEach(gwoGroup.mobile, function (unit) {
            mods.push({
              file: unit,
              path: "passive_health_regen",
              op: "add",
              value: -1,
            });
          });
          _.forEach(mobileUnits, function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
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
                path: "navigation.brake",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 2,
              }
            );
          });
          _.forEach(gwoGroup.ammo, function (ammo) {
            mods.push(
              {
                file: ammo,
                path: "damage",
                op: "multiply",
                value: 2,
              },
              {
                file: ammo,
                path: "splash_damage",
                op: "multiply",
                value: 2,
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
