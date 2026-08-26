define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GW, GWCStart, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: GW.bank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.maxCards(inventory.maxCards() - 3);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.commander, "multiply", gwoCard.paths.navigation, 5)
          .concat(
            gwoCard.mods(
              gwoUnit.commanderSecondary,
              "multiply",
              gwoCard.paths.energyWeapon,
              0.25
            ),
            gwoCard.flatMapMods(gwoGroup.commanderPrimaryWeapons, "multiply", {
              rate_of_fire: 2,
            }),
            gwoCard.mods(gwoUnit.commander, "multiply", { max_health: 3 })
          )
      );
    },
  });
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
    hint: gwoCard.lockedHint(
      "!LOC:Bionic Augmentation Commander Of Neutralizing"
    ),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
