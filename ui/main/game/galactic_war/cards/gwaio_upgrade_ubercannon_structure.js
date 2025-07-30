define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Commander Upgrade Tech increases Uber Cannon damage by 300% and allows you to reclaim friendly Commanders for metal."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Commander Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function () {
      const chance = 30;
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      const mods = _.map(gwoGroup.fabberBuildArms, function (fabberBuildArm) {
        return {
          file: fabberBuildArm,
          path: "reclaim_types",
          op: "push",
          value: "Friendly_Commander",
        };
      });
      mods.push(
        {
          file: gwoUnit.commanderSecondaryAmmo,
          path: "damage",
          op: "multiply",
          value: 4,
        },
        {
          file: gwoUnit.commanderSecondaryAmmo,
          path: "splash_damage",
          op: "multiply",
          value: 4,
        },
        {
          file: gwoUnit.commanderSecondaryAmmo,
          path: "burn_damage",
          op: "multiply",
          value: 4,
        }
      );
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
