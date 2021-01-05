var gwaioWarInfoPanelLoaded;

if (!gwaioWarInfoPanelLoaded) {
  gwaioWarInfoPanelLoaded = true;

  function gwaioWarInfoPanel() {
    try {
      if (!model.game().isTutorial()) {
        var stars = model.game().galaxy().stars();
        var origin = model.game().galaxy().origin();
        if (stars[origin].system().gwaio) {
          model.gwaioVersion = loc(stars[origin].system().gwaio.version);
          model.gwaioDifficulty = loc(stars[origin].system().gwaio.difficulty);
          model.gwaioSize = loc(stars[origin].system().gwaio.galaxySize);
          if (stars[origin].system().gwaio.factionScaling === true)
            model.gwaioFactionScaling = loc("!LOC:Enabled");
          else model.gwaioFactionScaling = loc("!LOC:Disabled");
          if (stars[origin].system().gwaio.easierStart === true)
            model.gwaioEasierStart = loc("!LOC:Enabled");
          else model.gwaioEasierStart = loc("!LOC:Disabled");
          if (stars[origin].system().gwaio.tougherCommanders === true)
            model.gwaioTougherCommanders = loc("!LOC:Enabled");
          else model.gwaioTougherCommanders = loc("!LOC:Disabled");
        } else {
          model.gwaioVersion = loc("!LOC:Unknown");
          model.gwaioDifficulty = loc("!LOC:Unknown");
          model.gwaioSize = model.game().galaxy().stars().length;
          model.gwaioFactionScaling = loc("!LOC:Unknown");
          model.gwaioEasierStart = loc("!LOC:Unknown");
          model.gwaioTougherCommanders = loc("!LOC:Unknown");
        }
        if (model.game().hardcore() === true)
          model.gwaioHardcore = loc("!LOC:Enabled");
        else model.gwaioHardcore = loc("!LOC:Disabled");

        $("#header").append(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html"
          )
        );
        locTree($("#gwo-panel"));
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioWarInfoPanel();
}
