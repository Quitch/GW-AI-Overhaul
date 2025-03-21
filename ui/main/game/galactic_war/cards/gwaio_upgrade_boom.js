define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      loc(
        "!LOC:Boom Upgrade Tech replaces Dox with Booms in the Lob. Enables the building of Lobs."
      ) +
        "<br> <br>" +
        loc("!LOC:Does not use a Data Bank.")
    ),
    summarize: _.constant("!LOC:Boom Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_artillery_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: gwoCard.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwoCard.hasUnit(inventory.units(), gwoUnit.boom) &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.lob)
      ) {
        chance = 60;
      }
      return {
        params: {
          allowOverflow: true,
        },
        chance: chance,
      };
    },
    buff: function (inventory) {
      inventory.maxCards(inventory.maxCards() + 1);
      inventory.addUnits(gwoUnit.lob);

      inventory.addMods([
        {
          file: gwoUnit.lobAmmo,
          path: "spawn_unit_on_death",
          op: "replace",
          value: gwoUnit.boom,
        },
      ]);
    },
    dull: function () {},
  };
});
