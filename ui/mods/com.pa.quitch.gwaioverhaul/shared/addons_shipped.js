// The add-on descriptors GWO ships. Each add-on branch adds its addon/<id>.js
// here; third-party mods push theirs onto model.gwoAddons instead. See
// races.md, "Add-ons".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/addon/second_wave.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/addon/section17.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/addon/osmech.js",
], function (secondWave, section17, osmech) {
  return [secondWave, section17, osmech];
});
