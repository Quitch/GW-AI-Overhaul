// The helper names this returns are a published API: third-party cards call
// them directly, and the New-GW-Cards template documents every one. Renaming
// or dropping one breaks those cards silently. See tech-cards.md.
define(() => {
  const getConnectedClients = () =>
    _.isFunction(model.gwCampaignConnectedClients) &&
    Array.isArray(model.gwCampaignConnectedClients())
      ? model.gwCampaignConnectedClients()
      : [];

  const isConnectedPlayerInventory = (data, connectedClients) =>
    _.some(connectedClients, (client) => {
      if (!client || !data) {
        return false;
      }

      // Falls through to the name on an id mismatch rather than returning. Ids and
      // names drift apart in co-op, and short-circuiting drops a viewer's cards.
      const clientId = client.id;
      const dataId = _.isUndefined(data.id) ? data.playerId : data.id;
      if (
        !_.isUndefined(clientId) &&
        !_.isUndefined(dataId) &&
        clientId === dataId
      ) {
        return true;
      }

      const clientName = client.name;
      const dataName = data.name || data.playerName;
      return !!clientName && !!dataName && clientName === dataName;
    });

  // The saved inventories of every connected co-op player bar the host, whose
  // own is the live GWInventory.
  const connectedPlayerInventories = (game) => {
    const activeGame = game || model.game();
    const connectedClients = getConnectedClients();
    const records =
      activeGame && _.isFunction(activeGame.coopPlayerInventoryData)
        ? activeGame.coopPlayerInventoryData()
        : [];

    return _.filter(
      _.map(records, (data) =>
        isConnectedPlayerInventory(data, connectedClients)
          ? data.inventory
          : undefined,
      ),
      (inventory) => inventory && Array.isArray(inventory.cards),
    );
  };

  // Indexed by GW.balance.numberOfSystems tier - see tech-cards.md. Small shares a
  // short/moderate threshold because star distance is integer and it spans ~8 values.
  const distances = {
    short: [3, 3, 4, 5, 6, 7, 8, 9, 10],
    moderate: [3, 4, 5, 6, 7, 8, 10, 11, 12],
    far: [4, 5, 6, 7, 8, 10, 11, 12, 13],
  };

  // Clamped against thresholds, not numberOfSystems: a longer third-party size
  // table would index past the end, and `distance > undefined` is silently false.
  const farForSize = (system, context, numberOfSystems, thresholds) => {
    const lastTier = Math.min(numberOfSystems.length, thresholds.length) - 1;
    let tier = 0;
    while (tier < lastTier && context.totalSize > numberOfSystems[tier]) {
      tier++;
    }
    return system.distance() > thresholds[tier];
  };

  const hasUnit = (inventoryUnits, units) => {
    if (_.isString(units)) {
      return _.includes(inventoryUnits, units);
    }
    return _.some(units, (unit) => _.includes(inventoryUnits, unit));
  };

  const hasAllUnits = (inventoryUnits, units) => {
    if (_.isString(units)) {
      return _.includes(inventoryUnits, units);
    }
    return _.every(units, (unit) => _.includes(inventoryUnits, unit));
  };

  // The two states that flood every planet fought on. See tech-cards.md.
  const floodsPlanets = (inventory) =>
    inventory.hasCard("gwaio_start_naval") ||
    inventory.hasCard("gwaio_enable_tsunami");

  const playerIsCluster = (inventory) =>
    inventory.getTag("global", "playerFaction") === 4;

  // Must run inside inventory.applyCards()'s dull phase: relies on
  // getTag/setTag's "" context resolving to the current card, and on
  // buff() having already run for every card this cycle.
  const applyDulls = (card, inventory, units) => {
    if (inventory.lookupCard(card) === 0) {
      const buffCount = inventory.getTag("", "buffCount", 0);
      if (buffCount) {
        inventory.removeUnits(units);
        inventory.setTag("", "buffCount", undefined);
      }
    }
  };

  // Every card that grants a slot says so as its own paragraph. Kept here so the
  // wording stays one translatable string rather than over a hundred copies of it.
  const withSlot = (description) =>
    `${description}<br> <br>${loc("!LOC:Adds a new slot for another technology.")}`;

  const getContext = (galaxy) => ({
    totalSize: galaxy.stars().length,
  });

  // Tested for undefined, not falsiness: a computed weight of 0 is legitimate.
  const upgradeDeal = (available, chance) => {
    const weight = _.isUndefined(chance) ? 60 : chance;
    return {
      params: {
        allowOverflow: true,
      },
      chance: available ? weight : 0,
    };
  };

  // props is either a path -> value map, or a list of paths that all take the
  // same `value`. Emitted in the order the map's keys or the list give.
  const mods = (file, op, props, value) => {
    const byPath = Array.isArray(props)
      ? _.zipObject(props, _.times(props.length, _.constant(value)))
      : props;
    return _.map(_.keys(byPath), (path) => ({
      file,
      path,
      op,
      value: byPath[path],
    }));
  };

  return {
    getConnectedClients,

    hasUnit,

    hasAllUnits,

    missingUnit: function (inventoryUnits, units) {
      return !hasAllUnits(inventoryUnits, units);
    },

    missingAllUnits: function (inventoryUnits, units) {
      return !hasUnit(inventoryUnits, units);
    },

    // Substring rather than a prefix test because the shipped English locales are "en"
    // and "en-US", and Chrome 40's startsWith ignores its second argument. detectLanguage
    // returns nothing when the engine has no locale to report, and the source strings are
    // English, so that case is English too.
    isEnglish: function () {
      const language = i18n.detectLanguage();
      return !language || _.includes(language, "en");
    },

    withSlot,

    loadoutIcon: function (loadoutId) {
      const raw = window.localStorage[`gwaio_victory_${loadoutId}`];
      let decoded;

      // localStorage is user-writable, and this runs while building the loadout
      // list, so one corrupt badge record must not take the whole list down.
      try {
        decoded = raw ? JSON.parse(raw) : undefined;
      } catch (e) {
        console.warn(
          `Ignoring unreadable victory record for loadout ${loadoutId}`,
          e,
        );
      }

      let icon;
      let hardcore = false;

      if (Array.isArray(decoded)) {
        icon = decoded[0];
        hardcore = decoded[1];
      } else {
        icon = decoded;
      }

      const iconPath = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/";
      const append = hardcore ? "_hardcore.png" : ".png";

      switch (icon) {
        case -1: {
          return `${iconPath}-1_beginner${append}`;
        }
        case 0: {
          return `${iconPath}0_casual${append}`;
        }
        case 1: {
          return `${iconPath}1_iron${append}`;
        }
        case 2: {
          return `${iconPath}2_bronze${append}`;
        }
        case 3: {
          return `${iconPath}3_silver${append}`;
        }
        case 4: {
          return `${iconPath}4_gold${append}`;
        }
        case 5: {
          return `${iconPath}5_platinum${append}`;
        }
        case 6: {
          return `${iconPath}6_diamond${append}`;
        }
        case 7: {
          return `${iconPath}7_uber${append}`;
        }
        default: {
          return "coui://ui/main/game/galactic_war/shared/img/red-commander.png";
        }
      }
    },

    applyDulls,

    // The buff/dull pair every loadout shares. The first buff of the war
    // runs the default start and `apply`; a later one only adds the slot
    // (unless `repeatSlot` is false); a copy dealt after the start goes to
    // `bank`. `always` runs on every buff of the start card. See tech-cards.md.
    loadout: function (card, options) {
      return {
        buff: function (inventory, context) {
          if (inventory.lookupCard(card) === 0) {
            let buffCount = inventory.getTag("", "buffCount", 0);
            if (!buffCount) {
              options.start.buff(inventory);
              if (options.apply) {
                options.apply(inventory);
              }
            } else if (options.repeatSlot !== false) {
              inventory.maxCards(inventory.maxCards() + 1);
            }
            if (options.always) {
              options.always(inventory, context);
            }
            ++buffCount;
            inventory.setTag("", "buffCount", buffCount);
          } else {
            inventory.maxCards(inventory.maxCards() + 1);
            options.bank.addStartCard(card);
          }
        },
        dull: function (inventory) {
          applyDulls(
            card,
            inventory,
            _.isFunction(options.dulls)
              ? options.dulls(inventory)
              : options.dulls,
          );
        },
      };
    },

    // A locked loadout's `hint`: the red commander and the loadout's name.
    lockedHint: function (description) {
      return _.constant({
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description,
      });
    },

    getContext,

    startCard: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },

    // gw_inventory.hasCard tests !card.unique, so only truthiness matters. Offset
    // into [1, 2) because a seeded zero would be permanent for that seed.
    uniqueValue: function (rng) {
      return rng ? 1 + rng() : Math.random();
    },

    upgradeDeal,

    // The whole of an upgrade card: visible, one slot, dealt through
    // upgradeDeal once `requires` is held (and `unless` is not), `description`
    // wrapped by withSlot. `describe`, `available`, `deal` and `chance` (a
    // weight or a function of the inventory) override those parts; `slot:
    // false` skips the slot. See tech-cards.md.
    upgradeCard: function (options) {
      const available =
        options.available ||
        ((inventory) =>
          (!options.unless || !inventory.hasCard(options.unless)) &&
          hasUnit(inventory.units(), options.requires));
      return {
        visible: () => true,
        describe:
          options.describe || _.constant(withSlot(loc(options.description))),
        summarize: _.constant(options.name),
        icon: _.constant(options.icon),
        audio: _.constant({ found: options.audio }),
        getContext,
        deal:
          options.deal ||
          ((system, context, inventory) =>
            upgradeDeal(
              available(inventory),
              _.isFunction(options.chance)
                ? options.chance(inventory)
                : options.chance,
            )),
        buff: function (inventory) {
          if (options.slot !== false) {
            inventory.maxCards(inventory.maxCards() + 1);
          }
          if (options.buff) {
            options.buff(inventory);
          }
        },
        dull: function () {},
      };
    },

    conditionalDeal: function (available, chance) {
      return { chance: available ? chance : 0 };
    },

    // Scales with retinue size, capped at double base. Cluster is exempt - its
    // subcommanders are not commanders. See tech-cards.md.
    commanderWeight: function (inventory, chance) {
      const commanders = inventory.minions().length;
      const finalChance = playerIsCluster(inventory)
        ? chance
        : Math.min(chance + Math.round(chance / 3) * commanders, chance * 2);
      return finalChance;
    },

    // Worth nothing until you field one, then opens at full base weight rather
    // than creeping up. See tech-cards.md.
    subcommanderWeight: function (inventory, chance) {
      const subcommanders = inventory.minions().length;
      if (subcommanders === 0) {
        return 0;
      }
      return Math.min(
        chance + Math.round(chance / 3) * (subcommanders - 1),
        90,
      );
    },

    // Full weight only for the two states that flood every planet fought on.
    // dryChance is for a card whose value collapses without water, not merely
    // dips (see gwaio_anti_sea). See tech-cards.md.
    navalWeight: function (inventory, chance, dryChance) {
      if (floodsPlanets(inventory)) {
        return chance;
      }
      return _.isUndefined(dryChance) ? Math.round(chance * 0.4) : dryChance;
    },

    floodsPlanets,

    playerIsCluster,

    // Prefer the wrappers below, which keep the tables private. numberOfSystems
    // is a parameter, not an import: this module must stay dependency-free, as
    // every card transitively depends on it. See tech-cards.md.
    farForSize,

    travelledShort: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.short);
    },

    travelledModerate: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.moderate);
    },

    travelledFar: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.far);
    },

    // e.g. mods(gwoUnit.x, "replace", { max_health: 100 })
    //      mods(gwoUnit.x, "multiply", gwoCard.paths.navigation, 1.25)
    mods,

    // The attribute sets cards multiply as one, in the order they emit them.
    paths: {
      navigation: [
        "navigation.move_speed",
        "navigation.brake",
        "navigation.acceleration",
        "navigation.turn_speed",
      ],
      damage: ["damage", "splash_damage"],
      energyWeapon: ["ammo_capacity", "ammo_demand", "ammo_per_shot"],
    },

    // One value across several paths, as a props map - for merging with other
    // keys. Passing the paths straight to mods()/flatMapMods() needs no map.
    eachPath: function (paths, value) {
      return _.zipObject(paths, _.times(paths.length, _.constant(value)));
    },

    // The first `count` recon.observer slots' `field`.
    observerPaths: function (count, field) {
      return _.times(count, (i) => `recon.observer.items.${i}.${field}`);
    },

    // { path: value } for every path, for mods() and flatMapMods().

    // mods() over every file, flattened: one file's entries before the next's.
    flatMapMods: function (files, op, props, value) {
      return _.flatten(
        _.map(_.isString(files) ? [files] : files, (file) =>
          mods(file, op, props, value),
        ),
      );
    },

    // The gwaio_anti_* shape: zero against its counter card, half once any other
    // anti_ tech is held. Must read the passed inventory, never the host's.
    antiTechDeal: function (inventory, baseChance, excludedCardId) {
      if (inventory.hasCard(excludedCardId)) {
        return { chance: 0 };
      }
      const hasAntiTech = _.some(inventory.cards(), (card) =>
        _.startsWith(card.id, "gwaio_anti_"),
      );
      return { chance: hasAntiTech ? baseChance / 2 : baseChance };
    },

    hasT2Access: function (inventory) {
      return _.some(inventory.cards(), (card) =>
        _.includes(model.gwoCardsGrantingAdvancedTech, card.id),
      );
    },

    getAllConnectedPlayerCards: function (hostInventory, game) {
      const hostCards =
        hostInventory && _.isFunction(hostInventory.cards)
          ? hostInventory.cards().slice(0)
          : [];

      return _.reduce(
        connectedPlayerInventories(game),
        (allCards, inventory) => allCards.concat(inventory.cards),
        hostCards,
      );
    },

    // The host's own check honours card.unique (gw_inventory.hasCard); a
    // viewer's saved cards are matched by id alone.
    anyPlayerHasCard: function (hostInventory, cardId, game) {
      return (
        (hostInventory &&
          _.isFunction(hostInventory.hasCard) &&
          hostInventory.hasCard(cardId)) ||
        _.some(connectedPlayerInventories(game), (inventory) =>
          _.some(inventory.cards, { id: cardId }),
        )
      );
    },
  };
});
