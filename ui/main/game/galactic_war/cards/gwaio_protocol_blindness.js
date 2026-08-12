define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoGroup, gwoUnit) => ({
  visible: () => true,

  describe: () =>
    "!LOC:Units gain +50% weapon range and +30% health, but only scouts and commanders can see.",

  summarize: () => "!LOC:Protocol: Blindness",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwaio_protocol.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_combat" }),
  getContext: gwoCard.getContext,

  deal: function () {
    return { chance: 50 };
  },

  buff: function (inventory) {
    const rangePercentageIncrease = 1.5;

    const healthMods = _.map(gwoGroup.units, (unit) =>
      gwoCard.mods(unit, "multiply", { max_health: 1.3 })
    );
    const rangeMods = _.map(gwoGroup.weapons, (weapon) =>
      gwoCard.mods(weapon, "multiply", {
        max_range: rangePercentageIncrease,
      })
    );
    // Try to make sure that units can use their full range
    const ammoMods = _.map(gwoGroup.ammo, (ammo) =>
      gwoCard.mods(ammo, "multiply", {
        lifetime: rangePercentageIncrease,
        max_velocity: rangePercentageIncrease,
      })
    );

    // Radar is excluded: its vision slots are ordered differently.
    const unitsExcludingRadarScoutsCommanders = _.reject(
      gwoGroup.units,
      (unit) =>
        _.includes(
          [
            gwoUnit.antiNukeLauncher,
            gwoUnit.arkyd,
            gwoUnit.commander,
            gwoUnit.firefly,
            gwoUnit.hermes,
            gwoUnit.manhattan,
            gwoUnit.nyx,
            // gwoUnit.planetaryRadar - uses slot 3+ for radar vision
            gwoUnit.radar,
            gwoUnit.radarAdvanced,
            gwoUnit.radarSatelliteAdvanced,
            gwoUnit.skitter,
            // gwoUnit.stingray - uses slot 2+ for radar vision
            gwoUnit.torpedoLauncher,
            gwoUnit.torpedoLauncherAdvanced,
            gwoUnit.ward,
          ],
          unit
        )
    );
    const radarsWithRadarVisionInSlot0 = [
      gwoUnit.arkyd,
      gwoUnit.radarSatelliteAdvanced,
    ];
    const radarsWithRadarVisionInSlot1 = [
      gwoUnit.antiNukeLauncher,
      gwoUnit.manhattan,
      gwoUnit.nyx,
      gwoUnit.radar,
      gwoUnit.radarAdvanced,
      gwoUnit.torpedoLauncher,
      gwoUnit.torpedoLauncherAdvanced,
      gwoUnit.ward,
    ];

    const blindMods = _.map(unitsExcludingRadarScoutsCommanders, (unit) =>
      // can't use replace due to Planetary Radar using it - multiply runs later
      gwoCard.mods(unit, "multiply", {
        "recon.observer.items.0.radius": 0,
        "recon.observer.items.1.radius": 0,
      })
    );
    const radarsWithRadarVisionInSlot1Mods = _.map(
      radarsWithRadarVisionInSlot1,
      (unit) =>
        gwoCard.mods(unit, "replace", {
          "recon.observer.items.0.radius": 0,
        })
    );
    const radarsWithRadarVisionInSlot0Mods = _.map(
      radarsWithRadarVisionInSlot0,
      (unit) =>
        gwoCard.mods(unit, "replace", {
          "recon.observer.items.1.radius": 0,
        })
    );

    // Ares needs a high arc to reach the extended range
    const aresFixMods = gwoCard.mods(gwoUnit.aresWeapon, "replace", {
      pitch_range: 89,
      arc_type: "ARC_high",
    });

    inventory.addMods(
      _.flatten(
        healthMods.concat(
          rangeMods,
          ammoMods,
          blindMods,
          radarsWithRadarVisionInSlot1Mods,
          radarsWithRadarVisionInSlot0Mods,
          aresFixMods
        )
      )
    );
  },

  dull: function () {},
}));
