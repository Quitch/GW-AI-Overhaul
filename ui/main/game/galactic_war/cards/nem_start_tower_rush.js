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
    summarize: _.constant("!LOC:Defense Tech Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Defenses are 50% cheaper, fire 25% faster, have 50% more range, and turn 300% quicker. Barriers are 90% cheaper and have their health doubled. All defenses can be built by both the commander and basic fabricators."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Defense Tech Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits(gwoGroup.structuresDefencesAdvanced);

          const units = gwoGroup.structuresDefencesAdvanced.concat(
            gwoUnit.laserDefenseTower
          );
          const mods = [];
          _.forEach(units, function (unit) {
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
          const costUnits = _.filter(
            gwoGroup.structuresDefences,
            function (defence) {
              return defence !== gwoUnit.wall && defence !== gwoUnit.landMine;
            }
          );
          _.forEach(costUnits, function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.5,
              },
              {
                file: unit,
                path: "area_build_separation",
                op: "multiply",
                value: 0.2,
              }
            );
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
            function (defence) {
              return defence !== gwoUnit.landMineWeapon;
            }
          );
          _.forEach(weapons, function (unit) {
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
            _.map(structures, function (structure) {
              return [
                {
                  type: "fabber",
                  op: "append",
                  toBuild: structure,
                  idToMod: "builders",
                  value: "Commander",
                },
                {
                  type: "fabber",
                  op: "append",
                  toBuild: structure,
                  idToMod: "builders",
                  value: "AnyBasicFabber",
                },
              ];
            })
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
