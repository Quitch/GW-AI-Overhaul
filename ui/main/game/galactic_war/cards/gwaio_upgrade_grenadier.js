define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Grenadier Upgrade Tech replaces this fire support's artillery with mine launchers, triples its cost and reduces its rate of fire by 75%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Grenadier Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.grenadier)) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods([
        {
          file: gwoUnit.grenadier,
          path: "build_metal_cost",
          op: "multiply",
          value: 3,
        },
        {
          file: gwoUnit.grenadierWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 0.25,
        },
        {
          file: gwoUnit.grenadierAmmo,
          path: "damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.grenadierAmmo,
          path: "splash_damage",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.grenadierAmmo,
          path: "splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.grenadierAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 0,
        },
        {
          file: gwoUnit.grenadierAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwoUnit.landMine,
        },
      ]);
    },
    dull: function () {},
  };
});
