define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], (
  races,
) => {
  const titansAiPath = "/pa/ai/";
  const subCommanderPath = "/pa/ai_subcommander/";
  const clusterPath = "/pa/ai_cluster/";
  const penchantPath = "/pa/ai_penchant/";
  const quellerPath = "/pa/ai_queller/";

  const sanitizeToken = (value) => {
    let token = String(value || "");
    token = token.replace(/^\.+/, "");
    token = token.replace(/[^A-Za-z0-9_-]+/g, "_");
    return _.trim(token, "_");
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

  const getAIPathDestination = (type, aiInUse, options) => {
    const settings = options || {};
    const isGuardians = !!settings.guardians;
    const aiMods = settings.aiMods || [];
    const scopeToken = settings.scopeToken;
    const smartSubcommanders = !!settings.smartSubcommanders;
    const race = settings.race;
    let basePath;

    if (type === "cluster") {
      basePath = clusterPath;
    } else if (aiInUse === "Queller") {
      basePath = getQuellerPath(type, smartSubcommanders);
    } else if (type === "subcommander" && !isGuardians && !_.isEmpty(aiMods)) {
      basePath = subCommanderPath;
    } else if (aiInUse === "Penchant") {
      basePath = penchantPath;
    } else {
      basePath = titansAiPath;
    }

    // A race's tree sits beside the brain's, under the same scope rules.
    return appendScope(races.aiRoot(race, basePath), scopeToken);
  };

  return {
    sanitizeToken,

    getScopeToken,

    getAIPathSource: function (type, aiInUse, smartSubcommanders) {
      switch (aiInUse) {
        case "Penchant":
          return penchantPath;
        case "Queller":
          return getQuellerPath(type, !!smartSubcommanders);
        default:
          return titansAiPath;
      }
    },

    getAIPathDestination,

    // A co-op viewer's subcommander tree. The hardcoded guardians:false, the raw
    // (unsanitised) player tag and the absence of any Cluster routing are all
    // deliberate - see ai-paths.md.
    getViewerSubcommanderPath: function (
      aiInUse,
      aiMods,
      smartSubcommanders,
      playerTag,
      race,
    ) {
      return getAIPathDestination("subcommander", aiInUse, {
        guardians: false,
        aiMods,
        smartSubcommanders,
        scopeToken: playerTag === ".player" ? undefined : playerTag,
        race,
      });
    },
  };
});
