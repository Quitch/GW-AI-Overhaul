define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  return {
    visible: _.constant(false), // Can't discard this card
    describe: _.constant("!LOC:Adds a new slot for another technology."),
    summarize: _.constant("!LOC:Additional Data Bank"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_storage.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_slot_increased",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 300;
      if (inventory.handIsFull()) {
        chance = 100000;
      }
      return {
        params: {
          allowOverflow: true,
          unique: Math.random(),
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 2); // one for card and one slot
    },
    dull: function () {},
    keep: function (params, context) {
      context.chance = 100;
    },
    discard: function (params, context) {
      context.chance *= Math.log(context.totalSize) * 0.4;
    },
  };
});
