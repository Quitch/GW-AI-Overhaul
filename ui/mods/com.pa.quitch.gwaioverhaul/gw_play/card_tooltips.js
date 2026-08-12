var gwoCardTooltipsLoaded;

function gwoCardTooltips() {
  if (gwoCardTooltipsLoaded || model.game().isTutorial()) {
    return;
  }

  gwoCardTooltipsLoaded = true;

  try {
    $("#system-card").replaceWith(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system.html"
      )
    );
    locTree($("#system-card"));

    // Build once per tooltip, not once per unit in it - a card covering most of
    // the unit list would otherwise rescan the inventory on every hover.
    const playerUnitLookup = () => {
      const owned = {};
      const playerUnits = model
        .game()
        .inventory()
        .units()
        .concat("/pa/units/commanders/base_commander/base_commander.json");
      _.forEach(playerUnits, (playerUnit) => {
        owned[playerUnit] = true;
      });
      return owned;
    };

    const lookupHas = (lookup, key) =>
      Object.prototype.hasOwnProperty.call(lookup, key);

    const highlightUnitName = (unitName) =>
      `<span class='highlight'>${unitName}</span>`;

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js",
      ],
      (gwoUnitToNames, gwoCardsToUnits) => {
        model.gwoTechCardTooltip = ko.observableArray([]);

        // global for modder compatibility - New-GW-Cards pushes here
        const cards = gwoCardsToUnits.cards;
        model.gwoCardsToUnits = _.isArray(model.gwoCardsToUnits)
          ? model.gwoCardsToUnits
          : [];
        Array.prototype.push.apply(model.gwoCardsToUnits, cards);
        // global for modder compatibility - New-GW-Cards pushes here
        model.gwoCardsWithoutTooltip = _.isArray(model.gwoCardsWithoutTooltip)
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
          "gwc_minion"
        );

        // Rebuilt whenever it grows: gwoUnitToNames.units is a modder extension
        // point, so caching once would miss late additions.
        let unitNamesByPath = {};
        let unitNamesIndexedCount = -1;
        const unitNameFor = (unit) => {
          if (unitNamesIndexedCount !== gwoUnitToNames.units.length) {
            unitNamesByPath = {};
            _.forEach(gwoUnitToNames.units, (entry) => {
              unitNamesByPath[entry.path] = entry.name;
            });
            unitNamesIndexedCount = gwoUnitToNames.units.length;
          }
          return lookupHas(unitNamesByPath, unit)
            ? unitNamesByPath[unit]
            : undefined;
        };

        const sortUnitNames = (units) => {
          const owned = playerUnitLookup();
          return _.map(units, (unit) => {
            const name = unitNameFor(unit);

            if (_.isUndefined(name)) {
              console.warn(
                `${unit} is invalid or missing from GWO unit_names.js`
              );
              return loc("!LOC:Unknown Unit");
            }

            const translatedName = loc(name);
            return lookupHas(owned, unit)
              ? translatedName
              : highlightUnitName(translatedName);
          }).sort();
        };

        const makeCardTooltip = (card, hoverIndex) => {
          if (card.isLoadout()) {
            return;
          }

          const cardId = card.id();
          const noTooltip = _.some(
            model.gwoCardsWithoutTooltip,
            (cardWithoutTooltip) => cardWithoutTooltip === cardId
          );

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
                `${cardId} is invalid or missing from model.gwoCardsToUnits`
              );
            }
            return;
          }

          const units = model.gwoCardsToUnits[cardUnitsIndex].units;
          let tooltip;
          if (units) {
            const affectedUnits = sortUnitNames(units);
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

        model.showSystemCard.subscribe(() => {
          if (model.showSystemCard()) {
            _.forEach(model.currentSystemCardList(), makeCardTooltip);
          }
        });
        // Ensure the tooltip is shown even if the UI is refreshed
        if (model.showSystemCard()) {
          _.forEach(model.currentSystemCardList(), makeCardTooltip);
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
      }
    );
  } catch (e) {
    console.error(e);
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoCardTooltips();
