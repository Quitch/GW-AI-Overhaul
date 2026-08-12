var gwoCoopPingLoaded;

function gwoCoopPing() {
  if (gwoCoopPingLoaded || model.game().isTutorial()) {
    return;
  }

  gwoCoopPingLoaded = true;

  try {
    // A sibling of the stock action row, which is hidden for the viewers this
    // button is for. Injected before gw_play.js's own ko.applyBindings, which is
    // what binds it. See coop.md.
    $("#selected-system-anchor").append(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping.html"
      )
    );
    locTree($(".gwo-ping-actions"));

    // Observable, so the button wakes up when the modules below arrive.
    const ping = ko.observable();

    model.gwoPingOnCooldown = ko.observable(false);
    model.gwoCanPingStar = ko.observable(false);
    model.gwoPingStar = () => {
      if (ping()) {
        ping().pingStar();
      }
    };

    // systems.js replaces model.selection outright, so the dependency on its
    // star observable can only be taken once every gw_play mod has loaded.
    _.defer(() => {
      ko.computed(() => {
        const star = model.selection.star();
        model.gwoCanPingStar(!!ping() && ping().canPing(star));
      });
    });

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping_marker.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping_operators.js",
      ],
      (gwoPingMarker, gwoPingOperators) => {
        const systemFor = (star) => model.galaxy.systems()[star];

        ping(
          gwoPingOperators({
            marker: gwoPingMarker.createLayer({ systemFor }),
            systemFor,
            starCount: function () {
              return model.galaxy.systems().length;
            },
            starName: function (star) {
              const system = systemFor(star);
              return system ? loc(system.name()) : "";
            },
            pendingTechRecords: function () {
              if (!model.gwCampaignPerPlayerTechCards()) {
                return [];
              }

              const game = model.game();
              const records = _.map(
                model.gwCampaignConnectedClients(),
                (client) =>
                  game.findCoopPlayerInventoryData({
                    id: client.id,
                    name: client.name,
                  })
              );

              // This client's own offer arrives by its own route, and a viewer
              // reading its own record back is not guaranteed to find it.
              return records.concat({
                pendingTechCards: model.currentCoopPendingTechCards(),
              });
            },
          })
        );
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoCoopPing();
