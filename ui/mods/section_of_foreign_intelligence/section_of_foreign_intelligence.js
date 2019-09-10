// Modified by Quitch - changes documented at https://github.com/Quitch/GW-AI-Overhaul

(function () {
  var threat = function (rate) {
    if (!rate) { return 'unknown' }
    else if (rate < 0.55) { return 'Worthless' }
    else if (rate < 0.65) { return 'Helpless' }
    else if (rate < 0.75) { return 'Weakling' }
    else if (rate < 0.85) { return 'Inexperienced' }
    else if (rate < 0.95) { return 'Novice' }
    else if (rate < 1.05) { return 'Competent' }
    else if (rate < 1.15) { return 'Skilled' }
    else if (rate < 1.25) { return 'Experienced' }
    else if (rate < 1.35) { return 'Veteran' }
    else if (rate < 1.45) { return 'Masterful' }
    else if (rate < 1.65) { return 'Hardcore' }
    else if (rate < 1.85) { return 'Dangerous' }
    else if (rate < 2.05) { return 'Deadly' }
    else if (rate < 2.35) { return 'Inhuman' }
    else if (rate < 2.65) { return 'Genocidal' }
    else if (rate < 3) { return 'Nightmare' }
    else if (rate < 10) { return 'Demigod' }
    else { return 'Godlike' }
  }

  var rgb = function (color) {
    return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
  }

  var intelligence = function (commander) {
    return {
      name: commander.name,
      threat: threat(commander.econ_rate), // + commander.econ_rate.toPrecision(2),
      color: rgb((commander.color && commander.color[0]) || [255, 255, 255]),
      character: commander.character,
    }
  }

  model.systemOwner = ko.computed(function () {
    var primary = model.selection.system().star.ai()
    var commanders = []
    if (primary) {
      commanders.push(intelligence(primary))
      if (primary.minions) {
        commanders = commanders.concat(primary.minions.map(intelligence))
      }
    }
    return commanders
  })

  model.ffaOpponents = ko.computed(function () {
    var primary = model.selection.system().star.ai()
    var commanders = []
    if (primary && primary.foes) {
      commanders = primary.foes.map(intelligence)
    }
    return commanders
  })

  var totalThreat = function (totalRate) {
    if (!totalRate) { return 'None' }
    else if (totalRate < 1) { return 'Very Low' }
    else if (totalRate < 2) { return 'Low' }
    else if (totalRate < 3) { return 'Moderate' }
    else if (totalRate < 4) { return 'High' }
    else if (totalRate < 6) { return 'Very High' }
    else if (totalRate < 8) { return 'Extreme' }
    else if (totalRate < 10) { return 'Critical' }
    else if (totalRate < 20) { return 'Suicidal' }
    else if (totalRate < 30) { return 'Impossible' }
    else { return 'Skynet' }
  }

  model.systemThreat = ko.computed(function () {
    var primary = model.selection.system().star.ai()
    if (primary) {
      var totalEco = primary.econ_rate
      if (primary.minions) {
        _.forEach(primary.minions, function (minion) {
          totalEco = totalEco + minion.econ_rate
        });
      }
      if (primary.foes) {
        _.forEach(primary.foes, function (foe) {
          totalEco = totalEco + foe.econ_rate
        });
      }
    }
    var danger = totalThreat(totalEco)
    return danger
  })

  var formatedString = function (planetSizes) {
    var km2 = 1000000
    var surfaceArea = planetSizes / km2
    if (surfaceArea < 1000) {
      return surfaceArea.toPrecision(3)
    }
    else {
      return Math.floor(surfaceArea)
    }
  };

  model.systemSurfaceArea = ko.computed(function () {
    var area = 0
    model.selection.system().planets().forEach(function (planet) {
      if (planet.generator && planet.generator.biom != 'gas') {
        area += 4 * Math.PI * Math.pow(planet.generator.radius, 2)
      }
    })
    return formatedString(area)
  })

  var url = 'coui://ui/mods/section_of_foreign_intelligence/section_of_foreign_intelligence.html'
  $.get(url, function (html) {
    console.log("Loaded html " + url);
    var $fi = $(html)
    $('#system-detail').append($fi)
    ko.applyBindings(model, $fi[0])
  })
})()
