define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (GW, gwoCard, gwoGroup) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Orbital Ammunition Tech increases damage of all orbital units by 25%",
    ),
    summarize: _.constant("!LOC:Orbital Ammunition Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_orbital.png",
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context) {
      var sizes = GW.balance.numberOfSystems;
      return {
        chance: gwoCard.travelledShort(system, context, sizes) ? 70 : 35,
      };
    },
    buff: function (inventory) {
      inventory.addMods(
        _.flatten(
          _.map(gwoGroup.orbitalAmmo, function (ammo) {
            return gwoCard.mods(ammo, "multiply", {
              damage: 1.25,
              splash_damage: 1.25,
            });
          }),
        ),
      );
    },
    dull: function () {},
  };
});
