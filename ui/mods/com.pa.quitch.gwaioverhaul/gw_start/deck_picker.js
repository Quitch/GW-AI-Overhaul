// The tech card deck picker: offer any third-party decks beside the built-in
// two, and describe each in the TECHS tooltip. The dropdown itself ships in
// cards_dropdown.html, injected by ui.js. See tech-cards.md, "Third-party
// decks".
var gwoDeckPickerLoaded;

function gwoDeckPicker() {
  if (gwoDeckPickerLoaded) {
    return;
  }

  gwoDeckPickerLoaded = true;

  try {
    var settings = model.gwoDifficultySettings;
    // The deck the last war was started with, read before the bindings run:
    // the select holds only the built-in options until the registry resolves,
    // and Knockout rejects a model value no option can show, writing an
    // option back over it. See race_picker.js.
    var savedDeck = settings.techCardDeck();
    var deckSelectId = "#game-cards";

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deck_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/decks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_picker_options.js",
      ],
      function (deckMods, decks, pickerOptions) {
        deckMods.registerAll();

        var all = decks.all();

        // The built-ins alone are already in the markup; leave vanilla alone.
        if (all.length > 2) {
          $(deckSelectId).html(pickerOptions.optionsHtml(all));

          // The tooltip binding reads this property on every show, so the
          // plain reassignment is picked up on the next hover. Names are
          // uppercased like the built-in lines; the description is the
          // modder's own markup.
          var extra = "";
          _.forEach(all, function (deck) {
            if (deck.tooltip) {
              extra +=
                "<BR>" +
                _.escape(loc(deck.name)).toUpperCase() +
                ": " +
                loc(deck.tooltip);
            }
          });
          model.gwoCardsTooltip = loc(model.gwoCardsTooltip) + extra;
        }

        // Restore the remembered deck; one whose mod is gone falls back to
        // the full GWO deck, which is also what its war will now deal.
        var restored = decks.byId(savedDeck);
        settings.techCardDeck(restored ? restored.id : decks.EXPANDED_ID);
        $(deckSelectId).selectpicker("val", settings.techCardDeck());
        $(deckSelectId).selectpicker("refresh");
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoDeckPicker();
