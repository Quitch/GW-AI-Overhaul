var galacticWarOverhaulLoaded;

if (!galacticWarOverhaulLoaded) {
  galacticWarOverhaulLoaded = true;

  try {
    var gwaioBuild = {
      "/pa/units/land/bot_aa/bot_aa.json": ["bot", 18, { row: 2, column: 6 }],
    };

    if (_.has(Build, "HotkeyModel.SpecIdToGridMap"))
      _.assign(Build.HotkeyModel.SpecIdToGridMap, gwaioBuild);
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
