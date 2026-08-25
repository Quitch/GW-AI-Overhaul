define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      inventory.addUnits(gwoGroup.structuresDefencesAdvanced);

      var units = gwoGroup.structuresDefencesAdvanced.concat(
        gwoUnit.laserDefenseTower
      );
      var costUnits = _.without(gwoGroup.structuresDefences, gwoUnit.wall);
      var separationUnits = _.without(costUnits, gwoUnit.landMine);
      var weapons = _.without(
        gwoGroup.structuresDefencesWeapons,
        gwoUnit.landMineWeapon
      );
      var mods = _.flatten(
        _.map(units, function (unit) {
          return gwoCard
            .mods(unit, "push", { unit_types: "UNITTYPE_CmdBuild" })
            .concat(
              gwoCard.mods(unit, "push", {
                unit_types: "UNITTYPE_FabBuild",
              })
            );
        })
      ).concat(
        gwoCard.flatMapMods(costUnits, "multiply", {
          build_metal_cost: 0.5,
        }),
        gwoCard.flatMapMods(separationUnits, "multiply", {
          area_build_separation: 0.2,
        }),
        gwoCard.mods(gwoUnit.wall, "multiply", {
          build_metal_cost: 0.1,
          max_health: 2,
        }),
        gwoCard.flatMapMods(weapons, "multiply", {
          rate_of_fire: 1.25,
          max_range: 1.5,
          yaw_rate: 4,
          pitch_rate: 4,
        })
      );
      inventory.addMods(mods);

      var structures = [
        "AdvancedAirDefense",
        "AdvancedLandDefense",
        "AdvancedNavalDefense",
        "BasicLandDefense",
        "TML",
      ];
      var aiMods = _.flatten(
        _.map(structures, function (structure) {
          return [
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
          ];
        })
      );
      inventory.addAIMods(aiMods);
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Defense Tech Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Defenses are 50% cheaper, fire 25% faster, have 50% more range, and turn 300% quicker. Barriers are 90% cheaper and have their health doubled. All defenses can be built by both the commander and basic fabricators."
    ),
    hint: gwoCard.lockedHint("!LOC:Defense Tech Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
