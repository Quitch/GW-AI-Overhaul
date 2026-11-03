"use strict";

// Rewrites gw_play/army_colours.js, every faction's Sub Commander, enemy, and
// spent-palette colours, from the faction files and the rules in
// scripts/lib/army-colours.js. Takes about a minute. `--check` writes nothing
// and exits 1 when the file would change. See coop.md, "Colour allocation".

const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");
const colours = require("./lib/army-colours.js");

const OUTPUT = path.join(
  __dirname,
  "..",
  "ui/mods/com.pa.quitch.gwaioverhaul/gw_play/army_colours.js"
);
// RGB grid step for candidate colours. Finer finds a few more colours and
// takes far longer.
const STEP = 3;

const factions = colours.loadFactions();
const factionLab = factions.map((faction) => colours.lab(faction.color[0]));

const candidates = [];
for (let r = 0; r <= 255; r += STEP) {
  for (let g = 0; g <= 255; g += STEP) {
    for (let b = 0; b <= 255; b += STEP) {
      const colour = [r, g, b];
      if (colours.contrastWithBlack(colour) < colours.MIN_CONTRAST) {
        continue;
      }
      const lab = colours.lab(colour);
      const faction = colours.colourSpace(colour);
      candidates.push({
        colour,
        lab,
        faction,
        toFaction: colours.deltaE00(lab, factionLab[faction]),
        nearest: Infinity,
        nearestOwn: Infinity,
        nearestOther: Infinity,
      });
    }
  }
}

const placed = [];
function place(entry) {
  placed.push(entry);
  for (const candidate of candidates) {
    const distance = colours.deltaE00(candidate.lab, entry.lab);
    candidate.nearest = Math.min(candidate.nearest, distance);
    if (entry.faction === candidate.faction) {
      candidate.nearestOwn = Math.min(candidate.nearestOwn, distance);
    } else {
      candidate.nearestOther = Math.min(candidate.nearestOther, distance);
    }
  }
}

// Every colour a battle can already show: each faction's players, and The
// Guardians. Palette picks join as they are made.
factions.forEach((faction, index) => {
  colours.playerColours(faction, index).forEach((colour) => {
    place({ colour, lab: colours.lab(colour), faction: index });
  });
});
place({
  colour: colours.GUARDIANS,
  lab: colours.lab(colours.GUARDIANS),
  faction: -1,
});

function nearestDistance(entry) {
  let best = Infinity;
  for (const other of placed) {
    if (other !== entry) {
      best = Math.min(best, colours.deltaE00(entry.lab, other.lab));
    }
  }
  return best;
}

// The colour nearest the faction colour that keeps every rule: far enough
// from everything placed, its own faction nearest, and nearer no other
// faction's palette colour than that colour's own nearest.
function nextPick(faction) {
  const pool = candidates
    .filter(
      (candidate) =>
        candidate.faction === faction &&
        candidate.nearest >= colours.MIN_DELTA_E &&
        candidate.nearestOwn < candidate.nearestOther
    )
    .sort((a, b) => a.toFaction - b.toFaction || b.nearest - a.nearest);
  const others = placed.filter(
    (entry) => entry.pick && entry.faction !== faction
  );
  return pool.find(
    (candidate) =>
      !others.some(
        (entry) => colours.deltaE00(entry.lab, candidate.lab) < entry.nearest
      )
  );
}

// The faction with the fewest colours always picks next.
const picks = factions.map(() => []);
const exhausted = factions.map(() => false);
for (;;) {
  const live = factions.map((_, i) => i).filter((i) => !exhausted[i]);
  if (!live.length) {
    break;
  }
  const fewest = Math.min(...live.map((i) => picks[i].length));
  const faction = live.find((i) => picks[i].length === fewest);
  const candidate = nextPick(faction);
  if (!candidate) {
    exhausted[faction] = true;
    continue;
  }
  const entry = {
    colour: candidate.colour,
    lab: candidate.lab,
    faction,
    pick: true,
  };
  place(entry);
  picks[faction].push(candidate.colour);
  placed
    .filter((other) => other.pick)
    .forEach((other) => {
      other.nearest = nearestDistance(other);
    });
}

// A faction's own player colours an enemy AI of it can take: each that keeps
// the palette's rules against every other faction's colours.
function enemyPlayerColours(faction, index) {
  return [faction.color[0]]
    .concat(faction.coopPlayerColors.slice(1))
    .filter((colour) => {
      if (colours.contrastWithBlack(colour) < colours.MIN_CONTRAST) {
        return false;
      }
      const lab = colours.lab(colour);
      return placed.every(
        (entry) =>
          (entry.faction === index && !entry.pick) ||
          colours.deltaE00(lab, entry.lab) >= colours.MIN_DELTA_E
      );
    });
}

function nearestToFactionFirst(list, index) {
  const ranked = list
    .map((colour) => ({
      colour,
      distance: colours.deltaE00(colours.lab(colour), factionLab[index]),
    }))
    .sort((a, b) => a.distance - b.distance);
  const anchor = ranked[0].colour;
  return [anchor].concat(list.filter((colour) => colour !== anchor));
}

const data = factions.map((faction, index) => {
  // The last pick, the one furthest from the faction colour, is the colour
  // every army past the palette shares.
  const allies = picks[index].slice(0, -1);
  const spent = picks[index][picks[index].length - 1];
  return {
    name: faction.name,
    allies: nearestToFactionFirst(allies, index),
    enemies: nearestToFactionFirst(
      enemyPlayerColours(faction, index).concat(allies),
      index
    ),
    spent,
  };
});

async function main() {
  const body = data
    .map(
      (entry) =>
        "    // " +
        entry.name +
        "\n    " +
        JSON.stringify({
          allies: entry.allies,
          enemies: entry.enemies,
          spent: entry.spent,
        })
    )
    .join(",\n");
  const source =
    "// Generated by scripts/generate-army-colours.js. Do not edit by hand: change\n" +
    "// the rules in scripts/lib/army-colours.js and regenerate. See coop.md,\n" +
    '// "Colour allocation".\n' +
    "define({\n  factions: [\n" +
    body +
    ",\n  ],\n});\n";
  const options = (await prettier.resolveConfig(OUTPUT)) || {};
  const formatted = await prettier.format(source, {
    ...options,
    filepath: OUTPUT,
  });
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
  const changed = formatted !== current;
  if (process.argv.includes("--check")) {
    console.log(
      "generate-army-colours: " + (changed ? "out of date" : "up to date")
    );
    process.exitCode = changed ? 1 : 0;
    return;
  }
  if (changed) {
    fs.writeFileSync(OUTPUT, formatted);
  }
  data.forEach((entry) => {
    console.log(
      entry.name +
        ": " +
        entry.allies.length +
        " Sub Commander, " +
        entry.enemies.length +
        " enemy"
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
