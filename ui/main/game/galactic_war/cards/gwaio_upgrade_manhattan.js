define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Manhattan Upgrade Tech doubles the radius of the mobile nuke's explosion.",
      ),
    ),
  ),

  summarize: () => "!LOC:Manhattan Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.manhattan),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.manhattanDeath,
        path: "splash_radius",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.manhattanDeath,
        path: "full_damage_splash_radius",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.manhattanDeath,
        path: "burn_radius",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.manhattanDeath,
        path: "damage_volume.initial_radius",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.manhattanDeath,
        path: "damage_volume.radius_velocity",
        op: "multiply",
        value: 2,
      },
      {
        file: gwoUnit.manhattanDeath,
        path: "damage_volume.burnable_remove_radius",
        op: "multiply",
        value: 2,
      },
    ]);
  },

  dull: function () {},
}));
