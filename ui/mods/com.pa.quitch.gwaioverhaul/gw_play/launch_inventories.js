// The inventories a hire builds the other players' armies from. See coop.md,
// "Records at launch".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
], function (refereeCoop) {
  // params: game, clients (the hire's), coopAis (the hire's roster), and
  // effects, whose apply(saved) resolves the saved inventory applied afresh.
  // Resolves { viewers, coopAis }: the viewers as getConnectedViewerInventories
  // lists them, and the roster, each record's inventory replaced by its apply.
  // The records themselves are left as they are.
  var forHire = function (params) {
    var withApplied = function (entry) {
      return params.effects.apply(entry.inventory).then(function (inventory) {
        return _.assign({}, entry, { inventory: inventory });
      });
    };
    var viewers = _.map(
      refereeCoop.getConnectedViewerInventories(params.game, params.clients),
      withApplied
    );
    // Under shared tech an AI fields the host's live inventory, applied on load.
    var coopAis = _.map(params.coopAis, function (coopAi) {
      return coopAi.perPlayer ? withApplied(coopAi) : coopAi;
    });

    return Promise.all([Promise.all(viewers), Promise.all(coopAis)]).then(
      function (applied) {
        return { viewers: applied[0], coopAis: applied[1] };
      }
    );
  };

  return {
    forHire: forHire,
  };
});
