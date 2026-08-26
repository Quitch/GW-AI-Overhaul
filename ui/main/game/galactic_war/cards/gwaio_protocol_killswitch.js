define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoGroup, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant("!LOC:All units explode on death."),
    summarize: _.constant("!LOC:Protocol: Kill-switch"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
    getContext: gwoCard.getContext,
    deal: function () {
      return { chance: 50 };
    },
    buff: function (inventory) {
      var deathAmmoMods = gwoCard.flatMapMods(gwoGroup.deathAmmo, "replace", {
        splash_damages_allies: true,
      });

      var unitsWithoutADeathWeapon = _.difference(gwoGroup.units, [
        gwoUnit.wyrm,
        gwoUnit.zeus,
        gwoUnit.commander,
        gwoUnit.manhattan,
        gwoUnit.atlas,
        gwoUnit.ares,
        gwoUnit.jig,
        gwoUnit.helios,
      ]);
      var deathWeaponMods = _.map(unitsWithoutADeathWeapon, function (unit) {
        return gwoCard
          .mods(unit, "replace", {
            "death_weapon.ground_ammo_spec": gwoUnit.kesslerAmmo,
          })
          .concat(
            gwoCard.mods(unit, "tag", {
              "death_weapon.ground_ammo_spec": gwoUnit.kesslerAmmo,
            })
          );
      });

      inventory.addMods(_.flatten(deathAmmoMods.concat(deathWeaponMods)));
    },
    dull: function () {},
  };
});
