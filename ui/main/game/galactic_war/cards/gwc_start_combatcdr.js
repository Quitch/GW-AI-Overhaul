define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Bionic Augmentation Commander Of Neutralizing"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Bionic Augmentation Commander Of Neutralizing loadout contains one data bank but increases the Commander's fire rate by 100%, decreases Uber Cannon energy usage by 75%, increases health by 200%, and increases speed by 650%."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Bionic Augmentation Commander Of Neutralizing",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 2);
          var navigationAttributes = [
            "navigation.move_speed",
            "navigation.brake",
            "navigation.acceleration",
            "navigation.turn_speed",
          ];
          var mods = _.map(
            navigationAttributes,
            function (navigationAttribute) {
              return {
                file: gwoUnit.commander,
                path: navigationAttribute,
                op: "multiply",
                value: 5,
              };
            }
          );
          var weapons = [gwoUnit.commanderSecondary, gwoUnit.commanderWeapon];
          var ammoAttributes = [
            "ammo_capacity",
            "ammo_demand",
            "ammo_per_shot",
          ];
          _.forEach(weapons, function (weapon) {
            _.forEach(ammoAttributes, function (ammoAttribute) {
              mods.push({
                file: weapon,
                path: ammoAttribute,
                op: "multiply",
                value: 0.25,
              });
            });
            mods.push(
              {
                file: gwoUnit.commander,
                path: "max_health",
                op: "multiply",
                value: 3,
              },
              {
                file: weapon,
                path: "rate_of_fire",
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
        GW.bank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
