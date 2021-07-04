var gwaioSystemChangesLoaded;

if (!gwaioSystemChangesLoaded) {
  gwaioSystemChangesLoaded = true;

  function gwaioSystemChanges() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        if (game.galaxy().stars()[game.galaxy().origin()].system().gwaio)
          console.log(
            "War created using Galactic War Overhaul v" +
              game.galaxy().stars()[game.galaxy().origin()].system().gwaio
                .version
          );
        else
          console.log(
            "War created using Galactic War Overhaul v4.12.1 or earlier"
          );

        function createBitmap(params) {
          if (!params.url) throw "No URL specified";
          if (!params.size) throw "No size specified";

          var result = new createjs.Bitmap(params.url);
          result.x = 0;
          result.y = 0;
          result.regX = params.size[0] / 2;
          result.regY = params.size[1] / 2;

          var scale = params.scale;
          if (scale !== undefined) {
            result.scaleX = scale;
            result.scaleY = scale;
          }

          var color = params.color;
          result.color = ko.observable();
          if (color) {
            if (params.noCache) throw "noCache incompatible with color";
            result.color(color);
            var updateFilters = function () {
              var color = result.color();
              result.filters = [];
              if (color)
                result.filters.push(
                  new createjs.ColorFilter(
                    color[0],
                    color[1],
                    color[2],
                    color.length >= 4 ? color[3] : 1
                  )
                );
            };
            updateFilters();
            result.color.subscribe(function () {
              updateFilters();
              result.updateCache();
            });
          }

          if (params.alpha !== undefined) result.alpha = params.alpha;

          if (!params.noCache) {
            // Note: Extra pixel compensates for bad filtering on the edges
            result.cache(-1, -1, params.size[0] + 2, params.size[1] + 2);
            $(result.image).load(function () {
              result.updateCache();
            });
          }
          return result;
        }

        function sortContainer(container) {
          container.sortChildren(function (a, b) {
            if (a.z === undefined) {
              if (b.z === undefined) return 0;
              return -1;
            } else if (b.z === undefined) {
              return 1;
            }
            return a.z - b.z;
          });
        }

        $(".all-planets").replaceWith(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/planets.html"
          )
        );

        function SelectionViewModel(config) {
          var self = this;

          var galaxy = config.galaxy;
          var hover = !!config.hover;
          var iconUrl = config.iconUrl;
          var color = config.color;

          if (!iconUrl) {
            if (hover)
              iconUrl = "coui://ui/main/game/galactic_war/shared/img/hover.png";
            else
              iconUrl =
                "coui://ui/main/game/galactic_war/shared/img/selection.png";
          }

          if (!color) {
            if (hover) color = [0.5, 0.9, 1];
            else color = [0, 0.8, 1];
          }

          self.visible = ko.observable(true);
          self.star = ko.observable(-1);
          self.system = ko.computed(function () {
            return self.star() >= 0 ? galaxy.systems()[self.star()] : undefined;
          });

          var extractor = function (field) {
            return ko.pureComputed(function () {
              var system = self.system();
              if (system) {
                var ai = system.star.ai();
                return loc(system[field]() || (ai && ai[field]) || ""); // GWAIO - use system information before AI information
              } else {
                return "";
              }
            });
          };

          self.name = extractor("name");
          self.html = extractor("html");
          self.description = extractor("description");

          self.scale = new createjs.Container();
          self.scale.scaleY = 0.5;
          self.scale.z = -1;
          self.icon = createBitmap({
            url: iconUrl,
            size: [240, 240],
            color: color,
          });
          self.scale.addChild(self.icon);

          ko.computed(function () {
            var system = self.system();
            var visible = !!system && self.visible();
            if (hover && visible)
              visible = system.mouseOver() !== system.mouseOut();
            self.icon.visible = visible;
            if (self.icon.visible) {
              var container = system.systemDisplay;
              container.addChild(self.scale);
              sortContainer(container);
            } else {
              if (self.scale.parent) self.scale.parent.removeChild(self.scale);
            }
          });

          if (!hover) {
            self.icon.addEventListener("tick", function () {
              self.icon.rotation = (_.now() * 0.02) % 360;
            });

            self.system.subscribe(
              function (oldSystem) {
                if (oldSystem) oldSystem.selected(false);
              },
              null,
              "beforeChange"
            );

            self.system.subscribe(function () {
              var newSystem = self.system();

              var radius = loc("!LOC:Radius:");
              var metalSpots = loc("!LOC:Metal Spots:");
              var metalClusters = loc("!LOC:Metal Clusters:");
              var metalDensity = loc("!LOC:Metal Density:");
              var temperature = loc("!LOC:Temperature:");
              var waterDepth = loc("!LOC:Water Depth:");
              var waterHeight = loc("!LOC:Water Height:");

              if (newSystem) {
                newSystem.selected(true);
                model.gwaioPlanetData = _.map(
                  self.system().planets(),
                  function (planet) {
                    if (planet.generator.biome === "gas")
                      return radius + " " + planet.generator.radius;
                    else if (
                      planet.generator.biome === "metal" ||
                      planet.generator.biome === "metal_boss" ||
                      planet.generator.biome === "moon"
                    )
                      if (planet.metal_spots)
                        return (
                          radius +
                          " " +
                          planet.generator.radius +
                          "<br>" +
                          metalSpots +
                          " " +
                          planet.metal_spots.length
                        );
                      else
                        return (
                          radius +
                          " " +
                          planet.generator.radius +
                          "<br>" +
                          metalClusters +
                          " " +
                          Math.round(planet.generator.metalClusters) +
                          "<br>" +
                          metalDensity +
                          " " +
                          Math.round(planet.generator.metalDensity)
                        );
                    else if (planet.metal_spots && planet.generator.waterDepth)
                      return (
                        radius +
                        " " +
                        planet.generator.radius +
                        "<br>" +
                        metalSpots +
                        " " +
                        planet.metal_spots.length +
                        "<br>" +
                        temperature +
                        " " +
                        Math.round(planet.generator.temperature) +
                        "<br>" +
                        waterDepth +
                        " " +
                        Math.round(planet.generator.waterDepth) +
                        "<br>" +
                        waterHeight +
                        " " +
                        Math.round(planet.generator.waterHeight)
                      );
                    else if (planet.metal_spots)
                      return (
                        radius +
                        " " +
                        planet.generator.radius +
                        "<br>" +
                        metalSpots +
                        " " +
                        planet.metal_spots.length +
                        "<br>" +
                        temperature +
                        " " +
                        Math.round(planet.generator.temperature) +
                        "<br>" +
                        waterHeight +
                        " " +
                        Math.round(planet.generator.waterHeight)
                      );
                    else
                      return (
                        radius +
                        " " +
                        planet.generator.radius +
                        "<br>" +
                        metalClusters +
                        " " +
                        Math.round(planet.generator.metalClusters) +
                        "<br>" +
                        metalDensity +
                        " " +
                        Math.round(planet.generator.metalDensity) +
                        "<br>" +
                        temperature +
                        " " +
                        Math.round(planet.generator.temperature) +
                        "<br>" +
                        waterDepth +
                        " " +
                        Math.round(planet.generator.waterDepth) +
                        "<br>" +
                        waterHeight +
                        " " +
                        Math.round(planet.generator.waterHeight)
                      );
                  }
                );
              }
            });
          }
        }

        model.selection = new SelectionViewModel({
          galaxy: model.galaxy,
          hover: false,
        });
        model.selection.star(game.currentStar());

        model.hoverSystem = new SelectionViewModel({
          galaxy: model.galaxy,
          hover: true,
        });

        model.canMove = ko.computed(function () {
          if (model.player.moving()) return false;

          var galaxy = game.galaxy();
          var from = game.currentStar();
          var to = model.selection.star();

          if (to < 0 || to > galaxy.stars().length) return false;

          if (!model.canSelectOrMovePrefix()) return false;

          if (from === to) return false;

          return galaxy.pathBetween(from, to, model.cheats.noFog());
        });

        model.displayMove = ko.computed(function () {
          return model.canMove();
        });

        model.displayFight = ko.computed(function () {
          return (
            model.canFight() &&
            !model.allowLoad() &&
            model.selection.star() === game.currentStar()
          );
        });

        requireGW(["shared/gw_factions"], function (GWFactions) {
          _.forEach(model.galaxy.systems(), function (system) {
            ko.computed(function () {
              var ai = system.star.ai();
              if (!ai) return;
              else if (ai.treasurePlanet === true)
                normalizedColor = [255, 255, 255];
              else {
                var faction = GWFactions[ai.faction];
                // Ensures we assign faction colour, not minion colour, to each system
                var normalizedColor = _.map(faction.color[0], function (c) {
                  return c / 255;
                });
              }
              system.ownerColor(normalizedColor.concat(3));
              // Dependencies. These will cause the base code that updates color to rerun, so we have to run under the same conditions, and pray we run later than that code.
              system.connected();
              model.cheats.noFog();
              system.star.hasCard();
            });
          });
        });
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioSystemChanges();
}
