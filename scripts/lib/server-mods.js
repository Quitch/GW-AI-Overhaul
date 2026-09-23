"use strict";

// The race and add-on server mods GWO ships descriptors for, in the order the
// local-only scripts mount them: every race's, then every add-on's, each in
// registry order, as validate-race-trees.js layers them. A later mod shadows an
// earlier one.

const { MOD_ROOT, loadCouiModule } = require("./amd-loader.js");

// Mods a descriptor's own mod needs but does not list, mounted just before it.
// commander-merge supplies the Bugs commander's base spec (race/bugs.js).
const COMPANIONS = {
  "com.pa.ferretmaster.bugs": ["com.pa.ferretmaster.commander-merge"],
};

function shippedServerMods() {
  const descriptors = loadCouiModule(
    MOD_ROOT + "/shared/races_shipped.js"
  ).concat(loadCouiModule(MOD_ROOT + "/shared/addons_shipped.js"));
  return descriptors
    .flatMap((descriptor) => descriptor.serverMods)
    .flatMap((id) => (COMPANIONS[id] || []).concat(id));
}

module.exports = { COMPANIONS, shippedServerMods };
