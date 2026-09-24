define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (gwoCard, gwoGroup) {
  var weight = function (chance, fallback, inventory, system, context) {
    return _.isUndefined(chance)
      ? fallback
      : chance(inventory, system, context);
  };

  return {
    // A gwaio_anti_* card: every ammo spec takes the `armour` multipliers
    // (armour type -> factor), dealt through antiTechDeal against `counter`.
    antiTechCard: function (options) {
      return {
        visible: _.constant(true),
        describe: _.constant(options.description),
        summarize: _.constant(options.name),
        icon: _.constant(options.icon),
        audio: _.constant({
          found: "/VO/Computer/gw/board_tech_available_ammunition",
        }),
        getContext: gwoCard.getContext,
        deal: function (system, context, inventory) {
          return gwoCard.antiTechDeal(
            inventory,
            weight(options.chance, 40, inventory, system, context),
            options.counter
          );
        },
        buff: function (inventory) {
          inventory.addMods(
            gwoCard.flatMapMods(
              gwoGroup.ammo,
              "multiplyOrCreate",
              _.mapKeys(options.armour, function (value, armourType) {
                return "armor_damage_map." + armourType;
              })
            )
          );
        },
        dull: function () {},
      };
    },

    // A gwaio_cooldown_* card: halves factory_cooldown_time on `factories`,
    // dealt while any of `requires` (default `factories`) is held.
    cooldownCard: function (options) {
      return {
        visible: _.constant(true),
        describe: _.constant(options.description),
        summarize: _.constant(options.name),
        icon: _.constant(options.icon),
        audio: _.constant({ found: options.audio }),
        getContext: gwoCard.getContext,
        deal: function (system, context, inventory) {
          return gwoCard.conditionalDeal(
            gwoCard.hasUnit(
              inventory.units(),
              options.requires || options.factories
            ),
            weight(options.chance, 70, inventory, system, context)
          );
        },
        buff: function (inventory) {
          inventory.addMods(
            gwoCard.flatMapMods(options.factories, "multiply", {
              factory_cooldown_time: 0.5,
            })
          );
        },
        dull: function () {},
      };
    },
  };
});
