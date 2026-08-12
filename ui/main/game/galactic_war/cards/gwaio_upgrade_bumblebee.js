define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Bumblebee Upgrade Tech causes the carpet bomber to drop a mine instead of bombs.",
      ),
    ),
  ),

  summarize: () => "!LOC:Bumblebee Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.bumblebee),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addUnits(gwoUnit.landMine);

    inventory.addMods([
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "damage",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "splash_damage",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "splash_radius",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "full_damage_splash_radius",
        op: "replace",
        value: 0,
      },
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "spawn_unit_on_death",
        op: "replace",
        value: gwoUnit.landMine,
      },
      {
        file: gwoUnit.bumblebeeAmmo,
        path: "spawn_unit_on_death",
        op: "tag",
      },
      {
        file: gwoUnit.bumblebeeWeapon,
        path: "ammo_per_shot",
        op: "replace",
        value: 425,
      },
    ]);
  },

  dull: function () {},
}));
