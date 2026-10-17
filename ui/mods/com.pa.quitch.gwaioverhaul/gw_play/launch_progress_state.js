// The measured half of gw_play/launch_progress.js. The observables are the
// scene's, handed in so the DOM bindings and any mod holding the object keep
// the same identities. See architecture.md, "Battle launch, end to end".
define([], function () {
  return function (deps) {
    var visible = deps.visible;
    var title = deps.title;
    var message = deps.message;
    var steps = deps.steps;
    var labels = deps.labels;
    var localise =
      deps.loc ||
      (typeof loc === "function"
        ? loc
        : function (key) {
            return key;
          });
    var broadcast = deps.broadcast || function () {};

    var showBegin = function () {
      if (visible()) {
        return false;
      }
      steps([]);
      title(labels.title);
      message(labels.message);
      visible(true);
      return true;
    };

    // Nothing to report outside a launch: a mod may mount on scene entry too.
    var showStage = function (text) {
      if (!visible()) {
        return false;
      }
      if (message()) {
        steps.push(message());
      }
      message(text);
      return true;
    };

    var showEnd = function () {
      var wasVisible = visible();
      visible(false);
      message("");
      steps([]);
      return wasVisible;
    };

    // Built from keys so each co-op viewer reads the line in its own language.
    var keyedText = function (source) {
      var text = localise(source.key, source.options);
      if (source.prefix) {
        text = localise(source.prefix) + ": " + text;
      }
      return text;
    };

    var progress = {
      visible: visible,
      title: title,
      message: message,
      steps: steps,

      begin: function () {
        if (showBegin()) {
          broadcast({ action: "begin" });
        }
      },

      stage: function (text, source) {
        if (!showStage(text)) {
          return;
        }
        var payload = { action: "stage", message: text };
        if (source && source.key) {
          payload.key = source.key;
          if (source.prefix) {
            payload.prefix = source.prefix;
          }
          if (source.options) {
            payload.options = source.options;
          }
        }
        broadcast(payload);
      },

      end: function () {
        if (showEnd()) {
          broadcast({ action: "end" });
        }
      },

      receive: function (payload) {
        if (payload.action === "begin") {
          showBegin();
        } else if (payload.action === "stage") {
          // A viewer that joined after the host's begin still gets the panel.
          showBegin();
          showStage(payload.key ? keyedText(payload) : payload.message);
        } else if (payload.action === "end") {
          showEnd();
        }
      },

      // Stock fight's early returns leave launchingFight as they found it, so
      // the panel closes unless a launch is already running. An outer wrapper
      // may defer the stock call behind a promise, so settle after it.
      settle: function (result, launching) {
        var check = function () {
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
  };
});
