// The Galactic Conquest scene shell: no-ops unless the war carries a
// gwaio.conquest snapshot, then instantiates the measured turn driver with the
// live scene objects. Logic lives in conquest_turn.js, conquest_engine.js,
// conquest_ai_builder.js and conquest_announce.js; this file only wires. See
// docs/conquest.md.
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

    var conquestDriver;
    model.gwoDisplayConquestPass = ko.observable(false);
    model.gwoConquestPass = function () {
      if (conquestDriver) {
        conquestDriver.pass();
      }
    };

    // A sibling of the stock action row, injected before gw_play.js's own
    // ko.applyBindings, which is what binds it.
    $("#selected-system-anchor").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_pass.html"
      )
    );
    locTree($(".gwo-conquest-actions"));

    // The stock owner computed paints a jumped boss's colour and reads
    // ownerColor back, so a counter-writing computed only triggers another
    // boss-coloured repaint. Intercept the write instead: while the boss
    // waits to be fought the star is still the player's, whatever repaints -
    // and a player-held unexplored star is the player's too, where the stock
    // computed would paint no ring at all.
    var playerHeldStar = function (starIndex, ai) {
      var held = gwoSettings.conquest.playerHeld;
      return !ai && !!(held && held[starIndex]);
    };
    _.forEach(model.galaxy.systems(), function (system, starIndex) {
      var baseOwnerColor = system.ownerColor;
      system.ownerColor = function (value) {
        if (arguments.length) {
          var ai = system.star.ai();
          if ((ai && ai.conquestJumped) || playerHeldStar(starIndex, ai)) {
            value = model.player.color().concat(3);
          }
          return baseOwnerColor(value);
        }
        return baseOwnerColor();
      };
      var installAi = system.star.ai();
      if (
        (installAi && installAi.conquestJumped) ||
        playerHeldStar(starIndex, installAi)
      ) {
        baseOwnerColor(model.player.color().concat(3));
      }
    });

    requireGW(
      [
        "shared/gw_factions",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_ai_builder.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_announce.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_turn.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_sprite.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
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
        gwoAnnounceFactory,
        gwoTurnFactory,
        gwoSpriteFactory,
        gwoCommanderColour,
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

        var playerFaction =
          game.inventory().getTag("global", "playerFaction") || 0;

        var paletteSizes = _.times(GWFactions.length, function (faction) {
          var palette = gwoCommanderColour.paletteFor(faction);
          return palette ? palette.length : 0;
        });

        model.gwoConquestPlayerHeld = ko.observable(cfg.playerHeld || {});
        model.gwoConquestPlayerArmies = ko.observable(cfg.playerArmies || []);
        var publishPlayerState = function () {
          model.gwoConquestPlayerHeld(cfg.playerHeld || {});
          model.gwoConquestPlayerArmies(cfg.playerArmies || []);
        };

        // Nested so the outer callback keeps its parameter count; both
        // modules read the observables created above.
        requireGW(
          [
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_army_icons.js",
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_pulse.js",
          ],
          function (gwoArmyIconsFactory, gwoPulse) {
            gwoArmyIconsFactory({ playerFaction: playerFaction });

            var playerRgb = _.map(model.player.color(), function (c) {
              return Math.round(c * 255);
            });
            var pulseLayer = gwoPulse.createLayer({
              systemFor: function (star) {
                return model.galaxy.systems()[star];
              },
              colour: "rgba(" + playerRgb.join(",") + ",1)",
            });

            // Pulses every held star until it is explored, and paints the
            // owner ring the stock computed skips for unexplored stars. The
            // explored() reads make an explore drop both at once.
            ko.computed(function () {
              var held = model.gwoConquestPlayerHeld();
              var stars = game.galaxy().stars();
              var active = {};
              _.forEach(held, function (value, key) {
                if (value && stars[key] && !stars[key].explored()) {
                  active[key] = true;
                  model.galaxy
                    .systems()
                    [key].ownerColor(model.player.color().concat(3));
                }
              });
              pulseLayer.sync(active);
            });
          }
        );

        var builder = gwoBuilder.create({
          cfg: cfg,
          factions: GWFactions,
          factionTechs: gwoTech.factionTechs,
          clusterCommanderMods: gwoCluster.clusterCommanderMods,
          penchants: gwoAI.penchants,
          quellerCompatibleMinions: gwoAI.quellerCompatibleMinions,
          aiType: gwoSettings.ai,
          aiAllyType: gwoSettings.aiAlly,
          playerFaction: playerFaction,
        });

        var announceFormat = gwoAnnounceFactory({
          factions: GWFactions,
          cfg: cfg,
          playerFaction: playerFaction,
        });

        // The popup markup is shared by every GW popup, so the card-hover
        // skin is applied per showing and dropped when the popup hides.
        model.showPopUp.subscribe(function (visible) {
          if (!visible) {
            $(".div_popup_panel").removeClass("gwo-conquest-elim-popup");
          }
        });

        var announce = function (eliminations) {
          $(".div_popup_panel").addClass("gwo-conquest-elim-popup");
          model.popUp({
            msg: announceFormat.message(eliminations),
            actions: { primary: undefined },
            tags: { primary: "!LOC:OK", secondary: "" },
          });
        };

        // Deferred so the overrides systems.js installs after this script -
        // canMove, the display computeds and defeatTeam - exist before the
        // driver wraps them.
        _.defer(function () {
          conquestDriver = gwoTurnFactory({
            game: game,
            gwoSettings: gwoSettings,
            cfg: cfg,
            engine: gwoEngine,
            builder: builder,
            streams: gwoStreams,
            warRng: warRng,
            save: gwoSave,
            paletteSizes: paletteSizes,
            playerFaction: playerFaction,
            onPlayerState: publishPlayerState,
            animate: gwoSpriteFactory({ game: game }),
            announce: announce,
            aiPhase: model.gwoConquestAiPhase,
            alliesSuppressed: gwoScaling.startCardBreaksAllies(
              game.inventory().cards()[0].id,
              model.gwoStarCardsWhichBreakAllies
            ),
          });

          // Shown with the player's own star selected, like Fight/Explore.
          ko.computed(function () {
            model.gwoDisplayConquestPass(
              model.canShowCampaignActionButtons() &&
                model.selection.star() === game.currentStar() &&
                conquestDriver.canPass()
            );
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
