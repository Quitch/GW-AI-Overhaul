// The measured half of gw_play/cards.js. Nothing here may touch model/$/ko/game
// at define time - see testing.md, "Coverage".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
], function (brainTable, ids, gwoLoadoutIds) {
  // Cards a race player is not offered unless their entry names race units:
  // unit upgrades are tuned to the MLA unit they name (the commander's
  // excepted - every race has one). A race gets its own. See races.md.
  var RACE_UPGRADES = /_upgrade_(subcommander|ubercannon)/;

  var mlaOnlyCard = function (cardId) {
    return /_upgrade_/.test(cardId) && !RACE_UPGRADES.test(cardId);
  };

  // The `races` a loadout's own entry in `loadoutEntries` (the
  // gwoStartingCards and gwoNewStartCards entries), or else GWO's own in
  // loadout_ids.js, names, normalised, or undefined when no entry names any.
  var listedLoadoutRaces = function (cardId, loadoutEntries) {
    var listsRaces = function (candidate) {
      return (
        !!candidate && candidate.id === cardId && _.isArray(candidate.races)
      );
    };
    var entry =
      _.find(loadoutEntries || [], listsRaces) ||
      _.find(gwoLoadoutIds.entries, listsRaces);
    return entry ? _.map(entry.races, ids.normalize) : undefined;
  };

  // Whether the loadout scenes show this loadout dimmed and unselectable for
  // `race`. No race at all locks nothing; every caller passes "mla" for a
  // player without a race mod. A loadout entry's `races` names the races
  // outright, in place of the `_upgrade_` rule; otherwise MLA locks nothing. See
  // races.md, "Which races a loadout reaches".
  var raceLocksLoadout = function (race, cardId, loadoutEntries) {
    if (!race) {
      return false;
    }
    var listed = listedLoadoutRaces(cardId, loadoutEntries);
    if (listed) {
      return !_.includes(listed, ids.normalize(race));
    }
    return race !== "mla" && mlaOnlyCard(cardId);
  };

  // The loadout entries a scene's model holds: what mods and GWO pushed onto
  // gwoStartingCards and gwoNewStartCards.
  var loadoutEntries = function (scene) {
    var listOf = function (list) {
      return _.isArray(list) ? list : [];
    };
    return scene
      ? listOf(scene.gwoStartingCards).concat(listOf(scene.gwoNewStartCards))
      : [];
  };

  // The races in `raceList` a loadout is not locked for.
  var compatibleRaces = function (cardId, raceList, loadoutEntries) {
    return _.filter(raceList || [], function (race) {
      return !!race && !raceLocksLoadout(race.id, cardId, loadoutEntries);
    });
  };

  // Every deal asks for every card's entry, so the list is indexed by
  // position, rebuilt when the list, its length or an indexed entry changes.
  var entryIndex = { list: undefined, length: -1, at: {} };

  var entryFor = function (cardsToUnits, cardId) {
    var list = cardsToUnits || [];
    var indexed = function () {
      return Object.prototype.hasOwnProperty.call(entryIndex.at, cardId);
    };
    var moved = function () {
      var entry = list[entryIndex.at[cardId]];
      return !entry || entry.id !== cardId;
    };

    if (
      entryIndex.list !== list ||
      entryIndex.length !== list.length ||
      (indexed() && moved())
    ) {
      var at = {};
      _.forEachRight(list, function (entry, position) {
        if (entry) {
          at[entry.id] = position;
        }
      });
      entryIndex = { list: list, length: list.length, at: at };
    }

    return indexed() ? list[entryIndex.at[cardId]] : undefined;
  };

  var isStartLoadoutCardId = function (cardId) {
    return _.isString(cardId) && _.includes(cardId, "_start_");
  };

  var helpers = {
    // The base count, plus one for a full hand and one for the Lucky start card.
    // A falsy inventory yields the base count.
    cardsOfferedCount: function (offer, inventory) {
      var cardsToOffer = offer;

      if (
        inventory &&
        _.isFunction(inventory.handIsFull) &&
        inventory.handIsFull()
      ) {
        cardsToOffer++;
      }

      if (
        inventory &&
        _.isFunction(inventory.hasCard) &&
        inventory.hasCard("gwaio_start_lucky")
      ) {
        cardsToOffer++;
      }

      return cardsToOffer;
    },

    exploreOfferRecord: function (gameId, star, cardsOffered) {
      return { gameId: gameId, star: star, cardsOffered: cardsOffered };
    },

    exploreOfferSaved: function (saved, gameId, star) {
      return (
        !!saved &&
        saved.gameId === gameId &&
        saved.star === star &&
        _.isNumber(saved.cardsOffered)
      );
    },

    // The host's offer size as its explore deal started, so deleting a card
    // mid-offer cannot change it. A record from another war or star, or none,
    // falls back to the size the hand gives now.
    exploreCardsOffered: function (saved, gameId, star, offer, inventory) {
      return helpers.exploreOfferSaved(saved, gameId, star)
        ? saved.cardsOffered
        : helpers.cardsOfferedCount(offer, inventory);
    },

    exploreRerollsUsed: function (cardsOffered, cardsHeld) {
      return Math.max(0, cardsOffered - cardsHeld);
    },

    // A record for this offer was written in this session, beside the rerolls
    // it has spent, so both stand: a thin deck's short hand would count too many.
    // Without one, the spent rerolls are counted from the hand's length.
    restoredExploreRerolls: function (
      saved,
      gameId,
      star,
      offer,
      inventory,
      rerollsUsed,
      cardsHeld
    ) {
      var cardsOffered = helpers.exploreCardsOffered(
        saved,
        gameId,
        star,
        offer,
        inventory
      );
      var kept =
        helpers.exploreOfferSaved(saved, gameId, star) &&
        _.isNumber(rerollsUsed);
      return {
        cardsOffered: cardsOffered,
        rerollsUsed: kept
          ? rerollsUsed
          : helpers.exploreRerollsUsed(cardsOffered, cardsHeld),
      };
    },

    // Whether `card` should be withheld from a deal. Duplicates are allowed
    // across players but not within one player's deal.
    doNotDealCard: function (
      inventory,
      card,
      cardsDealt,
      dealAddSlot,
      systemCards
    ) {
      var cardsInSystem = _.isArray(systemCards) ? systemCards : [];
      var systemHasCard = _.some(cardsInSystem, function (systemCard) {
        if (!systemCard) {
          return false;
        }

        if (_.isFunction(systemCard.id)) {
          return systemCard.id() === card.id;
        }

        return systemCard.id === card.id;
      });

      // Never deal Additional Data Bank as a system's pre-dealt card
      if (card.id === "gwc_add_card_slot" && dealAddSlot === false) {
        return true;
      }

      return (
        inventory.hasCard(card.id) ||
        _.some(cardsDealt, { id: card.id }) ||
        systemHasCard
      );
    },

    // The weighted walk over one deal iteration; `roll` is [0, 1). Undefined when
    // nothing is dealable, or the roll falls off the end through float error.
    chooseDealIndex: function (fullHand, roll) {
      var hand = [];
      var probability = 0;

      _.forEach(fullHand, function (deal, index) {
        var raw = deal && deal.chance;
        var chance = _.isNumber(raw) || _.isString(raw) ? Number(raw) : 0;
        if (chance > 0 && isFinite(chance)) {
          hand.push({ index: index, chance: chance });
          probability += chance;
        }
      });

      if (!hand.length) {
        return undefined;
      }

      var remaining = roll * probability;
      for (var entry of hand) {
        if (remaining < entry.chance) {
          return entry.index;
        }
        remaining -= entry.chance;
      }

      return undefined;
    },

    // A reroll spends one offered card, and the last card is never rerolled.
    rerollsRemain: function (rerollsUsed, cardsOffered) {
      return rerollsUsed < cardsOffered - 1;
    },

    isStartLoadoutCardId: isStartLoadoutCardId,

    filterStartLoadoutCards: function (cards) {
      return _.filter(cards || [], function (card) {
        return isStartLoadoutCardId(card.id);
      });
    },

    buildPendingStartLoadoutCard: function (card) {
      var result = _.isString(card) ? { id: card } : _.cloneDeep(card);
      if (
        result &&
        isStartLoadoutCardId(result.id) &&
        _.isUndefined(result.allowOverflow)
      ) {
        result.allowOverflow = true;
      }

      return result;
    },

    pendingCardsContainLoadout: function (pendingTechCards) {
      return !!(
        pendingTechCards &&
        _.isArray(pendingTechCards.cards) &&
        pendingTechCards.cards.length &&
        isStartLoadoutCardId(pendingTechCards.cards[0].id)
      );
    },

    // Both test whether the exploration that started a deal is still live once
    // the async chooser resolves. See tech-cards.md, "A deal that arrives late,
    // or empty".
    explorationDealtNothing: function (game, starIndex, star, replaying) {
      if (replaying) {
        return false;
      }

      return (
        game.turnState() === "explore" &&
        game.currentStar() === starIndex &&
        _.isEmpty(star.cardList())
      );
    },
    explorationStillLive: function (game, starIndex, star) {
      return (
        game.turnState() === "explore" &&
        game.currentStar() === starIndex &&
        !!star.hasCard()
      );
    },

    // Mutates the subcommander. A no-op unless the race's ally brain is
    // Penchant - a Sub Commander fights as the player's race, so its brain
    // comes from that race's row, not the war-wide string. See races.md. Only
    // the name is recorded: its tags are built at launch, and the referee
    // shows the name after the character. See galaxy.md.
    applyPenchantToSubcommander: function (
      subcommander,
      gwoSettings,
      gwoAI,
      rng,
      race
    ) {
      var settings = gwoSettings || {};
      var allyBrain = brainTable.resolve(
        settings.aiByRace,
        "ally",
        race,
        settings.ai,
        settings.aiAlly
      );
      if (allyBrain !== "Penchant") {
        return;
      }

      subcommander.penchantName = gwoAI.penchants(rng).penchantName;
    },

    mlaOnlyCard: mlaOnlyCard,
    raceLocksLoadout: raceLocksLoadout,
    compatibleRaces: compatibleRaces,
    loadoutEntries: loadoutEntries,

    // cardsToUnits is model.gwoCardsToUnits. See races.md, "Capability cells".
    raceCanDeal: function (races, inventory, cardId, cardsToUnits) {
      var race = races.raceOf(inventory);
      var entry = entryFor(cardsToUnits, cardId);
      var units = entry ? entry.units : undefined;
      // An entry's `races` names the races outright, in place of the
      // `_upgrade_` rule. See tech-cards.md, "Which races a card reaches".
      if (entry && _.isArray(entry.races)) {
        if (!_.includes(_.map(entry.races, races.normalizeId), race)) {
          return false;
        }
      } else if (
        !races.isMla(race) &&
        mlaOnlyCard(cardId) &&
        !races.namesForeignUnit(units)
      ) {
        return false;
      }
      return races.cardUsable(race, units);
    },

    // A Sub Commander fights as the player's race, with one of its commanders.
    // Mutates the subcommander; a no-op for MLA.
    applyRaceToSubcommander: function (subcommander, races, race, rng) {
      if (races.isMla(race)) {
        return subcommander;
      }
      subcommander.race = race;
      var commander = races.commanderFor(rng, race);
      if (commander) {
        subcommander.commander = commander;
      }
      return subcommander;
    },

    // The two Sub Commanders the General Commander loadout grants. Each draws
    // from its own stream, so adding a draw to one cannot move the other.
    buildGeneralCommanderMinions: function (params) {
      var minionPool = params.minionPool || [];
      var gwoSettings = params.gwoSettings;
      var gwoAI = params.gwoAI;
      var gwoCard = params.gwoCard;
      var rng = params.rng;
      var minions = [];

      if (!minionPool.length) {
        return minions;
      }

      _.times(2, function (index) {
        var minionRng = rng ? rng.stream("minion", index) : undefined;
        var baseSubcommander = minionRng
          ? minionRng.pick(minionPool)
          : _.sample(minionPool);
        if (!baseSubcommander) {
          return;
        }

        var subcommander = _.cloneDeep(baseSubcommander);
        // Every reader gives a Sub Commander its own rate, so the card carries
        // no rate the template may hold.
        delete subcommander.econ_rate;
        helpers.applyPenchantToSubcommander(
          subcommander,
          gwoSettings,
          gwoAI,
          minionRng,
          params.race
        );
        helpers.applyRaceToSubcommander(
          subcommander,
          params.races,
          params.race,
          minionRng ? minionRng.stream("commander") : undefined
        );
        minions.push({
          id: "gwc_minion",
          minion: subcommander,
          unique: gwoCard.uniqueValue(minionRng),
        });
      });

      return minions;
    },
  };

  return helpers;
});
