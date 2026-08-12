define(() => {
  const titansAiPath = "/pa/ai/";
  const subCommanderPath = "/pa/ai_subcommander/";
  const clusterPath = "/pa/ai_cluster/";
  const penchantPath = "/pa/ai_penchant/";
  const quellerPath = "/pa/ai_queller/";

  const sanitizeToken = (value) => {
    let token = String(value || "");
    token = token.replace(/^\.+/, "");
    token = token.replace(/[^A-Za-z0-9_-]+/g, "_");
    token = token.replace(/^_+/, "");
    while (token.length && _.endsWith(token, "_")) {
      token = token.slice(0, -1);
    }
    return token;
  };

  const getScopeToken = (identity, fallbackToken) => {
    let token = identity;

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

  const appendScope = (basePath, scopeToken) => {
    if (!scopeToken) {
      return basePath;
    }
    return `${basePath}player_${scopeToken}/`;
  };

  const getPlayerScopedPath = (basePath, identity, fallbackToken) =>
    appendScope(basePath, getScopeToken(identity, fallbackToken));

  const getQuellerPath = (type, smartSubcommanders) => {
    if (type === "all") {
      return quellerPath;
    } else if (type === "enemy") {
      return `${quellerPath}q_uber/`;
    } else if (type === "subcommander" && smartSubcommanders) {
      return `${quellerPath}q_silver/`;
    }
    return `${quellerPath}q_bronze/`;
  };

  return {
    sanitizeToken,

    getScopeToken,

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
      const settings = options || {};
      const isGuardians = !!settings.guardians;
      const aiMods = settings.aiMods || [];
      const scopeToken = settings.scopeToken;
      const smartSubcommanders = !!settings.smartSubcommanders;
      let basePath;

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

    getPlayerScopedUnitMapPath: function (
      basePath,
      identity,
      fallbackToken,
      titans,
    ) {
      const append = titans ? "_x1.json" : ".json";
      return `${getPlayerScopedPath(basePath, identity, fallbackToken)}unit_maps/ai_unit_map${append}`;
    },
  };
});
