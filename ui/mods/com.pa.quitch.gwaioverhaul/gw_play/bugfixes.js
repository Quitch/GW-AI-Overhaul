(function () {
  var game = model.game();

  if (game.isTutorial()) {
    return;
  }

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

    // Wars generated before the offer became derived hold the host's pick, and
    // recorded no treasure star index. A treasure star is never pre-dealt
    // anything else, so its list clears whole.
    var deriveTreasureLoadout = function (gwoTreasure) {
      var stars = galaxy.stars();
      gwoSettings.treasureStar = gwoTreasure.findTreasureStar(stars);

      // A save taken mid-exploration is already showing that list, and clearing
      // it would leave the player nothing to pick.
      var midExplore =
        game.turnState() === "explore" &&
        game.currentStar() === gwoSettings.treasureStar;

      var star = _.isNumber(gwoSettings.treasureStar)
        ? stars[gwoSettings.treasureStar]
        : undefined;
      if (star && !midExplore && star.cardList().length) {
        star.cardList([]);
      }
    };

    var fixLuckyCommanderLocalStorageVariable = function (gwoBank) {
      var unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      var index = _.findIndex(unlockedVanillaStartCards().startCards, {
        id: "gwaio_start_lucky",
      });

      if (index !== -1) {
        unlockedVanillaStartCards().startCards.splice(index, 1);
        unlockedVanillaStartCards.valueHasMutated();
        gwoBank.addStartCard({ id: "gwaio_start_lucky" });
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

    var applyFixes = function (gwoTreasure, gwoBank, clusterRepair) {
      for (var star of galaxy.stars()) {
        if (!gwoSettings.treasurePlanetFixed) {
          fixTreasurePlanetCardList(star);
        }
      }

      if (!gwoSettings.clusterFixed) {
        clusterRepair.repairStars(galaxy.stars());
      }

      if (!gwoSettings.treasureLoadoutDerived) {
        deriveTreasureLoadout(gwoTreasure);
      }

      gwoSettings.treasurePlanetFixed = true; // Treasure planet might not exist
      gwoSettings.clusterFixed = true; // Cluster might not exist
      gwoSettings.treasureLoadoutDerived = true;

      if (luckyCommanderFixed() !== "true") {
        fixLuckyCommanderLocalStorageVariable(gwoBank);
      }
    };

    checkIfPatchesNeeded();

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cluster_repair.js",
      ],
      function (gwoSave, gwoTreasure, gwoBank, clusterRepair) {
        applyFixes(gwoTreasure, gwoBank, clusterRepair);
        gwoSave(game, true);
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
