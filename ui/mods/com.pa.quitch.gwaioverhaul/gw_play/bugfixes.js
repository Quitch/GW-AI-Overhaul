var gwoBugfixesLoaded;

function gwoBugfixes() {
  const game = model.game();

  if (gwoBugfixesLoaded || game.isTutorial()) {
    return;
  }

  gwoBugfixesLoaded = true;

  try {
    const galaxy = game.galaxy();
    const luckyCommanderFixed = ko
      .observable()
      .extend({ local: "gwaio_lucky_commander_fixed" });
    const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    var allFixesApplied =
      gwoSettings &&
      gwoSettings.treasurePlanetFixed &&
      gwoSettings.clusterFixed &&
      luckyCommanderFixed();

    if (!gwoSettings || allFixesApplied) {
      return;
    }

    const fixTreasurePlanetCardList = function (star) {
      if (gwoSettings.treasurePlanetFixed) {
        return;
      }

      if (_.includes(star.cardList(), undefined)) {
        star.cardList([]);
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    const applyClusterTypeFix = function (mod) {
      if (mod.path === "buildable_types") {
        mod.value = mod.value + " & Custom58";
        return mod.file;
      } else if (mod.path === "unit_types") {
        mod.value.push("UNITTYPE_Custom58");
        return mod.file;
      }
    };

    const clusterTypeFix = function (mod, securityFix, workerFix) {
      const security =
        "/pa/units/land/bot_support_commander/bot_support_commander.json";
      const worker = "/pa/units/air/support_platform/support_platform.json";
      if (
        (securityFix === false && mod.file === security) ||
        (workerFix < 2 && mod.file === worker)
      ) {
        return applyClusterTypeFix(mod);
      }
    };

    const fixClusterCommanderTypes = function (star) {
      const ai = star.ai();

      if (gwoSettings.clusterFixed || !ai || !ai.isCluster) {
        return;
      }

      var securityFix = false; // we have to fix `unit_types`
      var workerFix = 0; // we have to fix `buildable_types` and `unit_types`

      for (var mod of ai.inventory) {
        const security =
          "/pa/units/land/bot_support_commander/bot_support_commander.json";
        const worker = "/pa/units/air/support_platform/support_platform.json";
        var result = clusterTypeFix(mod, securityFix, workerFix);
        switch (result) {
          case security:
            securityFix = true;
            break;
          case worker:
            workerFix += 1;
        }

        if (securityFix === true && workerFix >= 2) {
          gwoSettings.clusterFixed = true;
          break;
        }
      }
    };

    const fixLuckyCommanderLocalStorageVariable = function () {
      if (luckyCommanderFixed()) {
        return;
      }

      const unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      const unlockedGwoStartCards = ko
        .observableArray()
        .extend({ local: "gwaio_bank" });
      const index = _.findIndex(
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

    const checkVersion = function (fixedVersion) {
      return gwoSettings.version.localeCompare(fixedVersion, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };

    const checkIfPatchesNeeded = function () {
      const playerIsCluster =
        model.game().inventory().getTag("global", "playerFaction") === 4;

      if (checkVersion("5.76.1") >= 0) {
        luckyCommanderFixed("true");
        return;
      }

      if (checkVersion("5.52.2") >= 0 || playerIsCluster) {
        gwoSettings.clusterFixed = true;
        return;
      }

      if (checkVersion("5.18.0") >= 0) {
        gwoSettings.treasurePlanetFixed = true;
      }
    };
    checkIfPatchesNeeded();

    const applyFixes = function () {
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
