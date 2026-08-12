define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Storm Upgrade Tech enables interception of tactical missiles by the flak tank."
      )
    )
  ),

  summarize: () => "!LOC:Storm Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.storm)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard
        .mods(gwoUnit.storm, "push", {
          tools: {
            spec_id: gwoUnit.gilEBeam,
            aim_bone: "socket_aim",
            muzzle_bone: [
              "socket_muzzle01",
              "socket_muzzle02",
              "socket_muzzle03",
              "socket_muzzle04",
            ],
          },
        })
        .concat([{ file: gwoUnit.storm, path: "tools.1.spec_id", op: "tag" }])
    );
  },

  dull: function () {},
}));
