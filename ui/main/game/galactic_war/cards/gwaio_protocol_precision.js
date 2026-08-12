define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +15% sight and weapon range and -15% movement speed.",

  summarize: () => "!LOC:Protocol: Precision",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.85;
    const percentageIncrease = 1.15;

    const speedMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "navigation.move_speed": percentageReduction,
        "navigation.brake": percentageReduction,
        "navigation.acceleration": percentageReduction,
        "navigation.turn_speed": percentageReduction,
      }),
    );
    const sightMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "recon.observer.items.0.radius": percentageIncrease,
        "recon.observer.items.1.radius": percentageIncrease,
      }),
    );
    const rangeMods = _.map(gwoGroup.combatMobileWeapons, (weapon) =>
      gwoCard.mods(weapon, "multiply", {
        max_range: percentageIncrease,
      }),
    );
    // Try to make sure that units can use their full range
    const ammoMods = _.map(gwoGroup.combatMobileAmmo, (ammo) =>
      gwoCard.mods(ammo, "multiply", {
        lifetime: percentageIncrease,
        max_velocity: percentageIncrease,
      }),
    );

    inventory.addMods(
      _.flatten(speedMods.concat(sightMods, rangeMods, ammoMods)),
    );
  },

  dull: function () {},
}));
