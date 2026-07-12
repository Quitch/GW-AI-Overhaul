var gwoBugfixesLoaded;

function gwoBugfixes() {
  var game = model.game();

  if (gwoBugfixesLoaded || game.isTutorial()) {
    return;
  }

  gwoBugfixesLoaded = true;

  try {
    var galaxy = game.galaxy();
    var luckyCommanderFixed = ko
      .observable()
      .extend({ local: "gwaio_lucky_commander_fixed" });
    var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    var allFixesApplied =
      gwoSettings &&
      gwoSettings.treasurePlanetFixed &&
      gwoSettings.clusterFixed &&
      luckyCommanderFixed();

    if (!gwoSettings || allFixesApplied) {
      return;
    }

    var fixTreasurePlanetCardList = function (star) {
      if (gwoSettings.treasurePlanetFixed) {
        return;
      }

      if (_.includes(star.cardList(), undefined)) {
        star.cardList([]);
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    var fixClusterType = function (mod, securityFix, workerFix) {
      var security =
        "/pa/units/land/bot_support_commander/bot_support_commander.json";
      var worker = "/pa/units/air/support_platform/support_platform.json";

      if (
        (securityFix === true || mod.file !== security) &&
        (workerFix >= 2 || mod.file !== worker)
      ) {
        return;
      }

      if (mod.path === "buildable_types") {
        mod.value = mod.value + " & Custom58";
        return mod.file;
      } else if (mod.path === "unit_types") {
        mod.value.push("UNITTYPE_Custom58");
        return mod.file;
      }
    };

    var fixClusterCommanderTypes = function (star) {
      var ai = star.ai();

      if (gwoSettings.clusterFixed || !ai || !ai.isCluster) {
        return;
      }

      var securityFix = false; // we have to fix `unit_types`
      var workerFix = 0; // we have to fix `buildable_types` and `unit_types`
      var security =
        "/pa/units/land/bot_support_commander/bot_support_commander.json";
      var worker = "/pa/units/air/support_platform/support_platform.json";

      for (var mod of ai.inventory) {
        var result = fixClusterType(mod, securityFix, workerFix);
        switch (result) {
          case security:
            securityFix = true;
            break;
          case worker:
            workerFix += 1;
            break;
          default:
            // falls through
            break;
        }

        if (securityFix === true && workerFix >= 2) {
          gwoSettings.clusterFixed = true;
          break;
        }
      }
    };

    var fixLuckyCommanderLocalStorageVariable = function () {
      if (luckyCommanderFixed()) {
        return;
      }

      var unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      var unlockedGwoStartCards = ko
        .observableArray()
        .extend({ local: "gwaio_bank" });
      var index = _.findIndex(
        unlockedVanillaStartCards().startCards,
        "id",
        "gwaio_start_lucky"
      );

      if (index !== -1) {
        unlockedVanillaStartCards().startCards.splice(index, 1);
        unlockedVanillaStartCards.valueHasMutated();
        unlockedGwoStartCards().startCards.push({
          id: "gwaio_start_lucky",
        });
        unlockedGwoStartCards.valueHasMutated();
      }

      luckyCommanderFixed("true");
    };

    var checkVersion = function (fixedVersion) {
      return gwoSettings.version.localeCompare(fixedVersion, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };

    var checkIfPatchesNeeded = function () {
      var playerIsCluster =
        model.game().inventory().getTag("global", "playerFaction") === 4;

      if (checkVersion("5.76.1") >= 0) {
        luckyCommanderFixed("true");
      } else if (checkVersion("5.52.2") >= 0 || playerIsCluster) {
        gwoSettings.clusterFixed = true;
      } else if (checkVersion("5.18.0") >= 0) {
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    var applyFixes = function () {
      for (var star of galaxy.stars()) {
        if (gwoSettings.treasurePlanetFixed && gwoSettings.clusterFixed) {
          break;
        }

        fixTreasurePlanetCardList(star);
        fixClusterCommanderTypes(star);
      }

      gwoSettings.treasurePlanetFixed = true; // Treasure planet might not exist
      gwoSettings.clusterFixed = true; // Cluster might not exist

      fixLuckyCommanderLocalStorageVariable();
    };

    checkIfPatchesNeeded();
    applyFixes();

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
