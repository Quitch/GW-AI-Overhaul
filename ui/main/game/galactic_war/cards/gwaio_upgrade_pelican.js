define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwoCard, gwoUnit) {
  return gwoCard.upgradeCard({
    name: "!LOC:Pelican Upgrade Tech",
    describe: _.constant(
      gwoCard.withSlot(
        loc(
          "!LOC:Pelican Upgrade Tech allows air transports to carry commanders."
        ) +
          " " +
          loc("!LOC:Every unit can shoot while being transported.")
      )
    ),
    icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_air_engine_upgrade.png",
    audio: "/VO/Computer/gw/board_tech_available_speed",
    requires: gwoUnit.pelican,
    buff: function (inventory) {
      inventory.addMods(
        gwoCard
          .mods(gwoUnit.pelican, "wipe", {
            "transporter.transportable_unit_types": " - Commander",
          })
          .concat(
            gwoCard.mods(gwoUnit.pelican, "replace", {
              "transporter.fire_while_loaded.unit_types": "Land & Mobile",
            })
          )
      );
    },
  });
});
