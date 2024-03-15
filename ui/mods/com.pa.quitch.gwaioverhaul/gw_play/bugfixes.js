var gwoBugfixesLoaded;

function gwoBugfixes() {
  if (gwoBugfixesLoaded) {
    return;
  }

  gwoBugfixesLoaded = true;

  try {
    var game = model.game();
    var galaxy = game.galaxy();
    var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    var allFixesApplied =
      gwoSettings &&
      gwoSettings.treasurePlanetFixed &&
      gwoSettings.clusterFixed;

    if (!gwoSettings || allFixesApplied) {
      return;
    }

    var star = {};
    var securityFix = false; // we have to fix `unit_types`
    var workerFix = 0; // we have to fix `buildable_types` and `unit_types`

    for (star of galaxy.stars()) {
      allFixesApplied =
        gwoSettings.treasurePlanetFixed && gwoSettings.clusterFixed;

      if (allFixesApplied) {
        break;
      }

      // Fix GWO v5.17.1 and earlier treasure planet bug when player had all loadouts unlocked
      if (
        !gwoSettings.treasurePlanetFixed &&
        _.includes(star.cardList(), undefined)
      ) {
        star.cardList([]);
        gwoSettings.treasurePlanetFixed = true;
      }

      // Fix GWO v5.22.1 and earlier Cluster commanders doing nothing
      if (!gwoSettings.clusterFixed) {
        var warVersion = gwoSettings.version;
        var fixedVersion = "5.52.2";
        var clusterFixDeployed = warVersion.localeCompare(
          fixedVersion,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
        if (clusterFixDeployed >= 0) {
          gwoSettings.clusterFixed = true;
        } else {
          var applyFix = function (mod) {
            if (mod.path === "buildable_types") {
              mod.value = mod.value + " & Custom58";
              return mod.file;
            } else if (mod.path === "unit_types") {
              mod.value.push("UNITTYPE_Custom58");
              return mod.file;
            }
          };

          var clusterTypeFix = function (mod) {
            var security =
              "/pa/units/land/bot_support_commander/bot_support_commander.json";
            var worker = "/pa/units/air/support_platform/support_platform.json";
            if (mod.file === security && securityFix === false) {
              return applyFix(mod);
            }
            if (mod.file === worker && workerFix < 2) {
              return applyFix(mod);
            }
          };

          if (!gwoSettings.clusterFixed && star.ai()) {
            var ai = star.ai();
            for (var mod of ai.inventory) {
              if (ai.isCluster) {
                var security =
                  "/pa/units/land/bot_support_commander/bot_support_commander.json";
                var worker =
                  "/pa/units/air/support_platform/support_platform.json";
                var result = clusterTypeFix(mod);
                switch (result) {
                  case security:
                    securityFix = true;
                    break;
                  case worker:
                    workerFix += 1;
                }

                if (securityFix === true && workerFix === 2) {
                  gwoSettings.clusterFixed = true;
                  break;
                }
              }
            }
          }
        }
      }
    }

    gwoSettings.treasurePlanetFixed = true;
    gwoSettings.clusterFixed = true;

    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
      function (gwoSave) {
        gwoSave(game, true);
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoBugfixes();
