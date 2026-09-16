(() => {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    $("#system-card").replaceWith(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system.html",
      ),
    );
    locTree($("#system-card"));

    // This client's inventory, read as gw_play/races.js reads it: a viewer's
    // own record under per-player tech, the host's otherwise.
    const ownInventory = () => {
      const record =
        _.isFunction(model.currentCoopPlayerInventoryData) &&
        model.currentCoopPlayerInventoryData();
      return (record && record.inventory) || model.game().inventory();
    };

    // A live GWInventory keeps units in an observable; a co-op record holds
    // the serialised array.
    const heldUnits = (inventory) =>
      _.isFunction(inventory.units) ? inventory.units() : inventory.units || [];

    const lookupHas = (lookup, key) =>
      Object.prototype.hasOwnProperty.call(lookup, key);

    const highlightUnitName = (unitName) =>
      `<span class='highlight'>${unitName}</span>`;

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
      ],
      (gwoUnitToNames, gwoCardsToUnits, gwoRaces, unitCells) => {
        // Build once per tooltip, not once per unit in it - a card covering
        // most of the unit list would otherwise rescan the inventory on every
        // hover. A race player owns what the referee would field for the
        // vanilla paths held (raceUnitsFor keeps base_commander, so the
        // commander card still reads owned); an MLA player with add-ons owns
        // those and the add-on units they bring. See races.md, "Capability
        // cells".
        const playerUnitLookup = (inventory, race, cells) => {
          const owned = {};
          const held = heldUnits(inventory).concat(
            "/pa/units/commanders/base_commander/base_commander.json",
          );
          let fielded = held;
          if (cells) {
            fielded = (
              gwoRaces.isMla(race)
                ? unitCells.addonUnitsFor
                : unitCells.raceUnitsFor
            )(held, cells.vanilla, cells.race);
          }
          _.forEach(fielded, (unit) => {
            owned[unit] = true;
          });
          return owned;
        };

        model.gwoTechCardTooltip = ko.observableArray([]);

        // global for modder compatibility - New-GW-Cards pushes here
        const cards = gwoCardsToUnits.cards;
        model.gwoCardsToUnits = Array.isArray(model.gwoCardsToUnits)
          ? model.gwoCardsToUnits
          : [];
        Array.prototype.push.apply(model.gwoCardsToUnits, cards);
        // global for modder compatibility - New-GW-Cards pushes here
        model.gwoCardsWithoutTooltip = Array.isArray(
          model.gwoCardsWithoutTooltip,
        )
          ? model.gwoCardsWithoutTooltip
          : [];
        model.gwoCardsWithoutTooltip.push(
          "gwaio_anti_air",
          "gwaio_anti_bots",
          "gwaio_anti_commander",
          "gwaio_anti_hover",
          "gwaio_anti_orbital",
          "gwaio_anti_sea",
          "gwaio_anti_structure",
          "gwaio_anti_vehicles",
          "gwaio_enable_bot_aa",
          "gwaio_enable_bounties",
          "gwaio_enable_eradication",
          "gwaio_enable_landanywhere",
          "gwaio_enable_orbitalbombardment",
          "gwaio_enable_suddendeath",
          "gwaio_enable_tsunami",
          "gwaio_upgrade_subcommander_duplication",
          "gwaio_upgrade_subcommander_fabber",
          "gwaio_upgrade_subcommander_tactics",
          "gwc_add_card_slot",
          "gwc_minion",
        );

        // Rebuilt whenever it grows: gwoUnitToNames.units is a modder extension
        // point, so caching once would miss late additions.
        let unitNamesByPath = {};
        let unitNamesIndexedCount = -1;
        const unitNameFor = (unit) => {
          if (unitNamesIndexedCount !== gwoUnitToNames.units.length) {
            unitNamesByPath = {};
            _.forEach(gwoUnitToNames.units, (entry) => {
              // A mod pushes here, and this runs inside a ko subscription where
              // a throw is uncaught - skip a malformed entry rather than lose
              // the whole tooltip.
              if (entry) {
                unitNamesByPath[entry.path] = entry.name;
              }
            });
            unitNamesIndexedCount = gwoUnitToNames.units.length;
          }
          return lookupHas(unitNamesByPath, unit)
            ? unitNamesByPath[unit]
            : undefined;
        };

        // A race or add-on unit is named by its descriptor, anything else by
        // unit_names.js. Both hold "!LOC:" or bare strings for loc().
        const raceUnitNameFor = (race, unit) => {
          const name = gwoRaces.unitName(race, unit);
          return _.isUndefined(name) ? unitNameFor(unit) : name;
        };

        // One line per name: Legion ships two units each called Purger,
        // Spoiler and Meteoroid. A name is plain when any unit behind it is
        // owned - highlighting it would say the player lacks a Spoiler.
        const sortUnitNames = (units, race, owned) => {
          const ownedByName = {};
          const names = [];

          _.forEach(units, (unit) => {
            let name = raceUnitNameFor(race, unit);

            if (_.isUndefined(name)) {
              console.warn(
                `${unit} is invalid or missing from GWO unit_names.js${
                  gwoRaces.isMla(race)
                    ? ""
                    : ` and the ${race} descriptor's unitNames`
                }`,
              );
              name = "!LOC:Unknown Unit";
            }

            const translatedName = loc(name);
            if (!lookupHas(ownedByName, translatedName)) {
              names.push(translatedName);
              ownedByName[translatedName] = false;
            }
            if (lookupHas(owned, unit)) {
              ownedByName[translatedName] = true;
            }
          });

          return _.map(names, (name) =>
            ownedByName[name] ? name : highlightUnitName(name),
          ).sort();
        };

        const makeCardTooltip = (card, hoverIndex) => {
          if (card.isLoadout()) {
            return;
          }

          const cardId = card.id();
          const noTooltip = _.includes(model.gwoCardsWithoutTooltip, cardId);

          if (noTooltip) {
            return;
          }

          // Ensure inventory hovers work at the same time as the new tech display
          if (_.isUndefined(hoverIndex)) {
            hoverIndex = 0;
          } else {
            hoverIndex += 1;
          }

          const cardUnitsIndex = _.findIndex(model.gwoCardsToUnits, {
            id: cardId,
          });

          if (cardUnitsIndex === -1) {
            if (!_.isUndefined(cardId)) {
              console.warn(
                `${cardId} is invalid or missing from model.gwoCardsToUnits`,
              );
            }
            return;
          }

          const units = model.gwoCardsToUnits[cardUnitsIndex].units;
          let tooltip;
          if (units) {
            // Resolved per tooltip, not once: a third-party race registers
            // in gw_play/races.js's own callback, and its cells land later.
            const inventory = ownInventory();
            const race = gwoRaces.raceOf(inventory);
            const cells = gwoRaces.cellsOf(race);
            let shown = units;
            if (cells) {
              shown = (
                gwoRaces.isMla(race)
                  ? unitCells.addonCardUnitsFor
                  : unitCells.cardUnitsFor
              )(units, cells.vanilla, cells.race);
            }
            const affectedUnits = sortUnitNames(
              shown,
              race,
              playerUnitLookup(inventory, race, cells),
            );
            tooltip = _.map(affectedUnits, (unitName, index) => {
              if (affectedUnits.length < 13) {
                return unitName.concat("<br>");
              } else if (index < affectedUnits.length - 1) {
                return unitName.concat(" | ");
              } else {
                return unitName;
              }
            });
          }

          // Write through the observableArray. Assigning into the array it returns
          // skips valueHasMutated, so nothing is notified.
          const tooltips = model.gwoTechCardTooltip().slice();
          tooltips[hoverIndex] = tooltip;
          model.gwoTechCardTooltip(tooltips);
        };

        const showSystemCardTooltips = () => {
          if (model.showSystemCard()) {
            _.forEach(model.currentSystemCardList(), makeCardTooltip);
          }
        };

        model.showSystemCard.subscribe(showSystemCardTooltips);
        // Ensure the tooltip is shown even if the UI is refreshed
        showSystemCardTooltips();

        // The cells land after the scene is up; a star opened before then was
        // named for MLA. See races.md, "Capability cells".
        if (ko.isObservable(model.gwoRaceCellsPrimed)) {
          model.gwoRaceCellsPrimed.subscribe(() => {
            showSystemCardTooltips();
            if (model.hoverCard()) {
              makeCardTooltip(model.hoverCard());
            }
          });
        }

        let hoverCount = 0;
        model.setHoverCard = (card, hoverEvent) => {
          if (card === model.hoverCard()) {
            card = undefined;
          }
          ++hoverCount;

          if (card) {
            makeCardTooltip(card);
          } else {
            // Delay clears for a bit to avoid flashing
            const oldCount = hoverCount;
            _.delay(() => {
              if (oldCount !== hoverCount) {
                return;
              }
              model.hoverCard(undefined);
            }, 300);
            return;
          }

          let $block = $(hoverEvent.target);
          if (!$block.is(".one-card")) {
            $block = $block.parent(".one-card");
          }
          const left = $block.offset().left + $block.width() / 2;
          model.hoverOffset(`${left.toString()}px`);
          model.hoverCard(card);
        };
      },
    );
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
})();
