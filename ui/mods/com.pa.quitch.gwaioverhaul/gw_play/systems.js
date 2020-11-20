// All of this is in service of changing the extractor function to prioritise system information
if (!model.game().isTutorial()) {
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
        iconUrl = "coui://ui/main/game/galactic_war/shared/img/selection.png";
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
          return loc(system[field]() || (ai && ai[field]) || ""); // GWAIO - prioritise system information
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
      if (hover && visible) visible = system.mouseOver() !== system.mouseOut();
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
        if (newSystem) newSystem.selected(true);
      });
    }
  }

  model.selection = new SelectionViewModel({
    galaxy: model.galaxy,
    hover: false,
  });
  model.selection.star(model.game().currentStar());

  model.hoverSystem = new SelectionViewModel({
    galaxy: model.galaxy,
    hover: true,
  });

  model.canMove = ko.computed(function () {
    if (model.player.moving()) return false;

    var game = model.game();
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
      model.selection.star() === model.game().currentStar()
    );
  });
}
