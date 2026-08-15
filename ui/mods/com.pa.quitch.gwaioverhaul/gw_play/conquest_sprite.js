// Animates a Conquest boss move on the galaxy map at the same cadence as the
// player's own transit in gw_play.js's CommanderViewModel.moveTo, whose helpers
// are closure-local there - createBitmap and the icon layout are copied, the
// precedent being gw_play/systems.js's inner-ring overlay. Rendering only:
// every decision the rules own happens in conquest_engine.js.
define([
  "shared/gw_factions",
  "shared/vecmath",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
], function (GWFactions, VMath, gwoCommanderColour) {
  var createBitmap = function (params) {
    var result = new createjs.Bitmap(params.url);
    result.x = 0;
    result.y = 0;
    result.regX = params.size[0] / 2;
    result.regY = params.size[1] / 2;
    if (!_.isUndefined(params.scale)) {
      result.scaleX = params.scale;
      result.scaleY = params.scale;
    }
    if (_.isArray(params.color)) {
      result.filters = [
        new createjs.ColorFilter(
          params.color[0],
          params.color[1],
          params.color[2],
          params.color.length >= 4 ? params.color[3] : 1
        ),
      ];
    }
    // Extra pixel compensates for bad filtering on the edges
    result.cache(-1, -1, params.size[0] + 2, params.size[1] + 2);
    $(result.image).on("load", function () {
      result.updateCache();
    });
    return result;
  };

  // factory(params) -> animate(step, done); params: { game }.
  var factory = function (params) {
    var game = params.game;

    var bossIcon = function (ai) {
      var faction = GWFactions[ai.faction || 0];
      var url =
        ai.icon ||
        (faction && faction.icon) ||
        "coui://ui/main/game/galactic_war/shared/img/icon_faction_" +
          (ai.faction || 0).toString() +
          ".png";
      var color;
      if (ai.conquestArmy) {
        // A minion army transits in its palette colour, matching its map
        // icon; a player token carries no ai.color at all.
        var palette = gwoCommanderColour.paletteFor(ai.faction || 0) || [];
        var paletteColour = palette[ai.conquestArmy.colour] || [255, 255, 255];
        color = _.map(paletteColour, function (c) {
          return c / 255;
        });
      } else if (ai.icon) {
        color = [1, 1, 1];
      } else {
        color = _.map(ai.color[0], function (c) {
          return c / 255;
        });
      }
      return { url: url, color: color };
    };

    // A player token is the player's own intelligence, drawn through fog
    // like its map icon - without this a token moving inside fogged held
    // territory would teleport.
    var moveIsVisible = function (step) {
      var systems = model.galaxy.systems();
      return (
        !!step.player ||
        model.cheats.noFog() ||
        systems[step.from].connected() ||
        systems[step.to].connected()
      );
    };

    return function (step, done) {
      if (!step.movedAi || !moveIsVisible(step)) {
        done();
        return;
      }

      var galaxy = model.galaxy;
      var stars = game.galaxy().stars();
      var fromStar = stars[step.from];
      var toStar = stars[step.to];
      var icon = bossIcon(step.movedAi);

      var container = new createjs.Container();
      container.z = Infinity;
      container.scaleX = 2;
      container.scaleY = 2;
      var offset = new createjs.Container();
      offset.x = 12;
      offset.y = -19;
      container.addChild(offset);
      offset.addChild(
        createBitmap({
          url: icon.url,
          size: [128, 128],
          color: icon.color,
          scale: 0.5,
        })
      );

      var moveSpeed = 0.1 / (galaxy.radius() * 1000); // Galactic Units/ms
      var distance = VMath.distance_v2(
        fromStar.coordinates(),
        toStar.coordinates()
      );
      var time = distance / moveSpeed;
      var departure = _.now();

      var curCoords = VMath.v3_zero();
      var curPos = VMath.v3_zero();
      var updateTransitPos = function () {
        var progress = Math.min((_.now() - departure) / time, 1.0);
        VMath.lerp_v3_s(
          fromStar.coordinates(),
          toStar.coordinates(),
          progress,
          curCoords
        );
        galaxy.applyTransform(curCoords, curPos);
        container.x = curPos[0];
        container.y = curPos[1];
        container.scaleX = curPos[2] * 2;
        container.scaleY = curPos[2] * 2;
      };

      // Without this the idle map renders at 10 FPS - see galaxy_map_perf.js.
      if (_.isFunction(model.gwoRequestInteractiveFrames)) {
        model.gwoRequestInteractiveFrames(time + 200);
      }

      galaxy.stage.addChild(container);
      updateTransitPos();
      container.addEventListener("tick", updateTransitPos);
      _.delay(function () {
        container.removeAllEventListeners("tick");
        galaxy.stage.removeChild(container);
        galaxy.sortStage();
        done();
      }, time + 100);
      _.delay(galaxy.sortStage);
    };
  };

  return factory;
});
