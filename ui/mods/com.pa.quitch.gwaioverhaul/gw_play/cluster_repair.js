// The repair gw_play/bugfixes.js applies to Cluster AIs in wars saved before
// 5.52.2, kept apart from that scene script so it can be tested. Those wars
// baked the Cluster commander mods into each Cluster AI's inventory without
// the Custom58 type.
define(function () {
  var security =
    "/pa/units/land/bot_support_commander/bot_support_commander.json";
  var worker = "/pa/units/air/support_platform/support_platform.json";

  var fixClusterType = function (mod) {
    // Worker needs two fixes but each fix is applied in a separate mod
    if (mod.path === "buildable_types") {
      mod.value = mod.value + " & Custom58";
      return mod.file;
    } else if (mod.file === security && mod.path === "unit_types") {
      mod.value.push("UNITTYPE_Custom58");
      return mod.file;
    }
    return null;
  };

  var fixClusterCommanderTypes = function (ai) {
    // A war that records typeOfBuffs builds its spec mods at launch from the
    // live Cluster mods, so only a baked inventory needs repairing.
    if (!_.isArray(ai.inventory)) {
      return;
    }
    var securityFix = false;
    var workerFix = 0;

    _.forEach(ai.inventory, function (mod) {
      var isSecurityCandidate = securityFix !== true && mod.file === security;
      var isWorkerCandidate = workerFix < 2 && mod.file === worker;

      if (!isSecurityCandidate && !isWorkerCandidate) {
        return;
      }

      var result = fixClusterType(mod);
      if (result === security) {
        securityFix = true;
      } else if (result === worker) {
        workerFix += 1;
      }
    });
  };

  return {
    // Every Cluster AI in the galaxy. A neutral star's ai() is undefined.
    repairStars: function (stars) {
      _.forEach(stars, function (star) {
        var ai = star.ai();
        if (ai && ai.isCluster) {
          fixClusterCommanderTypes(ai);
        }
      });
    },
  };
});
