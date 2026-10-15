// What every host-side co-op operator handler does around its own work: reply
// to the viewer that asked, look up that viewer's record, and write it back.
// A reply always names its client, so the server can route it - see coop.md,
// "Addressing a host's reply".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
], function (refereeCoop) {
  var reply = function (type, operator, payload) {
    model.sendCampaignHostOperator(
      type,
      _.assign(
        { client_id: operator.client_id, client_name: operator.client_name },
        payload
      ),
      {
        target_client_id: operator.client_id,
        request_id: operator.request_id,
      }
    );
  };

  var fail = function (type, operator, action, reason) {
    console.error("[GW COOP] failed to " + action + ": " + reason);
    if (_.isUndefined(operator.client_id)) {
      return;
    }

    reply(type, operator, { error: reason });
  };

  // An operator names its client as client_id/client_name.
  var recordFor = function (game, operator) {
    return refereeCoop.recordForClient(game, {
      id: operator.client_id,
      name: operator.client_name,
    });
  };

  // A plain-data copy of the record, as a save or a snapshot makes it, with
  // `patch` applied and updatedAt stamped.
  var patched = function (record, patch) {
    return _.assign(
      {},
      JSON.parse(JSON.stringify(record)),
      { updatedAt: _.now() },
      patch
    );
  };

  // Stores a patched copy of the record and returns it, or undefined when the
  // store refused it.
  var upsertRecord = function (game, record, patch) {
    var next = patched(record, patch);
    return game.upsertCoopPlayerInventoryData(next) ? next : undefined;
  };

  // Stores a patched copy of every record patchFor returns a patch for, in one
  // write, and returns how many it patched. Each write re-renders every view
  // bound to the records, which costs tens of milliseconds in a large war.
  var upsertRecords = function (game, patchFor) {
    var count = 0;
    var next = _.map(game.coopPlayerInventoryData(), function (record) {
      var patch = patchFor(record);
      if (!patch) {
        return record;
      }

      count += 1;
      return patched(record, patch);
    });

    if (count) {
      game.coopPlayerInventoryData(next);
    }
    return count;
  };

  return {
    reply: reply,
    fail: fail,
    recordFor: recordFor,
    upsertRecord: upsertRecord,
    upsertRecords: upsertRecords,
  };
});
