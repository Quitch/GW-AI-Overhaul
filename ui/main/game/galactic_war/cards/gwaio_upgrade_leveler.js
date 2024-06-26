define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Leveler Upgrade Tech enables the building of assault tanks by the Unit Cannon."
    ),
    summarize: _.constant("!LOC:Leveler Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
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
        gwoCard.hasUnit(inventory.units(), gwoUnit.leveler) &&
        gwoCard.hasUnit(inventory.units(), gwoUnit.unitCannon) &&
        !inventory.hasCard("gwaio_start_paratrooper")
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwoUnit.leveler,
          path: "unit_types",
          op: "push",
          value: "UNITTYPE_CannonBuildable",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "load",
          value: "gwaio_upgrade_leveler.json",
        },
      ]);
    },
    dull: function () {},
  };
});
