var gwaioBuild = {
  "/pa/units/land/bot_aa/bot_aa.json": ["bot", 18, { row: 2, column: 6 }],
};

if (_.has(Build, "HotkeyModel.SpecIdToGridMap")) {
  _.extend(Build.HotkeyModel.SpecIdToGridMap, gwaioBuild);
}
