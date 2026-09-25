// Co-op AI players: which records are AIs, what each takes in the lobby, and
// what each brings to a battle. The measured half of gw_play/coop_ai.js. See
// coop.md, "AI players".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
], function (gwoAI, gwoRaces, perPlayerTech, unitCells) {
  var ID_PREFIX = "gwo_ai_";
  var SHARED_SCOPE = "coopai";
  // Stock's gwCampaignMaxClientsLimit before the server reports its own.
  var SLOT_LIMIT = 12;

  // The display word for each personality template an AI can be given.
  var CHARACTERS = {
    uber: "!LOC:Uber",
    absurd: "!LOC:Absurd",
  };

  // A record is an AI's iff it carries gwaioAi. It has no playerName, so no
  // human lookup, by id or by name, can land on it.
  var isAiRecord = function (record) {
    return !!record && _.isPlainObject(record.gwaioAi);
  };

  // Slot order is creation order: serials only grow.
  var aiRecords = function (records) {
    return _.sortBy(_.filter(records || [], isAiRecord), "gwaioAi.serial");
  };

  // The next serial and the id it gives. A serial is never reused, so an AI
  // added after a kick draws its own name and commander.
  var nextAiIdentity = function (gwaio) {
    var last = gwaio && _.isNumber(gwaio.coopAiSerial) ? gwaio.coopAiSerial : 0;
    var serial = last + 1;
    return { serial: serial, playerId: ID_PREFIX + serial };
  };

  // Under shared tech every AI fields the host's units; under per-player tech
  // each takes the next player tag after the humans'.
  var aiTag = function (index, perPlayer, humanCount) {
    return perPlayer
      ? perPlayerTech.getPlayerTagGivenIndex(humanCount + index)
      : ".player";
  };

  // One tree for every AI under shared tech, where they share brain, race, AI
  // mods and tag; one each under per-player tech.
  var scopeTokenFor = function (record, perPlayer) {
    return perPlayer
      ? SHARED_SCOPE + "_" + record.gwaioAi.serial
      : SHARED_SCOPE;
  };

  var personalityIdFor = function (brain) {
    return brain === "Queller" ? "uber" : "absurd";
  };

  // Continues the players' colour sequence, so no human's colour moves when an
  // AI joins. resolve is GWCoopPlayerColors.resolvePlayerColorPairs.
  var colourPairs = function (params) {
    if (!params.aiCount) {
      return [];
    }
    return params
      .resolve(
        params.humanArmies + params.aiCount,
        params.faction,
        params.factionColour
      )
      .slice(params.humanArmies);
  };

  // The human slots a lobby may hold beside its AIs. A lock's limit comes from
  // the wrapped savedCoopPlayers, which already leaves the AIs out.
  var humanCapacity = function (limit, locked, aiCount) {
    var cap = _.isFinite(limit) && limit >= 1 ? limit : SLOT_LIMIT;
    return locked ? cap : cap - aiCount;
  };

  var roomForSlot = function (maxClients, limit, locked, aiCount) {
    return maxClients < humanCapacity(limit, locked, aiCount);
  };

  // The AIs that hold one of the war's own seats.
  var seatedAis = function (records) {
    return _.filter(aiRecords(records), function (record) {
      return !record.gwaioAi.extraSeat;
    });
  };

  // Whether an AI added now fills a seat beyond those the war was made with:
  // one the host opened with "+". maxClients is the count before the add. An
  // AI in such a seat holds none of the war's, so a seat a player left is
  // still one of them.
  var takesExtraSeat = function (maxClients, records, warSeats) {
    return maxClients + seatedAis(records).length > warSeats;
  };

  // The human seats a new session opens with: the war's own, less those its
  // AIs hold. An AI in a seat the host opened for it takes none of them.
  var humanSeats = function (warSeats, records) {
    return Math.max(1, warSeats - seatedAis(records).length);
  };

  // Every name a new AI must not take: the connected players', the records'
  // players', the other AIs', the host's, and the stock "Player".
  var takenNames = function (connected, records, hostName) {
    return _.compact(
      _.pluck(connected, "name")
        .concat(_.pluck(records, "playerName"))
        .concat(_.map(aiRecords(records), "gwaioAi.name"))
        .concat(["Player", hostName])
    );
  };

  // Every commander already on the field: the host's, its Sub Commanders',
  // and every co-op player's.
  var fieldedCommanders = function (hostCommander, records, minions) {
    return _.compact(
      [hostCommander]
        .concat(_.pluck(records, "commander"))
        .concat(_.pluck(minions, "commander"))
    );
  };

  // The human armies a battle fields, as stock's gwCoopPlayerColors counts
  // them: one shared army, else one per connected client.
  var humanArmies = function (sharedArmy, connectedCount) {
    return sharedArmy ? 1 : Math.max(1, connectedCount);
  };

  // An AI's row in the slot list, with every field a stock row carries, so the
  // stock markup binds it unchanged. canKick is false: GWO's own Kick removes
  // an AI.
  var slotRows = function (records, firstIndex, loadingTooltip) {
    return _.map(records, function (record, index) {
      return {
        index: firstIndex + index,
        id: record.playerId,
        name: record.gwaioAi.name,
        host: false,
        loading: false,
        loadingStatus: "",
        loadingTooltip: loadingTooltip,
        empty: false,
        showInventory: false,
        inventoryAvailable: false,
        inventoryTooltip: "!LOC:Waiting for loadout",
        canRemove: false,
        canKick: false,
        gwoAi: true,
      };
    });
  };

  // The skirmish lobby's AI names: every quoted string in the source of
  // server-script/ai_names_table.js, first occurrence kept.
  var parseAiNames = function (text) {
    var source = String(text || "");
    var names = [];
    var pattern = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
    var match = pattern.exec(source);

    while (match) {
      var name = _.trim(
        (match[1] === undefined ? match[2] : match[1]).replace(/\\(.)/g, "$1")
      );
      if (name.length && !_.includes(names, name)) {
        names.push(name);
      }
      match = pattern.exec(source);
    }

    return names;
  };

  // A name no player or AI in the war already goes by. Case is ignored: the
  // table holds "Quitch", and a player may be "quitch".
  var pickAiName = function (names, taken, rng) {
    var used = _.map(taken || [], function (name) {
      return String(name).toLowerCase();
    });
    var free = _.filter(names || [], function (name) {
      return !_.includes(used, name.toLowerCase());
    });
    return rng ? rng.pick(free) : _.sample(free);
  };

  var BASE_COMMANDER =
    "/pa/units/commanders/base_commander/base_commander.json";

  // Every spec on each path's base_spec chain, by path. A spec that fails to
  // load ends its chain.
  var loadChains = function (paths, fetch) {
    var specs = {};
    var visit = function (path) {
      if (!_.isString(path) || _.has(specs, path)) {
        return Promise.resolve();
      }
      specs[path] = undefined;
      return new Promise(function (resolve) {
        resolve(fetch(path));
      }).then(function (spec) {
        specs[path] = spec;
        return visit(spec && spec.base_spec);
      }, _.noop);
    };
    return Promise.all(_.map(paths, visit)).then(function () {
      return specs;
    });
  };

  // The commanders an MLA AI can field: those that build what MLA's base
  // commander builds. See coop.md, "AI players".
  var mlaCommanders = function (commanders, fetch) {
    return loadChains([BASE_COMMANDER].concat(commanders || []), fetch).then(
      function (specs) {
        var builds = function (path) {
          return unitCells.chainValue(path, specs, "buildable_types");
        };
        var mla = builds(BASE_COMMANDER);
        return _.filter(commanders, function (commander) {
          return !!mla && builds(commander) === mla;
        });
      }
    );
  };

  // A race's own commanders for a race AI, the host's owned MLA ones for MLA,
  // less those already fielded; the host's own when none is left.
  var pickAiCommander = function (params) {
    var raceCommanders = params.raceCommanders || [];
    var pool = raceCommanders.length ? raceCommanders : params.owned || [];
    var free = _.difference(pool, params.fielded || []);
    var chosen = params.rng ? params.rng.pick(free) : _.sample(free);
    return chosen || params.fallback;
  };

  // A new AI's record. It carries no playerName and no inventory: under shared
  // tech it fields the host's. params: identity (nextAiIdentity's), rng (the
  // AI's coopAiPlayerRng, or undefined in a war without a seed), race, names,
  // taken (every name already in the war), owned (the host's MLA commanders),
  // fielded, hostCommander, now.
  var buildAiRecord = function (params) {
    var identity = params.identity;
    var rng = params.rng;
    var race = params.race;
    var brain = gwoAI.aiInUse("coop", race);
    var descriptor = gwoRaces.isMla(race) ? undefined : gwoRaces.byId(race);
    var gwaioAi = {
      serial: identity.serial,
      name:
        pickAiName(params.names, params.taken, rng && rng.stream("name")) ||
        "AI " + identity.serial,
      personalityId: personalityIdFor(brain),
      createdAt: params.now,
    };

    if (brain === "Penchant") {
      gwaioAi.penchantName = gwoAI.penchants(
        rng && rng.stream("penchant")
      ).penchantName;
    }

    return {
      playerId: identity.playerId,
      commander: pickAiCommander({
        raceCommanders: descriptor
          ? _.pluck(descriptor.commanders, "spec")
          : [],
        owned: params.owned,
        fielded: params.fielded,
        fallback: params.hostCommander,
        rng: rng && rng.stream("commander"),
      }),
      updatedAt: params.now,
      gwaioAi: gwaioAi,
    };
  };

  // The AI players of one battle, in slot order. None outside an active
  // session: an AI sits out a war played without one. Under per-player tech
  // none either, until that support lands.
  var launchAis = function (params) {
    if (!params.active || params.perPlayerTech) {
      return [];
    }

    var records = aiRecords(params.records);
    var colours = params.colours(records.length);

    return _.map(records, function (record, index) {
      var race = params.hostRace;
      var inventory = params.hostInventory;
      var scopeToken = scopeTokenFor(record, false);
      var personalityId = record.gwaioAi.personalityId;

      return {
        id: record.playerId,
        serial: record.gwaioAi.serial,
        name: record.gwaioAi.name,
        slot: index,
        tag: aiTag(index, false, params.humanCount),
        scopeToken: scopeToken,
        race: race,
        brain: gwoAI.aiInUse("coop", race),
        source: gwoAI.getAIPathSource("coop", race, inventory),
        path: gwoAI.getCoopAiPath(race, scopeToken),
        commander: record.commander,
        colour: colours[index],
        personalityId: personalityId,
        penchantName: record.gwaioAi.penchantName,
        character: CHARACTERS[personalityId],
        inventory: inventory,
      };
    });
  };

  // The war panel's line for each AI, after the humans': its name, battle
  // colour and race. Under shared tech every AI fields the host's race.
  var panelEntries = function (records, colours, race) {
    return _.map(records, function (record, index) {
      return {
        name: record.gwaioAi.name,
        colour: colours[index],
        race: gwoRaces.raceOf({ race: race }),
      };
    });
  };

  return {
    ID_PREFIX: ID_PREFIX,
    SHARED_SCOPE: SHARED_SCOPE,
    CHARACTERS: CHARACTERS,
    isAiRecord: isAiRecord,
    aiRecords: aiRecords,
    nextAiIdentity: nextAiIdentity,
    aiTag: aiTag,
    scopeTokenFor: scopeTokenFor,
    personalityIdFor: personalityIdFor,
    colourPairs: colourPairs,
    humanCapacity: humanCapacity,
    roomForSlot: roomForSlot,
    takesExtraSeat: takesExtraSeat,
    humanSeats: humanSeats,
    takenNames: takenNames,
    fieldedCommanders: fieldedCommanders,
    humanArmies: humanArmies,
    slotRows: slotRows,
    parseAiNames: parseAiNames,
    pickAiName: pickAiName,
    mlaCommanders: mlaCommanders,
    pickAiCommander: pickAiCommander,
    buildAiRecord: buildAiRecord,
    launchAis: launchAis,
    panelEntries: panelEntries,
  };
});
