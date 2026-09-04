// The mod version, as shown in the war information panel and stamped into new war
// saves. modinfo.json carries the same number and is what the game itself reads, so
// the two cannot be derived from one another at runtime - bump both together when
// cutting a release.
define(function () {
  return "7.0.0";
});
