define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Nuclear Missile Launcher Upgrade Tech increases the damage dealt to commanders and orbital from the LR-96 Pacifier Nuclear Missiles by 200%."
        )
      )
    ),
    summarize: _.constant("!LOC:Nuclear Missile Launcher Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_super_weapon",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.nukeLauncher)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard.mods(gwoUnit.nukeLauncherAmmo, "multiply", {
          "armor_damage_map.AT_Commander": 3,
          "armor_damage_map.AT_Orbital": 3,
        })
      );
    },
    dull: function () {},
  };
});
