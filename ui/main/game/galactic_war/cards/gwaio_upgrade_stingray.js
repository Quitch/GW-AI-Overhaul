define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Stingray Upgrade Tech enables interception of tactical missiles by the missile ship and increases vision and radar radius by 50%."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Stingray Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.stingray),
        30
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        [
          {
            file: gwoUnit.stingray,
            path: "tools",
            op: "push",
            value: {
              spec_id: gwoUnit.gileEBeam,
              aim_bone: "socket_missile_muzzle01",
              record_index: 0,
              muzzle_bone: [
                "socket_missile_muzzle01",
                "socket_missile_muzzle02",
              ],
            },
          },
        ].concat(
          _.times(4, function (i) {
            return {
              file: gwoUnit.stingray,
              path: "recon.observer.items." + i + ".radius",
              op: "multiply",
              value: 1.5,
            };
          })
        )
      );
    },
    dull: function () {},
  };
});
