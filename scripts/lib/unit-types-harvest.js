"use strict";

// The fixture harvest-unit-types.js writes, from root objects as
// mod-roots.js makes them: `stock` reads the base game's roots alone, and the
// top-level `units` and `buildable` read the mods' roots over them. A mod's
// shadow of a stock spec therefore never stands in for the stock spec. The
// stock unit list is the last base-game root's, as pa_ex1's replaces pa's;
// the mods' lists are merged into it. See testing.md.

const { codeUnitCompare } = require("./loc-keys.js");

function view(roots, listRoots) {
  // "/pa/units/x.json" -> "units/x.json", last root that has it wins.
  const readJson = (specPath) => {
    const rel = specPath.replace(/^\/pa\//, "");
    const root = roots.findLast((candidate) => candidate.has(rel));
    return root ? JSON.parse(root.read(rel)) : undefined;
  };

  // The first value of `field` up the base_spec chain; null when no spec on
  // the chain is on disk at all.
  const chainValue = (specPath, field) => {
    const seen = new Set();
    let current = specPath;
    let found = false;
    while (current && !seen.has(current)) {
      seen.add(current);
      const spec = readJson(current);
      if (!spec) {
        return found ? undefined : null;
      }
      found = true;
      if (spec[field] !== undefined) {
        return spec[field];
      }
      current = spec.base_spec;
    }
    return undefined;
  };

  const listed = new Set();
  for (const root of listRoots) {
    if (root.has("units/unit_list.json")) {
      for (const unit of JSON.parse(root.read("units/unit_list.json")).units) {
        listed.add(unit);
      }
    }
  }

  const units = {};
  const buildable = {};
  let missing = 0;
  for (const unit of [...listed].sort(codeUnitCompare)) {
    const types = chainValue(unit, "unit_types");
    if (types === null) {
      missing++;
      continue;
    }
    units[unit] = Array.isArray(types) ? types : [];
    const expression = chainValue(unit, "buildable_types");
    if (typeof expression === "string" && expression.length) {
      buildable[unit] = expression;
    }
  }
  return { units, buildable, missing };
}

// Each stock unit whose unit_types or buildable_types the mods change. The
// order of unit_types carries no meaning, so a reordered copy is no change.
function shadowsOf(stock, modded) {
  const comparable = (value) =>
    JSON.stringify(
      Array.isArray(value) ? [...value].sort(codeUnitCompare) : value
    );
  const shadows = [];
  for (const unit of Object.keys(stock.units)) {
    for (const [field, key] of [
      ["unit_types", "units"],
      ["buildable_types", "buildable"],
    ]) {
      if (comparable(stock[key][unit]) !== comparable(modded[key][unit])) {
        shadows.push({ unit, field });
      }
    }
  }
  return shadows;
}

function harvestUnitTypes(stockRoots, modRoots) {
  const stockList = stockRoots
    .filter((root) => root.has("units/unit_list.json"))
    .slice(-1);
  const stock = view(stockRoots, stockList);
  const modded = view(stockRoots.concat(modRoots), stockList.concat(modRoots));
  return {
    fixture: {
      units: modded.units,
      buildable: modded.buildable,
      stock: { units: stock.units, buildable: stock.buildable },
    },
    shadows: shadowsOf(stock, modded),
    missing: { stock: stock.missing, units: modded.missing },
  };
}

module.exports = { harvestUnitTypes };
