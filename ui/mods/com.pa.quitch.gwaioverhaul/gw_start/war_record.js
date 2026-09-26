// The war settings stamped onto originSystem.gwaio for the gw_play scene to
// read.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
], function (gwoBrainTable, gwoBiomes, gwoVersion) {
  var build = function (war) {
    var settings = war.settings;
    var brains = war.brains;
    var gwaio = {};
    gwaio.version = gwoVersion;
    // Re-entering this in the lobby rebuilds this war.
    gwaio.seed = war.seed;
    gwaio.difficulty = war.tier.difficultyName;
    // A named tier is looked up live at launch; Custom's values live nowhere
    // else, so the war records them.
    if (war.tier.customDifficulty) {
      gwaio.customDifficulty = war.tierData;
    }
    gwaio.galaxySize = war.galaxySize;
    gwaio.factionScaling = settings.factionScaling();
    gwaio.systemScaling = settings.systemScaling();
    gwaio.simpleSystems = settings.simpleSystems();
    gwaio.largePlanets = settings.largePlanets();
    gwaio.easierStart = settings.easierStart();
    if (war.devMode) {
      gwaio.cheatsUsed = true;
    }
    gwaio.ai = brains.ai;
    gwaio.aiAlly = brains.aiAlly;
    // Co-op AI players follow the opponent until the player picks otherwise.
    gwaio.aiCoop = brains.aiCoop || brains.ai;
    // One coerced row per installed race, so the save never carries a brain a
    // race cannot run and co-op viewers read the same answers.
    gwaio.aiByRace = gwoBrainTable.recordFor(
      brains.aiByRace,
      war.installedRaces,
      brains.ai,
      brains.aiAlly,
      gwaio.aiCoop
    );
    gwaio.aiMods = [];
    gwaio.techCardDeck = settings.techCardDeck();
    gwaio.staticTech = settings.staticTech();
    // We don't need to apply the hotfix as it's for v5.17.1 and earlier
    gwaio.treasurePlanetFixed = true;
    // We don't need to apply the hotfix as it's for v5.22.1 and earlier
    gwaio.clusterFixed = true;
    // This war never pre-dealt a treasure loadout to strip
    gwaio.treasureLoadoutDerived = true;
    gwaio.treasureStar = war.treasureStar;
    gwaio.coopPlayerScalingCount = war.playerCount;
    gwaio.races = {
      player: war.playerRace,
      byFaction: war.raceByFaction,
      unique: settings.uniqueRaces(),
      mods: war.raceInfo.mods,
      // The add-on server mods active at creation, so a resume can say which
      // are gone. See races.md, "Add-ons".
      addons: war.raceInfo.addonMods,
      // Only the per-player tech referee reads a viewer's own race, so a war
      // without it never claims one. See coop.md.
      perPlayerRace: settings.perPlayerRace() && !!war.perPlayerTechCards,
    };
    // Only an AI player under per-player tech draws a loadout.
    gwaio.uniqueAiLoadouts =
      settings.uniqueAiLoadouts() && !!war.perPlayerTechCards;
    // The map packs GW Server Mods must mount for this war. The resume check
    // reads the stars' own stamps first; this stands in for a star whose
    // system lost its stamp. See galaxy.md, "Biome mods in a GW battle".
    gwaio.biomeMods = gwoBiomes.gwsmMods(
      _.map(war.galaxy.stars(), function (star) {
        return star.system().gwoBiomeMods;
      })
    );
    return gwaio;
  };

  return {
    build: build,
  };
});
