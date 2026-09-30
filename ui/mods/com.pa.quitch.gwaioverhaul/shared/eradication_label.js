// The eradication modifier as the intelligence panel and the battle's
// win-conditions line both show it. loc is passed in so the module stays
// loadable under the Node test harness.
define(function () {
  // targets: whether the enemy's Sub Commanders, factories and fabbers must go
  // as well as its commander.
  return function (targets, loc) {
    var names = [loc("!LOC:Commander")];
    if (targets.subCommanders) {
      names.push(loc("!LOC:Colonel"));
    }
    if (targets.factories) {
      names.push(loc("!LOC:Factory"));
    }
    if (targets.fabbers) {
      names.push(loc("!LOC:Fabber"));
    }
    return loc("!LOC:Eradicate") + ": " + names.join(", ");
  };
});
