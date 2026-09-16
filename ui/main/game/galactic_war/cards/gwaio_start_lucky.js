define([
  "module",
  "shared/gw_common",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], (module, GW, GWCStart, gwoBank, gwoCard) => {
  const CARD = { id: module.id.substring(module.id.lastIndexOf("/") + 1) };
  const loadout = gwoCard.loadout(CARD, {
    bank: gwoBank,
    start: GWCStart,
  });
  return {
    visible: () => false,
    summarize: function () {
      return "!LOC:Lucky Commander";
    },
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
    },
    describe: () =>
      "!LOC:The Lucky Commander is offered four cards instead of three at every planet.",
    hint: function () {
      const icon =
        "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png";
      return {
        icon,
        description: "!LOC:Lucky Commander",
      };
    },
    deal: gwoCard.startCard,
    buff: loadout.buff,
    dull: loadout.dull,
  };
});
