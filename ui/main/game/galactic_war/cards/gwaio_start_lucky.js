define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], function (module, GW, GWCStart, gwoBank, gwoCard) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: function () {
      var english = _.includes(i18n.detectLanguage(), "en");
      if (english) {
        return "!LOC:Lucky Commander";
      }
      return loc("!LOC:Reroll Tech") + " " + loc("!LOC:Commander"); // scuffed translation using existing strings
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:The Lucky Commander is offered four cards instead of three at every planet."
    ),
    hint: function () {
      var english = _.includes(i18n.detectLanguage(), "en");
      var icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      if (english) {
        return {
          icon: icon,
          description: "!LOC:Lucky Commander",
        };
      }
      return {
        icon: icon,
        description: loc("!LOC:Reroll Tech") + " " + loc("!LOC:Commander"), // scuffed translation using existing strings
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
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
