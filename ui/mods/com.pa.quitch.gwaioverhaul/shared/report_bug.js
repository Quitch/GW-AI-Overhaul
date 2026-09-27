(function () {
  try {
    var BUG_REPORT_URL =
      "https://github.com/Quitch/GW-AI-Overhaul/issues/new?template=bug_report.md";

    model.gwoReportBug = function () {
      engine.call("web.launchPage", BUG_REPORT_URL);
    };
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
