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
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.maxCards(inventory.maxCards() - 3);
          var weapons = [
            gwoUnit.commanderSecondary,
            gwoUnit.commanderWeaponBullet,
            gwoUnit.commanderWeaponLaser,
            gwoUnit.commanderWeaponMissile,
          ];
          inventory.addMods(
            gwoCard
              .mods(gwoUnit.commander, "multiply", {
                "navigation.move_speed": 5,
                "navigation.brake": 5,
                "navigation.acceleration": 5,
                "navigation.turn_speed": 5,
              })
              .concat(
                gwoCard.mods(gwoUnit.commanderSecondary, "multiply", {
                  ammo_capacity: 0.25,
                  ammo_demand: 0.25,
                  ammo_per_shot: 0.25,
                }),
                gwoCard.flatMapMods(weapons, "multiply", { rate_of_fire: 2 }),
                gwoCard.mods(gwoUnit.commander, "multiply", { max_health: 3 })
              )
          );
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
