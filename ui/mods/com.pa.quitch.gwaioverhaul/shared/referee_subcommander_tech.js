define(function () {
  var applySubcommanderTacticsTech = function (personality, cards) {
    if (_.some(cards, { id: "gwaio_upgrade_subcommander_tactics" })) {
      personality.micro_type = 2;
      personality.go_for_the_kill = true;
      personality.priority_scout_metal_spots = true;
      personality.enable_commander_danger_responses = true;
      _.pull(personality.personality_tags, "SlowerExpansion");
      personality.personality_tags.push("PreventsWaste");
    }
    return personality;
  };

  var applySubcommanderFabberTech = function (personality, cards) {
    if (_.some(cards, { id: "gwaio_upgrade_subcommander_fabber" })) {
      personality.max_basic_fabbers = Math.round(
        personality.max_basic_fabbers * 1.5
      );
      personality.max_advanced_fabbers = Math.round(
        personality.max_advanced_fabbers * 1.5
      );
    }
    return personality;
  };

  var hasDuplicatedSubcommanders = function (cards) {
    return _.some(cards, { id: "gwaio_upgrade_subcommander_duplication" });
  };

  var applySubcommanderDuplicationTech = function (cards) {
    return hasDuplicatedSubcommanders(cards) ? 2 : 1;
  };

  var hasSmartSubcommanders = function (inventory) {
    var cards = _.isFunction(inventory && inventory.cards)
      ? inventory.cards()
      : (inventory && inventory.cards) || [];
    return _.some(cards, {
      id: "gwaio_upgrade_subcommander_tactics",
    });
  };

  return {
    applySubcommanderTacticsTech: applySubcommanderTacticsTech,
    applySubcommanderFabberTech: applySubcommanderFabberTech,
    applySubcommanderDuplicationTech: applySubcommanderDuplicationTech,
    hasDuplicatedSubcommanders: hasDuplicatedSubcommanders,
    hasSmartSubcommanders: hasSmartSubcommanders,
  };
});
