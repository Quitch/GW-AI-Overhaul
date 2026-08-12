define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Stinger Upgrade Tech replaces the anti-air bot's missiles with flak from the Flak Cannon. It fires two projectiles per volley as opposed to the Flak Cannons' four.",
      ),
    ),
  ),

  summarize: () => "!LOC:Stinger Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_bot_combat_upgrade.png",

  audio: _.constant({
    found: "/VO/Computer/gw/board_tech_available_ammunition",
  }),

  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.stinger),
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods(
      gwoCard
        .mods(gwoUnit.stinger, "replace", {
          tools: [
            {
              spec_id: gwoUnit.flakWeapon,
              aim_bone: "bone_turret",
              projectiles_per_fire: 2,
              muzzle_bone: ["socket_rightMuzzle", "socket_leftMuzzle"],
            },
          ],
        })
        .concat([
          { file: gwoUnit.stinger, path: "tools.0.spec_id", op: "tag" },
        ]),
    );
  },

  dull: function () {},
}));
