define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  return {
    visible: _.constant(false),
    summarize: function () {
      if (gwoCard.isEnglish()) {
        return "!LOC:Terminal Commander";
      }
      return loc("!LOC:Deathmark") + " " + loc("!LOC:Commander"); // scuffed translation using existing strings
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:You're dying, but you have one last war left in you. Your units' health decreases over time, and your commander's fastest of all. Life is short and must be lived to the full, so unit damage and movement is doubled and costs are halved. Life through victory, Commander!"
    ),
    hint: function () {
      var icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      if (gwoCard.isEnglish()) {
        return {
          icon: icon,
          description: "!LOC:Terminal Commander",
        };
      }
      return {
        icon: icon,
        description: loc("!LOC:Deathmark") + " " + loc("!LOC:Commander"), // scuffed translation using existing strings
      };
    },
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.maxCards(inventory.maxCards() + 1);
        } else {
          GWCStart.buff(inventory);

          var playerIsCluster =
            inventory.getTag("global", "playerFaction") === 4;
          var mobileUnits = gwoGroup.mobile.concat(gwoUnit.commander);
          var mods = gwoCard
            .flatMapMods(
              playerIsCluster ? gwoGroup.unitsNoCluster : gwoGroup.units,
              "multiply",
              { build_metal_cost: 0.5 }
            )
            .concat(
              gwoCard.mods(gwoUnit.commander, "add", {
                passive_health_regen: -15,
              }),
              gwoCard.flatMapMods(gwoGroup.immobile, "add", {
                passive_health_regen: -3,
              }),
              gwoCard.flatMapMods(gwoGroup.factories, "add", {
                passive_health_regen: -7,
              }),
              gwoCard.flatMapMods(gwoGroup.mobile, "add", {
                passive_health_regen: -1,
              }),
              gwoCard.flatMapMods(mobileUnits, "multiply", {
                "navigation.move_speed": 2,
                "navigation.acceleration": 2,
                "navigation.brake": 2,
                "navigation.turn_speed": 2,
              }),
              gwoCard.flatMapMods(gwoGroup.ammo, "multiply", {
                damage: 2,
                splash_damage: 2,
              })
            );
          inventory.addMods(mods);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
