define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Avenger Upgrade Tech adds a railgun to the orbital fighter."
    ),
    summarize: _.constant("!LOC:Avenger Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_orbital_fighter_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (gwoCard.hasUnit(inventory.units(), gwoUnit.avenger)) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.avenger,
          path: "tools",
          op: "push",
          value: [
            {
              spec_id: gwoUnit.artemisWeapon,
              aim_bone: "bone_body",
              muzzle_bone: "bone_recoil01",
            },
          ],
        },
      ]);
    },
    dull: function () {
      // empty
    },
  };
});
