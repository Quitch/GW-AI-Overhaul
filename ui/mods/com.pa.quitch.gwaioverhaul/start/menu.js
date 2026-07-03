var gwoMenuLoaded;

function gwoMenu() {
  if (gwoMenuLoaded) {
    return;
  }

  gwoMenuLoaded = true;

  try {
    var $gwNav = $("#nav-gw");
    var htmlFile =
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/start/menu_old.html";

    if (!$gwNav.length) {
      $gwNav = $(
        ".top-nav-sub-btn.btn_std_ix[data-bind*='navToGalacticWar']"
      ).first();
      htmlFile = "coui://ui/mods/com.pa.quitch.gwaioverhaul/start/menu.html";
    }

    var $replacement = $(loadHtml(htmlFile));

    if ($gwNav.length) {
      $gwNav.replaceWith($replacement);
      locTree($replacement);
    }
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoMenu();
