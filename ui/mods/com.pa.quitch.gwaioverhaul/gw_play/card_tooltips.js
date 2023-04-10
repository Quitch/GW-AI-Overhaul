var gwoCardTooltipsLoaded;

if (!gwoCardTooltipsLoaded) {
  gwoCardTooltipsLoaded = true;

  function gwoCardTooltips() {
    try {
      // Set up tooltips and tech deletion
      $("#hover-card").replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_inventory.html"
        )
      );
      locTree($("#hover-card"));
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

          if (model.gwoCardsToUnits) {
            model.gwoCardsToUnits = model.gwoCardsToUnits.concat(
              gwoCardsToUnits.cards
            );
          } else {
            model.gwoCardsToUnits = gwoCardsToUnits.cards;
          }

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
            var cardIndex = _.findIndex(model.gwoCardsToUnits, {
              id: cardId,
            });

            if (cardIndex === -1) {
              if (!_.isUndefined(cardId)) {
                console.warn(
                  cardId + " is invalid or missing from model.gwoCardsToUnits"
                );
              }
              return;
            }

            var units = model.gwoCardsToUnits[cardIndex].units;
            if (units) {
              var affectedUnits = _.map(units, function (unit) {
                cardIndex = _.findIndex(gwoUnitToNames.units, {
                  path: unit,
                });
                if (cardIndex === -1) {
                  console.warn(
                    unit + " is invalid or missing from GWO unit_names.js"
                  );
                  return loc("!LOC:Unknown Unit");
                } else {
                  return loc(gwoUnitToNames.units[cardIndex].name);
                }
              }).sort();

              model.gwoTechCardTooltip()[hoverIndex] = _.map(
                affectedUnits,
                function (unit, index) {
                  if (affectedUnits.length < 13) {
                    return unit.concat("<br>");
                  } else if (index < affectedUnits.length - 1) {
                    return unit.concat(" | ");
                  } else {
                    return unit;
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
}
