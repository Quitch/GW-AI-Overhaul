// Adds Cluster
define([
  "shared/gw_faction_0",
  "shared/gw_faction_1",
  "shared/gw_faction_2",
  "shared/gw_faction_3",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_faction.js",
], function (faction0, faction1, faction2, faction3, gwoCluster) {
  var factions = [faction0, faction1, faction2, faction3];
  if (api.content.usingTitans()) {
    factions.push(gwoCluster);
  }
  return factions;
});
