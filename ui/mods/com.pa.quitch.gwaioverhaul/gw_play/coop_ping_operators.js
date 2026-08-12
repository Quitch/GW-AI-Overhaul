// Co-op star pings. A viewer asks the host (gwo_ping_star) to raise a marker on a
// star; the host validates it and relays it to every viewer
// (gwo_ping_star_broadcast). See coop.md.
define(() => {
  const PING_REQUEST = "gwo_ping_star";
  const PING_BROADCAST = "gwo_ping_star_broadcast";
  const PING_CUE = "/SE/UI/UI_ping";
  const VIEWER_COOLDOWN_MS = 3000;
  // Under the viewer's own cooldown, because the viewer's clock starts at the
  // click and the host's at receipt.
  const HOST_COOLDOWN_MS = 2500;
  const COOLDOWN_PRUNE_MS = HOST_COOLDOWN_MS * 12;
  // Pings from different clients can legitimately land together, so the cue is
  // throttled separately from the per-client cooldown.
  const SOUND_THROTTLE_MS = 250;
  const MAX_PING_ID_LENGTH = 64;
  const OWN_PING_MEMORY = 8;

  // An unauthenticated viewer can have an empty client_id, so the key is the
  // composite gwo_panel.js uses.
  const clientKey = (clientId, clientName) =>
    `${String(clientId || "")}::${String(clientName || "")}`;

  const starValidationError = (star, starCount) => {
    if (!_.isFinite(star) || star !== Math.floor(star)) {
      return "invalid star";
    }

    if (star < 0 || star >= starCount) {
      return "star out of range";
    }

    return undefined;
  };

  // Matches the predicate gwCampaignPlayerSetupBlocked uses, which is host-only
  // and so cannot be read from a viewer.
  const techChoicePending = (records) =>
    _.some(records, (record) => {
      const pending = record && record.pendingTechCards;
      return !!(
        pending &&
        _.isNumber(pending.star) &&
        _.isArray(pending.cards)
      );
    });

  // The reject reason, or undefined when the ping is valid.
  const pingValidationError = (payload, starCount) => {
    if (!_.isPlainObject(payload)) {
      return "invalid payload";
    }

    const starError = starValidationError(payload.star, starCount);
    if (starError) {
      return starError;
    }

    const pingId = payload.ping_id;
    if (
      !_.isString(pingId) ||
      !pingId.length ||
      pingId.length > MAX_PING_ID_LENGTH
    ) {
      return "invalid ping id";
    }

    return undefined;
  };

  const pingChatMessage = (starName) => {
    const ping = loc("!LOC:Ping!");
    return starName ? `${ping} ${starName}` : ping;
  };

  const pingPlayerName = (name) => name || loc("!LOC:Unknown");

  // A null prototype, so a client named __proto__ cannot make its own bucket
  // unstorable and escape the limit.
  const createCooldown = (limitMs) => {
    const acceptedAt = Object.create(null);

    return {
      allow: function (key, now) {
        if (_.has(acceptedAt, key) && now - acceptedAt[key] < limitMs) {
          return false;
        }

        _.forEach(_.keys(acceptedAt), (other) => {
          if (now - acceptedAt[other] > COOLDOWN_PRUNE_MS) {
            delete acceptedAt[other];
          }
        });

        acceptedAt[key] = now;
        return true;
      },
    };
  };

  const factory = (params) => {
    const marker = params.marker;
    const systemFor = params.systemFor;
    const starCount = params.starCount;
    const starName = params.starName;
    const pendingTechRecords = params.pendingTechRecords;

    const hostCooldown = createCooldown(HOST_COOLDOWN_MS);
    const ownPings = [];
    let pingSequence = 0;
    let lastSoundAt = 0;

    const nextPingId = () => {
      pingSequence += 1;
      return `${String(_.now())}:${pingSequence}`;
    };

    const rememberOwnPing = (pingId) => {
      ownPings.push(pingId);
      if (ownPings.length > OWN_PING_MEMORY) {
        ownPings.shift();
      }
    };

    const playPingSound = () => {
      const now = _.now();
      if (now - lastSoundAt < SOUND_THROTTLE_MS) {
        return;
      }

      lastSoundAt = now;
      api.audio.playSound(PING_CUE);
    };

    const showPing = (star, playerName) => {
      marker.raise(star);
      playPingSound();
      model.addCampaignChatMessage(
        pingPlayerName(playerName),
        pingChatMessage(starName(star)),
        true
      );
    };

    // Drives both the button's visibility and the send, so a click that lands as
    // the war moves on cannot get past it.
    const canPing = (star) => {
      if (
        !model.isCampaignViewer() ||
        !model.gwCampaignConnected() ||
        model.canShowCampaignActionButtons() ||
        model.hidingUI() ||
        starValidationError(star, starCount())
      ) {
        return false;
      }

      // An explore or a fight is the host's to finish. Testing for those rather
      // than for begin is deliberate: the turn state only returns to begin on
      // the next move, so a finished exploration rests at end - which is exactly
      // when somewhere to go next is worth pointing at.
      if (
        model.testGameState({ explore: true, fight: true }, false) ||
        model.scanning() ||
        techChoicePending(pendingTechRecords())
      ) {
        return false;
      }

      // An explored star has been taken: there is nothing left there to ask the
      // host for.
      const system = systemFor(star);
      return !!system && !system.star.explored();
    };

    // The pinger renders locally rather than waiting for the relay to come back,
    // and drops its own echo below.
    const pingStar = () => {
      const star = model.selection.star();
      if (model.gwoPingOnCooldown() || !canPing(star)) {
        return;
      }

      const payload = { star, ping_id: nextPingId() };

      if (!model.sendCampaignViewerOperator(PING_REQUEST, payload)) {
        return;
      }

      rememberOwnPing(payload.ping_id);
      model.gwoPingOnCooldown(true);
      _.delay(() => {
        model.gwoPingOnCooldown(false);
      }, VIEWER_COOLDOWN_MS);

      showPing(payload.star, model.displayName());
    };

    // Returns nothing: a ping mutates no campaign state, so it must not join the
    // queue the base game orders authoritative updates with.
    const relayPingToViewers = (operator) => {
      // The handler is registered on every client, host or not.
      if (!model.isCampaignHost() || !model.gwCampaignConnected()) {
        return;
      }

      const payload = operator && operator.payload;
      const validationError = pingValidationError(payload, starCount());
      if (validationError) {
        console.log(`[GW COOP] dropped ping: ${validationError}`);
        return;
      }

      const sender = clientKey(operator.client_id, operator.client_name);
      if (!hostCooldown.allow(sender, _.now())) {
        console.log("[GW COOP] dropped ping: too soon after the last one");
        return;
      }

      // No target: the relay reads that as every connected viewer. See coop.md.
      model.sendCampaignHostOperator(PING_BROADCAST, {
        star: payload.star,
        ping_id: payload.ping_id,
        client_id: operator.client_id,
        client_name: operator.client_name,
      });

      showPing(payload.star, operator.client_name);
    };

    const applyPingBroadcast = (operator) => {
      const payload = operator && operator.payload;
      // Checked against this client's own galaxy, which a viewer part-way
      // through a rehydrate can legitimately be behind on.
      const validationError = pingValidationError(payload, starCount());
      if (validationError) {
        console.log(`[GW COOP] ignored ping: ${validationError}`);
        return;
      }

      if (_.indexOf(ownPings, payload.ping_id) !== -1) {
        return;
      }

      showPing(payload.star, payload.client_name);
    };

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        PING_REQUEST,
        relayPingToViewers
      );
    }

    if (model.registerCampaignHostOperatorHandler) {
      model.registerCampaignHostOperatorHandler(
        PING_BROADCAST,
        applyPingBroadcast
      );
    }

    return { canPing, pingStar };
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      clientKey,
      createCooldown,
      pingChatMessage,
      pingPlayerName,
      pingValidationError,
      starValidationError,
      techChoicePending,
    };
  }

  return factory;
});
