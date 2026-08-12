define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], (gwoCard, gwoGroup) => ({
  visible: () => true,

  describe: () =>
    "!LOC:All combat units gain +20% movement speed and -10% sight and weapon range.",

  summarize: () => "!LOC:Protocol: Wrath",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const percentageReduction = 0.9;
    const percentageIncrease = 1.2;

    const sightMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "recon.observer.items.0.radius": percentageReduction,
        "recon.observer.items.1.radius": percentageReduction,
      })
    );
    const speedMods = _.map(gwoGroup.combatMobile, (unit) =>
      gwoCard.mods(unit, "multiply", {
        "navigation.move_speed": percentageIncrease,
        "navigation.brake": percentageIncrease,
        "navigation.acceleration": percentageIncrease,
        "navigation.turn_speed": percentageIncrease,
      })
    );
    const rangeMods = _.map(gwoGroup.combatMobileWeapons, (weapon) =>
      gwoCard.mods(weapon, "multiply", {
        max_range: percentageReduction,
      })
    );

    inventory.addMods(_.flatten(sightMods.concat(speedMods, rangeMods)));
  },

  dull: function () {},
}));
