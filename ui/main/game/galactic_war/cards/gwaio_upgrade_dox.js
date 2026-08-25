define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Dox Upgrade Tech replaces the basic infantry's bullet weapons with flamethrowers."
        )
      )
    ),
    summarize: _.constant("!LOC:Dox Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.dox)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.dox, "replace", {
            "events.fired.effect_spec":
              "/pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_rightMuzzle /pa/units/land/tank_armor/tank_armor_muzzle_flame.pfx socket_leftMuzzle",
          })
          .concat(
            gwoCard.mods(gwoUnit.doxWeapon, "multiply", { max_range: 0.27 }),
            gwoCard.mods(gwoUnit.doxWeapon, "replace", { spread_fire: true }),
            gwoCard.mods(gwoUnit.doxAmmo, "replace", {
              ammo_type: "AMMO_Beam",
            }),
            gwoCard.mods(gwoUnit.doxAmmo, "multiply", { damage: 10 })
          )
      );
    },
    dull: function () {},
  };
});
