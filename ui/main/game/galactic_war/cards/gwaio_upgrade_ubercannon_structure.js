define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoUnit, gwoGroup) {
  return gwoCard.upgradeCard({
    name: "!LOC:Commander Upgrade Tech",
    description:
      "!LOC:Commander Upgrade Tech increases Uber Cannon damage by 300% and allows you to reclaim friendly Commanders for metal.",
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_ammunition",
    deal: function (system, context, inventory) {
      return {
        params: {
          allowOverflow: true,
        },
        chance: gwoCard.commanderWeight(inventory, 35),
      };
    },
    buff: function (inventory) {
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
  });
});
