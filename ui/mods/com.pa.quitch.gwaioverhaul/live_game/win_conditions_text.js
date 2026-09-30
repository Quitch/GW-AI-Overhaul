define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/eradication_label.js",
], function (eradicationLabel) {
  // options is the game_options object the server echoes to live_game clients;
  // loc is passed in so the module stays loadable under the Node test harness
  return function (options, loc) {
    if (!options || options.game_type !== "Galactic War") {
      return "";
    }

    var modifiers = [];
    // the server's sudden death check ignores eradication_mode
    if (options.sudden_death_mode) {
      modifiers.push(loc("!LOC:Sudden Death"));
    } else if (options.eradication_mode) {
      modifiers.push(
        eradicationLabel(
          {
            subCommanders: options.eradication_mode_sub_commanders,
            factories: options.eradication_mode_factories,
            fabbers: options.eradication_mode_fabricators,
          },
          loc
        )
      );
    }
    if (options.bounty_mode) {
      var bounty = loc("!LOC:Bounties");
      if (typeof options.bounty_value === "number") {
        bounty += " x" + options.bounty_value;
      }
      modifiers.push(bounty);
    }
    return modifiers.join(" | ");
  };
});
