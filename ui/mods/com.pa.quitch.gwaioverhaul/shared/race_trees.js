// Which files of a brain's merged source listing make up a race's own AI
// tree. races.js says what each layer is (layersFor); this says which listed
// files a layer claims. See races.md, "Race trees".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], function (
  gwoRaces
) {
  var matchesSource = function (filePath, source) {
    return (
      _.startsWith(filePath, source.dir) &&
      _.startsWith(filePath.slice(source.dir.length), source.match || "")
    );
  };

  var matchesAnySource = function (sources, filePath) {
    return _.some(sources, function (source) {
      return matchesSource(filePath, source);
    });
  };

  var layerClaims = function (layer, filePath) {
    return (
      _.includes(layer.unitMaps, filePath) ||
      matchesAnySource(layer.sources, filePath)
    );
  };

  // One race tree job's inputs, read once and shared by its three filters.
  // See races.md, "Race trees".
  var treeContext = function (raceId, brain, sourceRoot) {
    var race = gwoRaces.byId(raceId);
    var brainKey = gwoRaces.brainKeyOf(brain);
    var config = (race && race.ai[brainKey]) || {};
    var layers = gwoRaces.layersFor(brainKey);

    return {
      isRace: !!race && race.id !== gwoRaces.MLA_ID,
      ownLayer: (race && layers[race.id]) || { unitMaps: [], sources: [] },
      // Every other layer, MLA's add-ons included, is subtracted from the
      // base.
      otherSources: _(layers)
        .omit(race ? race.id : "")
        .map("sources")
        .flatten()
        .value(),
      modSources: config.sources || [],
      exclude: config.exclude || [],
      aiConfig: sourceRoot + "ai_config.json",
      mapsDir: sourceRoot + "unit_maps/",
      templatesDir: sourceRoot + "platoon_templates/",
      buildDirs: [
        sourceRoot + "fabber_builds/",
        sourceRoot + "factory_builds/",
      ],
      // The engine lists unit_maps/ and loads each file it finds plus the
      // army's tag, so the tagged merged map is only read when its untagged
      // namesake is there to be listed. The brain's own map files fill that
      // role.
      baseMaps: [
        sourceRoot + "unit_maps/ai_unit_map.json",
        sourceRoot + "unit_maps/ai_unit_map_x1.json",
      ],
    };
  };

  // The race's own layer, then the base layer: whatever no other layer
  // claims. A file two layers claim is the race's when its own does.
  var layeredFile = function (context, filePath) {
    if (matchesAnySource(context.ownLayer.sources, filePath)) {
      return true;
    }

    // No untagged stray may reach unit_maps/ - the engine would load it
    // with the army's tag appended.
    if (_.startsWith(filePath, context.mapsDir)) {
      return false;
    }

    return !matchesAnySource(context.otherSources, filePath);
  };

  // Under a brain that carries the race: the tier minus the MLA side.
  var carriedFile = function (context, filePath) {
    return (
      context.exclude.length > 0 &&
      !_.some(context.exclude, function (fragment) {
        return _.includes(filePath, fragment);
      })
    );
  };

  // Which files of a brain's source tree make up the race's own tree. See
  // races.md, "Race trees".
  var treeFilter = function (context) {
    var hasData =
      context.ownLayer.sources.length > 0 || context.exclude.length > 0;
    var ownFile = context.ownLayer.sources.length ? layeredFile : carriedFile;

    var isUnitMap = function (filePath) {
      return _.some(context.ownLayer.unitMaps, function (map) {
        return filePath === map || _.endsWith(filePath, "/" + map);
      });
    };

    return function (filePath) {
      if (!context.isRace || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (
        filePath === context.aiConfig ||
        _.includes(context.baseMaps, filePath)
      ) {
        return true;
      }

      if (isUnitMap(filePath) || _.includes(filePath, "/neural_networks/")) {
        return false;
      }

      // Every layer's templates, as in a skirmish: a build file at a vanilla
      // path can name another race's (Bugs' orbital builds do).
      if (hasData && _.startsWith(filePath, context.templatesDir)) {
        return true;
      }

      return ownFile(context, filePath);
    };
  };

  // Whether the race mod itself put this file in the tree - the base layer
  // does not count. The referee warns when nothing matches: no race files in
  // the merged listing means the race's server mod is not mounted.
  var raceLayerFilter = function (context) {
    var keep = treeFilter(context);

    return function (filePath) {
      if (!context.isRace || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (context.modSources.length) {
        return matchesAnySource(context.modSources, filePath);
      }

      if (!context.exclude.length) {
        return false;
      }

      // A brain that carries the race itself: the tier's own data files, not
      // the config and map boilerplate every tree keeps.
      return (
        keep(filePath) &&
        filePath !== context.aiConfig &&
        !_.includes(context.baseMaps, filePath)
      );
    };
  };

  // Whether a file of the race's tree is a stock factory or fabber build list:
  // kept from the base layer, so the referee strips MLA's orders from it. A
  // brain that carries the race has none. See races.md, "Race trees".
  var stockBuildFilter = function (context) {
    var keep = treeFilter(context);

    return function (filePath) {
      return (
        context.ownLayer.sources.length > 0 &&
        keep(filePath) &&
        _.some(context.buildDirs, function (dir) {
          return _.startsWith(filePath, dir);
        }) &&
        !layerClaims(context.ownLayer, filePath)
      );
    };
  };

  // Every brain key any descriptor names a layer for.
  var brainKeys = function () {
    return _.uniq(
      _.flatten(
        _.map(gwoRaces.all(), function (race) {
          return _.keys(race.ai);
        }).concat(
          _.map(gwoRaces.addons(), function (addon) {
            return _.flatten(_.map(addon.layers, _.keys));
          })
        )
      )
    );
  };

  // Whether a race's layer claims this file and MLA's does not: a race mod's
  // own build files or unit map, or an add-on's files for a race, under any
  // brain, in the merged listing. An MLA tree is the brain's base files plus
  // MLA's add-on files, so referee_ai.js's sweep drops these and keeps the
  // rest - an add-on map both MLA and a race claim rides along untagged. A
  // relative unit map names a file the brain ships itself, never a race
  // mod's, and matches nothing here. Nor does a platoon template, which every
  // tree carries (see treeFilter).
  //
  // raceLayerTest builds the layers once, for a caller testing a whole file
  // list: nothing it reads changes during one sweep.
  var raceLayerTest = function () {
    var layerSets = _.map(brainKeys(), gwoRaces.layersFor);

    return function (filePath) {
      if (_.includes(filePath, "/platoon_templates/")) {
        return false;
      }

      var mla = false;
      var other = false;

      _.forEach(layerSets, function (layers) {
        _.forEach(layers, function (layer, raceId) {
          if (layerClaims(layer, filePath)) {
            if (raceId === gwoRaces.MLA_ID) {
              mla = true;
            } else {
              other = true;
            }
          }
        });
      });

      return other && !mla;
    };
  };

  return {
    treeContext: treeContext,
    treeFilter: treeFilter,
    raceLayerFilter: raceLayerFilter,
    stockBuildFilter: stockBuildFilter,
    raceLayerTest: raceLayerTest,
  };
});
