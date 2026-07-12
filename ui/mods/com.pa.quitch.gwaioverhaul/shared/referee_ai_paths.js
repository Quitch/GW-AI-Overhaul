var titansAiPath = "/pa/ai/";
var subCommanderPath = "/pa/ai_subcommander/";
var clusterPath = "/pa/ai_cluster/";
var penchantPath = "/pa/ai_penchant/";
var quellerPath = "/pa/ai_queller/";

var sanitizeToken = function (value) {
  var token = String(value || "");
  token = token.replace(/^\.+/, "");
  token = token.replace(/[^A-Za-z0-9_-]+/g, "_");
  token = token.replace(/^_+/, "");
  while (token.length && _.endsWith(token, "_")) {
    token = token.slice(0, -1);
  }
  return token;
};

var getScopeToken = function (identity, fallbackToken) {
  var token = identity;

  if (token && _.isObject(token)) {
    token =
      token.playerTag ||
      token.specTag ||
      token.client_name ||
      token.playerName ||
      token.name ||
      token.id ||
      token.client_id ||
      token.role;
  }

  if (!_.isString(token) || !token.length) {
    token = fallbackToken;
  }

  token = sanitizeToken(token);

  if (!token.length) {
    token = sanitizeToken(fallbackToken);
  }

  return token.length ? token : "player";
};

var appendScope = function (basePath, scopeToken) {
  if (!scopeToken) {
    return basePath;
  }
  return basePath + "player_" + scopeToken + "/";
};

var getQuellerPath = function (type, smartSubcommanders) {
  if (type === "all") {
    return quellerPath;
  } else if (type === "enemy") {
    return quellerPath + "q_uber/";
  } else if (type === "subcommander" && smartSubcommanders) {
    return quellerPath + "q_silver/";
  }
  return quellerPath + "q_bronze/";
};

define(function () {
  return {
    sanitizeToken: sanitizeToken,

    getScopeToken: getScopeToken,

    getAIPathSource: function (type, aiInUse) {
      switch (aiInUse) {
        case "Penchant":
          return penchantPath;
        case "Queller":
          return getQuellerPath(type, false);
        default:
          return titansAiPath;
      }
    },

    getAIPathDestination: function (type, aiInUse, options) {
      var settings = options || {};
      var isGuardians = !!settings.guardians;
      var aiMods = settings.aiMods || [];
      var scopeToken = settings.scopeToken;
      var smartSubcommanders = !!settings.smartSubcommanders;
      var basePath;

      if (type === "cluster") {
        basePath = clusterPath;
      } else if (aiInUse === "Queller") {
        basePath = getQuellerPath(type, smartSubcommanders);
      } else if (
        type === "subcommander" &&
        !isGuardians &&
        !_.isEmpty(aiMods)
      ) {
        basePath = subCommanderPath;
      } else if (aiInUse === "Penchant") {
        basePath = penchantPath;
      } else {
        basePath = titansAiPath;
      }

      return appendScope(basePath, scopeToken);
    },

    getPlayerScopedPath: function (basePath, identity, fallbackToken) {
      return appendScope(basePath, getScopeToken(identity, fallbackToken));
    },

    getPlayerScopedUnitMapPath: function (
      basePath,
      identity,
      fallbackToken,
      titans
    ) {
      var append = titans ? "_x1.json" : ".json";
      return (
        this.getPlayerScopedPath(basePath, identity, fallbackToken) +
        "unit_maps/ai_unit_map" +
        append
      );
    },
  };
});
