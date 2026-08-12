define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Ragnarok Upgrade Tech allows the titan structure to annihilate all life on a planet while leaving the planet itself intact. It may take up to 30 seconds before you can land safely after detonation."
      )
    )
  ),

  summarize: () => "!LOC:Ragnarok Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_super_weapons_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.ragnarok)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage",
        op: "replace",
        value: 99999,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "full_damage_splash_radius",
        op: "replace",
        value: 99999,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "splash_damage",
        op: "replace",
        value: 99999,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "splash_damages_allies",
        op: "replace",
        value: true,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "splash_radius",
        op: "replace",
        value: 99999,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage_volume.burnable_remove_radius",
        op: "replace",
        value: 100,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage_volume.delay",
        op: "replace",
        value: 1.5,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage_volume.initial_radius",
        op: "replace",
        value: 20,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage_volume.radius_accel",
        op: "replace",
        value: -40,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "damage_volume.radius_velocity",
        op: "replace",
        value: 500,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "burn_damage",
        op: "replace",
        value: 200,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "burn_radius",
        op: "replace",
        value: 99999,
      },
      {
        file: gwoUnit.ragnarokPbaoe,
        path: "planet_impact_spec.delay_time",
        op: "replace",
        value: 99999, // never resolves, so the planet survives the blast
      },
    ]);
  },

  dull: function () {},
}));
