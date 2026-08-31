// Registers the races before any referee runs, and refuses to fight a war whose
// races the player is no longer running. See races.md.
var gwoPlayRacesLoaded;

function gwoPlayRaces() {
  if (gwoPlayRacesLoaded) {
    return;
  }

  gwoPlayRacesLoaded = true;

  try {
    model.gwoRaces = _.isArray(model.gwoRaces) ? model.gwoRaces : [];

    // Both are made here, before any asynchronous work. This scene script is
    // first in modinfo's gw_play list, so the war panel and the fight gate
    // always find them; the manifest read used to be able to finish before
    // gwo_panel.js made the observable, and the message was lost.
    model.gwoRaceWarning = ko.observable("");
    model.gwoRaceBlock = ko.observableArray([]);

    var blocked = function () {
      return model.gwoRaceBlock().length > 0;
    };

    var blockMessage = function () {
      return (
        loc("!LOC:This war cannot be fought:") +
        "<br/>" +
        model.gwoRaceBlock().join("<br/>") +
        "<br/><br/>" +
        loc(
          "!LOC:Enable the missing mods and restart Planetary Annihilation to continue this war."
        )
      );
    };

    var showBlockPopUp = function () {
      if (!_.isFunction(model.popUp)) {
        return;
      }

      model.popUp({ msg: blockMessage(), tags: { primary: "!LOC:OK" } });
    };

    // Knockout reads a click binding's value accessor when the click happens,
    // so replacing these holds however late this runs. The stock fight path
    // never consults gwCampaignFightBlocked, so this is the gate, not the
    // greying below.
    var gateAction = function (name) {
      var stock = model[name];

      if (!_.isFunction(stock)) {
        return;
      }

      model[name] = function () {
        if (blocked()) {
          showBlockPopUp();
          return;
        }

        return stock.apply(this, arguments);
      };
    };

    // The stock co-op gate already greys the Fight button and gives it a
    // reason; a missing race is one more reason to say no.
    var gateButton = function () {
      var stockBlocked = model.gwCampaignFightBlocked;
      var stockTooltip = model.gwCampaignFightTooltip;

      if (ko.isObservable(stockBlocked)) {
        model.gwCampaignFightBlocked = ko.computed(function () {
          return blocked() || stockBlocked();
        });
      }

      if (ko.isObservable(stockTooltip)) {
        model.gwCampaignFightTooltip = ko.computed(function () {
          return blocked()
            ? "!LOC:A race this war fields is missing"
            : stockTooltip();
        });
      }
    };

    // A binding captures the computed it was given, so the swap has to precede
    // ko.applyBindings - which a scene script may run either side of. gw_play
    // sets gwCampaignPlayStarted immediately after binding, so that says which.
    var whenBound = function (install) {
      if (model.gwCampaignPlayStarted) {
        install();
        return;
      }

      var applyBindings = ko.applyBindings;

      ko.applyBindings = function () {
        ko.applyBindings = applyBindings;
        install();
        return applyBindings.apply(this, arguments);
      };
    };

    whenBound(function () {
      gateButton();
      gateAction("fight");
      gateAction("restartFight");
    });

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_cells.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_check.js",
      ],
      function (raceMods, gwoAI, gwoRaces, raceCells, raceCheck) {
        raceMods.registerAll();

        // Deals are synchronous and gate on the race's cells, so build them
        // now rather than at the first deal - once GW Server Mods has the race
        // zip mounted, or the unit list read has no race unit in it. See
        // races.md.
        var playerRace = gwoRaces.raceOf(model.game().inventory());
        if (!gwoRaces.isMla(playerRace)) {
          raceMods.mountRoot().always(function () {
            raceCells.prime(playerRace);
          });
        }

        // A war resumed without the mods behind its races loses units with no
        // other warning, so say so and stop it being fought. See races.md.
        var settings = gwoAI.originSettings(model.game());
        var recorded = settings && settings.races;
        var ais = _.map(model.game().galaxy().stars(), function (star) {
          return star.ai();
        });
        var warRaceIds = raceCheck.warRaces(recorded, ais);

        if (!warRaceIds.length) {
          return;
        }

        var describe = function (entry) {
          if (entry.reason === "descriptor") {
            return (
              loc(entry.name) + " - " + loc("!LOC:its mod is not installed")
            );
          }

          if (entry.reason === "gwServerMods") {
            return (
              loc(entry.name) +
              " - " +
              loc("!LOC:GW Server Mods is not enabled")
            );
          }

          return (
            loc(entry.name) +
            " - " +
            entry.mods[0] +
            " " +
            loc("!LOC:is not enabled")
          );
        };

        raceMods.installedRaces().then(function (info) {
          var result = raceCheck.evaluate(recorded, warRaceIds, info);

          var changed = _.map(result.warnings, function (warning) {
            return warning.name + " " + warning.from + " -> " + warning.to;
          });

          if (changed.length) {
            console.warn("gwoRaces: " + changed.join("; "));
            model.gwoRaceWarning(
              loc("!LOC:Race mods changed since this war began:") +
                " " +
                changed.join("; ")
            );
          }

          if (!result.blocked.length) {
            return;
          }

          var missing = _.map(result.blocked, describe);
          console.error("gwoRaces: " + missing.join("; "));
          model.gwoRaceBlock(missing);
          showBlockPopUp();
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoPlayRaces();
