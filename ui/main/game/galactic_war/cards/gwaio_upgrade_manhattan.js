define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Manhattan Upgrade Tech doubles the radius of the mobile nuke's explosion."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Manhattan Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.manhattan)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.manhattanDeath,
          path: "splash_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.manhattanDeath,
          path: "full_damage_splash_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.manhattanDeath,
          path: "burn_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.manhattanDeath,
          path: "damage_volume.initial_radius",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.manhattanDeath,
          path: "damage_volume.radius_velocity",
          op: "multiply",
          value: 2,
        },
        {
          file: gwoUnit.manhattanDeath,
          path: "damage_volume.burnable_remove_radius",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
