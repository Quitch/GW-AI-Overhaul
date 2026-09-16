// The measured half of gw_play/launch_progress.js. The observables are the
// scene's, handed in so the DOM bindings and any mod holding the object keep
// the same identities. See architecture.md, "Battle launch, end to end".
define([], () => (deps) => {
  const visible = deps.visible;
  const title = deps.title;
  const message = deps.message;
  const steps = deps.steps;
  const labels = deps.labels;

  const progress = {
    visible,
    title,
    message,
    steps,

    begin: function () {
      if (visible()) {
        return;
      }
      steps([]);
      title(labels.title);
      message(labels.message);
      visible(true);
    },

    // Nothing to report outside a launch: a mod may mount on scene entry too.
    stage: function (text) {
      if (!visible()) {
        return;
      }
      if (message()) {
        steps.push(message());
      }
      message(text);
    },

    end: function () {
      visible(false);
      message("");
      steps([]);
    },

    // Every early return in stock fight leaves launchingFight false. An outer
    // wrapper may defer the stock call behind a promise, so settle after it.
    settle: function (result, launching) {
      const check = () => {
        if (!launching()) {
          progress.end();
        }
      };
      if (result && typeof result.then === "function") {
        result.then(check, check);
      } else {
        check();
      }
    },
  };

  return progress;
});
