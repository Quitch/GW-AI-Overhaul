define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioGroups) {
  {
    return {
      visible: _.constant(true),
      describe: _.constant(
        "!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their energy usage by 90%. Requires technology to build artillery structures and units."
      ),
      summarize: _.constant("!LOC:Artillery Ammunition Tech"),
      icon: _.constant(
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_artillery.png"
      ),
      audio: function () {
        return {
          found: "/VO/Computer/gw/board_tech_available_ammunition",
        };
      },
      getContext: gwaioCards.getContext,
      deal: function (system, context, inventory) {
        var chance = 0;
        if (
          inventory.hasCard("gwc_enable_artillery") ||
          inventory.hasCard("gwc_start_artillery")
        ) {
          chance = 50;
        }
        return { chance: chance };
      },
      buff: function (inventory) {
        var mods = [];
        _.forEach(gwaioGroups.structuresArtilleryAmmo, function (unit) {
          mods.push({
            file: unit,
            path: "damage",
            op: "multiply",
            value: 1.25,
          });
          mods.push({
            file: unit,
            path: "splash_damage",
            op: "multiply",
            value: 1.25,
          });
        });
        _.forEach(gwaioGroups.structuresArtilleryWeapons, function (weap) {
          mods.push({
            file: weap,
            path: "ammo_capacity",
            op: "multiply",
            value: 0.1,
          });
          mods.push({
            file: weap,
            path: "ammo_demand",
            op: "multiply",
            value: 0.1,
          });
          mods.push({
            file: weap,
            path: "ammo_per_shot",
            op: "multiply",
            value: 0.1,
          });
        });
        inventory.addMods(mods);
      },
      dull: function () {
        // empty
      },
    };
  }
});
