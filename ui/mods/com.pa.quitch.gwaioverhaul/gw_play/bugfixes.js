(function () {
  var game = model.game();

  if (game.isTutorial()) {
    return;
  }

  try {
    var galaxy = game.galaxy();
    var luckyCommanderFixed = ko
      .observable()
      // Not gwaio_lucky_commander_fixed: up to 7.4.1 a war's version set
      // that without moving the card.
      .extend({ local: "gwaio_lucky_commander_moved" });
    var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    var allFixesApplied =
      gwoSettings &&
      gwoSettings.treasurePlanetFixed &&
      gwoSettings.clusterFixed &&
      gwoSettings.treasureLoadoutDerived &&
      gwoSettings.planetPositionFixed &&
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

    // Explicit planets drawn into stock titans-easy slots were saved with only
    // Position/Velocity, which the server rejects with "No position".
    var fixPlanetPositions = function (star) {
      for (var planet of star.system().planets) {
        if (_.isUndefined(planet.position) && !_.isUndefined(planet.Position)) {
          planet.position = planet.Position;
        }
        if (_.isUndefined(planet.velocity) && !_.isUndefined(planet.Velocity)) {
          planet.velocity = planet.Velocity;
        }
      }
    };

    // The base game's bank read gw_bank before this runs and saves its own
    // list on the next unlock, so the card leaves through that bank.
    var fixLuckyCommanderLocalStorageVariable = function (gwoBank, stockBank) {
      var startCards = stockBank.startCards();
      var kept = _.reject(startCards, { id: "gwaio_start_lucky" });

      if (kept.length !== _.size(startCards)) {
        stockBank.startCards(kept);
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

    var checkIfPatchesNeeded = function (gwoCard) {
      var playerIsCluster = gwoCard.playerIsCluster(model.game().inventory());

      // No version sets planetPositionFixed: Shared Systems for GW generates
      // the systems of any war, so a new war can still need it. Nor
      // luckyCommanderFixed: it is the profile's bank, not the war's.
      if (atLeastVersion("6.8.0")) {
        gwoSettings.treasureLoadoutDerived = true;
      }
      if (atLeastVersion("5.52.2") || playerIsCluster) {
        gwoSettings.clusterFixed = true;
      }
      if (atLeastVersion("5.18.0")) {
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    var applyFixes = function (gwoTreasure, gwoBank, clusterRepair, stockBank) {
      for (var star of galaxy.stars()) {
        if (!gwoSettings.treasurePlanetFixed) {
          fixTreasurePlanetCardList(star);
        }

        if (!gwoSettings.planetPositionFixed) {
          fixPlanetPositions(star);
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
      gwoSettings.planetPositionFixed = true;

      if (luckyCommanderFixed() !== "true") {
        fixLuckyCommanderLocalStorageVariable(gwoBank, stockBank);
      }
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cluster_repair.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
        "shared/gw_common",
      ],
      function (gwoSave, gwoTreasure, gwoBank, clusterRepair, gwoCard, GW) {
        checkIfPatchesNeeded(gwoCard);
        applyFixes(gwoTreasure, gwoBank, clusterRepair, GW.bank);
        gwoSave(game, true);
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
