(function () {
  try {
    var $settings = $(
      "#game_menu .div_game_menu_item[data-bind*='menuSettings']"
    );
    var $item = $(
      loadHtml("coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/menu.html")
    );

    $settings.after($item);
    locTree($item);
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
