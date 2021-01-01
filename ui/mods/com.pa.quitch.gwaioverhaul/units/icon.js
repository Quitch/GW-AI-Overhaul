var galacticWarOverhaulLoaded;

if (!galacticWarOverhaulLoaded) {
  galacticWarOverhaulLoaded = true;

  try {
    model.strategicIcons.push("bot_aa");
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
