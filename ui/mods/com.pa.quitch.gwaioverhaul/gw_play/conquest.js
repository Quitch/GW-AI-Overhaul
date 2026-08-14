// The Galactic Conquest scene shell: no-ops unless the war carries a
// gwaio.conquest snapshot, then instantiates the measured turn driver with the
// live scene objects. Logic lives in conquest_turn.js, conquest_engine.js and
// conquest_ai_builder.js; this file only wires. See docs/conquest.md.
var gwoConquestLoaded;

function gwoConquest() {
  if (gwoConquestLoaded) {
    return;
  }

  var game = model.game();
  if (game.isTutorial()) {
    return;
  }

  var galaxy = game.galaxy();
  var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
  if (!gwoSettings || !gwoSettings.conquest) {
    return;
  }

  gwoConquestLoaded = true;

  try {
    model.gwoConquestAiPhase = ko.observable(false);

    // The stock owner computed paints a jumped boss's colour; counter-write
    // the player's after it (scene mods register later), tracking the same
    // dependencies so every stock repaint re-runs this. See docs/conquest.md.
    _.forEach(model.galaxy.systems(), function (system) {
      ko.computed(function () {
        var ai = system.star.ai();
        system.connected();
        model.cheats.noFog();
        system.star.hasCard();
        if (ai && ai.conquestJumped) {
          system.ownerColor(model.player.color().concat(3));
        }
      });
    });

    requireGW(
      [
        "shared/gw_factions",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_ai_builder.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_turn.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_sprite.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_scaling.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js",
      ],
      function (
        GWFactions,
        gwoStreams,
        gwoEngine,
        gwoBuilder,
        gwoTurnFactory,
        gwoSpriteFactory,
        gwoSave,
        gwoAI,
        gwoScaling,
        gwoTech,
        gwoCluster
      ) {
        var cfg = gwoSettings.conquest;

        var warRng = gwoStreams.warRng(gwoSettings);
        if (!warRng) {
          console.error("Conquest war carries no seed; AI turns disabled");
          return;
        }

        var builder = gwoBuilder.create({
          cfg: cfg,
          factions: GWFactions,
          factionTechs: gwoTech.factionTechs,
          clusterCommanderMods: gwoCluster.clusterCommanderMods,
          penchants: gwoAI.penchants,
          quellerCompatibleMinions: gwoAI.quellerCompatibleMinions,
          aiType: gwoSettings.ai,
          aiAllyType: gwoSettings.aiAlly,
          playerFaction:
            game.inventory().getTag("global", "playerFaction") || 0,
        });

        var announce = function (teams) {
          var names = _.map(teams, function (team) {
            var faction = GWFactions[cfg.factions[team]];
            return faction ? faction.name : "?";
          });
          var verb =
            names.length > 1
              ? loc("!LOC:have been eliminated!")
              : loc("!LOC:has been eliminated!");
          model.popUp({
            msg: names.join(", ") + " " + verb,
            actions: { primary: undefined },
            tags: { primary: "!LOC:OK", secondary: "" },
          });
        };

        // Deferred so systems.js's async overrides of canMove, the display
        // computeds and defeatTeam exist before the driver wraps them.
        _.defer(function () {
          gwoTurnFactory({
            game: game,
            gwoSettings: gwoSettings,
            cfg: cfg,
            engine: gwoEngine,
            builder: builder,
            streams: gwoStreams,
            warRng: warRng,
            save: gwoSave,
            animate: gwoSpriteFactory({ game: game }),
            announce: announce,
            aiPhase: model.gwoConquestAiPhase,
            alliesSuppressed: gwoScaling.startCardBreaksAllies(
              game.inventory().cards()[0].id,
              model.gwoStarCardsWhichBreakAllies
            ),
          });
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoConquest();
