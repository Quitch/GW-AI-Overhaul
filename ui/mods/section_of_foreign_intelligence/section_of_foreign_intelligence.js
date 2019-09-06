// Modified by Quitch

(function () {
  var evaluation = function (rate) {
    if (!rate) { return 'unspecified' }
    else if (rate < 0.5) { return 'helpless' }
    else if (rate < 0.75) { return 'incompetent' }
    else if (rate < 0.95) { return 'weak' }
    else if (rate < 1.05) { return 'competent' }
    else if (rate < 1.25) { return 'strong' }
    else if (rate < 1.5) { return 'dangerous' }
    else if (rate < 1.75) { return 'deadly' }
    else { return 'unstoppable' }
  }

  var rgb = function (color) {
    return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
  }

  var intelligence = function (commander) {
    return {
      name: commander.name,
      evaluation: evaluation(commander.econ_rate), // + commander.econ_rate.toPrecision(2),
      color: rgb((commander.color && commander.color[0]) || [255, 255, 255]),
    }
  }

  model.foreign_intelligence = ko.computed(function () {
    var primary = model.selection.system().star.ai()
    var commanders = []
    if (primary) {
      commanders.push(intelligence(primary))
      if (primary.minions) {
        commanders = commanders.concat(primary.minions.map(intelligence))
      }
      // Support for Galatic War AI Overhaul
      if (primary.foes) {
        commanders = commanders.concat(primary.foes.map(intelligence))
      }
    }
    return commanders
  })

  var km2 = 1000000

  var formatedString = function (number) {
    var number = number / km2
    if (number < 1000) {
      return number.toPrecision(3)
    } else {
      return Math.floor(number)
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

  url = 'coui://ui/mods/section_of_foreign_intelligence/section_of_foreign_intelligence.html'
  $.get(url, function (html) {
    console.log("Loaded html " + url);
    var $fi = $(html)
    $('#system-detail').append($fi)
    ko.applyBindings(model, $fi[0])
  })
})()
