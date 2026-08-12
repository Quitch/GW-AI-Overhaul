var gwoRecordHighestDifficultyDefeatedLoaded;

function gwoRecordHighestDifficultyDefeated() {
  if (gwoRecordHighestDifficultyDefeatedLoaded) {
    return;
  }

  gwoRecordHighestDifficultyDefeatedLoaded = true;

  try {
    const game = model.game();
    const galaxy = game.galaxy();
    const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    const noBadge =
      gwoSettings && (gwoSettings.cheatsUsed || gwoSettings.tooManyPlayers);

    if (!gwoSettings || noBadge || game.gameState() !== "won") {
      return;
    }

    const getPreviousBest = (defeatedDifficulties) =>
      Array.isArray(defeatedDifficulties)
        ? defeatedDifficulties[0]
        : defeatedDifficulties;

    const loadoutId = game.inventory().cards()[0].id;
    const defeatedDifficulties = ko
      .observable()
      .extend({ local: `gwaio_victory_${loadoutId}` });
    const previousBest = getPreviousBest(defeatedDifficulties());

    const isNewHighScore = (currentDifficulty, previousBest) =>
      currentDifficulty > previousBest ||
      (currentDifficulty === previousBest && game.hardcore()) ||
      _.isUndefined(previousBest);

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
      ],
      (gwoDifficulty) => {
        // Read from the difficulty data, not restated: renaming or inserting a
        // tier would otherwise shift everybody's badge history.
        const tierIndex = _.findIndex(
          gwoDifficulty.difficulties,
          (tier) =>
            !tier.customDifficulty &&
            tier.difficultyName === gwoSettings.difficulty
        );

        // Custom carries no difficulty rating, so it ranks against nothing -
        // recording it yields an index of -2, which no badge matches.
        if (tierIndex === -1) {
          return;
        }

        // Badge indices run from -1 (Beginner) so that Casual is 0 - see the
        // loadoutIcon switch in shared/cards.js.
        const currentDifficultyIndex = tierIndex - 1;

        defeatedDifficulties(
          isNewHighScore(currentDifficultyIndex, previousBest)
            ? [currentDifficultyIndex, game.hardcore()]
            : defeatedDifficulties()
        );
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoRecordHighestDifficultyDefeated();
