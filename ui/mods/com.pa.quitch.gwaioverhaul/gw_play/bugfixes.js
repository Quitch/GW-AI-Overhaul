(() => {
  const game = model.game();

  if (game.isTutorial()) {
    return;
  }

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
      // A war that records typeOfBuffs builds its spec mods at launch from the
      // live Cluster mods, so only a baked inventory needs repairing.
      if (!Array.isArray(ai.inventory)) {
        return;
      }
      let securityFix = false;
      let workerFix = 0;
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

    const fixLuckyCommanderLocalStorageVariable = (gwoBank) => {
      const unlockedVanillaStartCards = ko
        .observableArray()
        .extend({ local: "gw_bank" });
      const index = _.findIndex(unlockedVanillaStartCards().startCards, {
        id: "gwaio_start_lucky",
      });

      if (index !== -1) {
        unlockedVanillaStartCards().startCards.splice(index, 1);
        unlockedVanillaStartCards.valueHasMutated();
        gwoBank.addStartCard({ id: "gwaio_start_lucky" });
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

    const applyFixes = (gwoTreasure, gwoBank) => {
      for (const star of galaxy.stars()) {
        if (!gwoSettings.treasurePlanetFixed) {
          fixTreasurePlanetCardList(star);
        }

        // A neutral star's ai() is undefined.
        const ai = ko.isObservable(star.ai) ? star.ai() : undefined;
        if (!gwoSettings.clusterFixed && ai && ai.isCluster) {
          fixClusterCommanderTypes(ai);
        }
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
      ],
      (gwoSave, gwoTreasure, gwoBank) => {
        applyFixes(gwoTreasure, gwoBank);
        gwoSave(game, true);
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
