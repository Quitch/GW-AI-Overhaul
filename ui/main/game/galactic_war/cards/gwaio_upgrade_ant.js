define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Ant Upgrade Tech adds splash damage to the light tank's attack."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Ant Upgrade Tech"),
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
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.ant)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.antAmmo,
          path: "splash_damage",
          op: "replace",
          value: 63,
        },
        {
          file: gwoUnit.antAmmo,
          path: "splash_radius",
          op: "replace",
          value: 10,
        },
        {
          file: gwoUnit.antAmmo,
          path: "full_damage_splash_radius",
          op: "replace",
          value: 2,
        },
        {
          file: gwoUnit.antAmmo,
          path: "events",
          op: "replace",
          value: {
            died: {
              audio_cue: "/SE/Impacts/bot_spark_impact",
              effect_spec: "/pa/effects/specs/tesla_hit.pfx",
            },
          },
        },
      ]);
    },
    dull: function () {},
  };
});
