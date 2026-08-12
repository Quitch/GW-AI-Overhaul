define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      loc(
        "!LOC:Orca Upgrade Tech changes the destroyer to a water hover unit, preventing torpedoes from targeting it and allowing the navigation of shallow waters. Surface weapon range is increased by 50%.",
      ),
    ),
  ),

  summarize: () => "!LOC:Orca Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_naval_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.orca),
      30,
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.orca,
        path: "unit_types",
        op: "push",
        value: "UNITTYPE_WaterHover",
      },
      {
        file: gwoUnit.orca,
        path: "navigation.type",
        op: "replace",
        value: "water-hover",
      },
      {
        file: gwoUnit.orcaWeapon,
        path: "max_range",
        op: "multiply",
        value: 1.5,
      },
    ]);
  },

  dull: function () {},
}));
