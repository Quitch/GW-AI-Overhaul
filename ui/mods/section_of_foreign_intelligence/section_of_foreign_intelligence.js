// Modified by Quitch - changes documented at https://github.com/Quitch/GW-AI-Overhaul

(function () {
  var threat = function (rate) {
    if (!rate) {
      return "!LOC:Unknown";
    } else if (rate < 0.649) {
      return "!LOC:Worthless";
    } else if (rate < 0.749) {
      return "!LOC:Helpless";
    } else if (rate < 0.849) {
      return "!LOC:Weakling";
    } else if (rate < 0.949) {
      return "!LOC:Inexperienced";
    } else if (rate < 1.049) {
      return "!LOC:Competent";
    } else if (rate < 1.149) {
      return "!LOC:Skilled";
    } else if (rate < 1.249) {
      return "!LOC:Experienced";
    } else if (rate < 1.349) {
      return "!LOC:Veteran";
    } else if (rate < 1.449) {
      return "!LOC:Masterful";
    } else if (rate < 1.649) {
      return "!LOC:Hardcore";
    } else if (rate < 1.849) {
      return "!LOC:Dangerous";
    } else if (rate < 2.049) {
      return "!LOC:Deadly";
    } else if (rate < 2.349) {
      return "!LOC:Inhuman";
    } else if (rate < 2.649) {
      return "!LOC:Genocidal";
    } else if (rate < 3) {
      return "!LOC:Nightmare";
    } else if (rate < 10) {
      return "!LOC:Demigod";
    } else {
      return "!LOC:Godlike";
    }
  };

  var rgb = function (color) {
    return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
  };

  var intelligence = function (commander) {
    var name = commander.name;
    if (commander.commanderCount > 1 || commander.bossCommanders)
      name = commander.commanderCount
        ? name.concat(" x", commander.commanderCount)
        : name.concat(" x", commander.bossCommanders);
    return {
      name: name,
      threat: loc(threat(commander.econ_rate)), // + commander.econ_rate.toPrecision(2),
      color: rgb((commander.color && commander.color[0]) || [255, 255, 255]),
      character: loc(commander.character),
    };
  };

  model.systemOwner = ko.computed(function () {
    var primary = model.selection.system().star.ai();
    var commanders = [];
    if (primary) {
      commanders.push(intelligence(primary));
      if (primary.minions) {
        commanders = commanders.concat(primary.minions.map(intelligence));
      }
    }
    return commanders;
  });

  // Game Options

  model.bountyMode = ko.computed(function () {
    var bountyMode = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().bountyMode
    )
      bountyMode = loc("!LOC:Enabled");
    return bountyMode;
  });

  model.landAnywhere = ko.computed(function () {
    var landAnywhere = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().landAnywhere
    )
      landAnywhere = loc("!LOC:Enabled");
    return landAnywhere;
  });

  model.suddenDeath = ko.computed(function () {
    var suddenDeath = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().suddenDeath
    )
      suddenDeath = loc("!LOC:Enabled");
    return suddenDeath;
  });

  // AI Buffs

  model.techBuild = ko.computed(function () {
    var techBuild = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().typeOfBuffs &&
      _.includes(model.selection.system().star.ai().typeOfBuffs, 4)
    )
      techBuild = loc("!LOC:Enabled");
    return techBuild;
  });

  model.techCost = ko.computed(function () {
    var techCost = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().typeOfBuffs &&
      _.includes(model.selection.system().star.ai().typeOfBuffs, 0)
    )
      techCost = loc("!LOC:Enabled");
    return techCost;
  });

  model.techDamage = ko.computed(function () {
    var techDamage = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().typeOfBuffs &&
      _.includes(model.selection.system().star.ai().typeOfBuffs, 1)
    )
      techDamage = loc("!LOC:Enabled");
    return techDamage;
  });

  model.techHealth = ko.computed(function () {
    var techHealth = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().typeOfBuffs &&
      _.includes(model.selection.system().star.ai().typeOfBuffs, 2)
    )
      techHealth = loc("!LOC:Enabled");
    return techHealth;
  });

  model.techSpeed = ko.computed(function () {
    var techSpeed = loc("!LOC:Disabled");
    if (
      model.selection.system().star.ai() &&
      model.selection.system().star.ai().typeOfBuffs &&
      _.includes(model.selection.system().star.ai().typeOfBuffs, 3)
    )
      techSpeed = loc("!LOC:Enabled");
    return techSpeed;
  });

  // Additional Factions

  model.ffaOpponents = ko.computed(function () {
    var primary = model.selection.system().star.ai();
    var commanders = [];
    if (primary && primary.foes) {
      commanders = primary.foes.map(intelligence);
    }
    return commanders;
  });

  var totalThreat = function (totalRate) {
    if (!totalRate) {
      return "!LOC:None";
    } else if (totalRate < 1) {
      return "!LOC:Very Low";
    } else if (totalRate < 2) {
      return "!LOC:Low";
    } else if (totalRate < 3) {
      return "!LOC:Moderate";
    } else if (totalRate < 4) {
      return "!LOC:High";
    } else if (totalRate < 6) {
      return "!LOC:Very High";
    } else if (totalRate < 9) {
      return "!LOC:Extreme";
    } else if (totalRate < 13) {
      return "!LOC:Critical";
    } else if (totalRate < 18) {
      return "!LOC:Suicidal";
    } else if (totalRate < 24) {
      return "!LOC:Impossible";
    } else {
      return "!LOC:Skynet";
    }
  };

  model.systemThreat = ko.computed(function () {
    var primary = model.selection.system().star.ai();
    if (primary) {
      var totalEco = primary.econ_rate;
      if (primary.minions) {
        _.forEach(primary.minions, function (minion) {
          totalEco = totalEco + minion.econ_rate;
        });
      }
      if (primary.foes) {
        _.forEach(primary.foes, function (foe) {
          totalEco = totalEco + foe.econ_rate;
        });
      }
    }
    return loc(totalThreat(totalEco));
  });

  var formatedString = function (number) {
    var km2 = 1000000;
    number = number / km2;
    if (number < 1000) {
      return number.toPrecision(3);
    } else {
      return Math.floor(number);
    }
  };

  model.systemSurfaceArea = ko.computed(function () {
    var area = 0;
    model.selection
      .system()
      .planets()
      .forEach(function (world) {
        if (world.generator && world.generator.biome != "gas") {
          area += 4 * Math.PI * Math.pow(world.generator.radius, 2);
        } else if (world.planet && world.planet.biome != "gas") {
          area += 4 * Math.PI * Math.pow(world.planet.radius, 2);
        }
      });
    return formatedString(area);
  });

  var url =
    "coui://ui/mods/section_of_foreign_intelligence/section_of_foreign_intelligence.html";
  $.get(url, function (html) {
    var $fi = $(html);
    $("#system-detail").append($fi);
    locUpdateDocument();
    ko.applyBindings(model, $fi[0]);
  });
})();
