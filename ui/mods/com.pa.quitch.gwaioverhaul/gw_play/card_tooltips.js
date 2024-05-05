var gwoCardTooltipsLoaded;

function gwoCardTooltips() {
  if (gwoCardTooltipsLoaded || model.game().isTutorial()) {
    return;
  }

  gwoCardTooltipsLoaded = true;

  try {
    // UI for card tooltips
    $("#system-card").replaceWith(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_system.html"
      )
    );
    locTree($("#system-card"));

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js",
      ],
      function (gwoUnitToNames, gwoCardsToUnits) {
        model.gwoTechCardTooltip = ko.observableArray([]);

        // support for modders to add to the tooltip system
        if (model.gwoCardsToUnits) {
          model.gwoCardsToUnits = model.gwoCardsToUnits.concat(
            gwoCardsToUnits.cards
          );
        } else {
          model.gwoCardsToUnits = gwoCardsToUnits.cards;
        }

        var unitInPlayerInventory = function (unit) {
          var playerUnits = model.game().inventory().units();
          return _.some(playerUnits, function (playerUnit) {
            return playerUnit === unit;
          });
        };

        var highlightUnitName = function (unitName) {
          return "<span class='highlight'>" + unitName + "</span>";
        };

        var makeCardTooltip = function (card, hoverIndex) {
          if (card.isLoadout()) {
            return;
          }

          // Ensure inventory hovers work at the same time as the new tech display
          if (_.isUndefined(hoverIndex)) {
            hoverIndex = 0;
          } else {
            hoverIndex += 1;
          }

          var cardId = card.id();
          var cardUnitsIndex = _.findIndex(model.gwoCardsToUnits, {
            id: cardId,
          });

          if (cardUnitsIndex === -1) {
            if (!_.isUndefined(cardId)) {
              console.warn(
                cardId + " is invalid or missing from model.gwoCardsToUnits"
              );
            }
            return;
          }

          var units = model.gwoCardsToUnits[cardUnitsIndex].units;
          if (units) {
            // find, sort, and highlight the unit names
            var affectedUnits = _.map(units, function (unit) {
              var unitNameIndex = _.findIndex(gwoUnitToNames.units, {
                path: unit,
              });
              if (unitNameIndex === -1) {
                console.warn(
                  unit + " is invalid or missing from GWO unit_names.js"
                );
                return loc("!LOC:Unknown Unit");
              } else {
                var translatedName = loc(
                  gwoUnitToNames.units[unitNameIndex].name
                );
                var formattedName = unitInPlayerInventory(unit)
                  ? translatedName
                  : highlightUnitName(translatedName);
                return formattedName;
              }
            }).sort();

            // set up the final tooltip
            model.gwoTechCardTooltip()[hoverIndex] = _.map(
              affectedUnits,
              function (unitName, index) {
                if (affectedUnits.length < 13) {
                  return unitName.concat("<br>");
                } else if (index < affectedUnits.length - 1) {
                  return unitName.concat(" | ");
                } else {
                  return unitName;
                }
              }
            );
          } else {
            model.gwoTechCardTooltip()[hoverIndex] = undefined;
          }
        };

        model.showSystemCard.subscribe(function () {
          if (model.showSystemCard()) {
            _.forEach(model.currentSystemCardList(), makeCardTooltip);
          }
        });
        // Ensure the tooltip is shown even if the UI is refreshed
        if (model.showSystemCard()) {
          _.forEach(model.currentSystemCardList(), makeCardTooltip);
        }

        // add tooltips to cards
        var hoverCount = 0;
        model.setHoverCard = function (card, hoverEvent) {
          if (card === model.hoverCard()) {
            card = undefined;
          }
          ++hoverCount;

          if (!card) {
            // Delay clears for a bit to avoid flashing
            var oldCount = hoverCount;
            _.delay(function () {
              if (oldCount !== hoverCount) {
                return;
              }
              model.hoverCard(undefined);
            }, 300);
            return;
          } else {
            makeCardTooltip(card);
          }

          var $block = $(hoverEvent.target);
          if (!$block.is(".one-card")) {
            $block = $block.parent(".one-card");
          }
          var left = $block.offset().left + $block.width() / 2;
          model.hoverOffset(left.toString() + "px");
          model.hoverCard(card);
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoCardTooltips();
