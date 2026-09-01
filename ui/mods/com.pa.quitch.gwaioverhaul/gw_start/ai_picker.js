// The per-race AI brain table: a modal with one row per race and an Opponent
// and Ally brain per row, replacing the two war-wide AI dropdowns. Each cell
// offers only the brains that know its race, so no coercion is needed at
// pick time. Cells are the scene's usual selectpicker dropdowns; the rows are
// rebuilt wholesale on every change, so each select is initialised once with
// its final option list and never needs a manual refresh. See races.md.
var gwoAiPickerLoaded;

function gwoAiPicker() {
  if (gwoAiPickerLoaded) {
    return;
  }

  gwoAiPickerLoaded = true;

  try {
    var settings = model.gwoDifficultySettings;
    // Written into by the requireGW callback below; the handlers only run on
    // clicks, which cannot arrive before the scene has rendered.
    var races;
    var brainTable;

    var buildRows = function () {
      if (!races) {
        return [];
      }

      var raceOptions = model.gwoRaceOptions();
      var namesById = {};
      _.forEach(raceOptions, function (option) {
        namesById[option.id] = option.name;
      });

      var rows = brainTable.rowsFor(
        settings.aiByRace(),
        _.pluck(raceOptions, "id"),
        settings.ai(),
        settings.aiAlly(),
        api.content.usingTitans()
      );

      return _.map(rows, function (row) {
        var descriptor = races.byId(row.id);
        return {
          id: row.id,
          stale: row.stale,
          // A stale race's descriptor may still be registered (its client mod
          // outlives its server mod); failing that the id has to do.
          name:
            namesById[row.id] || (descriptor ? loc(descriptor.name) : row.id),
          options: row.options,
          enemy: ko.observable(row.enemy),
          ally: ko.observable(row.ally),
        };
      });
    };

    // Observables the markup binds to exist before the bindings are applied.
    // See shadowing.md, "Function hijacking".
    model.gwoAiModalVisible = ko.observable(false);
    model.gwoAiTableRows = ko.observableArray([]);
    model.gwoAiModalIntro =
      loc(
        "!LOC:TITANS: base game AI<br>QUELLER: greater challenge at the cost of performance<br>PENCHANT: increased personality"
      ) +
      loc("!LOC:<br>An AI that does not know a race is not offered for it.");

    // The rows are the draft: open re-seeds them from the settings, close
    // discards them, apply writes them back.
    model.openGwoAiModal = function () {
      model.gwoAiTableRows(buildRows());
      model.gwoAiModalVisible(true);
    };
    model.closeGwoAiModal = function () {
      model.gwoAiModalVisible(false);
    };
    model.applyGwoAiModal = function () {
      if (!races) {
        model.gwoAiModalVisible(false);
        return;
      }

      // Start from the stored table, so a stale race's remembered row
      // survives an apply that never rendered it editable.
      var stored = _.cloneDeep(settings.aiByRace()) || {};
      _.forEach(model.gwoAiTableRows(), function (row) {
        if (row.stale) {
          return;
        }
        if (row.id === races.MLA_ID) {
          // The war-wide observables ARE the MLA row. See races.md.
          settings.ai(row.enemy());
          settings.aiAlly(row.ally());
          return;
        }
        stored[row.id] = { enemy: row.enemy(), ally: row.ally() };
      });
      settings.aiByRace(stored);
      model.gwoAiModalVisible(false);
    };

    $("#gwo-game-options-panel").after(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_modal.html"
      )
    );
    // Must hang off body: the modal is position: absolute, and in the Setup
    // column it would resolve against a short, scrolling ancestor.
    $("#gwo-ai-modal").appendTo("body");
    locTree($("#gwo-ai-panel"));
    locTree($("#gwo-ai-modal"));

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
      ],
      function (racesModule, brainTableModule) {
        races = racesModule;
        brainTable = brainTableModule;

        model.gwoAiTableRows(buildRows());
        // The installed race list lands asynchronously (race_picker.js), so
        // the table grows after first render; a foreach binding tolerates
        // that, and an open modal simply refreshes.
        model.gwoRaceOptions.subscribe(function () {
          model.gwoAiTableRows(buildRows());
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}

gwoAiPicker();
