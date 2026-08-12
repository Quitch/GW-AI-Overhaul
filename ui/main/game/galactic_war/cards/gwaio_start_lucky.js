define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], (module, GW, GWCStart, gwoBank, gwoCard) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: () => false,
    summarize: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Lucky Commander";
      }
      return `${loc("!LOC:Reroll Tech")} ${loc("!LOC:Commander")}`; // scuffed translation using existing strings
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:The Lucky Commander is offered four cards instead of three at every planet.",
    hint: function () {
      const icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      if (gwoCard.isEnglish()) {
        return {
          icon,
          description: "!LOC:Lucky Commander",
        };
      }
      return {
        icon,
        description: `${loc("!LOC:Reroll Tech")} ${loc("!LOC:Commander")}`, // scuffed translation using existing strings
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
