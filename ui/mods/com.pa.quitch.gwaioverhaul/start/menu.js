var gwoMenuLoaded;

function gwoMenu() {
  if (gwoMenuLoaded) {
    return;
  }

  gwoMenuLoaded = true;

  try {
    $("#nav-gw").replaceWith(
      loadHtml("coui://ui/mods/com.pa.quitch.gwaioverhaul/start/menu.html")
    );
    locTree($("#nav-gw"));
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoMenu();
