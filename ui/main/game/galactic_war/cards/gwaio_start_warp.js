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
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.commander, "push", {
            command_caps: "ORDER_MassTeleport",
          })
          .concat(
            gwoCard.mods(gwoUnit.commander, "replace", {
              mass_teleporter: {
                radius: 100,
                phasing_duration: 30,
                phasing_health_frac: 0.01,
                energy_drain: 60000,
                energy_cost: 600000,
                unit_cap: 1000,
                target_types: "Mobile",
              },
            })
          )
      );
    },
  });
  return {
    visible: _.constant(false),
    summarize: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Warp Commander";
      }
      return loc("!LOC:Teleporter") + " " + loc("!LOC:Commander"); // scuffed translation using existing strings
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Commander can mass teleport itself and all units within weapons range to anywhere in the system, but they are highly vulnerable to attack afterwards."
    ),
    hint: function () {
      var icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      if (gwoCard.isEnglish()) {
        return {
          icon: icon,
          description: "!LOC:Warp Commander",
        };
      }
      return {
        icon: icon,
        description: loc("!LOC:Teleporter") + " " + loc("!LOC:Commander"), // scuffed translation using existing strings
      };
    },
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
