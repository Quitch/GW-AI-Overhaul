"use strict";

// Colour maths and fixed inputs for the army colour lists in
// gw_play/army_colours.js, shared by test/faction_coop_colours.test.js and
// scripts/generate-army-colours.js. See coop.md, "Colour allocation".

const { loadCouiModule } = require("./amd-loader.js");

const MIN_DELTA_E = 10;
const MIN_CONTRAST = 3;
const GUARDIANS = [255, 255, 255];

// Players 7 to 12 of each faction (a war seats up to 12), which take the base
// game's lobby colours nearest the host's once coopPlayerColors runs out.
const LOBBY_PLAYERS = [
  [
    [0, 223, 223],
    [0, 112, 223],
    [51, 151, 197],
    [32, 178, 170],
    [100, 149, 237],
    [0, 250, 154],
  ],
  [
    [147, 122, 219],
    [160, 32, 240],
    [218, 112, 214],
    [128, 128, 128],
    [100, 149, 237],
    [164, 164, 164],
  ],
  [
    [111, 223, 186],
    [164, 164, 164],
    [50, 184, 50],
    [128, 128, 128],
    [124, 252, 0],
    [223, 191, 162],
  ],
  [
    [223, 60, 0],
    [223, 0, 0],
    [223, 87, 62],
    [223, 105, 41],
    [161, 59, 59],
    [139, 69, 19],
  ],
  [
    [164, 164, 164],
    [142, 107, 68],
    [147, 122, 219],
    [72, 89, 61],
    [223, 140, 107],
    [70, 70, 70],
  ],
];

function loadFactions() {
  const factions = [0, 1, 2, 3].map((index) =>
    loadCouiModule(
      "coui://ui/main/game/galactic_war/shared/js/gw_faction_" + index + ".js"
    )
  );
  factions.push(
    loadCouiModule(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_faction.js"
    )
  );
  return factions;
}

// The base game's brightness rule for a lobby colour, which the co-op
// resolver applies to every palette entry.
function dimmed(colour) {
  return colour.includes(255)
    ? colour.map((channel) => Math.round((channel * 14) / 16))
    : colour;
}

// The colours a faction's human armies take, as the battle shows them:
// the host's faction colour, players 2 to 6 dimmed, players 7 to 12 from the
// lobby.
function playerColours(faction, index) {
  return [faction.color[0]]
    .concat(faction.coopPlayerColors.slice(1).map(dimmed))
    .concat(LOBBY_PLAYERS[index]);
}

function relativeLuminance(colour) {
  const linear = colour.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// WCAG contrast ratio against black, the colour of a strategic icon's symbol.
function contrastWithBlack(colour) {
  return (relativeLuminance(colour) + 0.05) / 0.05;
}

// sRGB to CIELAB under D65.
function lab(colour) {
  const linear = colour.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = linear;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) =>
    t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// Lightness, chroma, and hue angle in degrees.
function lch(colour) {
  const [lightness, a, b] = lab(colour);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [lightness, Math.hypot(a, b), hue < 0 ? hue + 360 : hue];
}

const RADIANS = Math.PI / 180;

function hueAngle(a, b) {
  if (a === 0 && b === 0) {
    return 0;
  }
  const angle = Math.atan2(b, a) / RADIANS;
  return angle < 0 ? angle + 360 : angle;
}

// CIEDE2000 colour difference between two CIELAB colours (Sharma, Wu and
// Dalal, 2005).
function deltaE00(first, second) {
  const [l1, a1, b1] = first;
  const [l2, a2, b2] = second;
  const chromaMean = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g =
    0.5 *
    (1 -
      Math.sqrt(
        Math.pow(chromaMean, 7) / (Math.pow(chromaMean, 7) + Math.pow(25, 7))
      ));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const h1p = hueAngle(a1p, b1);
  const h2p = hueAngle(a2p, b2);
  const chromaProduct = c1p * c2p;

  let hueDiff = 0;
  if (chromaProduct !== 0) {
    hueDiff = h2p - h1p;
    if (hueDiff > 180) {
      hueDiff -= 360;
    } else if (hueDiff < -180) {
      hueDiff += 360;
    }
  }
  const deltaL = l2 - l1;
  const deltaC = c2p - c1p;
  const deltaH =
    2 * Math.sqrt(chromaProduct) * Math.sin((hueDiff * RADIANS) / 2);

  const lMean = (l1 + l2) / 2;
  const cMean = (c1p + c2p) / 2;
  let hMean = h1p + h2p;
  if (chromaProduct !== 0) {
    if (Math.abs(h1p - h2p) > 180) {
      hMean = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    } else {
      hMean = (h1p + h2p) / 2;
    }
  }
  const t =
    1 -
    0.17 * Math.cos((hMean - 30) * RADIANS) +
    0.24 * Math.cos(2 * hMean * RADIANS) +
    0.32 * Math.cos((3 * hMean + 6) * RADIANS) -
    0.2 * Math.cos((4 * hMean - 63) * RADIANS);
  const rotation = 30 * Math.exp(-Math.pow((hMean - 275) / 25, 2));
  const rc =
    2 * Math.sqrt(Math.pow(cMean, 7) / (Math.pow(cMean, 7) + Math.pow(25, 7)));
  const sl =
    1 +
    (0.015 * Math.pow(lMean - 50, 2)) / Math.sqrt(20 + Math.pow(lMean - 50, 2));
  const sc = 1 + 0.045 * cMean;
  const sh = 1 + 0.015 * cMean * t;
  const rt = -Math.sin(2 * rotation * RADIANS) * rc;
  return Math.sqrt(
    Math.pow(deltaL / sl, 2) +
      Math.pow(deltaC / sc, 2) +
      Math.pow(deltaH / sh, 2) +
      rt * (deltaC / sc) * (deltaH / sh)
  );
}

function difference(first, second) {
  return deltaE00(lab(first), lab(second));
}

// Each faction's colour space in CIELCh, indexed like the factions: Legonis
// Machina cyans and blues, Foundation purples to pinks, Synchronous greens,
// Revenants reds to yellows, and Cluster every muted colour.
const CLUSTER = 4;
const MAX_CLUSTER_CHROMA = 20;
function colourSpace(colour) {
  const [, chroma, hue] = lch(colour);
  if (chroma <= MAX_CLUSTER_CHROMA) {
    return CLUSTER;
  }
  if (hue >= 10 && hue < 110) {
    return 3;
  }
  if (hue >= 110 && hue < 175) {
    return 2;
  }
  if (hue >= 175 && hue < 300) {
    return 0;
  }
  return 1;
}

module.exports = {
  GUARDIANS,
  LOBBY_PLAYERS,
  MIN_CONTRAST,
  MIN_DELTA_E,
  colourSpace,
  contrastWithBlack,
  deltaE00,
  difference,
  dimmed,
  lab,
  lch,
  loadFactions,
  playerColours,
};
