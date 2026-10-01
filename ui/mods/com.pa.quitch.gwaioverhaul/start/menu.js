(function () {
  try {
    var $gwNav = $(
      ".top-nav-sub-btn.btn_std_ix[data-bind*='navToGalacticWar']"
    ).first();
    var $replacement = $(
      loadHtml("coui://ui/mods/com.pa.quitch.gwaioverhaul/start/menu.html")
    );

    if ($gwNav.length) {
      $gwNav.replaceWith($replacement);
      locTree($replacement);
    }
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
