define({
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
  getContext: function (galaxy) {
    return {
      chance: 300,
      totalSize: galaxy.stars().length,
    };
  },
  deal: function (system, context, inventory) {
    var chance = system.distance() > 0 ? context.chance : 0;
    if (inventory.handIsFull()) chance = 100000;

    return {
      params: {
        allowOverflow: true,
        unique: Math.random(),
      },
      chance: chance,
    };
  },
  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 2); // Note: One for us, and one for an extra.
  },
  dull: function () {},
  keep: function (unused0, context) {
    context.chance = 100;
  },
  discard: function (unused0, context) {
    context.chance *= Math.log(context.totalSize) * 0.4;
  },
});
