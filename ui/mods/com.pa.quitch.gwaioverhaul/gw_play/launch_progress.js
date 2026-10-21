(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    // Hangs off body: the backdrop is position: absolute, and .container is
    // hidden by hidingUI. Injected before gw_play.js's own ko.applyBindings.
    $("body").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress.html"
      )
    );

    // The observables exist before the bindings and before any mod loaded after
    // GWO can read them; the methods do nothing until the module below replaces
    // this object. See architecture.md, "Battle launch, end to end".
    model.gwoLaunchProgress = {
      visible: ko.observable(false),
      title: ko.observable(""),
      message: ko.observable(""),
      steps: ko.observableArray([]),
      begin: _.noop,
      stage: _.noop,
      end: _.noop,
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress_state.js",
      ],
      function (createLaunchProgress) {
        // A co-op viewer's only stock signal is the page being replaced, so the
        // host mirrors the panel to every viewer. The send helper no-ops
        // off-host. Stock queues every host operator; the handler returns
        // nothing, so later updates in that queue need not wait on it.
        var launchProgressOperator = "gwo_launch_progress";

        var progress = createLaunchProgress({
          visible: model.gwoLaunchProgress.visible,
          title: model.gwoLaunchProgress.title,
          message: model.gwoLaunchProgress.message,
          steps: model.gwoLaunchProgress.steps,
          labels: {
            title: loc("!LOC:Preparing for battle"),
            message: loc("!LOC:Saving war"),
          },
          loc: loc,
          broadcast: function (payload) {
            model.sendCampaignHostOperator(launchProgressOperator, payload);
          },
        });
        model.gwoLaunchProgress = progress;

        model.registerCampaignHostOperatorHandler(
          launchProgressOperator,
          function (operator) {
            if (!model.isCampaignViewer()) {
              return;
            }
            progress.receive(operator.payload || {});
          }
        );

        // No disconnect dismissal: gwCampaignConnected is never written false,
        // and both teardown paths navigate to transit, taking the panel with
        // the page.

        // Outside every other mod's wrapper: mods that report to this screen
        // load before GWO.
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
})();
