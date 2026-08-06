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
      gwoSettings.treasureLoadoutDerived &&
      luckyCommanderFixed();

    if (!gwoSettings || allFixesApplied) {
      return;
    }

    var fixTreasurePlanetCardList = function (star) {
      if (_.includes(star.cardList(), undefined)) {
        star.cardList([]);
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    // Wars generated before the offer became derived hold the host's pick. A
    // treasure star is never pre-dealt anything else, so the list clears whole.
    var dropPreDealtTreasureLoadout = function (star) {
      var ai = ko.isObservable(star.ai) && star.ai();
      if (ai && ai.treasurePlanet && star.cardList().length) {
        star.cardList([]);
      }
    };

    var fixClusterType = function (mod, security) {
      // Worker needs two fixes but each fix is applied in a separate mod
      if (mod.path === "buildable_types") {
        mod.value = mod.value + " & Custom58";
        return mod.file;
      } else if (mod.file === security && mod.path === "unit_types") {
        mod.value.push("UNITTYPE_Custom58");
        return mod.file;
      }
      return null;
    };

    var fixClusterCommanderTypes = function (ai) {
      var securityFix = false; // we have to fix `unit_types`
      var workerFix = 0; // we have to fix `buildable_types` and `unit_types`
      var security =
        "/pa/units/land/bot_support_commander/bot_support_commander.json";
      var worker = "/pa/units/air/support_platform/support_platform.json";

      for (var mod of ai.inventory) {
        var isSecurityCandidate = securityFix !== true && mod.file === security;
        var isWorkerCandidate = workerFix < 2 && mod.file === worker;

        if (!isSecurityCandidate && !isWorkerCandidate) {
          continue;
        }

        var result = fixClusterType(mod, security);
        switch (result) {
          case security:
            securityFix = true;
            break;
          case worker:
            workerFix += 1;
            break;
        }

        if (securityFix === true && workerFix >= 2) {
          gwoSettings.clusterFixed = true;
          break;
        }
      }
    };

    var fixLuckyCommanderLocalStorageVariable = function () {
      var unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      var unlockedGwoStartCards = ko
        .observableArray()
        .extend({ local: "gwaio_bank" });
      var index = _.findIndex(unlockedVanillaStartCards().startCards, {
        id: "gwaio_start_lucky",
      });

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
      if (!gwoSettings.version) {
        return -1;
      }
      return gwoSettings.version.localeCompare(fixedVersion, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };

    var atLeastVersion = function (version) {
      return checkVersion(version) >= 0;
    };

    var checkIfPatchesNeeded = function () {
      var playerIsCluster =
        model.game().inventory().getTag("global", "playerFaction") === 4;

      if (atLeastVersion("6.8.0")) {
        gwoSettings.treasureLoadoutDerived = true;
      }
      if (atLeastVersion("5.76.1")) {
        luckyCommanderFixed("true");
      }
      if (atLeastVersion("5.52.2") || playerIsCluster) {
        gwoSettings.clusterFixed = true;
      }
      if (atLeastVersion("5.18.0")) {
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    var applyFixes = function () {
      for (var star of galaxy.stars()) {
        if (!gwoSettings.treasurePlanetFixed) {
          fixTreasurePlanetCardList(star);
        }

        if (!gwoSettings.treasureLoadoutDerived) {
          dropPreDealtTreasureLoadout(star);
        }

        if (
          !gwoSettings.clusterFixed &&
          ko.isObservable(star.ai) &&
          star.ai().isCluster
        ) {
          fixClusterCommanderTypes(star.ai());
        }
      }

      gwoSettings.treasurePlanetFixed = true; // Treasure planet might not exist
      gwoSettings.clusterFixed = true; // Cluster might not exist
      gwoSettings.treasureLoadoutDerived = true;

      if (luckyCommanderFixed() !== "true") {
        fixLuckyCommanderLocalStorageVariable();
      }
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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoBugfixes();
