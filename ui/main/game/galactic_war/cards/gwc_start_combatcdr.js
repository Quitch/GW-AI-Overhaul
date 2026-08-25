define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (module, GW, GWCStart, gwoCard, gwoUnit) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: () => false,
    summarize: () => "!LOC:Bionic Augmentation Commander Of Neutralizing",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:The Bionic Augmentation Commander Of Neutralizing loadout contains one data bank but increases the Commander's fire rate by 100%, decreases Uber Cannon energy usage by 75%, increases health by 200%, and increases speed by 400%.";
      }
      return "!LOC:The Bionic Augmentation Commander Of Neutralizing loadout contains one data bank but increases the Commander's fire rate by 100%, decreases Uber Cannon energy usage by 75%, increases health by 200%, and increases speed by 650%.";
    },
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Bionic Augmentation Commander Of Neutralizing",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        let buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 3);
          const navigationAttributes = [
            "navigation.move_speed",
            "navigation.brake",
            "navigation.acceleration",
            "navigation.turn_speed",
          ];
          const mods = _.map(navigationAttributes, (navigationAttribute) => ({
            file: gwoUnit.commander,
            path: navigationAttribute,
            op: "multiply",
            value: 5,
          }));
          const weapons = [
            gwoUnit.commanderSecondary,
            gwoUnit.commanderWeaponBullet,
            gwoUnit.commanderWeaponLaser,
            gwoUnit.commanderWeaponMissile,
          ];
          const ammoAttributes = [
            "ammo_capacity",
            "ammo_demand",
            "ammo_per_shot",
          ];
          _.forEach(ammoAttributes, (ammoAttribute) => {
            mods.push({
              file: gwoUnit.commanderSecondary,
              path: ammoAttribute,
              op: "multiply",
              value: 0.25,
            });
          });
          _.forEach(weapons, (weapon) => {
            mods.push({
              file: weapon,
              path: "rate_of_fire",
              op: "multiply",
              value: 2,
            });
          });
          mods.push({
            file: gwoUnit.commander,
            path: "max_health",
            op: "multiply",
            value: 3,
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
