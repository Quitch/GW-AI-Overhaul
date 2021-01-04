var gwaioWarInfoPanelLoaded;

if (!gwaioWarInfoPanelLoaded) {
  gwaioWarInfoPanelLoaded = true;

  function gwaioWarInfoPanel() {
    try {
      if (!model.game().isTutorial()) {
        model.gwaioDifficulty = loc(
          model.game().galaxy().stars()[model.game().galaxy().origin()].system()
            .gwaio.difficulty
        );
        model.gwaioSize = loc(
          model.game().galaxy().stars()[model.game().galaxy().origin()].system()
            .gwaio.galaxySize
        );
        if (
          model.game().galaxy().stars()[model.game().galaxy().origin()].system()
            .gwaio.factionScaling === true
        )
          model.gwaioFactionScaling = loc("!LOC:Enabled");
        else model.gwaioFactionScaling = loc("!LOC:Disabled");
        if (
          model.game().galaxy().stars()[model.game().galaxy().origin()].system()
            .gwaio.easierStart === true
        )
          model.gwaioEasierStart = loc("!LOC:Enabled");
        else model.gwaioEasierStart = loc("!LOC:Disabled");
        if (
          model.game().galaxy().stars()[model.game().galaxy().origin()].system()
            .gwaio.tougherCommanders === true
        )
          model.gwaioTougherCommanders = loc("!LOC:Enabled");
        else model.gwaioTougherCommanders = loc("!LOC:Disabled");
        if (model.game().hardcore() === true)
          model.gwaioHardcore = loc("!LOC:Enabled");
        else model.gwaioHardcore = loc("!LOC:Disabled");

        $("#header").append(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/war_info.html"
          )
        );
        locTree($("#war-detail"));
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioWarInfoPanel();
}
