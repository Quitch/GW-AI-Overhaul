define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], (gwoCard, gwoUnit) => ({
  visible: () => true,

  describe: _.constant(
    gwoCard.withSlot(
      `${loc(
        "!LOC:Pelican Upgrade Tech allows air transports to carry commanders."
      )} ${loc("!LOC:Every unit can shoot while being transported.")}`
    )
  ),

  summarize: () => "!LOC:Pelican Upgrade Tech",

  icon: () =>
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png",

  audio: _.constant({ found: "/VO/Computer/gw/board_tech_available_speed" }),
  getContext: gwoCard.getContext,

  deal: function (system, context, inventory) {
    return gwoCard.upgradeDeal(
      gwoCard.hasUnit(inventory.units(), gwoUnit.pelican)
    );
  },

  buff: function (inventory) {
    inventory.maxCards(inventory.maxCards() + 1);
    inventory.addMods([
      {
        file: gwoUnit.pelican,
        path: "transporter.transportable_unit_types",
        op: "wipe",
        value: " - Commander",
      },
      {
        file: gwoUnit.pelican,
        path: "transporter.fire_while_loaded.unit_types",
        op: "replace",
        value: "Land & Mobile",
      },
    ]);
  },

  dull: function () {},
}));
