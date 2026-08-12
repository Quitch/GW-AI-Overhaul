define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (module, GWCStart, gwoBank, gwoCard, gwoUnit) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: () => false,
    summarize: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Warp Commander";
      }
      return `${loc("!LOC:Teleporter")} ${loc("!LOC:Commander")}`; // scuffed translation using existing strings
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:The Commander can mass teleport itself and all units within weapons range to anywhere in the system, but they are highly vulnerable to attack afterwards.",
    hint: function () {
      const icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      if (gwoCard.isEnglish()) {
        return {
          icon,
          description: "!LOC:Warp Commander",
        };
      }
      return {
        icon,
        description: `${loc("!LOC:Teleporter")} ${loc("!LOC:Commander")}`, // scuffed translation using existing strings
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        let buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);
          inventory.addMods([
            {
              file: gwoUnit.commander,
              path: "command_caps",
              op: "push",
              value: "ORDER_MassTeleport",
            },
            {
              file: gwoUnit.commander,
              path: "mass_teleporter",
              op: "replace",
              value: {
                radius: 100,
                phasing_duration: 30,
                phasing_health_frac: 0.01,
                energy_drain: 60000,
                energy_cost: 600000,
                unit_cap: 1000,
                target_types: "Mobile",
              },
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
