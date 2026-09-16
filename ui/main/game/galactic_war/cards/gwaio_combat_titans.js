define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Titan Combat Tech increases the speed of all titans by 20%, health by 50%, and damage by 25%",

  summarize: () => "!LOC:Titan Combat Tech",

  icon: () =>
    "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_armor" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.conditionalDeal(
      gwoCard.hasUnit(inventory.units(), gwoGroup.titans),
      60,
    );
  },

  buff: function (inventory) {
    inventory.addMods(
      gwoCard
        .flatMapMods(gwoGroup.titans, "multiply", { max_health: 1.5 })
        .concat(
          gwoCard.flatMapMods(
            gwoGroup.titansMobile,
            "multiply",
            gwoCard.paths.navigation,
            1.2,
          ),
          gwoCard.flatMapMods(
            gwoGroup.titansAmmo,
            "multiply",
            gwoCard.paths.damage,
            1.25,
          ),
        ),
    );
  },

  dull: function () {},
}));
