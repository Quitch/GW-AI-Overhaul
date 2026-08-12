define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Solar Array Upgrade Tech enables interception of tactical missiles and drop pods by the Solar Array.",
      ),
    ),
  ),

  summarize: () => "!LOC:Solar Array Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.solarArray),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard
        .mods(gwoUnit.solarArray, "push", {
          tools: [
            {
              spec_id: gwoUnit.gilEBeam,
              aim_bone: "bone_root",
              record_index: 0,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
            {
              spec_id: gwoUnit.umbrellaBeam,
              aim_bone: "bone_root",
              record_index: 1,
              fire_event: "fired",
              muzzle_bone: "bone_root",
            },
          ],
        })
        .concat(
          _.times(2, (i) => ({
            file: gwoUnit.solarArray,
            path: `tools.${i}.spec_id`,
            op: "tag",
          })),
        ),
    );
  },

  dull: function () {},
}));
