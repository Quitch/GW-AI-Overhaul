define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Nomad Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Non-factory and non-Titan structures are mobile, except metal extractors and the Catalyst, which must stay on the map features they claim, and the Teleporter. Small structures can be transported and use teleporters, medium size structures can use teleporters.";
      }
      return "!LOC:Non-factory and non-Titan structures are mobile. Small structures can be transported and use teleporters, medium size structures can use teleporters.";
    },
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Nomad Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);

          var smallStructures = [
            gwoUnit.energyPlant,
            gwoUnit.energyStorage,
            gwoUnit.galata,
            gwoUnit.landMine,
            gwoUnit.laserDefenseTower,
            gwoUnit.lob,
            gwoUnit.metalStorage,
            gwoUnit.pelter,
            gwoUnit.radar,
            gwoUnit.singleLaserDefenseTower,
            gwoUnit.torpedoLauncher,
            gwoUnit.umbrella,
            gwoUnit.wall,
          ];
          var mediumStructures = [
            gwoUnit.catapult,
            gwoUnit.energyPlantAdvanced,
            gwoUnit.flak,
            gwoUnit.laserDefenseTowerAdvanced,
            gwoUnit.radarJammingStation,
            gwoUnit.torpedoLauncherAdvanced,
          ];
          var largeStructures = [
            gwoUnit.anchor,
            gwoUnit.deepSpaceOrbitalRadar,
            gwoUnit.holkins,
            gwoUnit.jig,
            gwoUnit.kessler,
            gwoUnit.radarAdvanced,
          ];
          var allStructures = smallStructures.concat(
            mediumStructures,
            largeStructures
          );
          var orbitalStructures = [
            gwoUnit.anchor,
            gwoUnit.jig,
            gwoUnit.kessler,
          ];
          var groundStructures = _.difference(allStructures, orbitalStructures);
          var teleportableStructures = smallStructures.concat(mediumStructures);
          var defensiveStructures = gwoGroup.structuresArtillery.concat(
            gwoGroup.structuresDefences
          );
          var offensiveStructures = _.without(
            defensiveStructures,
            gwoUnit.wall
          );
          var mods = _.flatten(
            _.map(groundStructures, function (unit) {
              return gwoCard
                .mods(unit, "replace", {
                  "navigation.type": "Hover",
                  "navigation.acceleration": 100,
                  "navigation.brake": 100,
                  "navigation.move_speed": 10,
                  "navigation.turn_speed": 60,
                  "physics.allow_pushing": true,
                  "physics.push_sideways": true,
                  "physics.type": "Mobile",
                  structure: null,
                  "navigation.park_stamp.shape": "sphere",
                  "navigation.park_stamp.cost": 10,
                  "navigation.park_stamp.type_data": [
                    { move_type: "land-small", stamp_type: "simple" },
                    { move_type: "amphibious", stamp_type: "simple" },
                    { move_type: "hover", stamp_type: "simple" },
                    { move_type: "water-hover", stamp_type: "simple" },
                  ],
                })
                .concat(
                  gwoCard.mods(unit, "push", { unit_types: "UNITTYPE_Hover" })
                );
            })
          ).concat(
            gwoCard.flatMapMods(orbitalStructures, "replace", {
              "navigation.type": "orbital",
              "navigation.acceleration": 25,
              "navigation.brake": 25,
              "navigation.move_speed": 25,
              "navigation.turn_speed": 90,
              "navigation.bank_factor": 5,
              "navigation.hover_time": -1,
            }),
            _.flatten(
              _.map(allStructures, function (unit) {
                return gwoCard
                  .mods(unit, "replace", {
                    command_caps: [
                      "ORDER_Move",
                      "ORDER_Patrol",
                      "ORDER_Assist",
                    ],
                  })
                  .concat(
                    gwoCard.mods(unit, "pull", {
                      unit_types: "UNITTYPE_Structure",
                    }),
                    gwoCard.mods(unit, "push", {
                      unit_types: "UNITTYPE_Mobile",
                    }),
                    gwoCard.mods(unit, "replace", {
                      "physics.radius": 5,
                      "physics.air_friction": 0.5,
                      "navigation.dodge_radius": 15,
                      "navigation.dodge_multiplier": 1,
                      "navigation.wobble_factor": 0.1,
                      "navigation.wobble_speed": 0.2,
                    })
                  );
              })
            ),
            gwoCard.flatMapMods(smallStructures, "replace", {
              transportable: { size: 1 },
              attachable: { offsets: { root: [0, 0, 0], head: [0, 0, 13] } },
            }),
            gwoCard.mods(gwoUnit.pelican, "replace", {
              "transporter.transportable_unit_types":
                "Mobile & ((Land - Commander) | CmdBuild | FabBuild)",
            }),
            _.flatten(
              _.map(teleportableStructures, function (unit) {
                return gwoCard
                  .mods(unit, "replace", { teleportable: {} })
                  .concat(
                    gwoCard.mods(unit, "push", { command_caps: "ORDER_Use" })
                  );
              })
            ),
            gwoCard.flatMapMods(offensiveStructures, "push", {
              command_caps: "ORDER_Attack",
            })
          );
          inventory.addMods(mods);
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
