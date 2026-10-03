(function () {
  try {
    // A scene's model.gwoBugReportInput can wait on GW Server Mods; past this
    // the form opens with what the scene alone knows.
    var GATHER_TIMEOUT_MS = 3000;

    // PA's log keeps only the first console argument, so it is one string.
    var log = function (gwoBugReport, scene, input, reason) {
      try {
        console.log(
          gwoBugReport.logText(gwoBugReport.fields(scene, input), reason)
        );
      } catch (e) {
        console.error(
          "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
        );
      }
    };

    // Writes the form's values to the log, so a report from GitHub has them
    // too. Waits on the scene's input with no time limit.
    model.gwoLogBugReport = function (reason) {
      if (!_.isFunction(model.gwoBugReportInput)) {
        return;
      }
      requireGW(
        ["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report.js"],
        function (gwoBugReport) {
          var scene = gwoBugReport.sceneOf(window.location.pathname);
          try {
            model.gwoBugReportInput().then(function (input) {
              log(gwoBugReport, scene, input, reason);
            });
          } catch (e) {
            console.error(
              "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
            );
          }
        }
      );
    };

    model.gwoReportBug = function () {
      requireGW(
        ["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report.js"],
        function (gwoBugReport) {
          var scene = gwoBugReport.sceneOf(window.location.pathname);
          var opened = false;

          var open = function (input) {
            if (opened) {
              return;
            }
            opened = true;
            log(
              gwoBugReport,
              scene,
              input,
              "Report a Galactic War Bug clicked"
            );
            var url;
            try {
              url = gwoBugReport.buildUrl(gwoBugReport.fields(scene, input));
            } catch (e) {
              console.error(
                "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
              );
              url = gwoBugReport.buildUrl(gwoBugReport.fields(scene));
            }
            engine.call("web.launchPage", url);
          };

          var openSceneOnly = function (e) {
            if (e) {
              console.error(
                "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
              );
            }
            open();
          };

          if (!_.isFunction(model.gwoBugReportInput)) {
            open();
            return;
          }
          _.delay(openSceneOnly, GATHER_TIMEOUT_MS);
          try {
            model.gwoBugReportInput().then(open, openSceneOnly);
          } catch (e) {
            openSceneOnly(e);
          }
        }
      );
    };
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
