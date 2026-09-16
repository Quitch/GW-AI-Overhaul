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

    const healthMods = gwoCard.flatMapMods(gwoGroup.units, "multiply", {
      max_health: 1.3,
    });
    const rangeMods = gwoCard.flatMapMods(gwoGroup.weapons, "multiply", {
      max_range: rangePercentageIncrease,
    });
    // Try to make sure that units can use their full range
    const ammoMods = gwoCard.flatMapMods(gwoGroup.ammo, "multiply", {
      lifetime: rangePercentageIncrease,
      max_velocity: rangePercentageIncrease,
    });

    // Radar is excluded: its vision slots are ordered differently.
    const unitsExcludingRadarScoutsCommanders = _.difference(gwoGroup.units, [
      gwoUnit.antiNukeLauncher,
      gwoUnit.arkyd,
      gwoUnit.commander,
      gwoUnit.firefly,
      gwoUnit.hermes,
      gwoUnit.manhattan,
      gwoUnit.nyx,
      // gwoUnit.deepSpaceOrbitalRadar - uses slot 3+ for radar vision
      gwoUnit.radar,
      gwoUnit.radarAdvanced,
      gwoUnit.radarSatelliteAdvanced,
      gwoUnit.skitter,
      // gwoUnit.stingray - uses slot 2+ for radar vision
      gwoUnit.torpedoLauncher,
      gwoUnit.torpedoLauncherAdvanced,
      gwoUnit.ward,
    ]);
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

    // can't use replace due to Planetary Radar using it - multiply runs later
    const blindMods = gwoCard.flatMapMods(
      unitsExcludingRadarScoutsCommanders,
      "multiply",
      gwoCard.observerPaths(2, "radius"),
      0,
    );
    const radarsWithRadarVisionInSlot1Mods = gwoCard.flatMapMods(
      radarsWithRadarVisionInSlot1,
      "replace",
      {
        "recon.observer.items.0.radius": 0,
      },
    );
    const radarsWithRadarVisionInSlot0Mods = gwoCard.flatMapMods(
      radarsWithRadarVisionInSlot0,
      "replace",
      {
        "recon.observer.items.1.radius": 0,
      },
    );

    // Ares needs a high arc to reach the extended range
    const aresFixMods = gwoCard.mods(gwoUnit.aresWeapon, "replace", {
      pitch_range: 89,
      arc_type: "ARC_high",
    });

    inventory.addMods(
      healthMods.concat(
        rangeMods,
        ammoMods,
        blindMods,
        radarsWithRadarVisionInSlot1Mods,
        radarsWithRadarVisionInSlot0Mods,
        aresFixMods,
      ),
    );
  },

  dull: function () {},
}));
