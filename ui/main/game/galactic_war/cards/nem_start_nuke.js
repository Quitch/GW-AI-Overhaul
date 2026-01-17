define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Tactical Nuke Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence."
    ),
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

          inventory.addMods([
            {
              file: gwoUnit.nukeLauncher,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.17361,
            },
            {
              file: gwoUnit.nukeLauncher,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_FabBuild",
            },
            {
              file: gwoUnit.nukeLauncher,
              path: "description",
              op: "replace",
              value:
                "!LOC:Tactical Nuke Launcher - Constructs low-cost/low-yield interplanetary tactical nukes.",
            },
            {
              file: gwoUnit.nukeLauncherBuildArm,
              path: "construction_demand.metal",
              op: "multiply",
              value: 0.167,
            },
            {
              file: gwoUnit.nukeLauncherBuildArm,
              path: "construction_demand.energy",
              op: "multiply",
              value: 0.375,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.01,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "damage",
              op: "multiply",
              value: 0.022727,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "splash_damage",
              op: "multiply",
              value: 0.022727,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "full_damage_splash_radius",
              op: "multiply",
              value: 0.4,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "splash_radius",
              op: "multiply",
              value: 0.33,
            },
            {
              file: gwoUnit.nukeLauncherAmmo,
              path: "description",
              op: "replace",
              value:
                "!LOC:Tactical Nuke - Small nuke with low damage and small blast radius.",
            },
          ]);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "NukeSilo",
              idToMod: "builders",
              value: "AnyBasicFabber",
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
      const units = [
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
