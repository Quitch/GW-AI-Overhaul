// Section 17 as a Galactic War add-on: experimental units for MLA and Legion,
// four of them built only by its gantries, and AI data for MLA. `units` keys
// every spec the mod adds by a name of its own (the same shape as
// shared/units.js) and `unitNames` carries the display names by the same
// keys. What a player fields follows from capability cells. See races.md,
// "Add-ons".
define(function () {
  return {
    id: "section17",
    name: "!LOC:Section 17",
    serverMods: ["com.pa.daedelus.experimentals"],
    layers: {
      // Flat files named for the unit each builds, beside the stock ones, and
      // one unit map. A full filename is a prefix no base file shares.
      mla: {
        titans: {
          unitMaps: ["/pa/ai/unit_maps/s17_paeiou.json"],
          sources: [
            { dir: "/pa/ai/factory_builds/", match: "dolfin.json" },
            { dir: "/pa/ai/factory_builds/", match: "katrina.json" },
            { dir: "/pa/ai/factory_builds/", match: "spider.json" },
            { dir: "/pa/ai/factory_builds/", match: "yellowjacket.json" },
            { dir: "/pa/ai/fabber_builds/", match: "dox_materializer.json" },
            { dir: "/pa/ai/fabber_builds/", match: "energy_coil.json" },
            { dir: "/pa/ai/fabber_builds/", match: "solar_cell.json" },
          ],
        },
      },
    },
    units: {
      aegir: "/pa/units/paeiou/aegir/aegir.json",
      bigBill: "/pa/units/paeiou/big_bill/big_bill.json",
      bigBillMainWeapon: "/pa/units/paeiou/big_bill/main_weapon.json",
      bigBillMainAmmo: "/pa/units/paeiou/big_bill/main_ammo.json",
      bigBillMiniWeapon: "/pa/units/paeiou/big_bill/mini_weapon.json",
      bigBillMiniAmmo: "/pa/units/paeiou/big_bill/mini_ammo.json",
      crotalid: "/pa/units/paeiou/ligma/drone_fighter/drone_fighter.json",
      crotalidWeapon: "/pa/units/paeiou/ligma/drone_fighter/weapon.json",
      crotalidAmmo: "/pa/units/paeiou/ligma/drone_fighter/ammo.json",
      dolfin: "/pa/units/paeiou/dolfin/dolfin.json",
      dolfinSurfaceWeapon: "/pa/units/paeiou/dolfin/surface_weapon.json",
      dolfinAmmo: "/pa/units/sea/battleship/battleship_ammo.json",
      dolfinAaWeapon: "/pa/units/paeiou/dolfin/aa_weapon.json",
      dolfinAaAmmo: "/pa/units/paeiou/dolfin/aa_ammo.json",
      doxMaterializer:
        "/pa/units/paeiou/dox_materializer/dox_materializer.json",
      doxMaterializerWeapon: "/pa/units/paeiou/dox_materializer/weapon.json",
      doxMaterializerAmmo: "/pa/units/paeiou/dox_materializer/ammo.json",
      energyCoil: "/pa/units/paeiou/energy_coil/energy_coil.json",
      energyCoilWeapon: "/pa/units/paeiou/energy_coil/weapon.json",
      energyCoilAmmo: "/pa/units/paeiou/energy_coil/ammo.json",
      etaAquariid: "/pa/units/paeiou/ligma/drone_bomber/drone_bomber.json",
      etaAquariidWeapon: "/pa/units/paeiou/ligma/drone_bomber/weapon.json",
      etaAquariidAmmo: "/pa/units/paeiou/ligma/drone_bomber/ammo.json",
      experimentalGantry:
        "/pa/units/paeiou/experimental_gantry/experimental_gantry.json",
      experimentalGantryBuildArm:
        "/pa/units/paeiou/experimental_gantry/build_arm.json",
      experimentalGantryLegion:
        "/pa/units/paeiou/l_experimental_gantry/l_experimental_gantry.json",
      floater: "/pa/units/paeiou/floater/floater.json",
      floaterMainWeapon: "/pa/units/paeiou/floater/main_weapon.json",
      floaterMainAmmo: "/pa/units/paeiou/floater/main_ammo.json",
      floaterSecondWeapon: "/pa/units/paeiou/floater/second_weapon.json",
      floaterSecondAmmo: "/pa/units/paeiou/floater/second_ammo.json",
      horntail: "/pa/units/paeiou/horntail/horntail.json",
      horntailWeapon: "/pa/units/paeiou/horntail/weapon.json",
      horntailAmmo: "/pa/units/paeiou/horntail/ammo.json",
      horntailNanoswarmBomb: "/pa/units/paeiou/horntail/larva/larva.json",
      horntailNanoswarmBombWeapon:
        "/pa/units/paeiou/horntail/larva/weapon.json",
      horntailNanoswarmBombAmmo: "/pa/units/paeiou/horntail/larva/ammo.json",
      katrina: "/pa/units/paeiou/katrina/katrina.json",
      katrinaWeapon: "/pa/units/paeiou/katrina/weapon.json",
      katrinaAmmo: "/pa/units/paeiou/katrina/ammo.json",
      ligma: "/pa/units/paeiou/ligma/ligma.json",
      ligmaEdisonWeapon: "/pa/units/paeiou/ligma/edison_tool_weapon.json",
      ligmaEdisonAmmo: "/pa/units/paeiou/ligma/edison_ammo.json",
      ligmaCarrierFighterWeapon:
        "/pa/units/paeiou/ligma/carrier_fighter_tool_weapon.json",
      ligmaCarrierFighterAmmo:
        "/pa/units/paeiou/ligma/carrier_fighter_ammo.json",
      ligmaCarrierBomberWeapon:
        "/pa/units/paeiou/ligma/carrier_bomber_tool_weapon.json",
      ligmaCarrierBomberAmmo: "/pa/units/paeiou/ligma/carrier_bomber_ammo.json",
      ligmaCentralWeapon: "/pa/units/paeiou/ligma/central_weapon.json",
      ligmaCentralAmmo: "/pa/units/paeiou/ligma/central_ammo.json",
      oceanicTwoWingFlyingfish:
        "/pa/units/paeiou/poseidon/pos_air_drone/pos_air_drone.json",
      oceanicTwoWingFlyingfishWeapon:
        "/pa/units/paeiou/poseidon/pos_air_drone/weapon.json",
      oceanicTwoWingFlyingfishAmmo: "/pa/units/air/fighter/fighter_ammo.json",
      orangeFinnedZebraDanio:
        "/pa/units/paeiou/poseidon/pos_torp_drone/pos_torp_drone.json",
      orangeFinnedZebraDanioWeapon:
        "/pa/units/paeiou/poseidon/pos_torp_drone/weapon.json",
      orangeFinnedZebraDanioAmmo:
        "/pa/units/paeiou/poseidon/pos_torp_drone/ammo.json",
      pineapple: "/pa/units/paeiou/pineapple/pineapple.json",
      pineappleWeapon: "/pa/units/paeiou/pineapple/weapon.json",
      pineappleAmmo: "/pa/units/paeiou/pineapple/ammo.json",
      pineappleWeaponNegWeapon: "/pa/units/paeiou/pineapple/weapon_neg.json",
      pineappleAmmoNegAmmo: "/pa/units/paeiou/pineapple/ammo_neg.json",
      poseidon: "/pa/units/paeiou/poseidon/poseidon.json",
      poseidonAaWeapon: "/pa/units/paeiou/poseidon/aa_weapon.json",
      poseidonAaAmmo: "/pa/units/paeiou/poseidon/aa_ammo.json",
      poseidonTorpWeapon: "/pa/units/paeiou/poseidon/torp_weapon.json",
      poseidonTorpAmmo: "/pa/units/paeiou/poseidon/torp_ammo.json",
      poseidonAmphWeapon: "/pa/units/paeiou/poseidon/amph_weapon.json",
      poseidonAmphAmmo: "/pa/units/paeiou/poseidon/amph_ammo.json",
      sigma: "/pa/units/paeiou/sigma/sigma.json",
      sigmaRailgunWeapon: "/pa/units/paeiou/sigma/railgun_weapon.json",
      sigmaRailgunAmmo: "/pa/units/paeiou/sigma/railgun_ammo.json",
      sigmaBottomWeapon: "/pa/units/paeiou/sigma/bottom_weapon.json",
      sigmaBottomAmmo: "/pa/units/paeiou/sigma/bottom_ammo.json",
      sigmaDropperWeapon: "/pa/units/paeiou/sigma/dropper_weapon.json",
      sigmaDropperAmmo: "/pa/units/paeiou/sigma/dropper_ammo.json",
      sigmaAvengerWeapon: "/pa/units/paeiou/sigma/avenger_weapon.json",
      sigmaAvengerAmmo: "/pa/units/paeiou/sigma/avenger_ammo.json",
      solarCell: "/pa/units/paeiou/solar_cell/solar_cell.json",
      spider: "/pa/units/paeiou/spider/spider.json",
      spiderWeapon: "/pa/units/paeiou/spider/weapon.json",
      spiderAmmo: "/pa/units/paeiou/spider/ammo.json",
      tasmanianGiantFreshwaterCrayfish:
        "/pa/units/paeiou/poseidon/pos_amph_drone/pos_amph_drone.json",
      tasmanianGiantFreshwaterCrayfishWeapon:
        "/pa/units/paeiou/poseidon/pos_amph_drone/weapon.json",
      tasmanianGiantFreshwaterCrayfishAmmo:
        "/pa/units/paeiou/poseidon/pos_amph_drone/ammo.json",
      yellowjacket: "/pa/units/paeiou/yellowjacket/yellowjacket.json",
      yellowjacketWeapon: "/pa/units/paeiou/yellowjacket/weapon.json",
      yellowjacketAmmo: "/pa/units/paeiou/yellowjacket/ammo.json",
    },
    unitNames: {
      aegir: "!LOC:Ægir",
      bigBill: "!LOC:Big Bill",
      crotalid: "!LOC:Crotalid",
      dolfin: "!LOC:Dolfin",
      doxMaterializer: "!LOC:Dox Materializer",
      energyCoil: "!LOC:Energy Coil",
      etaAquariid: "!LOC:Eta Aquariid",
      experimentalGantry: "!LOC:Experimental Gantry",
      experimentalGantryLegion: "!LOC:Experimental Gantry",
      floater: "!LOC:Floater",
      horntail: "!LOC:Horntail",
      horntailNanoswarmBomb: "!LOC:Horntail Nanoswarm Bomb",
      katrina: "!LOC:Katrina",
      ligma: "!LOC:Ligma",
      oceanicTwoWingFlyingfish: "!LOC:Oceanic Two-Wing Flyingfish",
      orangeFinnedZebraDanio: "!LOC:Orange Finned Zebra Danio",
      pineapple: "!LOC:Pineapple",
      poseidon: "!LOC:Poseidon",
      sigma: "!LOC:Sigma",
      solarCell: "!LOC:Solar Cell",
      spider: "!LOC:Spider",
      tasmanianGiantFreshwaterCrayfish:
        "!LOC:Tasmanian Giant Freshwater Crayfish",
      yellowjacket: "!LOC:Yellowjacket",
    },
  };
});
