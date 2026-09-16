// What every host-side co-op operator handler does around its own work: reply
// to the viewer that asked, look up that viewer's record, and write it back.
// A reply always names its client, so the server can route it - see coop.md,
// "Addressing a host's reply".
define(() => {
  const reply = (type, operator, payload) => {
    if (!model.sendCampaignHostOperator) {
      return;
    }

    model.sendCampaignHostOperator(
      type,
      _.assign(
        { client_id: operator.client_id, client_name: operator.client_name },
        payload,
      ),
      {
        target_client_id: operator.client_id,
        request_id: operator.request_id,
      },
    );
  };

  const fail = (type, operator, action, reason) => {
    console.error(`[GW COOP] failed to ${action}: ${reason}`);
    if (_.isUndefined(operator.client_id)) {
      return;
    }

    reply(type, operator, { error: reason });
  };

  const recordFor = (game, operator) =>
    game.findCoopPlayerInventoryData({
      id: operator.client_id,
      name: operator.client_name,
    });

  // Stores a copy of the record with `patch` applied and updatedAt stamped,
  // and returns that copy, or undefined when the store refused it.
  const upsertRecord = (game, record, patch) => {
    const next = Object.assign(
      {},
      _.cloneDeep(record),
      { updatedAt: _.now() },
      patch,
    );
    return game.upsertCoopPlayerInventoryData(next) ? next : undefined;
  };

  return {
    reply,
    fail,
    recordFor,
    upsertRecord,
  };
});
