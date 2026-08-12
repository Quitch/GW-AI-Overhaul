define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoGroup, gwoUnit) => ({
  visible: () => true,
  describe: () => "!LOC:All units explode on death.",
  summarize: () => "!LOC:Protocol: Kill-switch",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const deathAmmo = [
      gwoUnit.wyrmDeath,
      gwoUnit.zeusDeath,
      gwoUnit.commanderDeath,
      gwoUnit.manhattanDeath,
      gwoUnit.atlasDeath,
      gwoUnit.aresDeath,
      gwoUnit.jigDeath,
      gwoUnit.kesslerAmmo,
      gwoUnit.landMineAmmo,
      gwoUnit.boomAmmo,
      gwoUnit.heliosDeath,
    ];
    const deathAmmoMods = _.map(deathAmmo, (ammo) =>
      gwoCard.mods(ammo, "replace", { splash_damages_allies: true })
    );

    const unitsWithoutADeathWeapon = _.reject(gwoGroup.units, (unit) =>
      _.includes(
        [
          gwoUnit.wyrm,
          gwoUnit.zeus,
          gwoUnit.commander,
          gwoUnit.manhattan,
          gwoUnit.atlas,
          gwoUnit.ares,
          gwoUnit.jig,
          gwoUnit.helios,
        ],
        unit
      )
    );
    const deathWeaponMods = _.map(unitsWithoutADeathWeapon, (unit) =>
      gwoCard
        .mods(unit, "replace", {
          "death_weapon.ground_ammo_spec": gwoUnit.kesslerAmmo,
        })
        .concat(
          gwoCard.mods(unit, "tag", {
            "death_weapon.ground_ammo_spec": gwoUnit.kesslerAmmo,
          })
        )
    );

    inventory.addMods(_.flatten(deathAmmoMods.concat(deathWeaponMods)));
  },

  dull: function () {},
}));
