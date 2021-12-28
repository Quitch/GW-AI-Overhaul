define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioCards, gwaioUnits) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:CEO Commander"),
    icon: function () {
      return gwaioCards.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Empower your subordinates and delegate your way to victory. Your commander can build Colonel proxy commanders and they are armed with Uber Cannons."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:CEO Commander",
      };
    },
    deal: gwaioCards.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioCards.setupCluster(inventory);
          inventory.addMods([
            {
              file: gwaioUnits.commander,
              path: "buildable_types",
              op: "add",
              value: " | SupportCommander",
            },
            {
              file: gwaioUnits.colonel,
              path: "tools",
              op: "push",
              value: {
                spec_id: gwaioUnits.commanderSecondary,
                aim_bone: "bone_turret",
                muzzle_bone: "socket_rightMuzzle",
                secondary_weapon: true,
              },
            },
            {
              file: gwaioUnits.colonel,
              path: "command_caps",
              op: "push",
              value: "ORDER_FireSecondaryWeapon",
            },
          ]);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "load",
              value: "gwaio_start_ceo.json",
            },
          ]);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwaioCards.applyDulls(CARD, inventory);
    },
  };
});
