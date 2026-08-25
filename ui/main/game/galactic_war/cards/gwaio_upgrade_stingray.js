define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Stingray Upgrade Tech enables interception of tactical missiles by the missile ship and increases vision and radar radius by 50%."
        )
      )
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
        gwoCard
          .mods(gwoUnit.stingray, "push", {
            tools: {
              spec_id: gwoUnit.gilEBeam,
              aim_bone: "socket_missile_muzzle01",
              record_index: 0,
              muzzle_bone: [
                "socket_missile_muzzle01",
                "socket_missile_muzzle02",
              ],
            },
          })
          .concat(
            [{ file: gwoUnit.stingray, path: "tools.3.spec_id", op: "tag" }],
            gwoCard.mods(
              gwoUnit.stingray,
              "multiply",
              gwoCard.eachPath(gwoCard.observerPaths(4, "radius"), 1.5)
            )
          )
      );
    },
    dull: function () {},
  };
});
