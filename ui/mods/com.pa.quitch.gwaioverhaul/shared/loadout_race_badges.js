// One icon per race that can use a loadout, on both loadout scenes. Each
// scene's race picker fills gwoLoadoutRaces. See races.md, "Loadout card race
// icons".
(function () {
  try {
    var modulesReady = ko.observable(false);
    var helpers;
    var races;
    var factions;
    var icons = {};

    model.gwoLoadoutRaces = ko.observableArray([]);

    // A mask over a missing image paints nothing, so a race whose client mod
    // is off shows the stock commander instead.
    var cssUrl = function (url) {
      return 'url("' + url.replace(/["\\]/g, "\\$&") + '")';
    };

    var maskFor = function (url) {
      if (!icons[url]) {
        var mask = ko.observable(cssUrl(url));
        var image = new Image();
        image.onerror = function () {
          mask(cssUrl(races.STOCK_COMMANDER_ICON));
        };
        image.src = url;
        icons[url] = mask;
      }

      return icons[url];
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
          badge.mask = maskFor(badge.icon);
          return badge;
        }
      );
    };

    // Before ko.applyBindings, so foreach clones it per unlocked loadout.
    // .card_locked is excluded.
    $("#start-cards .card").append(
      '<div class="gwo-loadout-races" data-bind="foreach: model.gwoLoadoutRaceBadges($data)">' +
        '<div class="gwo-loadout-race gwo-tip" data-bind="' +
        "style: { backgroundColor: colour, webkitMaskImage: mask }, " +
        "tooltip: name" +
        '"></div></div>'
    );

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "shared/gw_factions",
      ],
      function (gwoHelpers, gwoRaces, GWFactions) {
        helpers = gwoHelpers;
        races = gwoRaces;
        factions = GWFactions;
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
