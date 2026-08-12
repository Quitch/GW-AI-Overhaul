define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Kestrel Upgrade Tech replaces the gunship's bullet weapons with flamethrowers.",
      ),
    ),
  ),

  summarize: () => "!LOC:Kestrel Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_combat_air_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.kestrel),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.kestrel,
        path: "events.fired.effect_spec",
        op: "replace",
        value:
          "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
      },
      {
        file: gwoUnit.kestrelWeapon,
        path: "max_range",
        op: "multiply",
        value: 0.33,
      },
      {
        file: gwoUnit.kestrelWeapon,
        path: "spread_fire",
        op: "replace",
        value: true,
      },
      {
        file: gwoUnit.kestrelAmmo,
        path: "ammo_type",
        op: "replace",
        value: "AMMO_Beam",
      },
      {
        file: gwoUnit.kestrelAmmo,
        path: "damage",
        op: "multiply",
        value: 5,
      },
    ]);
  },

  dull: function () {},
}));
