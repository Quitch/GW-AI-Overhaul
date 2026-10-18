// One icon per race that can use a loadout, on both loadout scenes. Each
// scene's race picker fills gwoLoadoutRaces. See races.md, "Loadout card race
// icons".
(function () {
  try {
    var modulesReady = ko.observable(false);
    var helpers;
    var races;
    var factions;
    var strategicIcon;
    var icons = {};

    model.gwoLoadoutRaces = ko.observableArray([]);

    var painted = function (image, colour) {
      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      var pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      strategicIcon.paint(pixels.data, colour);
      var box = strategicIcon.bounds(pixels.data, canvas.width, canvas.height);
      var cropped = document.createElement("canvas");
      cropped.width = box.width;
      cropped.height = box.height;
      cropped.getContext("2d").putImageData(pixels, -box.x, -box.y);
      return cropped.toDataURL();
    };

    // A race whose client mod is off has no icon file, so it shows the stock
    // commander instead.
    var imageFor = function (url, colour) {
      var key = url + "|" + colour.join(",");

      if (!icons[key]) {
        var css = ko.observable("");
        var load = function (src) {
          var image = new Image();
          image.onload = function () {
            css('url("' + painted(image, colour) + '")');
          };
          image.onerror = function () {
            if (src !== races.STOCK_COMMANDER_ICON) {
              load(races.STOCK_COMMANDER_ICON);
            }
          };
          image.src = src;
        };
        load(url);
        icons[key] = css;
      }

      return icons[key];
    };

    model.gwoLoadoutRaceBadges = function (card) {
      var raceList = model.gwoLoadoutRaces();

      if (!modulesReady()) {
        return [];
      }

      return _.map(
        helpers.compatibleRaces(card.id(), raceList),
        function (race) {
          var badge = races.raceBadge(race, factions);
          badge.image = imageFor(badge.icon, badge.colour);
          return badge;
        }
      );
    };

    // Before ko.applyBindings, so foreach clones it per unlocked loadout.
    // .card_locked is excluded.
    $("#start-cards .card").append(
      '<div class="gwo-loadout-races" data-bind="foreach: model.gwoLoadoutRaceBadges($data)">' +
        '<div class="gwo-loadout-race gwo-tip" data-bind="' +
        "style: { backgroundImage: image }, " +
        "tooltip: name" +
        '"></div></div>'
    );

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "shared/gw_factions",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/strategic_icon.js",
      ],
      function (gwoHelpers, gwoRaces, GWFactions, gwoStrategicIcon) {
        helpers = gwoHelpers;
        races = gwoRaces;
        factions = GWFactions;
        strategicIcon = gwoStrategicIcon;
        modulesReady(true);
      },
      function (err) {
        console.error(
          "Galactic War Overhaul (GWO): loadout race icons not loaded: " +
            err.requireModules +
            ": " +
            (err.stack || err.message || err)
        );
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
