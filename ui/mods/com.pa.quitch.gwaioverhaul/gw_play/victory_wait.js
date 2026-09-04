var gwoVictoryWaitLoaded;

function gwoVictoryWait() {
  if (gwoVictoryWaitLoaded || model.game().isTutorial()) {
    return;
  }

  gwoVictoryWaitLoaded = true;

  try {
    // Hangs off body like launch_progress.html, whose backdrop it shares.
    // Injected before gw_play.js's own ko.applyBindings.
    $("body").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/victory_wait.html"
      )
    );
    locTree($(".gwo-victory-wait"));

    // The observables exist before the bindings; systems.js builds the state
    // beside victory.js so the two never race. See coop.md, "War end".
    var state = ko.observable();

    model.gwoVictoryWait = {
      visible: ko.observable(false),
      title: loc("!LOC:Waiting for players"),
      message: ko.observable(""),
      cancel: function () {
        if (state()) {
          state().cancel();
        }
      },
      state: state,
    };
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoVictoryWait();
