// A treasure planet's loadout offer, derived per player at exploration rather
// than pre-dealt at war creation. See docs/coop.md, "Treasure loadouts".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
], (gwoLoadoutIds, helpers, gwoLoadoutBanks) => {
  const cardId = (card) => {
    if (_.isString(card)) {
      return card;
    }
    return card && _.isString(card.id) ? card.id : undefined;
  };

  // The base game records only ids beginning "gwc_start", so every mod loadout a
  // player owns reaches us through gwaioUnlockedStartCardIds instead.
  const unlockedIds = (record) => {
    const base = Array.isArray(record && record.unlockedStartCardIds)
      ? record.unlockedStartCardIds
      : [];
    const gwaio = Array.isArray(record && record.gwaioUnlockedStartCardIds)
      ? record.gwaioUnlockedStartCardIds
      : [];

    return _.uniq(
      _.filter(
        _.map(base.concat(gwaio, [record && record.loadoutCardId]), cardId),
        (id) => helpers.isStartLoadoutCardId(id)
      )
    );
  };

  // gw_game.js's winTurn passes the Guardians' ai.team to defeatTeam, and
  // gw_start/setup.js deletes that field, so defeatTeam(undefined) matches the
  // treasure star itself and clears its ai(). Nothing on the star survives the
  // fight; the recorded index is what identifies it afterwards.
  const isTreasureStar = (gwoSettings, starIndex) =>
    !!gwoSettings &&
    _.isNumber(gwoSettings.treasureStar) &&
    gwoSettings.treasureStar === starIndex;

  // For a war generated before the index was recorded. The live ai() answers
  // while the Guardians stand; afterwards only the pre-dealt card is left.
  const findTreasureStar = (stars) => {
    let found = _.findIndex(stars, (star) => {
      const ai = star && _.isFunction(star.ai) && star.ai();
      return !!(ai && ai.treasurePlanet);
    });

    if (found !== -1) {
      return found;
    }

    found = _.findIndex(stars, (star) =>
      _.some(
        (star && _.isFunction(star.cardList) && star.cardList()) || [],
        (card) => card && helpers.isStartLoadoutCardId(card.id)
      )
    );

    return found === -1 ? undefined : found;
  };

  // The base game's own predicate, shared by gw_play.js and the server. Ids it
  // rejects are the ones the server pushes into a viewer's war inventory
  // instead of recording as an unlock.
  const isBaseLoadoutCardId = (id) =>
    _.isString(id) && id.indexOf("gwc_start") === 0;

  // A loadout won mid-war unlocks the commander and nothing else, so its buff()
  // never runs and the bank has to be written directly. Mod ids are kept out of
  // the base game's bank - see shared/bank.js. A third-party mod that registered
  // its own bank gets its own unlocks back, so uninstalling it takes its records
  // with it rather than leaving them in gwaio_bank.
  const bankStartCard = (params) => {
    const id = cardId(params.card);
    if (!helpers.isStartLoadoutCardId(id)) {
      return false;
    }

    // Tested before the registry: the base game reads its own bank directly, so
    // a mod registering the gwc_start prefix must not capture those ids.
    if (isBaseLoadoutCardId(id)) {
      return params.stockBank.addStartCard({ id });
    }

    const modBank = gwoLoadoutBanks.bankFor(id);
    return (modBank || params.gwoBank).addStartCard({ id });
  };

  // A mod's locked loadouts join the pool through model.gwoNewStartCards. gw_play
  // is a fresh page, so this holds only what the mod's own gw_play loader pushed -
  // shared/loadouts.js, which adds GWO's unlockable list, runs in gw_start.
  const modLoadoutIds = () => {
    const registered = Array.isArray(model.gwoNewStartCards)
      ? model.gwoNewStartCards
      : [];

    return _.filter(_.map(registered, cardId), (id) =>
      helpers.isStartLoadoutCardId(id)
    );
  };

  const treasureLoadoutPool = () =>
    _.map(
      _.uniq(
        gwoLoadoutIds.lockedBase.concat(
          gwoLoadoutIds.unlockable,
          modLoadoutIds()
        )
      ),
      (id) => ({
        id,
      })
    );

  const recordHasUnlockedLoadout = (record, card) => {
    const id = cardId(card);
    if (!helpers.isStartLoadoutCardId(id)) {
      return false;
    }

    return unlockedIds(record).indexOf(id) !== -1;
  };

  // The loadout this player is offered, or undefined once they hold them all.
  const pickTreasureLoadout = (params) => {
    const pool = params.pool || treasureLoadoutPool();
    const isUnlocked = params.isUnlocked;
    const rng = params.rng;
    const locked = _.filter(pool, (card) => !isUnlocked(card));

    if (!locked.length) {
      return undefined;
    }

    return helpers.buildPendingStartLoadoutCard(
      rng ? rng.pick(locked) : _.sample(locked)
    );
  };

  // Whether the Guardians still hold a loadout worth winning: the local banks,
  // plus every co-op player's reported unlocks under per-player tech. Records are
  // not filtered by connection, because a stale one only leaves the offer
  // standing.
  const anyPlayerCanUnlockLoadout = (params) => {
    const pool = params.pool || treasureLoadoutPool();
    const localIds = Array.isArray(params.localUnlockedIds)
      ? params.localUnlockedIds
      : [];

    const localLocked = _.some(
      pool,
      (card) => localIds.indexOf(card.id) === -1
    );
    if (localLocked || !params.perPlayerTech) {
      return localLocked;
    }

    return _.some(params.records || [], (record) =>
      _.some(pool, (card) => !recordHasUnlockedLoadout(record, card))
    );
  };

  const reportOperator = "gwo_report_unlocked_loadouts";

  // A viewer's own unlock record, in ids. The base game reports its half too,
  // but drops everything outside the "gwc_start" prefix on the way - which is
  // every mod loadout, so a registered bank's holdings have to come along here or
  // the host will keep offering the viewer loadouts they already own.
  const localUnlockedLoadoutIds = (stockBank, gwoBank) => {
    const held = stockBank
      .startCards()
      .concat(gwoBank.startCards(), gwoLoadoutBanks.startCards());

    return _.uniq(
      _.filter(_.map(held, cardId), (id) => helpers.isStartLoadoutCardId(id))
    );
  };

  const applyReportedLoadouts = (game, operator) => {
    const payload = (operator && operator.payload) || {};
    const ids = _.filter(
      Array.isArray(payload.unlocked_start_card_ids)
        ? payload.unlocked_start_card_ids
        : [],
      (id) => helpers.isStartLoadoutCardId(id)
    );

    const record = game.findCoopPlayerInventoryData({
      id: operator.client_id,
      name: operator.client_name,
    });
    if (!record) {
      console.warn(
        `[GW COOP] no record for reported loadout unlocks client=${operator.client_id}`
      );
      return;
    }

    if (_.isEqual(record.gwaioUnlockedStartCardIds, ids)) {
      return;
    }

    const stored = game.upsertCoopPlayerInventoryData(
      Object.assign({}, _.cloneDeep(record), {
        gwaioUnlockedStartCardIds: ids,
        updatedAt: _.now(),
      })
    );
    if (!stored) {
      console.error("[GW COOP] failed to store reported loadout unlocks");
      return;
    }

    model.sendCampaignSnapshot(reportOperator, true);
  };

  // The host has to know which loadouts a viewer already owns to offer them a
  // treasure planet they can use, and cannot learn the mod ones any other way.
  const install = (params) => {
    const game = params.game;
    const stockBank = params.stockBank;
    const gwoBank = params.gwoBank;

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        reportOperator,
        applyReportedLoadouts.bind(null, game)
      );
    }

    let reported = "";
    ko.computed(() => {
      if (
        !model.isCampaignViewer() ||
        !model.gwCampaignActive() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !model.currentCoopPlayerInventoryData()
      ) {
        return;
      }

      const ids = localUnlockedLoadoutIds(stockBank, gwoBank);
      const key = ids.join(",");
      if (key === reported) {
        return;
      }

      reported = key;
      model.sendCampaignViewerOperator(reportOperator, {
        unlocked_start_card_ids: ids,
      });
    });

    // A viewer's own claim, as opposed to the host's cards being applied to it -
    // gw_inventory.js suspends banking for the latter. See docs/coop.md.
    return {
      bankOwnLoadout: function (card) {
        return bankStartCard({
          card,
          stockBank,
          gwoBank,
        });
      },
    };
  };

  const api = {
    isTreasureStar,
    findTreasureStar,
    isBaseLoadoutCardId,
    bankStartCard,
    treasureLoadoutPool,
    recordHasUnlockedLoadout,
    pickTreasureLoadout,
    anyPlayerCanUnlockLoadout,
    unlockedLoadoutIds: unlockedIds,
    localUnlockedLoadoutIds,
    install,
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = api;
  }

  return api;
});
