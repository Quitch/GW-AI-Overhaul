define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwaioCards, gwaioUnits, gwaioGroups) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Bot Combat Tech increases health of all bots by 50%, damage by 25%, and speed by 50%"
    ),
    summarize: _.constant("!LOC:Bot Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_bot_combat.png"
    ),
    audio: function () {
      return {
        found: "PA/VO/Computer/gw/board_tech_available_combat",
      };
    },
    getContext: gwaioCards.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        inventory.hasCard("gwc_enable_bots_t1") ||
        inventory.hasCard("gwc_enable_bots_all") ||
        inventory.hasCard("gwc_start_bot") ||
        inventory.hasCard("gwaio_start_hoarder") ||
        inventory.hasCard("tgw_start_speed")
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = gwaioGroups.mobileBots;
      var mods = [];
      units.forEach(function (unit) {
        mods.push(
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 1.5,
          },
          {
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.5,
          }
        );
      });
      var ammos = [
        gwaioUnits.slammerAmmo,
        gwaioUnits.slammerTorpedoAmmo,
        gwaioUnits.doxAmmo,
        gwaioUnits.stingerAmmo,
        gwaioUnits.boomAmmo,
        gwaioUnits.locustsAmmo,
        gwaioUnits.gilEAmmo,
        gwaioUnits.colonelAmmo,
        gwaioUnits.bluehawkAmmo,
        gwaioUnits.sparkAmmo,
      ];
      ammos.forEach(function (ammo) {
        mods.push({
          file: ammo,
          path: "damage",
          op: "multiply",
          value: 1.25,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
