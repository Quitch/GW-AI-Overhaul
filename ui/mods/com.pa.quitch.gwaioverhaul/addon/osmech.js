// Osmech as a Galactic War add-on: MLA units, many of them Titans, and no AI
// data. `units` keys every spec the mod adds by a name of its own (the same
// shape as shared/units.js) and `unitNames` carries the display names by the
// same keys. What a player fields follows from capability cells. See
// races.md, "Add-ons".
define(function () {
  return {
    id: "osmech",
    name: "!LOC:Osmech",
    serverMods: ["com.pa.loloares.thorosmen"],
    layers: {},
    units: {},
    unitNames: {},
  };
});
