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
    const allFixesApplied =
      gwoSettings &&
      gwoSettings.treasurePlanetFixed &&
      gwoSettings.clusterFixed &&
      gwoSettings.treasureLoadoutDerived &&
      luckyCommanderFixed();

    if (!gwoSettings || allFixesApplied) {
      return;
    }

    const fixTreasurePlanetCardList = (star) => {
      if (_.includes(star.cardList(), undefined)) {
        star.cardList([]);
        gwoSettings.treasurePlanetFixed = true;
      }
    };

    // Wars generated before the offer became derived hold the host's pick, and
    // recorded no treasure star index. A treasure star is never pre-dealt
    // anything else, so its list clears whole.
    const deriveTreasureLoadout = (gwoTreasure) => {
      const stars = galaxy.stars();
      gwoSettings.treasureStar = gwoTreasure.findTreasureStar(stars);

      // A save taken mid-exploration is already showing that list, and clearing
      // it would leave the player nothing to pick.
      const midExplore =
        game.turnState() === "explore" &&
        game.currentStar() === gwoSettings.treasureStar;

      const star = _.isNumber(gwoSettings.treasureStar)
        ? stars[gwoSettings.treasureStar]
        : undefined;
      if (star && !midExplore && star.cardList().length) {
        star.cardList([]);
      }
    };

    const fixClusterType = (mod, security) => {
      // Worker needs two fixes but each fix is applied in a separate mod
      if (mod.path === "buildable_types") {
        mod.value = `${mod.value} & Custom58`;
        return mod.file;
      } else if (mod.file === security && mod.path === "unit_types") {
        mod.value.push("UNITTYPE_Custom58");
        return mod.file;
      }
      return null;
    };

    const fixClusterCommanderTypes = (ai) => {
      let securityFix = false; // we have to fix `unit_types`
      let workerFix = 0; // we have to fix `buildable_types` and `unit_types`
      const security =
        "/pa/units/land/bot_support_commander/bot_support_commander.json";
      const worker = "/pa/units/air/support_platform/support_platform.json";

      for (const mod of ai.inventory) {
        const isSecurityCandidate =
          securityFix !== true && mod.file === security;
        const isWorkerCandidate = workerFix < 2 && mod.file === worker;

        if (!isSecurityCandidate && !isWorkerCandidate) {
          continue;
        }

        const result = fixClusterType(mod, security);
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

    const fixLuckyCommanderLocalStorageVariable = () => {
      const unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      const unlockedGwoStartCards = ko
        .observableArray()
        .extend({ local: "gwaio_bank" });
      const index = _.findIndex(unlockedVanillaStartCards().startCards, {
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

    const checkVersion = (fixedVersion) => {
      if (!gwoSettings.version) {
        return -1;
      }
      return gwoSettings.version.localeCompare(fixedVersion, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };

    const atLeastVersion = (version) => checkVersion(version) >= 0;

    const checkIfPatchesNeeded = () => {
      const playerIsCluster =
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

    const applyFixes = (gwoTreasure) => {
      for (const star of galaxy.stars()) {
        if (!gwoSettings.treasurePlanetFixed) {
          fixTreasurePlanetCardList(star);
        }

        if (
          !gwoSettings.clusterFixed &&
          ko.isObservable(star.ai) &&
          star.ai().isCluster
        ) {
          fixClusterCommanderTypes(star.ai());
        }
      }

      if (!gwoSettings.treasureLoadoutDerived) {
        deriveTreasureLoadout(gwoTreasure);
      }

      gwoSettings.treasurePlanetFixed = true; // Treasure planet might not exist
      gwoSettings.clusterFixed = true; // Cluster might not exist
      gwoSettings.treasureLoadoutDerived = true;

      if (luckyCommanderFixed() !== "true") {
        fixLuckyCommanderLocalStorageVariable();
      }
    };

    checkIfPatchesNeeded();

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js",
      ],
      (gwoSave, gwoTreasure) => {
        applyFixes(gwoTreasure);
        gwoSave(game, true);
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoBugfixes();
