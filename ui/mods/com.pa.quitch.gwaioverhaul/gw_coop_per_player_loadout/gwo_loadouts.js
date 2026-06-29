var gwoLoadoutsLoaded;

function gwoLoadouts() {
  if (gwoLoadoutsLoaded) {
    return;
  }

  gwoLoadoutsLoaded = true;

  try {
    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js"],
      function (loadouts) {
        model.startCards(loadouts.startCards);
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoLoadouts();
