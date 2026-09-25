// How a co-op AI player values a tech card, and what it does with a hand: by
// what the card observably does to its inventory, never by its id. Pure: the
// effect comes from gw_play/coop_ai_effects.js and the units from
// shared/coop_ai_units.js. The weights are tuned from the debug lines this
// module formats. See tech-cards.md, "How AI players judge a card".
define(function () {
  var WEIGHTS = {
    // A unit's worth by class, and by tier.
    classes: {
      Factory: 10,
      Titan: 10,
      Superweapon: 6,
      Combat: 6,
      Fabber: 4,
      Defense: 3,
      Metal: 2,
      Energy: 2,
      Storage: 1,
      Intel: 1,
      Teleporter: 1,
      Structure: 1,
      Commander: 0,
    },
    advanced: 1.3,
    // Each further unit of a cell is worth this much of the one before.
    decay: 0.6,
    // A unit the commander cannot reach, for now.
    unreachable: 0.25,
    // Per domain fielded, so opening one is worth it on its own.
    domain: 8,
    // A domain no teammate fields.
    teamDomain: 1.5,
    // A stat mod: its direction times the worth of the fielded units it
    // touches.
    modScale: 1,
    // The same, on the domain the AI fields most.
    focus: 1.2,
    // An add or a replace: known to change, not by how much.
    addStep: 0.25,
    otherOp: 0.25,
    // The first Sub Commander, and what each one held already leaves of it.
    minion: 12,
    minionDecay: 0.7,
    aiMod: 0.5,
    aiModCap: 3,
    // A slot's price rises as the bank fills.
    slotBase: 0.5,
    slotFull: 6,
    // A card whose effect shows only in battle, at a full deal chance.
    floor: 4,
    // Reroll while the best card is under this; it rises as the bank fills
    // and falls with each reroll spent.
    rerollBase: 4,
    rerollFull: 6,
    rerollStep: 3,
    // A card replaces a held one only when it is worth this much more.
    swapMargin: 3,
  };

  // Cost and delay grow worse as they grow.
  var INVERTED = /cost|cooldown|delay|build_time|_demand|consumption|reload/i;

  var key = function (value) {
    return JSON.stringify(value);
  };

  // `list` less `other`, one for one: a card adding a second copy of a mod the
  // inventory holds adds one.
  var minus = function (list, other) {
    var counts = {};
    _.forEach(other || [], function (item) {
      var k = key(item);
      counts[k] = (counts[k] || 0) + 1;
    });
    return _.filter(list || [], function (item) {
      var k = key(item);
      if (counts[k]) {
        counts[k] -= 1;
        return false;
      }
      return true;
    });
  };

  // What applying a card changed. before and after are saved inventories.
  var effectOf = function (before, after) {
    return {
      addedUnits: _.difference(_.uniq(after.units || []), before.units || []),
      removedUnits: _.difference(_.uniq(before.units || []), after.units || []),
      addedMods: minus(after.mods, before.mods),
      removedMods: minus(before.mods, after.mods),
      addedAiMods: minus(after.aiMods, before.aiMods).length,
      addedMinions: Math.max(
        0,
        (after.minions || []).length - (before.minions || []).length
      ),
      netSlots:
        (after.maxCards || 0) -
        (before.maxCards || 0) -
        ((after.cards || []).length - (before.cards || []).length),
    };
  };

  var unitWorth = function (cell) {
    var worth = _.has(WEIGHTS.classes, cell.cls)
      ? WEIGHTS.classes[cell.cls]
      : WEIGHTS.classes.Structure;
    return worth * (cell.tier === "Advanced" ? WEIGHTS.advanced : 1);
  };

  // The worth of a set of held units: a cell's units worth less the more of
  // them there are, a unit the commander cannot reach a quarter, a domain no
  // teammate fields more, plus a bonus per domain fielded. context: lookup,
  // commander, teamDomains.
  var setValue = function (units, context) {
    var lookup = context.lookup;
    var reached = lookup.reachable(units, context.commander);
    var cells = {};
    var domains = {};
    var total = 0;

    _.forEach(_.uniq(units).sort(), function (unit) {
      var cell = lookup.classOf(unit);
      if (cell) {
        cells[cell.key] = cells[cell.key] || { cell: cell, units: [] };
        cells[cell.key].units.push(unit);
      }
    });

    _.forEach(cells, function (entry) {
      var worth = unitWorth(entry.cell);
      var team = _.includes(context.teamDomains || [], entry.cell.domain)
        ? 1
        : WEIGHTS.teamDomain;
      var ordered = _.sortBy(entry.units, function (unit) {
        return _.includes(reached, unit) ? 0 : 1;
      });

      _.forEach(ordered, function (unit, index) {
        var live = _.includes(reached, unit);
        total +=
          worth *
          Math.pow(WEIGHTS.decay, index) *
          (live ? 1 : WEIGHTS.unreachable) *
          team;
        if (live && worth > 0) {
          domains[entry.cell.domain] = true;
        }
      });
    });

    return total + WEIGHTS.domain * _.keys(domains).length;
  };

  var sign = function (value) {
    if (value > 0) {
      return 1;
    }
    return value < 0 ? -1 : 0;
  };

  var modDirection = function (mod) {
    var value = mod.value;
    var direction = WEIGHTS.otherOp;

    if (mod.op === "multiply" && _.isNumber(value)) {
      direction = value - 1;
    } else if (mod.op === "add" && _.isNumber(value)) {
      direction = WEIGHTS.addStep * sign(value);
    }
    if (
      (mod.op === "multiply" || mod.op === "add") &&
      INVERTED.test(mod.path || "")
    ) {
      direction = -direction;
    }
    return Math.max(-1, Math.min(2, direction));
  };

  // The domain whose fielded units are worth most, for the focus bonus.
  var focusDomain = function (fielded, lookup) {
    var byDomain = {};
    _.forEach(fielded, function (unit) {
      var cell = lookup.classOf(unit);
      if (cell && cell.cls !== "Commander") {
        byDomain[cell.domain] = (byDomain[cell.domain] || 0) + unitWorth(cell);
      }
    });
    var best;
    _.forEach(_.keys(byDomain).sort(), function (domain) {
      if (!best || byDomain[domain] > byDomain[best]) {
        best = domain;
      }
    });
    return best;
  };

  // Stat mods, one file at a time: the mean direction of the mods on the file,
  // times the worth of the fielded units that own it, less for each copy of
  // those mods the inventory holds already. Nothing for a file no fielded unit
  // owns.
  var modsValue = function (mods, context, fielded, held) {
    var lookup = context.lookup;
    var focus = focusDomain(fielded, lookup);

    return _(mods)
      .groupBy("file")
      .map(function (fileMods, file) {
        var owners = _.intersection(lookup.ownersOf(file), fielded);
        if (!owners.length) {
          return 0;
        }
        var cells = _.compact(_.map(owners, lookup.classOf));
        var worth = _(cells).map(unitWorth).sum();
        var direction = _(fileMods).map(modDirection).sum() / fileMods.length;
        var paths = _.pluck(fileMods, "path");
        var stacked = _.filter(held, function (mod) {
          return mod.file === file && _.includes(paths, mod.path);
        }).length;
        var onFocus = _.some(cells, { domain: focus }) ? WEIGHTS.focus : 1;
        return (
          (direction * worth * WEIGHTS.modScale * onFocus) /
          (1 + stacked / fileMods.length)
        );
      })
      .sum();
  };

  // The classes a player fields a domain with.
  var FIELDING = ["Factory", "Combat", "Fabber", "Titan"];

  // Every domain the given players field between them, for the team factor.
  // players: { units, commander } each.
  var teamDomains = function (players, lookup) {
    var domains = [];
    _.forEach(players, function (player) {
      _.forEach(
        lookup.reachable(player.units || [], player.commander),
        function (unit) {
          var cell = lookup.classOf(unit);
          if (cell && _.includes(FIELDING, cell.cls)) {
            domains.push(cell.domain);
          }
        }
      );
    });
    return _.uniq(domains).sort();
  };

  var round = function (value) {
    return Math.round(value * 10) / 10;
  };

  // A card's value, by part. before and after are the saved inventories either
  // side of the card; context: lookup, commander, teamDomains, and for a card
  // with no effect to see, namesUnits (it registers units in gwoCardsToUnits)
  // and chance (its own deal() weight for this inventory).
  var scoreCard = function (before, after, context) {
    var effect = effectOf(before, after);
    var fullness = before.maxCards ? before.cards.length / before.maxCards : 1;
    var fielded = context.lookup.reachable(after.units, context.commander);
    var parts = {
      unlock: setValue(after.units, context) - setValue(before.units, context),
      mods:
        modsValue(effect.addedMods, context, fielded, before.mods) -
        modsValue(
          effect.removedMods,
          context,
          context.lookup.reachable(before.units, context.commander),
          after.mods
        ),
      minions: 0,
      aiMods: Math.min(WEIGHTS.aiModCap, effect.addedAiMods) * WEIGHTS.aiMod,
      slots: effect.netSlots * (WEIGHTS.slotBase + WEIGHTS.slotFull * fullness),
      floor: 0,
    };

    for (var i = 0; i < effect.addedMinions; i++) {
      parts.minions +=
        WEIGHTS.minion *
        Math.pow(WEIGHTS.minionDecay, (before.minions || []).length + i);
    }

    var seen =
      parts.unlock !== 0 ||
      parts.mods !== 0 ||
      parts.minions !== 0 ||
      parts.aiMods !== 0 ||
      effect.netSlots !== -1;
    if (!seen && !context.namesUnits) {
      // A function when finding it costs a deal() call.
      var chance = _.isFunction(context.chance)
        ? context.chance()
        : context.chance;
      parts.floor =
        (WEIGHTS.floor * Math.min(Math.max(chance || 0, 0), 100)) / 100;
    }

    parts.total = round(
      parts.unlock +
        parts.mods +
        parts.minions +
        parts.aiMods +
        parts.slots +
        parts.floor
    );
    _.forEach(
      ["unlock", "mods", "minions", "aiMods", "slots", "floor"],
      function (part) {
        parts[part] = round(parts[part]);
      }
    );
    return parts;
  };

  var rerollThreshold = function (fullness, rerollsUsed) {
    return round(
      WEIGHTS.rerollBase +
        WEIGHTS.rerollFull * fullness -
        WEIGHTS.rerollStep * rerollsUsed
    );
  };

  // The best of scored cards, ties broken by the stream so the same deal
  // always settles the same way.
  var best = function (scored, rng) {
    var top = _.max(_.pluck(scored, "total"));
    var tied = _.filter(scored, { total: top });
    return rng ? rng.pick(tied) : tied[0];
  };

  // What to do with a hand. params: scored ({ index, id, total, loadout }),
  // rerollsLeft, rerollsUsed, fullness, roomFor(card) (whether the bank takes
  // it without a deletion), held ({ index, id, total }, removable cards only),
  // rng. Returns { action, index, deleteIndex, best, threshold, reason }.
  var decide = function (params) {
    var scored = params.scored || [];

    if (!scored.length) {
      return { action: "decline", reason: "no cards" };
    }
    // A loadout is banked, never held, and an AI never banks.
    if (_.some(scored, "loadout")) {
      return { action: "decline", reason: "loadout" };
    }

    var choice = best(scored, params.rng);
    var threshold = rerollThreshold(params.fullness, params.rerollsUsed);

    if (params.rerollsLeft > 0 && choice.total < threshold) {
      return {
        action: "reroll",
        best: choice.total,
        threshold: threshold,
      };
    }

    if (choice.total <= 0) {
      return { action: "decline", reason: "nothing worth a slot" };
    }

    if (params.roomFor(choice)) {
      return { action: "take", index: choice.index, best: choice.total };
    }

    var weakest = _.first(_.sortBy(params.held || [], "total"));
    if (weakest && choice.total > weakest.total + WEIGHTS.swapMargin) {
      return {
        action: "swap",
        index: choice.index,
        deleteIndex: weakest.index,
        deleteId: weakest.id,
        best: choice.total,
      };
    }

    return { action: "decline", reason: "bank full" };
  };

  var formatParts = function (parts) {
    return (
      "unlock " +
      parts.unlock +
      " mods " +
      parts.mods +
      " minions " +
      parts.minions +
      " aiMods " +
      parts.aiMods +
      " slots " +
      parts.slots +
      " floor " +
      parts.floor
    );
  };

  var formatAction = function (decision, scored) {
    var chosen = _.find(scored, { index: decision.index });
    switch (decision.action) {
      case "reroll":
        return (
          "reroll (best " +
          decision.best +
          " < threshold " +
          decision.threshold +
          ")"
        );
      case "take":
        return "took " + chosen.id;
      case "swap":
        return "deleted " + decision.deleteId + " took " + chosen.id;
      default:
        return "declined (" + decision.reason + ")";
    }
  };

  // One log line per hand offered, for tuning the weights: everything the AI
  // was offered, how it scored each card, and what it did.
  var describeHand = function (params) {
    return (
      "[GW COOP AI] " +
      params.name +
      " deal=" +
      params.deal +
      " star=" +
      params.star +
      " hand=" +
      params.scored.length +
      " via=" +
      params.via +
      " offered: " +
      _.map(params.scored, function (card) {
        return card.id + "=" + card.total + " (" + formatParts(card) + ")";
      }).join(", ") +
      " -> " +
      formatAction(params.decision, params.scored)
    );
  };

  // The same for the starting loadout: every candidate and its score.
  var describeLoadouts = function (params) {
    return (
      "[GW COOP AI] " +
      params.name +
      " loadout via=" +
      params.via +
      " candidates: " +
      _.map(params.scored, function (card) {
        return card.id + "=" + card.total + " (" + formatParts(card) + ")";
      }).join(", ") +
      " -> " +
      (params.chosen ? "chose " + params.chosen : "none")
    );
  };

  return {
    WEIGHTS: WEIGHTS,
    effectOf: effectOf,
    unitWorth: unitWorth,
    setValue: setValue,
    modDirection: modDirection,
    focusDomain: focusDomain,
    modsValue: modsValue,
    teamDomains: teamDomains,
    scoreCard: scoreCard,
    rerollThreshold: rerollThreshold,
    best: best,
    decide: decide,
    describeHand: describeHand,
    describeLoadouts: describeLoadouts,
  };
});
