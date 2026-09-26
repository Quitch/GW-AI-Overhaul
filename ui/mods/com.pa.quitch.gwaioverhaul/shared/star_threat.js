// A star's threat, as the intelligence panel shows it and a co-op AI player
// weighs it. Vendored from wondible's Section of Foreign Intelligence for
// Galactic War (Apache 2.0, see LICENSE.txt); modified by Quitch - changes
// documented at https://github.com/Quitch/GW-AI-Overhaul
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"], function (
  gwoAI
) {
  // shared/ai.js's buff types, plus `commanders`, which only v5.11.0 and
  // earlier saves carry.
  var BUFF_TYPES = _.assign({}, gwoAI.BUFF_TYPES, { commanders: 5 });

  // A commander's economy as the panel lists it: a shared army's grows with
  // its commanders.
  var commanderEco = function (commander) {
    var eco = gwoAI.aiEconRateWithFloor(commander.econ_rate);
    var count = gwoAI.commanderCount(commander);
    return count > 1 ? eco * ((count + 1) / 2) : eco;
  };

  var buffFactor = function (buff) {
    switch (buff) {
      case BUFF_TYPES.cost:
      case BUFF_TYPES.build:
        return 1.3;
      case BUFF_TYPES.damage:
      case BUFF_TYPES.health:
      case BUFF_TYPES.cooldown:
        return 1.2;
      case BUFF_TYPES.speed:
        return 1.1;
      case BUFF_TYPES.combat:
        return 1.5;
      case BUFF_TYPES.commanders:
        return 1;
      default:
        console.warn("Undefined buff type: " + buff);
        return 1;
    }
  };

  // The star's armies' economy - its AI, minions, and foes - shared with the
  // star's ally when it has one, scaled by the AI's buffs, and tripled for
  // the Guardians. Rounded as the panel shows it.
  var measure = function (ai) {
    var total = 0;
    _.forEach(ai.foes, function (army) {
      total +=
        gwoAI.aiEconRateWithFloor(army.econ_rate) *
        0.4 *
        (gwoAI.commanderCount(army) - 1);
    });
    _.forEach(
      [ai].concat(ai.minions || [], ai.foes || []),
      function (commander) {
        total += commanderEco(commander);
      }
    );
    if (ai.ally) {
      // Not ai.ally.econ_rate - the battle overrides it with this
      // (referee_config_setup.js).
      total /= gwoAI.subcommanderEconRate + 1;
    }
    _.forEach(ai.typeOfBuffs, function (buff) {
      total *= buffFactor(buff);
    });
    if (ai.mirrorMode) {
      total *= 3;
    }
    // + converts the string output of toFixed() back to a float
    return +Number.parseFloat(total).toFixed(2);
  };

  return {
    BUFF_TYPES: BUFF_TYPES,
    commanderEco: commanderEco,
    measure: measure,
  };
});
