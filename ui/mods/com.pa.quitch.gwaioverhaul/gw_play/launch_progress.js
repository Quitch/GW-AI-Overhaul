(() => {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    // Hangs off body: the backdrop is position: absolute, and .container is
    // hidden by hidingUI. Injected before gw_play.js's own ko.applyBindings.
    $("body").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress.html",
      ),
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
      (createLaunchProgress) => {
        const progress = createLaunchProgress({
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

        // A co-op viewer's only stock signal is the page being replaced, so the
        // host mirrors the panel to every viewer. Wrapping the methods rather
        // than the callers covers stages reported by other mods too. The send
        // helper no-ops off-host; the handler returns nothing, so it never
        // joins the state apply tail.
        const launchProgressOperator = "gwo_launch_progress";

        const broadcast = (action, text) => {
          model.sendCampaignHostOperator(launchProgressOperator, {
            action,
            message: text,
          });
        };

        const localBegin = progress.begin;
        progress.begin = () => {
          localBegin();
          broadcast("begin");
        };

        const localStage = progress.stage;
        progress.stage = (text) => {
          localStage(text);
          // stage is a no-op outside a launch; mirror that.
          if (progress.visible()) {
            broadcast("stage", text);
          }
        };

        const localEnd = progress.end;
        progress.end = () => {
          localEnd();
          broadcast("end");
        };

        model.registerCampaignHostOperatorHandler(
          launchProgressOperator,
          (operator) => {
            if (!model.isCampaignViewer()) {
              return;
            }
            const payload = operator.payload || {};
            if (payload.action === "begin") {
              localBegin();
            } else if (payload.action === "stage") {
              localStage(payload.message);
            } else if (payload.action === "end") {
              localEnd();
            }
          },
        );

        // No disconnect dismissal: gwCampaignConnected is never written false,
        // and both teardown paths navigate to transit, taking the panel with
        // the page.

        // Outermost wrapper: mods that report to this screen load before GWO.
        // Stock restartFight delegates to model.fight, so one wrap covers both.
        const previousFight = model.fight;
        model.fight = function (viewModel, event, cheat) {
          // The cheat path saves and returns without launching.
          if (cheat === true) {
            return previousFight.apply(this, arguments);
          }
          progress.begin();
          const result = previousFight.apply(this, arguments);
          progress.settle(result, model.launchingFight);
          return result;
        };

        // Stock clears launchingFight on every failed launch, and a mod loaded
        // after GWO that replaces model.fight still sets it.
        model.launchingFight.subscribe((launching) => {
          if (launching) {
            progress.begin();
          } else {
            progress.end();
          }
        });
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
