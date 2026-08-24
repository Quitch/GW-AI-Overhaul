var gwoLiveGameModifiersLoaded;

function gwoLiveGameModifiers() {
  if (gwoLiveGameModifiersLoaded) {
    return;
  }

  gwoLiveGameModifiersLoaded = true;

  try {
    model.gwoGameOptions = ko.observable();

    var stockUpdateGameOptions = model.updateGameOptions;
    model.updateGameOptions = function (options) {
      stockUpdateGameOptions.apply(model, arguments);
      if (options) {
        model.gwoGameOptions(options);
      }
    };

    model.gwoGameModifiersText = ko.computed(function () {
      var options = model.gwoGameOptions();
      if (!options || options.game_type !== "Galactic War") {
        return "";
      }

      var modifiers = [];
      if (options.sudden_death_mode) {
        modifiers.push(loc("!LOC:Sudden Death"));
      } else if (options.eradication_mode) {
        var targets = [loc("!LOC:Commander")];
        if (options.eradication_mode_sub_commanders) {
          targets.push(loc("!LOC:Colonel"));
        }
        if (options.eradication_mode_factories) {
          targets.push(loc("!LOC:Factory"));
        }
        if (options.eradication_mode_fabricators) {
          targets.push(loc("!LOC:Fabber"));
        }
        modifiers.push(loc("!LOC:Eradicate") + ": " + targets.join(", "));
      }
      if (options.bounty_mode) {
        var bounty = loc("!LOC:Bounties");
        if (_.isNumber(options.bounty_value)) {
          bounty += " x" + options.bounty_value;
        }
        modifiers.push(bounty);
      }
      return modifiers.join(" | ");
    });

    model.gwoGameModifiersText.subscribe(function (text) {
      if (api.panels.options_bar) {
        api.panels.options_bar.message("gwo_game_modifiers", text);
      }
    });
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoLiveGameModifiers();
