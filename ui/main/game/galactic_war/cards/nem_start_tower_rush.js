define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: () => false,
    summarize: () => "!LOC:Defense Tech Commander",
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:Defenses are 50% cheaper, fire 25% faster, have 50% more range, and turn 300% quicker. Barriers are 90% cheaper and have their health doubled. All defenses can be built by both the commander and basic fabricators.",
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Defense Tech Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        let buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.structuresDefencesAdvanced);

          const units = gwoGroup.structuresDefencesAdvanced.concat(
            gwoUnit.laserDefenseTower
          );
          const mods = [];
          _.forEach(units, (unit) => {
            mods.push(
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_CmdBuild",
              },
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_FabBuild",
              }
            );
          });
          // The Wall is 90% cheaper below instead. The mine keeps its spacing:
          // packing a minefield tighter is not something the loadout offers.
          const costUnits = _.filter(
            gwoGroup.structuresDefences,
            (defence) => defence !== gwoUnit.wall
          );
          _.forEach(costUnits, (unit) => {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.5,
            });
          });
          const separationUnits = _.filter(
            costUnits,
            (defence) => defence !== gwoUnit.landMine
          );
          _.forEach(separationUnits, (unit) => {
            mods.push({
              file: unit,
              path: "area_build_separation",
              op: "multiply",
              value: 0.2,
            });
          });
          mods.push(
            {
              file: gwoUnit.wall,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.1,
            },
            {
              file: gwoUnit.wall,
              path: "max_health",
              op: "multiply",
              value: 2,
            }
          );
          const weapons = _.filter(
            gwoGroup.structuresDefencesWeapons,
            (defence) => defence !== gwoUnit.landMineWeapon
          );
          _.forEach(weapons, (unit) => {
            mods.push(
              {
                file: unit,
                path: "rate_of_fire",
                op: "multiply",
                value: 1.25,
              },
              {
                file: unit,
                path: "max_range",
                op: "multiply",
                value: 1.5,
              },
              {
                file: unit,
                path: "yaw_rate",
                op: "multiply",
                value: 4,
              },
              {
                file: unit,
                path: "pitch_rate",
                op: "multiply",
                value: 4,
              }
            );
          });
          inventory.addMods(mods);

          const structures = [
            "AdvancedAirDefense",
            "AdvancedLandDefense",
            "AdvancedNavalDefense",
            "BasicLandDefense",
            "TML",
          ];
          const aiMods = _.flatten(
            _.map(structures, (structure) => [
              {
                type: "fabber",
                op: "append",
                toBuild: structure,
                idToMod: "builders",
                value: "Commander",
                matchAll: true,
              },
              {
                type: "fabber",
                op: "append",
                toBuild: structure,
                idToMod: "builders",
                value: "AnyBasicFabber",
                matchAll: true,
              },
            ])
          );
          inventory.addAIMods(aiMods);
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
