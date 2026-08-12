define(() => {
  const applySubcommanderTacticsTech = (personality, cards) => {
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

  const applySubcommanderFabberTech = (personality, cards) => {
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

  const applySubcommanderDuplicationTech = (cards) => {
    if (
      _.some(cards, {
        id: "gwaio_upgrade_subcommander_duplication",
      })
    ) {
      return 2;
    }
    return 1;
  };

  const hasSmartSubcommanders = (inventory) => {
    const cards = _.isFunction(inventory && inventory.cards)
      ? inventory.cards()
      : (inventory && inventory.cards) || [];
    return _.some(cards, {
      id: "gwaio_upgrade_subcommander_tactics",
    });
  };

  return {
    applySubcommanderTacticsTech,
    applySubcommanderFabberTech,
    applySubcommanderDuplicationTech,
    hasSmartSubcommanders,
  };
});
