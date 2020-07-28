define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/js/bank.js",
], function (module, GWCStart, gwaioBank) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Test Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant("!LOC:Trying out new ideas."),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Test Commander",
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
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          var mods = [];
          mods.push({
            file: "/pa/units/air/air_factory/air_factory.json",
            path: "buildable_types",
            op: "replace",
            value: "(Air & Fabber & Basic & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/air/air_factory_adv/air_factory_adv.json",
            path: "buildable_types",
            op: "replace",
            value: "(Air & Fabber & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/land/bot_factory/bot_factory.json",
            path: "buildable_types",
            op: "replace",
            value: "(Bot & Fabber & Basic & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
            path: "buildable_types",
            op: "replace",
            value: "(Bot & Fabber & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/land/vehicle_factory/vehicle_factory.json",
            path: "buildable_types",
            op: "replace",
            value: "(Tank & Fabber & Basic & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json",
            path: "buildable_types",
            op: "replace",
            value: "(Tank & Fabber & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/sea/naval_factory/naval_factory.json",
            path: "buildable_types",
            op: "replace",
            value: "(Naval & Fabber & Basic & Mobile) & FactoryBuild",
          });
          mods.push({
            file: "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
            path: "buildable_types",
            op: "replace",
            value: "(Naval & Fabber & Mobile) & FactoryBuild",
          });
          mods.push({
            file:
              "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
          });
          mods.push({
            file:
              "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Basic & Air | Land & Structure & Basic - Factory | Factory & Advanced & Air | FabBuild - Factory",
          });
          mods.push({
            file:
              "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Air | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Air",
          });
          mods.push({
            file: "/pa/units/land/fabrication_bot/fabrication_bot.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Basic & Bot | Land & Structure & Basic - Factory | Factory & Advanced & Bot & Land | FabBuild - Factory",
          });
          mods.push({
            file: "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Bot | Land & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & Bot",
          });
          mods.push({
            file: "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Basic & Tank | Land & Structure & Basic - Factory | Factory & Land & Tank & Advanced | FabBuild - Factory",
          });
          mods.push({
            file:
              "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Tank | Structure & Land & Advanced - Factory | FabAdvBuild | FabBuild - Factory | Titan & (Tank | Naval)",
          });
          mods.push({
            file: "/pa/units/sea/fabrication_ship/fabrication_ship.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Basic & Naval | Naval & Structure & Basic - Factory | Naval & Factory & Advanced | FabBuild - Factory",
          });
          mods.push({
            file:
              "/pa/units/land/fabrication_ship_adv/fabrication_ship_adv.json",
            path: "buildable_types",
            op: "replace",
            value:
              "Mobile & Naval | Naval & Structure & Advanced - Factory | FabAdvBuild | FabBuild - Factory",
          });
          mods.push({
            file:
              "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
            path: "buildable_types",
            op: "replace",
            value: "Mobile & Orbital | FabOrbBuild - Factory",
          });
          inventory.addMods(mods);
        } else {
          // Don't clog up a slot.
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        // Don't clog up a slot.
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
