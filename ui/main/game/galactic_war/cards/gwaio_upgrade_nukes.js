define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Nuclear Missile Launcher Upgrade Tech increases the damage dealt to commanders and orbital from the LR-96 Pacifier Nuclear Missiles by 200%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
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
      inventory.addMods([
        {
          file: gwoUnit.nukeLauncherAmmo,
          path: "armor_damage_map.AT_Commander",
          op: "multiply",
          value: 3,
        },
        {
          file: gwoUnit.nukeLauncherAmmo,
          path: "armor_damage_map.AT_Orbital",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {},
  };
});
