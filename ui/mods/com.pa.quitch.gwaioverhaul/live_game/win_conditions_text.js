define(() =>
  // options is the game_options object the server echoes to live_game clients;
  // loc is passed in so the module stays loadable under the Node test harness
  (options, loc) => {
    if (!options || options.game_type !== "Galactic War") {
      return "";
    }

    const modifiers = [];
    // the server's sudden death check ignores eradication_mode
    if (options.sudden_death_mode) {
      modifiers.push(loc("!LOC:Sudden Death"));
    } else if (options.eradication_mode) {
      const targets = [loc("!LOC:Commander")];
      if (options.eradication_mode_sub_commanders) {
        targets.push(loc("!LOC:Colonel"));
      }
      if (options.eradication_mode_factories) {
        targets.push(loc("!LOC:Factory"));
      }
      if (options.eradication_mode_fabricators) {
        targets.push(loc("!LOC:Fabber"));
      }
      modifiers.push(`${loc("!LOC:Eradicate")}: ${targets.join(", ")}`);
    }
    if (options.bounty_mode) {
      let bounty = loc("!LOC:Bounties");
      if (typeof options.bounty_value === "number") {
        bounty += ` x${options.bounty_value}`;
      }
      modifiers.push(bounty);
    }
    return modifiers.join(" | ");
  });
