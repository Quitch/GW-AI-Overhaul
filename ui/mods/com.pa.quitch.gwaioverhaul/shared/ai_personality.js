// Resolves an AI's personality from what the war records. The measured
// sibling of faction/personalities.js - see galaxy.md, "AI personalities and
// penchants".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  // Index = faction, as gw_faction_*.js and cluster_faction.js declare them.
  var FACTION_IDS = [
    "legonisMachina",
    "foundation",
    "synchronous",
    "revenants",
    "cluster",
  ];

  // The personalities.js key of the object a faction file references, so an
  // id can never drift from the object it names.
  var idOf = function (personality) {
    return _.findKey(personalities, function (candidate) {
      return candidate === personality;
    });
  };

  // A fresh personality: the faction's baseline with the named overrides
  // merged over it, the merge faction_builder.js makes. undefined when either
  // is unknown, so a caller can fall back to what the war stored.
  var base = function (personalityId, faction) {
    var baseline = personalities[FACTION_IDS[faction]];
    var overrides = personalities[personalityId];
    if (!baseline || !overrides) {
      return undefined;
    }
    return _.merge(_.cloneDeep(baseline), overrides);
  };

  var FFA_TAGS = ["ffa", "platoon"];

  // Tier key -> personality key. The tiers hold the booleans as the
  // "true"/"false" strings their dropdowns read; the AI contract needs booleans.
  var TIER_FIELDS = [
    { tier: "microType", key: "micro_type" },
    { tier: "goForKill", key: "go_for_the_kill", boolean: true },
    {
      tier: "priority_scout_metal_spots",
      key: "priority_scout_metal_spots",
      boolean: true,
    },
    { tier: "factory_build_delay_min", key: "factory_build_delay_min" },
    { tier: "factory_build_delay_max", key: "factory_build_delay_max" },
    { tier: "unable_to_expand_delay", key: "unable_to_expand_delay" },
    {
      tier: "enable_commander_danger_responses",
      key: "enable_commander_danger_responses",
      boolean: true,
    },
    { tier: "per_expansion_delay", key: "per_expansion_delay" },
    { tier: "max_basic_fabbers", key: "max_basic_fabbers" },
    { tier: "max_advanced_fabbers", key: "max_advanced_fabbers" },
  ];

  // Writes the tier's AI settings onto the personality, in place. A radius of
  // 0 means unset, leaving the AI to examine the spawn zone. No tier, no-op.
  var applyTier = function (personality, tier) {
    if (!tier) {
      return personality;
    }
    _.forEach(TIER_FIELDS, function (field) {
      var value = tier[field.tier];
      if (_.isUndefined(value)) {
        return;
      }
      personality[field.key] = field.boolean
        ? value === true || value === "true"
        : value;
    });
    var radius = tier.starting_location_evaluation_radius;
    if (_.isNumber(radius) && radius > 0) {
      personality.starting_location_evaluation_radius = radius;
    }
    return personality;
  };

  var QUELLER_TAGS = [
    ["tank", "queller"],
    ["air", "queller"],
    ["bot", "queller"],
    ["orbital", "queller"],
    ["land", "queller"],
  ];

  // Queller's build orders for the faction's preferred arm; nothing for a
  // faction Queller has no orders for.
  var quellerTags = function (faction) {
    var tags = QUELLER_TAGS[faction];
    if (!tags) {
      console.error("Undefined faction:", faction);
      return [];
    }
    return tags.slice();
  };

  // The tags an enemy's brain adds to the tier's: Titans its default orders,
  // Queller its faction orders, Penchant its drawn penchant plus the defaults.
  var brainTags = function (brain, faction, penchantTags) {
    switch (brain) {
      case "Titans":
        return ["Default"];
      case "Queller":
        return quellerTags(faction);
      case "Penchant":
        return (penchantTags || []).concat(["Default"]);
      default:
        return [];
    }
  };

  // The personality an AI fights with, as a new object: the template its id
  // names, the tier's settings and tags, and the brain's tags. An AI without
  // an id, or with one no longer shipped, keeps what the war stored and still
  // takes the tier's settings. options: side ("enemy" or "ally"), faction,
  // tier, brain, penchantTags, ffa. An ally takes no tier and keeps its
  // template's tags. See galaxy.md, "AI personalities and penchants".
  var resolve = function (ai, options) {
    var opts = options || {};
    var ally = opts.side === "ally";
    var personality = base(ai.personalityId, opts.faction);

    if (!personality) {
      personality = _.cloneDeep(ai.personality || {});
      return ally ? personality : applyTier(personality, opts.tier);
    }

    if (ally) {
      personality.personality_tags = (
        personality.personality_tags || []
      ).concat(opts.penchantTags || []);
    } else {
      applyTier(personality, opts.tier);
      var tierTags = opts.tier ? opts.tier.personality_tags || [] : [];
      personality.personality_tags = tierTags.concat(
        brainTags(opts.brain, opts.faction, opts.penchantTags)
      );
    }
    if (opts.ffa && opts.brain === "Queller") {
      personality.personality_tags =
        personality.personality_tags.concat(FFA_TAGS);
    }
    return personality;
  };

  return {
    FACTION_IDS: FACTION_IDS,
    FFA_TAGS: FFA_TAGS,
    idOf: idOf,
    base: base,
    applyTier: applyTier,
    quellerTags: quellerTags,
    brainTags: brainTags,
    resolve: resolve,
  };
});
