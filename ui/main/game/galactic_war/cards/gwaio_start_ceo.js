define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:CEO Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Empower your subordinates and delegate your way to victory. Your commander can build Colonel proxy commanders and they are armed with Uber Cannons. Halves their cost."
    ),
    hint: _.constant({
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:CEO Commander",
    }),
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);

          // Cluster fields Colonels as Sub Commanders and replaces their
          // unit_types with a list carrying neither SupportCommander nor
          // FactoryBuild, so nothing can build one. This loadout gets a copy
          // taken before that runs, leaving Cluster's own Colonels alone.
          var playerIsCluster =
            inventory.getTag("global", "playerFaction") === 4;
          var colonel = playerIsCluster
            ? gwoUnit.clusterCeoColonel
            : gwoUnit.colonel;

          inventory.addUnits(colonel);
          var mods = [
            {
              file: gwoUnit.commander,
              path: "buildable_types",
              op: "add",
              value: " | SupportCommander & Custom58",
            },
            {
              file: colonel,
              path: "tools",
              op: "push",
              value: {
                spec_id: gwoUnit.commanderSecondary,
                aim_bone: "bone_turret",
                muzzle_bone: "socket_rightMuzzle",
                secondary_weapon: true,
              },
            },
            {
              file: colonel,
              path: "tools.2.spec_id",
              op: "tag",
            },
            {
              file: colonel,
              path: "command_caps",
              op: "push",
              value: "ORDER_FireSecondaryWeapon",
            },
            {
              file: colonel,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.5,
            },
          ];
          if (playerIsCluster) {
            mods.push(
              {
                file: gwoUnit.colonel,
                op: "clone",
                value: gwoUnit.clusterCeoColonel,
              },
              // Only your Commander builds it - the advanced bot factory asks
              // for FactoryBuild.
              {
                file: colonel,
                path: "unit_types",
                op: "pull",
                value: "UNITTYPE_FactoryBuild",
              },
              // The strategic icon is named after the spec file, and this one
              // has no file of its own.
              {
                file: colonel,
                path: "si_name",
                op: "replace",
                value: "bot_support_commander",
              }
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
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
