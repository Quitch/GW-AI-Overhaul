define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Bumblebee Upgrade Tech causes the carpet bomber to drop a mine instead of bombs."
        )
      )
    ),
    summarize: _.constant("!LOC:Bumblebee Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.bumblebee)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.landMine);

      inventory.addMods(
        gwoCard
          .mods(gwoUnit.bumblebeeAmmo, "replace", {
            damage: 0,
            splash_damage: 0,
            splash_radius: 0,
            full_damage_splash_radius: 0,
            spawn_unit_on_death: gwoUnit.landMine,
          })
          .concat(
            [
              {
                file: gwoUnit.bumblebeeAmmo,
                path: "spawn_unit_on_death",
                op: "tag",
              },
            ],
            gwoCard.mods(gwoUnit.bumblebeeWeapon, "replace", {
              ammo_per_shot: 425,
            })
          )
      );
    },
    dull: function () {},
  };
});
