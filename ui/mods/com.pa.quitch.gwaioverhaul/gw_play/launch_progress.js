var gwoLaunchProgressLoaded;

function gwoLaunchProgress() {
  if (gwoLaunchProgressLoaded || model.game().isTutorial()) {
    return;
  }

  gwoLaunchProgressLoaded = true;

  try {
    // Hangs off body: the backdrop is position: absolute, and .container is
    // hidden by hidingUI. Injected before gw_play.js's own ko.applyBindings.
    $("body").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress.html"
      )
    );
    locTree($(".gwo-launch-progress"));

    // The observables exist before the bindings and before any mod loaded after
    // GWO can read them; the methods arrive with the module below. See
    // architecture.md, "Battle launch, end to end".
    model.gwoLaunchProgress = {
      visible: ko.observable(false),
      title: ko.observable(""),
      message: ko.observable(""),
      steps: ko.observableArray([]),
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress_state.js",
      ],
      function (createLaunchProgress) {
        var progress = createLaunchProgress({
          visible: model.gwoLaunchProgress.visible,
          title: model.gwoLaunchProgress.title,
          message: model.gwoLaunchProgress.message,
          steps: model.gwoLaunchProgress.steps,
          labels: {
            title: loc("!LOC:Preparing for battle"),
            message: loc("!LOC:Saving war"),
          },
        });
        model.gwoLaunchProgress = progress;

        // Outermost wrapper: mods that report to this screen load before GWO.
        // Stock restartFight delegates to model.fight, so one wrap covers both.
        var previousFight = model.fight;
        model.fight = function (viewModel, event, cheat) {
          // The cheat path saves and returns without launching.
          if (cheat === true) {
            return previousFight.apply(this, arguments);
          }
          progress.begin();
          var result = previousFight.apply(this, arguments);
          progress.settle(result, model.launchingFight);
          return result;
        };

        // Stock clears launchingFight on every failed launch, and a mod loaded
        // after GWO that replaces model.fight still sets it.
        model.launchingFight.subscribe(function (launching) {
          if (launching) {
            progress.begin();
          } else {
            progress.end();
          }
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoLaunchProgress();
