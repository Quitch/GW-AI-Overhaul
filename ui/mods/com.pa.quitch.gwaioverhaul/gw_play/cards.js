requireGW(["shared/gw_common", "shared/gw_factions"], function (
  GW,
  GWFactions
) {
  if (
    model.game().inventory().cards().length === 1 &&
    model.game().inventory().cards()[0].id === "gwc_start_subcdr"
  ) {
    var playerFaction = model
      .game()
      .inventory()
      .getTag("global", "playerFaction");
    _.times(2, function () {
      var minion = _.sample(GWFactions[playerFaction].minions);
      model
        .game()
        .inventory()
        .cards()
        .push({ id: "gwc_minion", minion: minion, unique: Math.random() });
    });
    model.game().inventory().applyCards();
    model.driveAccessInProgress(true);
    GW.manifest.saveGame(model.game()).then(function () {
      model.driveAccessInProgress(false);
    });
  }
});
