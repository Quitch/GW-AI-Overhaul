define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles and drop pods by the Solar Array."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Solar Array Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.solarArray)) {
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
      inventory.addMods([
        {
          file: gwoUnit.solarArray,
          path: "tools",
          op: "push",
          value: [
            {
              spec_id: gwoUnit.gileEBeam,
              aim_bone: "bone_root",
              record_index: 0,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
            {
              spec_id: gwoUnit.umbrellaBeam,
              aim_bone: "bone_root",
              record_index: 1,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
          ],
        },
      ]);
    },
    dull: function () {},
  };
});
