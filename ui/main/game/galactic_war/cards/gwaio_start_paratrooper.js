define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoAI, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Paratrooper Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Contains no basic land or air factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers! Halves the cost of both. All land units can be built from the Unit Cannon as they are unlocked.";
      }
      return (
        loc(
          "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers!"
        ) +
        " " +
        loc(
          "!LOC:Halves the cost of both. All land units can be built from the Unit Cannon as they are unlocked."
        )
      );
    },
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Paratrooper Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);

          var unitCannons = [gwoUnit.lob, gwoUnit.unitCannon];
          var units = unitCannons.concat(gwoGroup.unitCannonMobile);
          inventory.addUnits(units);

          var mobileLandUnits = gwoGroup.botsMobile.concat(
            gwoGroup.vehiclesMobile
          );
          var landUnitsNotInUnitCannon = _.difference(
            mobileLandUnits,
            gwoGroup.unitCannonMobile
          );
          var mods = _.flatten(
            _.map(unitCannons, function (unit) {
              return gwoCard
                .mods(unit, "push", { unit_types: "UNITTYPE_CmdBuild" })
                .concat(
                  gwoCard.mods(unit, "multiply", { build_metal_cost: 0.5 })
                );
            })
          ).concat(
            gwoCard.flatMapMods(landUnitsNotInUnitCannon, "push", {
              unit_types: "UNITTYPE_CannonBuildable",
            }),
            gwoCard.mods(gwoUnit.manhattan, "replace", {
              "transportable.size": 1,
              "attachable.offsets": { root: [0, 0, 0], head: [0, 0, 7] },
            }),
            // Don't let the Pelican carry the Manhattan
            gwoCard.mods(gwoUnit.pelican, "add", {
              "transporter.transportable_unit_types": " - Important",
            })
          );
          inventory.addMods(mods);

          var aiMods = [
            {
              type: "fabber",
              op: "replace",
              toBuild: "UnitCannon",
              idToMod: "priority",
              value: 478,
              refId: "priority",
              refValue: 360, // TITANS AI
            },
            {
              type: "fabber",
              op: "load",
              value: CARD.id + ".json", // Queller AI
            },
            {
              type: "factory",
              op: "load",
              value: "gwaio_upgrade_leveler.json", // Queller AI
            },
          ];
          var factoryArtillery = ["UnitCannon", "MiniUnitCannon"];
          var mobileLand = [
            "SupportCommander",
            "AdvancedArtilleryBot",
            "TMLBot",
            "BasicArmorTank",
            "HoverTank",
            "LandScout",
            "AdvancedArmorTank",
            "AdvancedArtilleryVehicle",
            "NukeTank",
          ];
          inventory.addAIMods(
            aiMods.concat(
              gwoAI.builderAppendMods("fabber", factoryArtillery, "Commander"),
              gwoAI.builderAppendMods("factory", mobileLand, "UnitCannon")
            )
          );
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
