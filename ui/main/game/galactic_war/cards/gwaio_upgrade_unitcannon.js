define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Unit Cannon Upgrade Tech doubles the launch capacity of this interplanetary transport and removes all cooldowns."
        )
      )
    ),
    summarize: _.constant("!LOC:Unit Cannon Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.unitCannon)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.unitCannon, "push", {
            "factory.spawn_points": [
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
              "socket_build",
            ],
          })
          .concat(
            gwoCard.mods(gwoUnit.unitCannon, "replace", {
              factory_cooldown_time: 0,
              wait_to_rolloff_time: 0,
            })
          )
      );
    },
    dull: function () {},
  };
});
