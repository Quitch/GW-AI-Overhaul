define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Omega Upgrade Tech replaces the battleship's underside laser with an SXX laser."
      ) +
        " " +
        loc("!LOC:Doubles the rate of fire of the other weapons.") +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.omega)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.omega,
          path: "tools.4.spec_id",
          op: "replace",
          value: gwoUnit.sxxWeapon,
        },
        {
          file: gwoUnit.omega,
          path: "attack_range_frac",
          op: "replace",
          value: 0.3,
        },
        {
          file: gwoUnit.omegaWeapon,
          path: "rate_of_fire",
          op: "multiply",
          value: 2,
        },
      ]);
    },
    dull: function () {},
  };
});
