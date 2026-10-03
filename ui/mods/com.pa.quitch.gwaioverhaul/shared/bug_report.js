// The Report a Galactic War Bug form's prefill: field values for
// .github/ISSUE_TEMPLATE/bug_report_game.yml, in English, from what a scene
// gathered, and the same values as one log entry. shared/report_bug.js is the
// scene glue.
define(function () {
  var FORM_URL =
    "https://github.com/Quitch/GW-AI-Overhaul/issues/new?template=bug_report_game.yml";
  // GitHub prefilled a 7,478-character URL in full.
  var URL_BUDGET = 7500;
  var TRUNCATED = "(list truncated)";
  var FIELDS = ["scene", "war", "coop", "mods", "language"];
  var CUT_ORDER = ["mods", "coop", "war"];
  var LOG_HEADINGS = {
    scene: "Where it happened",
    war: "GWO info",
    coop: "Co-op",
    mods: "Mods",
    language: "Game language",
  };
  var SCENES = {
    gw_start: "War setup",
    gw_play: "Galaxy map",
    live_game: "During a battle",
  };

  var english = function (text) {
    return _.isString(text) && _.startsWith(text, "!LOC:")
      ? text.slice("!LOC:".length)
      : text;
  };

  var yesNo = function (value) {
    return value ? "Yes" : "No";
  };

  var line = function (label, value) {
    if (_.isUndefined(value) || _.isNull(value) || value === "") {
      return undefined;
    }
    return "- " + label + ": " + value;
  };

  var sceneOf = function (pathname) {
    var scene = _.find(_.keys(SCENES), function (name) {
      return _.includes(pathname || "", "/" + name + "/");
    });
    return scene ? SCENES[scene] : undefined;
  };

  var optionKeys = function (gwoSettings, hardcore) {
    var settings = gwoSettings || {};
    var optionDefs = [
      [settings.factionScaling, "!LOC:Faction Scaling"],
      [settings.systemScaling, "!LOC:System scaling"],
      [settings.simpleSystems, "!LOC:Easy Systems"],
      [settings.largePlanets, "!LOC:Large Planets"],
      [settings.staticTech, "!LOC:Static tech"],
      [settings.races && settings.races.unique, "!LOC:Unique races"],
      [settings.cheatsUsed, "!LOC:dev mode"],
      [hardcore, "!LOC:Hardcore mode"],
      [settings.tougherCommanders, "!LOC:Tougher commanders"], // deprecated - pre-v5.27.0 support only
    ];
    return _.map(_.filter(optionDefs, 0), 1);
  };

  var deckName = function (deckId, registeredName) {
    if (registeredName) {
      return english(registeredName);
    }
    if (!deckId || deckId === "Expanded") {
      return "Galactic War Overhaul";
    }
    return deckId;
  };

  var aiByRaceText = function (aiByRace) {
    var raceIds = _.keys(aiByRace || {}).sort();
    if (!raceIds.length) {
      return undefined;
    }
    return _.map(raceIds, function (raceId) {
      var row = aiByRace[raceId] || {};
      return (
        raceId +
        " (enemy " +
        row.enemy +
        ", ally " +
        row.ally +
        ", co-op " +
        row.coop +
        ")"
      );
    }).join(", ");
  };

  var winConditions = function (options) {
    var conditions = [];
    if (!options) {
      return undefined;
    }
    // The server's sudden death check ignores eradication_mode.
    if (options.sudden_death_mode) {
      conditions.push("Sudden Death");
    } else if (options.eradication_mode) {
      var also = _.compact([
        options.eradication_mode_sub_commanders && "Sub Commanders",
        options.eradication_mode_factories && "factories",
        options.eradication_mode_fabricators && "fabricators",
      ]);
      conditions.push(
        "Eradication" + (also.length ? " (" + also.join(", ") + ")" : "")
      );
    }
    if (options.bounty_mode) {
      conditions.push(
        "Bounties" +
          (_.isNumber(options.bounty_value) ? " x" + options.bounty_value : "")
      );
    }
    return conditions.length ? conditions.join(", ") : "Standard";
  };

  var warLines = function (input) {
    var running = line("GWO running", input.running);
    if (input.stale) {
      return _.compact([running, "- War copy on this viewer is out of date"]);
    }

    var settings = input.settings;
    if (!settings) {
      return _.compact([running]);
    }
    var options = _.map(optionKeys(settings, input.hardcore), english);
    var battle = input.battle || {};

    return _.compact([
      running,
      line("War created with GWO", settings.version),
      line("War", input.warName),
      line("Seed", settings.seed),
      line("Difficulty", english(settings.difficulty)),
      line("Size", english(settings.galaxySize)),
      line("Opponent AI", settings.ai),
      line("Ally AI", settings.aiAlly || settings.ai),
      line("Co-op AI", settings.aiCoop || settings.ai),
      line("AI by race", aiByRaceText(settings.aiByRace)),
      line("Deck", deckName(settings.techCardDeck, input.deckName)),
      line("Options", options.join(", ")),
      line("Faction", english(input.factionName)),
      line("Race", english(input.raceName)),
      line("Commander", input.commander),
      line("Loadout", input.loadout),
      line("System", battle.system),
      line("Enemy", battle.enemy),
      line("Win conditions", winConditions(battle.gameOptions)),
    ]);
  };

  var coopLines = function (coop) {
    if (!coop) {
      return [];
    }
    var inCampaign = coop.role === "host" || coop.role === "viewer";
    if (!inCampaign) {
      return coop.createdFor > 1
        ? [line("Players the war was created for", coop.createdFor)]
        : [];
    }
    var players = coop.playersNow;
    if (!_.isUndefined(players) && coop.coopAiCount > 0) {
      players += " (" + coop.coopAiCount + " co-op AI)";
    }
    var slots = coop.maxClients;
    if (!_.isUndefined(slots) && !_.isUndefined(coop.slotsLocked)) {
      slots += coop.slotsLocked ? " (locked)" : " (unlocked)";
    }

    return _.compact([
      line("Role", coop.role),
      line("Players now", players),
      line("Players the war was created for", coop.createdFor),
      line(
        "Shared Armies",
        _.isUndefined(coop.sharedArmies) ? undefined : yesNo(coop.sharedArmies)
      ),
      line(
        "Per-Player Tech",
        _.isUndefined(coop.perPlayerTech)
          ? undefined
          : yesNo(coop.perPlayerTech)
      ),
      line("Player slots", slots),
    ]);
  };

  var modText = function (mod) {
    var name = mod.display_name || mod.displayName || mod.identifier;
    return (
      _.compact([name, mod.version]).join(" ") + " (" + mod.identifier + ")"
    );
  };

  var modList = function (label, mods) {
    if (_.isEmpty(mods)) {
      return [];
    }
    return [label + ":"].concat(
      _.map(mods, function (mod) {
        return "  - " + modText(mod);
      })
    );
  };

  // A war's race, add-on and biome mods, each marked when this client cannot
  // see it mounted. With the server mod list unreadable nothing is marked.
  var warModList = function (label, mods, mounted) {
    if (_.isEmpty(mods)) {
      return [];
    }
    return [label + ":"].concat(
      _.map(mods, function (mod) {
        var missing = mounted && !_.includes(mounted, mod.identifier);
        return "  - " + modText(mod) + (missing ? " - not mounted" : "");
      })
    );
  };

  var modLines = function (input) {
    var server = input.server || {};
    var settings = input.settings || {};
    var races = settings.races || {};
    var known = server.known !== false;
    var mounted = known
      ? _.map((server.mods || []).concat(input.client || []), "identifier")
      : undefined;
    var serverLines = server.gwsm
      ? modList("Server mods (GW Server Mods)", server.mods)
      : ["Server mods: GW Server Mods is not running"];

    if (_.isUndefined(input.client) && !input.server) {
      return [];
    }

    return []
      .concat(modList("Client mods", input.client))
      .concat(input.server ? serverLines : [])
      .concat(modList("Host's server mods", input.hostServer))
      .concat(warModList("War's race mods", races.mods, mounted))
      .concat(warModList("War's add-on mods", races.addons, mounted))
      .concat(warModList("War's map pack mods", settings.biomeMods, mounted));
  };

  var fields = function (scene, input) {
    var data = input || {};
    return {
      scene: scene,
      war: warLines(data).join("\n"),
      coop: coopLines(data.coop).join("\n"),
      mods: modLines(data).join("\n"),
      language: data.language,
    };
  };

  var urlOf = function (values) {
    return (
      FORM_URL +
      _.map(
        _.filter(FIELDS, function (field) {
          return !!values[field];
        }),
        function (field) {
          return "&" + field + "=" + encodeURIComponent(values[field]);
        }
      ).join("")
    );
  };

  // Over budget, the mod list loses its last lines first, then co-op, then
  // the war, and a cut field ends with TRUNCATED.
  var buildUrl = function (values) {
    var cut = _.clone(values);
    var url = urlOf(cut);

    _.forEach(CUT_ORDER, function (field) {
      var lines = cut[field] ? cut[field].split("\n") : [];
      while (url.length > URL_BUDGET && lines.length) {
        lines.pop();
        cut[field] = lines.concat(TRUNCATED).join("\n");
        url = urlOf(cut);
      }
    });
    return url;
  };

  // One string: PA's log keeps only the first console argument.
  var logText = function (values, reason) {
    var data = values || {};
    var filled = _.filter(FIELDS, function (field) {
      return !!data[field];
    });

    return ["[GWO] bug report context" + (reason ? ": " + reason : "")]
      .concat(
        _.map(filled, function (field) {
          var separator = _.includes(data[field], "\n") ? ":\n" : ": ";
          return LOG_HEADINGS[field] + separator + data[field];
        })
      )
      .join("\n");
  };

  return {
    URL_BUDGET: URL_BUDGET,
    english: english,
    sceneOf: sceneOf,
    optionKeys: optionKeys,
    deckName: deckName,
    winConditions: winConditions,
    warLines: warLines,
    coopLines: coopLines,
    modLines: modLines,
    fields: fields,
    buildUrl: buildUrl,
    logText: logText,
  };
});
