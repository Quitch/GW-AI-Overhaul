define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  var loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
    apply: function (inventory) {
      var playerIsCluster = gwoCard.playerIsCluster(inventory);
      var colonel = playerIsCluster
        ? gwoUnit.clusterCeoColonel
        : gwoUnit.colonel;

      inventory.addUnits(colonel);

      var mods = gwoCard
        .mods(gwoUnit.commander, "add", {
          buildable_types: " | SupportCommander & Custom58",
        })
        .concat(
          gwoCard.mods(colonel, "push", {
            tools: {
              spec_id: gwoUnit.commanderSecondary,
              aim_bone: "bone_turret",
              muzzle_bone: "socket_rightMuzzle",
              secondary_weapon: true,
            },
          }),
          [{ file: colonel, path: "tools.2.spec_id", op: "tag" }],
          gwoCard.mods(colonel, "push", {
            command_caps: "ORDER_FireSecondaryWeapon",
          }),
          gwoCard.mods(colonel, "multiply", { build_metal_cost: 0.5 })
        );
      if (playerIsCluster) {
        mods = mods.concat(
          [
            {
              file: gwoUnit.colonel,
              op: "clone",
              value: gwoUnit.clusterCeoColonel,
            },
          ],
          gwoCard.mods(colonel, "pull", {
            unit_types: "UNITTYPE_FactoryBuild",
          }),
          gwoCard.mods(colonel, "replace", {
            si_name: "bot_support_commander",
          })
        );
      }
      inventory.addMods(mods);
      inventory.addAIMods([
        {
          type: "fabber",
          op: "load",
          value: CARD.id + ".json",
        },
      ]);
    },
  });
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:CEO Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Empower your subordinates and delegate your way to victory. Your commander can build Colonel proxy commanders and they are armed with Uber Cannons. Halves their cost."
    ),
    hint: gwoCard.lockedHint("!LOC:CEO Commander"),
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
