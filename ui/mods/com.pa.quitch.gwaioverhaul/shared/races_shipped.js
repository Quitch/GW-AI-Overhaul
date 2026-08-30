// The race descriptors GWO ships. Each race branch adds its race/<id>.js here;
// third-party mods push theirs onto model.gwoRaces instead. See races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/race/legion.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/race/bugs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/race/exiles.js",
], function (legion, bugs, exiles) {
  return [legion, bugs, exiles];
});
