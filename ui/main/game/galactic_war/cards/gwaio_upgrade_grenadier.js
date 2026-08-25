define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Grenadier Upgrade Tech replaces this fire support's artillery with mine launchers, triples its cost and reduces its rate of fire by 75%."
        )
      )
    ),
    summarize: _.constant("!LOC:Grenadier Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.grenadier)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.grenadier, "multiply", { build_metal_cost: 3 })
          .concat(
            gwoCard.mods(gwoUnit.grenadierWeapon, "multiply", {
              rate_of_fire: 0.25,
            }),
            gwoCard.mods(gwoUnit.grenadierAmmo, "replace", {
              damage: 0,
              splash_damage: 0,
              splash_radius: 0,
              full_damage_splash_radius: 0,
              spawn_unit_on_death: gwoUnit.landMine,
            }),
            [
              {
                file: gwoUnit.grenadierAmmo,
                path: "spawn_unit_on_death",
                op: "tag",
              },
            ]
          )
      );
    },
    dull: function () {},
  };
});
