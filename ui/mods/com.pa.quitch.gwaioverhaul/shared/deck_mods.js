// Engine glue for shared/decks.js: adopt whatever a mod pushed onto
// model.gwoDecks before this ran. GWO's built-ins were registered when
// decks.js loaded. See tech-cards.md, "Third-party decks".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/decks.js"], function (
  decks
) {
  // Descriptor object references already handled, so the several consumers in
  // one scene (the deal, the picker, the war panel) re-register nothing and
  // re-warn about nothing.
  var seen = [];

  // Adopted, never assigned over - see tech-cards.md.
  var registerAll = function () {
    model.gwoDecks = _.isArray(model.gwoDecks) ? model.gwoDecks : [];

    _.forEach(model.gwoDecks, function (descriptor) {
      if (_.contains(seen, descriptor)) {
        return;
      }
      seen.push(descriptor);

      try {
        if (descriptor && decks.byId(descriptor.id)) {
          console.warn(
            "gwoDeckMods: deck " +
              descriptor.id +
              " registered twice; the later registration wins"
          );
        }
        decks.register(descriptor);
      } catch (e) {
        console.error("gwoDeckMods: deck not registered: " + (e.message || e));
      }
    });
  };

  return {
    registerAll: registerAll,
    // Test-only: `seen` outlives the module, and the harness loads each
    // module once per process.
    reset: function () {
      seen = [];
    },
  };
});
