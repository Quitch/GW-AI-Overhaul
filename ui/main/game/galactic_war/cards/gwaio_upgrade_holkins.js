define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Holkins Upgrade Tech triples the number of shots fired per volley by the advanced artillery while also tripling their deviation from target."
      ) +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
    ),
    summarize: _.constant("!LOC:Holkins Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png"
    ),
    audio: _.constant({
      found: "/VO/Computer/gw/board_tech_available_ammunition",
    }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      return gwoCard.upgradeDeal(
        gwoCard.hasUnit(inventory.units(), gwoUnit.holkins)
      );
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addMods([
        {
          file: gwoUnit.holkins,
          path: "tools.0.projectiles_per_fire",
          op: "replace",
          value: 3,
        },
        {
          file: gwoUnit.holkins,
          path: "tools.0.muzzle_bone",
          op: "replace",
          value: ["socket_muzzle", "socket_muzzle", "socket_muzzle"],
        },
        {
          file: gwoUnit.holkinsWeapon,
          path: "firing_standard_deviation",
          op: "multiply",
          value: 3,
        },
      ]);
    },
    dull: function () {},
  };
});
