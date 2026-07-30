define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Commander Combat Tech increases the speed of your commanders by 200%, doubles commander health, and increases damage by 25%."
    ),
    summarize: _.constant("!LOC:Commander Combat Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return { chance: gwoCard.commanderWeight(inventory, 35) };
    },
    buff: function (inventory) {
      var mods = gwoCard.mods(gwoUnit.commander, "multiply", {
        "navigation.move_speed": 3,
        "navigation.brake": 3,
        "navigation.acceleration": 3,
        "navigation.turn_speed": 3,
        max_health: 2,
      });

      _.forEach(gwoGroup.commanderAmmo, function (ammo) {
        mods = mods.concat(
          gwoCard.mods(ammo, "multiply", {
            damage: 1.25,
            splash_damage: 1.25,
          })
        );
      });

      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
