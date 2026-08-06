// A treasure planet's loadout offer, derived per player at exploration rather
// than pre-dealt at war creation. See docs/coop.md, "Treasure loadouts".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
], function (gwoLoadoutIds, helpers) {
  var cardId = function (card) {
    if (_.isString(card)) {
      return card;
    }
    return card && _.isString(card.id) ? card.id : undefined;
  };

  // The base game records only ids beginning "gwc_start", so every mod loadout a
  // player owns reaches us through gwaioUnlockedStartCardIds instead.
  var unlockedIds = function (record) {
    var base = _.isArray(record && record.unlockedStartCardIds)
      ? record.unlockedStartCardIds
      : [];
    var gwaio = _.isArray(record && record.gwaioUnlockedStartCardIds)
      ? record.gwaioUnlockedStartCardIds
      : [];

    return _.uniq(
      _.filter(
        _.map(base.concat(gwaio, [record && record.loadoutCardId]), cardId),
        function (id) {
          return helpers.isStartLoadoutCardId(id);
        }
      )
    );
  };

  var treasureLoadoutPool = function () {
    return _.map(
      gwoLoadoutIds.lockedBase.concat(gwoLoadoutIds.unlockable),
      function (id) {
        return { id: id };
      }
    );
  };

  var recordHasUnlockedLoadout = function (record, card) {
    var id = cardId(card);
    if (!helpers.isStartLoadoutCardId(id)) {
      return false;
    }

    return unlockedIds(record).indexOf(id) !== -1;
  };

  // The loadout this player is offered, or undefined once they hold them all.
  var pickTreasureLoadout = function (params) {
    var pool = params.pool || treasureLoadoutPool();
    var isUnlocked = params.isUnlocked;
    var rng = params.rng;
    var locked = _.filter(pool, function (card) {
      return !isUnlocked(card);
    });

    if (!locked.length) {
      return undefined;
    }

    return helpers.buildPendingStartLoadoutCard(
      rng ? rng.pick(locked) : _.sample(locked)
    );
  };

  var reportOperator = "gwo_report_unlocked_loadouts";

  // A viewer's own unlock record, in ids. The base game reports its half too,
  // but drops everything outside the "gwc_start" prefix on the way.
  var localUnlockedLoadoutIds = function (stockBank, gwoBank) {
    return _.uniq(
      _.filter(
        _.map(stockBank.startCards().concat(gwoBank.startCards()), cardId),
        function (id) {
          return helpers.isStartLoadoutCardId(id);
        }
      )
    );
  };

  var applyReportedLoadouts = function (game, operator) {
    var payload = (operator && operator.payload) || {};
    var ids = _.filter(
      _.isArray(payload.unlocked_start_card_ids)
        ? payload.unlocked_start_card_ids
        : [],
      function (id) {
        return helpers.isStartLoadoutCardId(id);
      }
    );

    var record = game.findCoopPlayerInventoryData({
      id: operator.client_id,
      name: operator.client_name,
    });
    if (!record) {
      console.warn(
        "[GW COOP] no record for reported loadout unlocks client=" +
          operator.client_id
      );
      return;
    }

    if (_.isEqual(record.gwaioUnlockedStartCardIds, ids)) {
      return;
    }

    var stored = game.upsertCoopPlayerInventoryData(
      _.assign({}, _.cloneDeep(record), {
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
  var install = function (params) {
    var game = params.game;
    var stockBank = params.stockBank;
    var gwoBank = params.gwoBank;

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        reportOperator,
        applyReportedLoadouts.bind(null, game)
      );
    }

    var reported = "";
    ko.computed(function () {
      if (
        !model.isCampaignViewer() ||
        !model.gwCampaignActive() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !model.currentCoopPlayerInventoryData()
      ) {
        return;
      }

      var ids = localUnlockedLoadoutIds(stockBank, gwoBank);
      var key = ids.join(",");
      if (key === reported) {
        return;
      }

      reported = key;
      model.sendCampaignViewerOperator(reportOperator, {
        unlocked_start_card_ids: ids,
      });
    });
  };

  var api = {
    treasureLoadoutPool: treasureLoadoutPool,
    recordHasUnlockedLoadout: recordHasUnlockedLoadout,
    pickTreasureLoadout: pickTreasureLoadout,
    unlockedLoadoutIds: unlockedIds,
    localUnlockedLoadoutIds: localUnlockedLoadoutIds,
    install: install,
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = api;
  }

  return api;
});
