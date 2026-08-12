var gwoSystemChangesLoaded;

function gwoSystemChanges() {
  const game = model.game();

  if (gwoSystemChangesLoaded || game.isTutorial()) {
    return;
  }

  gwoSystemChangesLoaded = true;

  try {
    const galaxy = game.galaxy();
    const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    if (gwoSettings) {
      console.log(
        `War created using Galactic War Overhaul v${gwoSettings.version}`
      );
    } else {
      console.log(
        "War created using base game, or Galactic War Overhaul v4.12.1 or earlier"
      );
    }

    // Don't allow starting zoom higher than maximum zoom
    _.defer(() => {
      model.galaxy.zoom(Math.max(model.galaxy.zoom(), model.galaxy.minZoom()));
      model.centerOnPlayer();
    });

    const createBitmap = (params) => {
      if (!params.url) {
        throw new Error("No URL specified");
      }
      if (!params.size) {
        throw new Error("No size specified");
      }

      const result = new createjs.Bitmap(params.url);
      result.x = 0;
      result.y = 0;
      result.regX = params.size[0] / 2;
      result.regY = params.size[1] / 2;

      const scale = params.scale;
      if (!_.isUndefined(scale)) {
        result.scaleX = scale;
        result.scaleY = scale;
      }

      result.color = ko.observable(params.color);
      if (_.isArray(result.color())) {
        if (params.noCache) {
          throw new Error("noCache incompatible with color");
        }

        const updateFilters = () => {
          const color = result.color();
          result.filters = [];
          if (color) {
            result.filters.push(
              new createjs.ColorFilter(
                color[0],
                color[1],
                color[2],
                color.length >= 4 ? color[3] : 1
              )
            );
          }
        };
        updateFilters();

        result.color.subscribe(() => {
          updateFilters();
          result.updateCache();
        });
      }

      if (!_.isUndefined(params.alpha)) {
        result.alpha = params.alpha;
      }

      if (!params.noCache) {
        // Note: Extra pixel compensates for bad filtering on the edges
        result.cache(-1, -1, params.size[0] + 2, params.size[1] + 2);
        $(result.image).on("load", () => {
          result.updateCache();
        });
      }
      return result;
    };

    const sortContainer = (container) => {
      container.sortChildren((a, b) => {
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

    // Add tooltips, starting planet, and thruster icons on planet intelligence icons
    $(".all-planets").replaceWith(
      loadHtml("coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/planets.html")
    );

    const SelectionViewModel = function (config) {
      const self = this;
      const galaxyView = config.galaxy;
      const hover = !!config.hover;
      let iconUrl = config.iconUrl;
      let color = config.color;

      if (!iconUrl) {
        if (hover) {
          iconUrl = "coui://ui/main/game/galactic_war/shared/img/hover.png";
        } else {
          iconUrl = "coui://ui/main/game/galactic_war/shared/img/selection.png";
        }
      }

      if (!color) {
        if (hover) {
          color = [0.5, 0.9, 1];
        } else {
          color = [0, 0.8, 1];
        }
      }

      self.visible = ko.observable(true);
      self.star = ko.observable(-1);
      self.system = ko.computed(() =>
        self.star() >= 0 ? galaxyView.systems()[self.star()] : undefined
      );

      const extractor = (field) =>
        ko.pureComputed(() => {
          const system = self.system();
          if (system) {
            return loc(system[field]()) || "";
          }
          return "";
        });

      self.name = extractor("name");
      self.html = extractor("html");
      self.description = extractor("description");
      self.scale = new createjs.Container();
      self.scale.scaleY = 0.5;
      self.scale.z = -1;
      self.icon = createBitmap({
        url: iconUrl,
        size: [240, 240],
        color,
      });
      self.scale.addChild(self.icon);

      ko.computed(() => {
        const system = self.system();
        let visible = !!system && self.visible();
        if (hover && visible) {
          visible = system.mouseOver() !== system.mouseOut();
        }
        self.icon.visible = visible;
        if (self.icon.visible) {
          const container = system.systemDisplay;
          container.addChild(self.scale);
          sortContainer(container);
        } else if (self.scale.parent) {
          self.scale.parent.removeChild(self.scale);
        }
      });

      if (!hover) {
        self.icon.addEventListener("tick", () => {
          self.icon.rotation = (_.now() * 0.02) % 360;
        });

        self.system.subscribe(
          (oldSystem) => {
            if (oldSystem) {
              oldSystem.selected(false);
            }
          },
          null,
          "beforeChange"
        );

        self.system.subscribe(() => {
          const newSystem = self.system();

          if (newSystem) {
            newSystem.selected(true);

            const radius = loc("!LOC:Radius:");
            const metalSpots = loc("!LOC:Metal Spots:");
            const metalClusters = loc("!LOC:Metal Clusters:");
            const metalDensity = loc("!LOC:Metal Density:");
            const temperature = loc("!LOC:Temperature:");
            const waterHeight = loc("!LOC:Water Height:");

            model.gwoPlanetData = _.map(newSystem.planets(), (planet) => {
              let tooltip = `${radius} ${planet.generator.radius}`;

              if (planet.generator.biome === "gas") {
                return tooltip;
              }

              if (planet.metal_spots) {
                tooltip += `<br>${metalSpots} ${planet.metal_spots.length}`;
              } else {
                tooltip += `<br>${metalClusters} ${Math.round(planet.generator.metalClusters)}<br>${metalDensity} ${Math.round(planet.generator.metalDensity)}`;
              }
              if (
                planet.generator.biome !== "metal" &&
                planet.generator.biome !== "metal_boss" &&
                planet.generator.biome !== "moon"
              ) {
                tooltip += `<br>${temperature} ${Math.round(planet.generator.temperature)}<br>${waterHeight} ${Math.round(planet.generator.waterHeight)}`;
              }
              return tooltip;
            });
          }
        });
      }
    };

    // Turn off the original selection icon before replacing model.selection()
    model.selection.visible(false);
    model.selection = new SelectionViewModel({
      galaxy: model.galaxy,
      hover: false,
    });
    model.selection.star(game.currentStar());

    model.hoverSystem = new SelectionViewModel({
      galaxy: model.galaxy,
      hover: true,
    });

    model.canMove = ko.computed(() => {
      if (model.isCampaignViewer() && !model.gwCampaignReplayingAction) {
        return false;
      }

      if (model.player.moving()) {
        return false;
      }

      const from = game.currentStar();
      const to = model.selection.star();

      if (to < 0 || to >= galaxy.stars().length) {
        return false;
      }

      if (!model.canSelectOrMovePrefix()) {
        return false;
      }

      if (from === to) {
        return false;
      }

      return galaxy.pathBetween(from, to, model.cheats.noFog());
    });

    model.displayMove = ko.computed(
      () => model.canShowCampaignActionButtons() && model.canMove()
    );

    model.displayFight = ko.computed(
      () =>
        model.canShowCampaignActionButtons() &&
        model.canFight() &&
        !model.allowLoad() &&
        model.selection.star() === game.currentStar()
    );

    model.displayExplore = ko.computed(
      () =>
        model.canShowCampaignActionButtons() &&
        model.canExplore() &&
        model.selection.star() === game.currentStar()
    );

    model.displayLoadSave = ko.computed(
      () =>
        model.canShowCampaignActionButtons() &&
        model.canFight() &&
        model.allowLoad() &&
        model.selection.star() === game.currentStar()
    );

    requireGW(
      [
        "shared/gw_common",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/victory.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
      ],
      (GW, gwoVictory, gwoSave, gwoTreasure, gwoBank) => {
        gwoVictory({
          game,
          gwoSettings,
          save: gwoSave,
          treasure: gwoTreasure,
          stockBank: GW.bank,
          gwoBank,
        });
      }
    );

    requireGW(["shared/gw_factions"], (GWFactions) => {
      const normalizedColor = (faction) =>
        _.map(faction.color[0], (c) => c / 255);

      game.defeatTeam = (defeatedTeam) => {
        let remainingBosses = 0;

        api.tally.incStatInt("gw_eliminate_faction");

        _.forEach(model.galaxy.systems(), (system) => {
          const star = system.star;
          const ai = star.ai();
          const guardians = ai && ai.mirrorMode;

          if (ai && ai.team === defeatedTeam) {
            const replacementAI = _.first(ai.foes);
            if (replacementAI) {
              const newAI = _.extend({}, ai, replacementAI);
              newAI.foes = _.rest(ai.foes);
              delete newAI.minions;

              const factionColor = normalizedColor(GWFactions[newAI.faction]);
              system.ownerColor(factionColor.concat(3));

              star.ai(newAI);
            } else {
              star.ai(undefined);
              // Delete pre-dealt cards when boss defeated
              if (!guardians) {
                star.cardList([]);
              }
            }
          } else if (ai && ai.boss) {
            ++remainingBosses;
          }
        });

        if (!remainingBosses) {
          requireGW(["shared/gw_game"], (GWGame) => {
            game.gameState(GWGame.gameStates.won);
          });
        }
      };

      _.forEach(model.galaxy.systems(), (system) => {
        const ai = system.star.ai();
        if (!ai) {
          return;
        }

        if (!ai.ally && !ai.foes) {
          return;
        }

        const innerColour = ai.ally
          ? normalizedColor(GWFactions[ai.ally.faction])
          : normalizedColor(GWFactions[ai.foes[0].faction]);

        const innerRing = createBitmap({
          url: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/inner_ring.png",
          size: [240, 240],
          color: innerColour.concat(7),
          scale: 0.71,
          alpha: 0.8,
        });

        const scaleInnerRing = new createjs.Container();
        scaleInnerRing.addChild(innerRing);
        scaleInnerRing.z = 0;
        system.systemDisplay.addChild(scaleInnerRing);

        innerRing.visible = false;

        ko.computed(() => {
          innerRing.visible =
            (system.connected() || model.cheats.noFog()) &&
            !!system.ownerColor() &&
            system.ownerColor()[0] !== model.player.color()[0];

          // Fix Z axis issues
          if (innerRing.visible === true) {
            system.mouseOver(1);
            system.mouseOver(0);
            system.mouseOut(0);
          }

          // Dependencies. These will cause the base code that updates color to rerun
          // so we have to run under the same conditions, and pray we run later than that code.
          system.connected();
          model.cheats.noFog();
          system.star.hasCard();
        });
      });
    });
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoSystemChanges();
