define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Tactical Nuke Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence. Gives up most advanced defenses to do it.";
      }
      return "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence.";
    },
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Tactical Nuke Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addUnits([
            gwoUnit.ant,
            gwoUnit.nukeLauncher,
            gwoUnit.skitter,
            gwoUnit.vehicleFabber,
            gwoUnit.vehicleFactory,
          ]);

          inventory.addMods(
            gwoCard
              .mods(gwoUnit.nukeLauncher, "multiply", {
                build_metal_cost: 0.17361,
              })
              .concat(
                gwoCard.mods(gwoUnit.nukeLauncher, "push", {
                  unit_types: "UNITTYPE_FabBuild",
                }),
                gwoCard.mods(gwoUnit.nukeLauncher, "replace", {
                  description:
                    "!LOC:Tactical Nuke Launcher - Constructs low-cost/low-yield interplanetary tactical nukes.",
                }),
                gwoCard.mods(gwoUnit.nukeLauncherBuildArm, "multiply", {
                  "construction_demand.metal": 0.167,
                  "construction_demand.energy": 0.375,
                }),
                gwoCard.mods(gwoUnit.nukeLauncherAmmo, "multiply", {
                  build_metal_cost: 0.01,
                  damage: 0.022727,
                  splash_damage: 0.022727,
                  full_damage_splash_radius: 0.4,
                  splash_radius: 0.33,
                }),
                gwoCard.mods(gwoUnit.nukeLauncherAmmo, "replace", {
                  description:
                    "!LOC:Tactical Nuke - Small nuke with low damage and small blast radius.",
                })
              )
          );

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "NukeSilo",
              idToMod: "builders",
              value: "AnyBasicFabber",
              matchAll: true,
            },
          ]);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      var units = [
        gwoUnit.anchor,
        gwoUnit.catapult,
        gwoUnit.flak,
        gwoUnit.kessler,
        gwoUnit.laserDefenseTower,
        gwoUnit.laserDefenseTowerAdvanced,
        gwoUnit.torpedoLauncherAdvanced,
      ];
      gwoCard.applyDulls(CARD, inventory, units);
    },
  };
});
