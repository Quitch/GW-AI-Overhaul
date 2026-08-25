define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Omega Upgrade Tech replaces the battleship's underside laser with an SXX laser."
        ) +
          " " +
          loc("!LOC:Doubles the rate of fire of the other weapons.")
      )
    ),
    summarize: _.constant("!LOC:Omega Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.omega)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.omega, "replace", {
            "tools.4.spec_id": gwoUnit.sxxWeapon,
          })
          .concat(
            [{ file: gwoUnit.omega, path: "tools.4.spec_id", op: "tag" }],
            gwoCard.mods(gwoUnit.omega, "replace", { attack_range_frac: 0.3 }),
            gwoCard.mods(gwoUnit.omegaWeapon, "multiply", { rate_of_fire: 2 })
          )
      );
    },
    dull: function () {},
  };
});
