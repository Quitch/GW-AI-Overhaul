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

    var cssUrl = function (url) {
      return 'url("' + url.replace(/["\\]/g, "\\$&") + '")';
    };

    var cssPair = function (icon) {
      return { fill: cssUrl(icon.fill), outline: cssUrl(icon.outline) };
    };

    // A mask over a missing image paints nothing, so a race whose client mod
    // is off shows the base game's player icon instead.
    var iconFor = function (badge) {
      var key = badge.fill + "|" + badge.outline;

      if (!icons[key]) {
        var icon = ko.observable(cssPair(badge));
        var image = new Image();
        image.onerror = function () {
          icon(cssPair(races.STOCK_PLAYER_ICON));
        };
        image.src = badge.fill;
        icons[key] = icon;
      }

      return icons[key];
    };

    model.gwoLoadoutRaceBadges = function (card) {
      var raceList = model.gwoLoadoutRaces();

      if (!modulesReady()) {
        return [];
      }

      return _.map(
        helpers.compatibleRaces(
          card.id(),
          raceList,
          helpers.loadoutEntries(model)
        ),
        function (race) {
          var badge = races.raceBadge(race, factions);
          badge.icon = iconFor(badge);
          return badge;
        }
      );
    };

    // Before ko.applyBindings, so foreach clones it per unlocked loadout.
    // .card_locked is excluded. The fill and outline layers are the
    // live_game player list's.
    $("#start-cards .card").append(
      '<div class="gwo-loadout-races" data-bind="foreach: model.gwoLoadoutRaceBadges($data)">' +
        '<div class="gwo-loadout-race gwo-tip" data-bind="tooltip: name">' +
        '<div class="gwo-loadout-race-fill" data-bind="' +
        "style: { backgroundColor: colour, webkitMaskImage: icon().fill }" +
        '"></div>' +
        '<div class="gwo-loadout-race-outline" data-bind="' +
        "style: { backgroundImage: icon().outline }" +
        '"></div></div></div>'
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
