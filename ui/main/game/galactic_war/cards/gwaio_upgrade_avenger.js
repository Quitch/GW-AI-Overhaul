define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc("!LOC:Avenger Upgrade Tech adds a railgun to the orbital fighter."),
    ),
  ),

  summarize: () => "!LOC:Avenger Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.avenger),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard
        .mods(gwoUnit.avenger, "push", {
          tools: [
            {
              spec_id: gwoUnit.artemisWeapon,
              aim_bone: "bone_body",
              muzzle_bone: "bone_recoil01",
            },
          ],
        })
        .concat([
          { file: gwoUnit.avenger, path: "tools.1.spec_id", op: "tag" },
        ]),
    );
  },

  dull: function () {},
}));
