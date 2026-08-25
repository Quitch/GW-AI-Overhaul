define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Commander Upgrade Tech increases Uber Cannon damage by 300% and allows you to reclaim friendly Commanders for metal."
        )
      )
    ),
    summarize: _.constant("!LOC:Commander Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return {
        params: {
          allowOverflow: true,
        },
        chance: gwoCard.commanderWeight(inventory, 35),
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .flatMapMods(gwoGroup.fabberBuildArms, "push", {
            reclaim_types: "Friendly_Commander",
          })
          .concat(
            gwoCard.mods(gwoUnit.commanderSecondaryAmmo, "multiply", {
              damage: 4,
              splash_damage: 4,
              burn_damage: 4,
            })
          )
      );
    },
    dull: function () {},
  };
});
