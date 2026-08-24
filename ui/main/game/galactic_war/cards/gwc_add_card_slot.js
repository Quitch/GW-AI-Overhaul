define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  var MINIMUM_CHANCE = 25;
  var FULL_HAND_CHANCE = 100000;

  return {
    visible: _.constant(false),
    describe: _.constant("!LOC:Adds a new slot for another technology."),
    summarize: _.constant("!LOC:Additional Data Bank"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png"
    ),
    audio: _.constant({ found: "/VO/Computer/gw/board_slot_increased" }),
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory, rng) {
      var emptySlots = inventory.maxCards() - inventory.cards().length;
      var chance = inventory.handIsFull()
        ? FULL_HAND_CHANCE
        : Math.max(300 - (emptySlots - 1) * 100, MINIMUM_CHANCE);
      return {
        params: {
          allowOverflow: true,
          unique: gwoCard.uniqueValue(rng),
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 2);
    },
    dull: function () {},
  };
});
