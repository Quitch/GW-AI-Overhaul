define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Defense Technology enables more powerful defenses. Advanced defenses are built via advanced fabricators. Advanced defenses include tactical missile launchers, triple barrel laser turrets, and anti-air flak towers."
    ),
    summarize: _.constant("!LOC:Advanced Defense Technology"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_defence",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      const hasT2Access = gwoCard.hasT2Access(inventory);
      const missingUnit = gwoCard.missingUnit(
        inventory.units(),
        gwoGroup.structuresDefencesAdvanced
      );
      if (missingUnit && hasT2Access) {
        chance = 100;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addUnits(gwoGroup.structuresDefencesAdvanced);
    },
    dull: function () {},
  };
});
