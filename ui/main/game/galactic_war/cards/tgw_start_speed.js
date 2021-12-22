define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioFunctions, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Swarm Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:This Commander likes to raid and has modified its blueprints to that end. Units are twice as fast and 30% cheaper but have damage output decreased by 50%."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Swarm Commander",
      };
    },
    deal: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);
          inventory.addUnits([
            gwaioUnits.dox,
            gwaioUnits.stinger,
            gwaioUnits.boom,
            gwaioUnits.botFactory,
            gwaioUnits.grenadier,
            gwaioUnits.spark,
            gwaioUnits.stitch,
          ]);
          var mods = [];
          var units = [
            gwaioUnits.firefly,
            gwaioUnits.hornet,
            gwaioUnits.wyrm,
            gwaioUnits.bumblebee,
            gwaioUnits.airFabberAdvanced,
            gwaioUnits.airFabber,
            gwaioUnits.phoenix,
            gwaioUnits.hummingbird,
            gwaioUnits.kestrel,
            gwaioUnits.icarus,
            gwaioUnits.horsefly,
            gwaioUnits.angel,
            gwaioUnits.zeus,
            gwaioUnits.pelican,
            gwaioUnits.spinner,
            gwaioUnits.slammer,
            gwaioUnits.dox,
            gwaioUnits.stryker,
            gwaioUnits.stinger,
            gwaioUnits.boom,
            gwaioUnits.grenadier,
            gwaioUnits.locusts,
            gwaioUnits.gilE,
            gwaioUnits.colonel,
            gwaioUnits.bluehawk,
            gwaioUnits.spark,
            gwaioUnits.botFabberAdvanced,
            gwaioUnits.mend,
            gwaioUnits.stitch,
            gwaioUnits.botFabber,
            gwaioUnits.vehicleFabberAdvanced,
            gwaioUnits.vehicleFabber,
            gwaioUnits.skitter,
            gwaioUnits.inferno,
            gwaioUnits.storm,
            gwaioUnits.vanguard,
            gwaioUnits.sheller,
            gwaioUnits.drifter,
            gwaioUnits.leveler,
            gwaioUnits.ant,
            gwaioUnits.manhattan,
            gwaioUnits.atlas,
            gwaioUnits.ares,
            gwaioUnits.omega,
            gwaioUnits.orbitalFabber,
            gwaioUnits.avenger,
            gwaioUnits.astraeus,
            gwaioUnits.sxx,
            gwaioUnits.hermes,
            gwaioUnits.artemis,
            gwaioUnits.radarSatelliteAdvanced,
            gwaioUnits.arkyd,
            gwaioUnits.solarArray,
            gwaioUnits.helios,
            gwaioUnits.barracuda,
            gwaioUnits.leviathan,
            gwaioUnits.orca,
            gwaioUnits.typhoon,
            gwaioUnits.squall,
            gwaioUnits.barnacle,
            gwaioUnits.navalFabberAdvanced,
            gwaioUnits.navalFabber,
            gwaioUnits.narwhal,
            gwaioUnits.kaiju,
            gwaioUnits.stingray,
            gwaioUnits.kraken,
            gwaioUnits.piranha,
          ];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
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
                path: "navigation.acceleration",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.7,
              }
            );
          });
          var ammos = [
            gwaioUnits.landMineAmmo,
            gwaioUnits.hornetAmmo,
            gwaioUnits.wyrmAmmo,
            gwaioUnits.bumblebeeAmmo,
            gwaioUnits.phoenixAmmo,
            gwaioUnits.hummingbirdAmmo,
            gwaioUnits.kestrelAmmo,
            gwaioUnits.icarusAmmo,
            gwaioUnits.horseflyAmmo,
            gwaioUnits.zeusAmmo,
            gwaioUnits.spinnerAmmo,
            gwaioUnits.flakAmmo,
            gwaioUnits.galataAmmo,
            gwaioUnits.antiNukeLauncherAmmo,
            gwaioUnits.holkinsAmmo,
            gwaioUnits.pelterAmmo,
            gwaioUnits.slammerAmmo,
            gwaioUnits.doxAmmo,
            gwaioUnits.stingerAmmo,
            gwaioUnits.boomAmmo,
            gwaioUnits.locustsAmmo,
            gwaioUnits.gilEAmmo,
            gwaioUnits.colonelAmmo,
            gwaioUnits.bluehawkAmmo,
            gwaioUnits.sparkAmmo,
            gwaioUnits.skitterAmmo,
            gwaioUnits.laserDefenseTowerAdvancedAmmo,
            gwaioUnits.singleLaserDefenseTowerAmmo,
            gwaioUnits.laserDefenseTowerAmmo,
            gwaioUnits.nukeLauncherAmmo,
            gwaioUnits.catapultAmmo,
            gwaioUnits.infernoAmmo,
            gwaioUnits.stormAmmo,
            gwaioUnits.vanguardAmmo,
            gwaioUnits.drifterAmmo,
            gwaioUnits.levelerAmmo,
            gwaioUnits.antAmmo,
            gwaioUnits.atlasAmmo,
            gwaioUnits.aresAmmo,
            gwaioUnits.aresSecondaryAmmo,
            gwaioUnits.aresStompAmmo,
            gwaioUnits.anchorAmmoAG,
            gwaioUnits.anchorAmmoAO,
            gwaioUnits.umbrellaAmmo,
            gwaioUnits.omegaAmmoAG,
            gwaioUnits.avengerAmmo,
            gwaioUnits.sxxAmmo,
            gwaioUnits.artemisAmmo,
            gwaioUnits.barracudaAmmo,
            gwaioUnits.leviathanAmmo,
            gwaioUnits.orcaAmmo,
            gwaioUnits.orcaTorpedoAmmo,
            gwaioUnits.squallTorpedoAmmo,
            gwaioUnits.squallAmmo,
            gwaioUnits.narwhalAAAmmo,
            gwaioUnits.narwhalAmmo,
            gwaioUnits.narwhalTorpedoAmmo,
            gwaioUnits.kaijuSecondaryAmmo,
            gwaioUnits.kaijuAmmo,
            gwaioUnits.stingrayAAAmmo,
            gwaioUnits.stingrayAmmo,
            gwaioUnits.krakenMissileAmmo,
            gwaioUnits.krakenWeaponAmmo,
            gwaioUnits.piranhaAmmo,
            gwaioUnits.torpedoLauncherAdvancedLandAmmo,
            gwaioUnits.torpedoLauncherAdvancedWaterAmmo,
            gwaioUnits.torpedoLauncherAdvancedAmmo,
            gwaioUnits.torpedoLauncherLandAmmo,
            gwaioUnits.torpedoLauncherWaterAmmo,
            gwaioUnits.torpedoLauncherAmmo,
          ];
          ammos.forEach(function (ammo) {
            mods.push(
              {
                file: ammo,
                path: "damage",
                op: "multiply",
                value: 0.5,
              },
              {
                file: ammo,
                path: "splash_damage",
                op: "multiply",
                value: 0.5,
              }
            );
          });
          var structures = [
            gwaioUnits.airFactoryAdvanced,
            gwaioUnits.airFactory,
            gwaioUnits.flak,
            gwaioUnits.galata,
            gwaioUnits.antiNukeLauncher,
            gwaioUnits.holkins,
            gwaioUnits.pelter,
            gwaioUnits.lob,
            gwaioUnits.botFactoryAdvanced,
            gwaioUnits.botFactory,
            gwaioUnits.catalyst,
            gwaioUnits.energyPlantAdvanced,
            gwaioUnits.energyPlant,
            gwaioUnits.energyStorage,
            gwaioUnits.wall,
            gwaioUnits.landMine,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.singleLaserDefenseTower,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.metalExtractorAdvanced,
            gwaioUnits.metalExtractor,
            gwaioUnits.metalStorage,
            gwaioUnits.nukeLauncher,
            gwaioUnits.radarAdvanced,
            gwaioUnits.radar,
            gwaioUnits.catapult,
            gwaioUnits.teleporter,
            gwaioUnits.ragnarok,
            gwaioUnits.unitCannon,
            gwaioUnits.vehicleFactoryAdvanced,
            gwaioUnits.vehicleFactory,
            gwaioUnits.deepSpaceOrbitalRadar,
            gwaioUnits.anchor,
            gwaioUnits.halley,
            gwaioUnits.umbrella,
            gwaioUnits.jig,
            gwaioUnits.orbitalFactory,
            gwaioUnits.orbitalLauncher,
            gwaioUnits.navalFactoryAdvanced,
            gwaioUnits.navalFactory,
            gwaioUnits.torpedoLauncherAdvanced,
            gwaioUnits.torpedoLauncher,
          ];
          structures.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.7,
            });
          });
          inventory.addMods(mods);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwaioFunctions.applyDulls(CARD, inventory);
    },
  };
});
