define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Ammunition Tech increases damage of your commanders by 25%"
    ),
    summarize: _.constant("!LOC:Commander Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_speed.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      // Scales with Sub Commanders rather than distance; see
      // gwoCard.commanderWeight.
      return { chance: gwoCard.commanderWeight(inventory, 70) };
    },
    buff: function (inventory) {
      var ammos = gwoGroup.commanderAmmo;
      var mods = [];
      _.forEach(ammos, function (ammo) {
        mods.push(
          {
            file: ammo,
            path: "damage",
            op: "multiply",
            value: 1.25,
          },
          {
            file: ammo,
            path: "splash_damage",
            op: "multiply",
            value: 1.25,
          }
        );
      });
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
