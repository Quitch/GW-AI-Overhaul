// Seeded random numbers for war generation. The pick/sample/shuffle helpers mirror
// lodash's semantics so the call sites they replaced read the same.
//
// Why this exists rather than Math.seedrandom or a reseeded Math.random, and how the
// streams are laid out: galaxy.md, "Determinism and the war seed".
define(function () {
  // cyrb128: seed text -> four 32-bit words.
  var hashSeed = function (text) {
    var h1 = 1779033703;
    var h2 = 3144134277;
    var h3 = 1013904242;
    var h4 = 2773480762;

    for (var i = 0; i < text.length; i++) {
      var k = text.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }

    // Load-bearing: without these, two seeds differing only in their last character -
    // which is what stream() produces - yield near-identical words.
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

    return [
      (h1 ^ h2 ^ h3 ^ h4) >>> 0,
      (h2 ^ h1) >>> 0,
      (h3 ^ h1) >>> 0,
      (h4 ^ h1) >>> 0,
    ];
  };

  // Enough that stream("star", 0) and stream("star", 1) diverge on their first output.
  var WARM_UP = 12;

  // No seed or label contains this, so stream("a", 1) cannot collide with stream("a1").
  var SEPARATOR = "\u0000";

  var create = function (seed) {
    // The lobby's own default seed is a number, and 0 has to survive.
    var seedText = seed === undefined || seed === null ? "" : String(seed);
    var words = hashSeed(seedText);
    var a = words[0];
    var b = words[1];
    var c = words[2];
    var d = words[3];

    // sfc32.
    var rng = function () {
      a >>>= 0;
      b >>>= 0;
      c >>>= 0;
      d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };

    for (var i = 0; i < WARM_UP; i++) {
      rng();
    }

    // Both bounds inclusive, matching _.random; ai_population.js's
    // gameModeEnabled depends on it.
    rng.int = function (min, max) {
      return min + Math.floor(rng() * (max - min + 1));
    };

    // [min, max), matching _.random(min, max, true).
    rng.float = function (min, max) {
      return min + rng() * (max - min);
    };

    rng.pick = function (list) {
      if (!list || !list.length) {
        return undefined;
      }
      return list[Math.floor(rng() * list.length)];
    };

    // Always an array, so the scalar _.sample(list) form is rng.pick, not this. A
    // negative n clamps to [], as lodash did - setupAIBuffs relies on that.
    rng.sample = function (list, n) {
      var shuffled = rng.shuffle(list);
      var wanted = n === undefined ? 1 : n;
      return shuffled.slice(0, Math.min(Math.max(wanted, 0), shuffled.length));
    };

    // Fisher-Yates over a copy.
    rng.shuffle = function (list) {
      var result = list ? Array.prototype.slice.call(list) : [];
      for (var index = result.length - 1; index > 0; index--) {
        var swap = Math.floor(rng() * (index + 1));
        var held = result[index];
        result[index] = result[swap];
        result[swap] = held;
      }
      return result;
    };

    // Derived from the seed text, not a counter, so a stream is unaffected by what its
    // parent or siblings drew first. See galaxy.md.
    rng.stream = function (label, index) {
      return create(
        seedText +
          SEPARATOR +
          label +
          (index === undefined ? "" : SEPARATOR + index)
      );
    };

    return rng;
  };

  return {
    create: create,
  };
});
