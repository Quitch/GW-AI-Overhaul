// Minion-army icons on the galaxy map. The stock scene draws a faction icon
// only for ai.boss, so an army-held star would read as a plain garrison; this
// copies the CommanderViewModel icon layout (the conquest_sprite.js
// precedent) and tints it with the army's minion palette colour. Rendering
// only: every decision the rules own happens in conquest_engine.js.
define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
], function (GWFactions, gwoCommanderColour) {
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

  var sortContainer = function (container) {
    container.sortChildren(function (a, b) {
      if (_.isUndefined(a.z)) {
        if (_.isUndefined(b.z)) {
          return 0;
        }
        return -1;
      } else if (_.isUndefined(b.z)) {
        return 1;
      }
      return a.z - b.z;
    });
  };

  // factory(params) -> installs the per-system icon computeds;
  // params: { playerFaction }.
  var factory = function (params) {
    var playerFaction = params.playerFaction || 0;

    var armyTint = function (faction, colourIndex) {
      var palette = gwoCommanderColour.paletteFor(faction) || [];
      var colour = palette[colourIndex] || [255, 255, 255];
      return _.map(colour, function (c) {
        return c / 255;
      });
    };

    var iconUrl = function (faction) {
      var data = GWFactions[faction];
      return (
        (data && data.icon) ||
        "coui://ui/main/game/galactic_war/shared/img/icon_faction_" +
          faction +
          ".png"
      );
    };

    // The army shown at a system: a settled army wins over a mustered stack;
    // a player token is the player's own intelligence, shown through fog.
    var armyAt = function (system, starIndex) {
      var ai = system.star.ai();
      if (ai && ai.conquestArmy) {
        return {
          faction: _.isUndefined(ai.faction) ? 0 : ai.faction,
          colour: ai.conquestArmy.colour,
          player: false,
        };
      }
      var stacked = ai && _.first(ai.minionArmies || []);
      if (stacked) {
        return {
          faction: _.isUndefined(stacked.faction) ? 0 : stacked.faction,
          colour: stacked.conquestArmy.colour,
          player: false,
        };
      }
      var token = _.find(model.gwoConquestPlayerArmies(), { star: starIndex });
      if (token) {
        return { faction: playerFaction, colour: token.colour, player: true };
      }
      return undefined;
    };

    _.forEach(model.galaxy.systems(), function (system, starIndex) {
      var container = new createjs.Container();
      container.z = 2;
      container.scaleX = 2;
      container.scaleY = 2;
      container.visible = false;
      var offset = new createjs.Container();
      offset.x = 12;
      offset.y = -19;
      container.addChild(offset);
      system.systemDisplay.addChild(container);
      sortContainer(system.systemDisplay);

      var shown;
      ko.computed(function () {
        var army = armyAt(system, starIndex);
        var key = army
          ? [army.faction, army.colour, army.player].join(".")
          : "";
        if (shown && shown.key !== key) {
          offset.removeChild(shown.bitmap);
          shown = undefined;
        }
        if (army && !shown) {
          shown = {
            key: key,
            bitmap: createBitmap({
              url: iconUrl(army.faction),
              size: [128, 128],
              color: armyTint(army.faction, army.colour),
              scale: 0.5,
            }),
          };
          offset.addChild(shown.bitmap);
        }
        container.visible =
          !!army && (army.player || system.connected() || model.cheats.noFog());
      });
    });
  };

  return factory;
});
