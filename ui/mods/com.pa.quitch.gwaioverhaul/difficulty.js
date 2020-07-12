ko.extenders.precision = function (target, precision) {
  //create a writable computed observable to intercept writes to our observable
  var result = ko
    .pureComputed({
      read: target, //always return the original observables value
      write: function (newValue) {
        var current = target(),
          roundingMultiplier = Math.pow(10, precision),
          newValueAsNum = isNaN(newValue) ? 0 : +newValue,
          valueToWrite =
            Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

        //only write if it changed
        if (valueToWrite !== current) {
          target(valueToWrite);
        } else {
          //if the rounded value is the same, but a different value was written, force a notification for the current field
          if (newValue !== current) {
            target.notifySubscribers(valueToWrite);
          }
        }
      },
    })
    .extend({ notify: "always" });

  //initialize with current value to make sure it is rounded appropriately
  result(target());

  //return the new computed observable
  return result;
};

// set the lowest difficulty as the default
model.newGameDifficultyIndex(0);

// gw_start uses ko.applyBindings(model) so we put ourselves within that variable
model.customDifficultySettings = {
  shuffleSpawns: ko.observable(true),
  easierStart: ko.observable(false),
  tougherCommanders: ko.observable(false),
  factionTech: ko.observable(true),
  customDifficulty: ko.observable(false),
  goForKill: ko.observable(false),
  microType: ko.observableArray([0, 1, 2]),
  microTypeDescription: ko.observable({
    0: "!LOC:No",
    1: "!LOC:Basic",
    2: "!LOC:Advanced",
  }),
  chosenMicroType: ko.observable(0),
  getmicroTypeDescription: function (value) {
    return loc(model.customDifficultySettings.microTypeDescription()[value]);
  },
  mandatoryMinions: ko.observable(0).extend({
    precision: 3,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  minionMod: ko.observable(0).extend({
    precision: 3,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  priorityScoutMetalSpots: ko.observable(false),
  useEasierSystemTemplate: ko.observable(false),
  factoryBuildDelayMin: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  factoryBuildDelayMax: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  unableToExpandDelay: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  enableCommanderDangerResponses: ko.observable(false),
  perExpansionDelay: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  personalityTags: ko.observableArray([
    "Default",
    "Tutorial",
    "SlowerExpansion",
    "PreventsWaste",
  ]),
  personalityTagsDescription: ko.observable({
    Default: "!LOC:Default",
    Tutorial: "!LOC:Lobotomy",
    SlowerExpansion: "!LOC:Slower Expansion",
    PreventsWaste: "!LOC:Prevent Waste",
  }),
  chosenPersonalityTags: ko.observableArray([]),
  getpersonalityTagsDescription: function (value) {
    return loc(
      model.customDifficultySettings.personalityTagsDescription()[value]
    );
  },
  econBase: ko.observable(0).extend({
    precision: 3,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  econRatePerDist: ko.observable(0).extend({
    precision: 3,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  maxBasicFabbers: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  maxAdvancedFabbers: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  startingLocationEvaluationRadius: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  ffaChance: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  bossCommanders: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  landAnywhereChance: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  suddenDeathChance: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  bountyModeChance: ko.observable(0).extend({
    precision: 0,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  bountyModeValue: ko.observable(0).extend({
    precision: 3,
    rateLimit: { timeout: 500, method: "notifyWhenChangesStop" },
  }),
  unsavedChanges: ko.observable(false),
};

model.customDifficultySettings.shuffleSpawns.subscribe(function () {
  model.makeGame();
});
model.customDifficultySettings.easierStart.subscribe(function () {
  model.makeGame();
});
model.customDifficultySettings.tougherCommanders.subscribe(function () {
  model.makeGame();
});
model.customDifficultySettings.factionTech.subscribe(function () {
  model.makeGame();
});

model.customDifficultySettings.goForKill.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.chosenMicroType.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.priorityScoutMetalSpots.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.useEasierSystemTemplate.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.enableCommanderDangerResponses.subscribe(
  function () {
    if (model.customDifficultySettings.customDifficulty())
      model.customDifficultySettings.unsavedChanges(true);
  }
);
model.customDifficultySettings.chosenPersonalityTags.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.mandatoryMinions.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.minionMod.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.factoryBuildDelayMin.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.factoryBuildDelayMax.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.unableToExpandDelay.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.perExpansionDelay.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.econBase.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.econRatePerDist.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.maxBasicFabbers.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.maxAdvancedFabbers.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.startingLocationEvaluationRadius.subscribe(
  function () {
    if (model.customDifficultySettings.customDifficulty())
      model.customDifficultySettings.unsavedChanges(true);
  }
);
model.customDifficultySettings.ffaChance.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.bossCommanders.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.landAnywhereChance.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.suddenDeathChance.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.bountyModeChance.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.bountyModeValue.subscribe(function () {
  if (model.customDifficultySettings.customDifficulty())
    model.customDifficultySettings.unsavedChanges(true);
});
model.customDifficultySettings.customDifficulty.subscribe(function () {
  if (!model.customDifficultySettings.customDifficulty()) {
    model.customDifficultySettings.unsavedChanges(false);
  }
});

// eslint-disable-next-line no-unused-vars
function saveCustomDifficultySettings() {
  model.customDifficultySettings.unsavedChanges(false);
  model.makeGame();
}

// Don't let the player go to war with unsaved custom difficulty changes
model.ready = ko.computed(function () {
  return (
    !!model.newGame() &&
    !!model.activeStartCard() &&
    !model.customDifficultySettings.unsavedChanges()
  );
});

document.getElementById("game-difficulty").innerHTML = "";
document
  .getElementById("game-difficulty")
  .insertAdjacentHTML(
    "afterbegin",
    '<option value="0">GW-CASUAL</option>' +
      '<option value="1">GW-IRON</option>' +
      '<option value="2">GW-BRONZE</option>' +
      '<option value="3">GW-SILVER</option>' +
      '<option value="4">GW-GOLD</option>' +
      '<option value="5">GW-PLATINUM</option>' +
      '<option value="6">GW-DIAMOND</option>' +
      '<option value="7">GW-UBER</option>' +
      '<option value="8">GW-CUSTOM</option>'
  );
locUpdateDocument();

document
  .getElementById("game-difficulty-label")
  .insertAdjacentHTML(
    "afterend",
    '<span class="info_tip" data-bind="tooltip: \'!LOC:CASUAL: you completed the tutorial.<br>IRON: you have some hours in PA.<br>BRONZE: you beat vanilla Galactic War.<br>SILVER: you beat the skirmish AI.<br>GOLD: you beat the Queller AI mod.<br>PLATINUM: one enemy is no challenge.<br>DIAMOND: your loadouts are OP.<br>UBER: you hate winning.<br>CUSTOM: create your own challenge.\'">?</span>'
  );

document
  .getElementById("game-difficulty")
  .insertAdjacentHTML(
    "afterend",
    '<div class="form-group" id="custom-difficulty-settings" data-bind="visible: model.customDifficultySettings.customDifficulty()">' +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.goForKill" />' +
      '<span style="margin-left: 6px;"></span><loc>Target Weakest</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Focus on weakest enemy.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.priorityScoutMetalSpots" />' +
      '<span style="margin-left: 6px;"></span><loc>Scout Metal First</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Scout around metal spots rather than at random.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.useEasierSystemTemplate" />' +
      '<span style="margin-left: 6px;"></span><loc>Easy Systems</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Greater number of single planet systems. Does not affect bosses.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.enableCommanderDangerResponses" />' +
      '<span style="margin-left: 6px;"></span><loc>Commander Leaves Planet</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Allow Commanders to travel by orbital transport and teleporter.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<select data-bind="options: model.customDifficultySettings.microType, optionsText: model.customDifficultySettings.getmicroTypeDescription, value:model.customDifficultySettings.chosenMicroType"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Micro</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:How well the AI handles its armies in combat.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.mandatoryMinions" />' +
      '<span style="margin-left: 6px;"></span><loc>Mandatory Minions</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Number of additional Commanders in every system.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.minionMod" />' +
      '<span style="margin-left: 6px;"></span><loc>Minion Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Mandatory Minions + Star Distance * Minion Modifier = number of additional enemy Commanders.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.factoryBuildDelayMin" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (min)</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Minimum number of seconds between units produced from a factory.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.factoryBuildDelayMax" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (max)</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Maximum number of seconds between units produced from a factory.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.unableToExpandDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Unable To Expand Delay</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Additional amount of time in seconds before recognising that it is contained.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.perExpansionDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Per Expansion Delay</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Delay in seconds between the creation of new bases.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.econBase" />' +
      '<span style="margin-left: 6px;"></span><loc>Base Econ Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage modifier to all sources of income where 1 = 100%.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.econRatePerDist" />' +
      '<span style="margin-left: 6px;"></span><loc>Distance Econ Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage points added to the Base Econ Modifier for each hop the enemy is from the starting star.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.maxBasicFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Basic Fabbers</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most basic fabbers each enemy army will build.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.maxAdvancedFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Advanced Fabbers</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most advanced fabbers each enemy army will build.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.startingLocationEvaluationRadius" />' +
      '<span style="margin-left: 6px;"></span><loc>Landing Evaluation</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Radius considered when evaluating each possible spawn.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.ffaChance" />' +
      '<span style="margin-left: 6px;"></span><loc>FFA Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of a FFA occuring.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bossCommanders" />' +
      '<span style="margin-left: 6px;"></span><loc>Boss Commanders</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Number of commanders present in each boss army.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.landAnywhereChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Big Spawns Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of land anywhere being enabled.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.suddenDeathChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Team Death Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of sudden death mode being enabled.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bountyModeChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Bounties Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of bounty mode being enabled.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bountyModeValue" />' +
      '<span style="margin-left: 6px;"></span><loc>Bounty Value</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage eco bonus per army kilk.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<select data-bind="options: model.customDifficultySettings.personalityTags, optionsText: model.customDifficultySettings.getpersonalityTagsDescription, selectedOptions: model.customDifficultySettings.chosenPersonalityTags", multiple="true"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Additional Settings</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Default = leave enabled.<br><br>Lobotomy = apply the tutorial restrictions on the AI so that it poses almost no threat.<br><br>Slower Expansion = takes longer to grow its economy.<br><br>Prevent Waste = turns excess eco into more factories.<br><br>Use Ctrl to select multiple options and deselect currently selected options.\'">?</span>' +
      "</div>" +
      "<div class='btn_hero' data-bind=\"click: saveCustomDifficultySettings, click_sound: 'default', rollover_sound: 'default', css: { btn_hero_disabled: !model.customDifficultySettings.unsavedChanges() }\">" +
      '<div class="btn_label" style="width:175px;"><loc>Save</loc></div>' +
      "</div>" +
      "</div>" +
      '<div class="form-group" id="additional-options">' +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.shuffleSpawns" />' +
      '<span style="margin-left: 6px;"></span><loc>Shuffle Landing Zones</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Assign randomised landing zones each battle.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.easierStart" />' +
      '<span style="margin-left: 6px;"></span><loc>Easier Start</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:More neutral systems with free technology.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.tougherCommanders" />' +
      '<span style="margin-left: 6px;"></span><loc>Tougher Commanders</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Enemies use Commander Armor Tech on regular worlds and Commander Combat Tech on boss worlds.\'">?</span>' +
      "</div>" +
      "<div>" +
      '<input type="checkbox", data-bind="checked: model.customDifficultySettings.factionTech" />' +
      '<span style="margin-left: 6px;"></span><loc>Faction Tech</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Enemies buff themselves with tech cards according to faction, with more cards used the greater the distance.<br><br>Legonis Machina: bot and vehicle buffs.<br>Foundation: air and sea buffs.<br>Synchronous: structure and fabricator buffs.<br>Revenants: orbital buffs.\'">?</span>' +
      "</div>" +
      "</div>"
  );

requireGW(
  [
    "shared/gw_common",
    "shared/gw_credits",
    "shared/gw_factions",
    "pages/gw_start/gw_breeder",
    "pages/gw_start/gw_dealer",
    "pages/gw_start/gw_teams",
    "main/shared/js/star_system_templates",
    "main/game/galactic_war/shared/js/gw_easy_star_systems",
  ],
  function (
    GW,
    GWCredits,
    GWFactions,
    GWBreeder,
    GWDealer,
    GWTeams,
    normal_system_templates /* this actually won't load -- window.star_system_templates is set instead */,
    easy_system_templates
  ) {
    var difficultyInfo = [
      {
        // Casual
        customDifficulty: false,
        goForKill: false,
        microType: 0,
        mandatoryMinions: 0,
        minionMod: 0.24,
        priority_scout_metal_spots: false,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 12,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: false,
        per_expansion_delay: 0,
        personality_tags: ["Default", "SlowerExpansion"],
        econBase: 0.4,
        econRatePerDist: 0.05,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 5,
        ffa_chance: 25,
        bossCommanders: 2,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 25,
        bountyModeValue: 0.5,
      },
      {
        // Iron
        customDifficulty: false,
        goForKill: false,
        microType: 1,
        mandatoryMinions: 0,
        minionMod: 0.28,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "SlowerExpansion"],
        econBase: 0.5,
        econRatePerDist: 0.075,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 10,
        ffa_chance: 25,
        bossCommanders: 2,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 25,
        bountyModeValue: 0.4,
        starting_location_evaluation_radius: 100,
      },
      {
        // Bronze
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.33,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default"],
        econBase: 0.6,
        econRatePerDist: 0.1,
        max_basic_fabbers: 15,
        max_advanced_fabbers: 10,
        ffa_chance: 25,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.3,
        starting_location_evaluation_radius: 150,
      },
      {
        // Silver
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.4,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default"],
        econBase: 0.7,
        econRatePerDist: 0.1,
        max_basic_fabbers: 15,
        max_advanced_fabbers: 15,
        ffa_chance: 25,
        bossCommanders: 3,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 20,
        bountyModeValue: 0.3,
        starting_location_evaluation_radius: 200,
      },
      {
        // Gold
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.49,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 0.85,
        econRatePerDist: 0.15,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 15,
        ffa_chance: 25,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.2,
        starting_location_evaluation_radius: 250,
      },
      {
        // Platinum
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 0,
        minionMod: 0.5,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 1,
        econRatePerDist: 0.175,
        max_basic_fabbers: 20,
        max_advanced_fabbers: 20,
        ffa_chance: 25,
        bossCommanders: 4,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 15,
        bountyModeValue: 0.2,
        starting_location_evaluation_radius: 300,
      },
      {
        // Diamond
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 1,
        minionMod: 0.49,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 1.2,
        econRatePerDist: 0.2,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 20,
        ffa_chance: 25,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.1,
        starting_location_evaluation_radius: 400,
      },
      {
        // Uber
        customDifficulty: false,
        goForKill: true,
        microType: 2,
        mandatoryMinions: 1,
        minionMod: 0.49,
        priority_scout_metal_spots: true,
        useEasierSystemTemplate: false,
        factory_build_delay_min: 0,
        factory_build_delay_max: 0,
        unable_to_expand_delay: 0,
        enable_commander_danger_responses: true,
        per_expansion_delay: 0,
        personality_tags: ["Default", "PreventsWaste"],
        econBase: 10,
        econRatePerDist: 0,
        max_basic_fabbers: 25,
        max_advanced_fabbers: 25,
        ffa_chance: 25,
        bossCommanders: 5,
        landAnywhereChance: 10,
        suddenDeathChance: 10,
        bountyModeChance: 10,
        bountyModeValue: 0.1,
        starting_location_evaluation_radius: 400,
      },
      {
        // Custom
        customDifficulty: true,
      },
    ];

    model.makeGame = function () {
      model.newGame(undefined);

      if (model.customDifficultySettings.easierStart())
        var baseNeutralStars = 4;
      else baseNeutralStars = 2;

      var busyToken = {};
      model.makeGameBusy(busyToken);

      var game = new GW.Game();

      game.name(model.newGameName());
      game.mode(model.mode());
      game.hardcore(model.newGameHardcore());
      game.content(api.content.activeContent());

      var useEasySystems =
        difficultyInfo[model.newGameDifficultyIndex() || 0]
          .useEasierSystemTemplate;
      var systemTemplates = useEasySystems
        ? easy_system_templates
        : star_system_templates;
      var sizes = GW.balance.numberOfSystems;
      var size = sizes[model.newGameSizeIndex()] || 40;

      // Track the selected difficulty values
      if (
        !difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        model.customDifficultySettings.goForKill(
          difficultyInfo[model.newGameDifficultyIndex() || 0].goForKill
        );
        model.customDifficultySettings.chosenMicroType(
          difficultyInfo[model.newGameDifficultyIndex() || 0].microType
        );
        model.customDifficultySettings.mandatoryMinions(
          difficultyInfo[model.newGameDifficultyIndex() || 0].mandatoryMinions
        );
        model.customDifficultySettings.minionMod(
          difficultyInfo[model.newGameDifficultyIndex() || 0].minionMod
        );
        model.customDifficultySettings.priorityScoutMetalSpots(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .priority_scout_metal_spots
        );
        model.customDifficultySettings.useEasierSystemTemplate(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .useEasierSystemTemplate
        );
        model.customDifficultySettings.factoryBuildDelayMin(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_min
        );
        model.customDifficultySettings.factoryBuildDelayMax(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .factory_build_delay_max
        );
        model.customDifficultySettings.unableToExpandDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .unable_to_expand_delay
        );
        model.customDifficultySettings.enableCommanderDangerResponses(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .enable_commander_danger_responses
        );
        model.customDifficultySettings.perExpansionDelay(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .per_expansion_delay
        );
        model.customDifficultySettings.chosenPersonalityTags(
          difficultyInfo[model.newGameDifficultyIndex() || 0].personality_tags
        );
        model.customDifficultySettings.econBase(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econBase
        );
        model.customDifficultySettings.econRatePerDist(
          difficultyInfo[model.newGameDifficultyIndex() || 0].econRatePerDist
        );
        model.customDifficultySettings.maxBasicFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0].max_basic_fabbers
        );
        model.customDifficultySettings.maxAdvancedFabbers(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .max_advanced_fabbers
        );
        model.customDifficultySettings.ffaChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].ffa_chance
        );
        model.customDifficultySettings.bossCommanders(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bossCommanders
        );
        model.customDifficultySettings.startingLocationEvaluationRadius(
          difficultyInfo[model.newGameDifficultyIndex() || 0]
            .starting_location_evaluation_radius
        );
        model.customDifficultySettings.landAnywhereChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].landAnywhereChance
        );
        model.customDifficultySettings.suddenDeathChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].suddenDeathChance
        );
        model.customDifficultySettings.bountyModeChance(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bountyModeChance
        );
        model.customDifficultySettings.bountyModeValue(
          difficultyInfo[model.newGameDifficultyIndex() || 0].bountyModeValue
        );
      }
      // Only show the custom difficulty fields if custom difficulty is selected
      if (
        difficultyInfo[model.newGameDifficultyIndex() || 0].customDifficulty
      ) {
        model.customDifficultySettings.customDifficulty(true);
      } else {
        model.customDifficultySettings.customDifficulty(false);
      }

      if (model.creditsMode()) {
        size = _.reduce(
          GWFactions,
          function (factionSum, faction) {
            return _.reduce(
              faction.teams,
              function (teamSum, team) {
                return teamSum + (team.workers || []).length;
              },
              factionSum + 1
            );
          },
          0
        );
      }

      model.updateCommander();
      game
        .inventory()
        .setTag("global", "playerFaction", model.playerFactionIndex());
      game.inventory().setTag("global", "playerColor", model.playerColor());

      var buildGalaxy = game.galaxy().build({
        seed: model.newGameSeed(),
        size: size,
        difficultyIndex: model.newGameDifficultyIndex() || 0,
        systemTemplates: systemTemplates,
        content: game.content(),
        minStarDistance: 2,
        maxStarDistance: 4,
        maxConnections: 4,
        minimumDistanceBonus: 8,
      });
      var dealStartCard = buildGalaxy.then(function (galaxy) {
        if (model.makeGameBusy() !== busyToken) return;
        return GWDealer.dealCard({
          id: model.activeStartCard().id(),
          inventory: game.inventory(),
          galaxy: galaxy,
          star: galaxy.stars()[galaxy.origin()],
        }).then(function (startCardProduct) {
          game
            .inventory()
            .cards.push(
              startCardProduct || { id: model.activeStartCard().id() }
            );
        });
      });
      var moveIn = dealStartCard.then(function () {
        if (model.makeGameBusy() !== busyToken) return;
        game.move(game.galaxy().origin());

        var star = game.galaxy().stars()[game.currentStar()];
        star.explored(true);

        game.gameState(GW.Game.gameStates.active);
      });
      var populate = moveIn.then(function () {
        if (model.makeGameBusy() !== busyToken) return;

        // Scatter some AIs
        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);
        if (!model.creditsMode()) aiFactions = _.shuffle(aiFactions);
        var teams = _.map(aiFactions, GWTeams.getTeam);
        if (model.creditsMode()) {
          // Duplicate the workers so we can keep them unique
          _.forEach(teams, function (team) {
            team.workers = (team.workers || []).slice(0);
          });
        }

        var teamInfo = _.map(teams, function (team, teamIndex) {
          return {
            team: team,
            workers: [],
            faction: aiFactions[teamIndex],
          };
        });

        var neutralStars = baseNeutralStars;
        // Over-spread to take up all the neutral stars
        if (model.creditsMode()) neutralStars = 0;

        return GWBreeder.populate({
          galaxy: game.galaxy(),
          teams: teams,
          neutralStars: neutralStars,
          orderedSpawn: model.creditsMode(),
          // eslint-disable-next-line lodash/prefer-noop
          spawn: function () {},
          canSpread: function (_star, ai) {
            return (
              !model.creditsMode() || !ai || !!teams[ai.team].workers.length
            );
          },
          spread: function (star, ai) {
            var team = teams[ai.team];
            return GWTeams.makeWorker(star, ai, team).then(function () {
              if (team.workers)
                // eslint-disable-next-line lodash/matches-prop-shorthand
                _.remove(team.workers, function (worker) {
                  return worker.name === ai.name;
                });

              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].workers.push({
                ai: ai,
                star: star,
              });
            });
          },
          boss: function (star, ai) {
            return GWTeams.makeBoss(
              star,
              ai,
              teams[ai.team],
              systemTemplates
            ).then(function () {
              ai.faction = teamInfo[ai.team].faction;
              teamInfo[ai.team].boss = ai;
            });
          },
          breedToOrigin: game.isTutorial(),
        }).then(function () {
          return teamInfo;
        });
      });

      var aiInventory = [];
      var bossInventory = [];

      if (model.customDifficultySettings.tougherCommanders()) {
        var units = ["/pa/units/commanders/base_commander/base_commander.json"];
        var ammos = [
          "/pa/units/commanders/base_commander/base_commander_ammo.json",
          "/pa/ammo/cannon_uber/cannon_uber.json",
        ];
        var modAIUnit = function (unit) {
          aiInventory.push({
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 2,
          });
        };
        _.forEach(units, modAIUnit);
        var modBossUnit = function (unit) {
          bossInventory.push(
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 3,
            }
          );
        };
        _.forEach(units, modBossUnit);
        var modBossAmmo = function (ammo) {
          bossInventory.push(
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(ammos, modBossAmmo);
      }

      if (model.customDifficultySettings.factionTech()) {
        var legonisUnits = [
          "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle.json",
          "/pa/units/land/assault_bot_adv/assault_bot_adv.json",
          "/pa/units/land/assault_bot/assault_bot.json",
          "/pa/units/land/attack_vehicle/attack_vehicle.json",
          "/pa/units/land/bot_bomb/bot_bomb.json",
          "/pa/units/land/bot_grenadier/bot_grenadier.json",
          "/pa/units/land/bot_nanoswarm/bot_nanoswarm.json",
          "/pa/units/land/bot_sniper/bot_sniper.json",
          "/pa/units/land/bot_support_commander/bot_support_commander.json",
          "/pa/units/land/bot_tactical_missile/bot_tactical_missile.json",
          "/pa/units/land/bot_tesla/bot_tesla.json",
          "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
          "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
          "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
          "/pa/units/land/fabrication_bot/fabrication_bot.json",
          "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
          "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
          "/pa/units/land/land_scout/land_scout.json",
          "/pa/units/land/tank_armor/tank_armor.json",
          "/pa/units/land/tank_flak/tank_flak.json",
          "/pa/units/land/tank_heavy_armor/tank_heavy_armor.json",
          "/pa/units/land/tank_heavy_mortar/tank_heavy_mortar.json",
          "/pa/units/land/tank_hover/tank_hover.json",
          "/pa/units/land/tank_laser_adv/tank_laser_adv.json",
          "/pa/units/land/tank_light_laser/tank_light_laser.json",
          "/pa/units/land/tank_nuke/tank_nuke.json",
          "/pa/units/land/titan_bot/titan_bot.json",
          "/pa/units/land/titan_vehicle/titan_vehicle.json",
        ];
        var legonisAmmo = [
          "/pa/units/land/aa_missile_vehicle/aa_missile_vehicle_ammo.json",
          "/pa/units/land/assault_bot_adv/assault_bot_adv_ammo.json",
          "/pa/units/land/assault_bot/assault_bot_ammo.json",
          "/pa/units/land/bot_bomb/bot_bomb_ammo.json",
          "/pa/units/land/bot_nanoswarm/bot_nanoswarm_ammo.json",
          "/pa/units/land/bot_sniper/bot_sniper_ammo.json",
          "/pa/units/land/bot_support_commander/bot_support_commander_ammo.json",
          "/pa/units/land/bot_tactical_missile/bot_tactical_missile_ammo.json",
          "/pa/units/land/bot_tesla/bot_tesla_ammo.json",
          "/pa/units/land/land_scout/land_scout_ammo.json",
          "/pa/units/land/tank_armor/tank_armor_ammo.json",
          "/pa/units/land/tank_flak/tank_flak_ammo.json",
          "/pa/units/land/tank_heavy_armor/tank_heavy_armor_ammo.json",
          "/pa/units/land/tank_hover/tank_hover_ammo.json",
          "/pa/units/land/tank_laser_adv/tank_laser_adv_ammo.json",
          "/pa/units/land/tank_light_laser/tank_light_laser_ammo.json",
          "/pa/units/land/titan_bot/titan_bot_ammo_stomp.json",
          "/pa/units/land/titan_vehicle/titan_vehicle_ammo_main.json",
          "/pa/units/land/titan_vehicle/titan_vehicle_ammo_side.json",
          "/pa/units/land/titan_vehicle/titan_vehicle_ammo_stomp.json",
        ];
        var foundationUnits = [
          "/pa/units/air/air_scout/air_scout.json",
          "/pa/units/air/bomber_adv/bomber_adv.json",
          "/pa/units/air/bomber_heavy/bomber_heavy.json",
          "/pa/units/air/bomber/bomber.json",
          "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
          "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
          "/pa/units/air/fighter_adv/fighter_adv.json",
          "/pa/units/air/fighter/fighter.json",
          "/pa/units/air/gunship/gunship.json",
          "/pa/units/air/solar_drone/solar_drone.json",
          "/pa/units/air/strafer/strafer.json",
          "/pa/units/air/support_platform/support_platform.json",
          "/pa/units/air/titan_air/titan_air.json",
          "/pa/units/air/transport/transport.json",
          "/pa/units/sea/attack_sub/attack_sub.json",
          "/pa/units/sea/battleship/battleship.json",
          "/pa/units/sea/destroyer/destroyer.json",
          "/pa/units/sea/drone_carrier/carrier/carrier.json",
          "/pa/units/sea/drone_carrier/drone/drone.json",
          "/pa/units/sea/fabrication_barge/fabrication_barge.json",
          "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
          "/pa/units/sea/fabrication_ship/fabrication_ship.json",
          "/pa/units/sea/frigate/frigate.json",
          "/pa/units/sea/hover_ship/hover_ship.json",
          "/pa/units/sea/missile_ship/missile_ship.json",
          "/pa/units/sea/nuclear_sub/nuclear_sub.json",
          "/pa/units/sea/sea_scout/sea_scout.json",
        ];
        var foundationAmmo = [
          "/pa/units/air/bomber_adv/bomber_adv_ammo.json",
          "/pa/units/air/bomber_heavy/bomber_heavy_ammo.json",
          "/pa/units/air/bomber/bomber_ammo.json",
          "/pa/units/air/figher/fighter_ammo.json",
          "/pa/units/air/fighter_adv/fighter_adv_ammo.json",
          "/pa/units/air/gunship/gunship_ammo.json",
          "/pa/units/air/solar_drone/solar_drone_ammo.json",
          "/pa/units/air/strafer_ammo/strafer_ammo.json",
          "/pa/units/air/titan_air/titan_air_ammo.json",
          "/pa/units/sea/attack_sub/attack_sub_ammo.json",
          "/pa/units/sea/battleship/battleship_ammo.json",
          "/pa/units/sea/destroyer/destroyer_ammo.json",
          "/pa/units/sea/destroyer/destroyer_torpedo_ammo.json",
          "/pa/units/sea/drone_carrier/drone/drone_ammo_torpedo.json",
          "/pa/units/sea/drone_carrier/drone/drone_ammo.json",
          "/pa/units/sea/frigate/frigate_ammo_aa.json",
          "/pa/units/sea/frigate/frigate_ammo_shell.json",
          "/pa/units/sea/frigate/frigate_ammo_torpedo.json",
          "/pa/units/sea/hover_ship/hover_ship_ammo_side.json",
          "/pa/units/sea/hover_ship/hover_ship_ammo.json",
          "/pa/units/sea/missile_ship/missile_ship_aa_ammo.json",
          "/pa/units/sea/missile_ship/missile_ship_ammo.json",
          "/pa/units/sea/nuclear_sub/nuclear_sub_ammo_missile.json",
          "/pa/units/sea/nuclear_sub/nuclear_sub_ammo.json",
          "/pa/units/sea/sea_scout/sea_scout_ammo.json",
        ];
        var synchronousUnits = [
          "/pa/units/air/air_factory_adv/air_factory_adv.json",
          "/pa/units/air/air_factory/air_factory.json",
          "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv.json",
          "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
          "/pa/units/land/air_defense_adv/air_defense_adv.json",
          "/pa/units/land/air_defense/air_defense.json",
          "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
          "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
          "/pa/units/land/artillery_long/artillery_long.json",
          "/pa/units/land/artillery_short/artillery_short.json",
          "/pa/units/land/artillery_unit_launcher/artillery_unit_launcher.json",
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json",
          "/pa/units/land/bot_factory/bot_factory.json",
          "/pa/units/land/control_module/control_module.json",
          "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
          "/pa/units/land/energy_plant/energy_plant.json",
          "/pa/units/land/energy_storage/energy_storage.json",
          "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json",
          "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json",
          "/pa/units/land/fabrication_bot/fabrication_bot.json",
          "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv.json",
          "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
          "/pa/units/land/land_barrier/land_barrier.json",
          "/pa/units/land/land_mine/land_mine.json",
          "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
          "/pa/units/land/laser_defense_single/laser_defense_single.json",
          "/pa/units/land/laser_defense/laser_defense.json",
          "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
          "/pa/units/land/metal_extractor/metal_extractor.json",
          "/pa/units/land/metal_storage/metal_storage.json",
          "/pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
          "/pa/units/land/nuke_launcher/nuke_launcher.json",
          "/pa/units/land/radar_adv/radar_adv.json",
          "/pa/units/land/radar/radar.json",
          "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
          "/pa/units/land/teleporter/teleporter.json",
          "/pa/units/land/titan_structure/titan_structure.json",
          "/pa/units/land/unit_cannon/unit_cannon.json",
          "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json",
          "/pa/units/land/vehicle_factory/vehicle_factory.json",
          "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          "/pa/units/orbital/defense_satellite/defense_satellite.json",
          "/pa/units/orbital/delta_v_engine/delta_v_engine.json",
          "/pa/units/orbital/ion_defense/ion_defense.json",
          "/pa/units/orbital/mining_platform/mining_platform.json",
          "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
          "/pa/units/orbital/orbital_factory/orbital_factory.json",
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
          "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv.json",
          "/pa/units/sea/fabrication_ship/fabrication_ship.json",
          "/pa/units/sea/naval_factory_adv/naval_factory_adv.json",
          "/pa/units/sea/naval_factory/naval_factory.json",
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
        ];
        var synchronousAmmo = [
          "/pa/ammo/mine_pbaoe/mine_pbaoe.json",
          "/pa/units/land/air_defense_adv/air_defense_adv_ammo.json",
          "/pa/units/land/air_defense/air_defense_ammo.json",
          "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_ammo.json",
          "/pa/units/land/artillery_long/artillery_long_ammo.json",
          "/pa/units/land/artillery_short/artillery_short_ammo.json",
          "/pa/units/land/laser_defense_adv/laser_defense_adv_ammo.json",
          "/pa/units/land/laser_defense_single/laser_defense_single_ammo.json",
          "/pa/units/land/laser_defense/laser_defense_ammo.json",
          "/pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
          "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher_ammo.json",
          "/pa/units/orbital/defense_satellite/defense_satellite_ammo_ground.json",
          "/pa/units/orbital/defense_satellite/defense_satellite_ammo_orbital.json",
          "/pa/units/orbital/ion_defense/ion_defense_ammo.json",
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_land.json",
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo_water.json",
          "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_ammo.json",
          "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_land.json",
          "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo_water.json",
          "/pa/units/sea/torpedo_launcher/torpedo_launcher_ammo.json",
        ];
        var revenantsUnits = [
          "/pa/units/land/teleporter/teleporter.json",
          "/pa/units/land/unit_cannon/unit_cannon.json",
          "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
          "/pa/units/orbital/defense_satellite/defense_satellite.json",
          "/pa/units/orbital/delta_v_engine/delta_v_engine.json",
          "/pa/units/orbital/ion_defense/ion_defense.json",
          "/pa/units/orbital/mining_platform/mining_platform.json",
          "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
          "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
          "/pa/units/orbital/orbital_factory/orbital_factory.json",
          "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
          "/pa/units/orbital/orbital_lander/orbital_lander.json",
          "/pa/units/orbital/orbital_laser/orbital_laser.json",
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
          "/pa/units/orbital/orbital_probe/orbital_probe.json",
          "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
          "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
          "/pa/units/orbital/radar_satellite/radar_satellite.json",
          "/pa/units/orbital/solar_array/solar_array.json",
          "/pa/units/orbital/titan_orbital/titan_orbital.json",
        ];
        var revenantsAmmo = [
          "/pa/units/orbital/orbital_battleship/orbital_battleship_ammo_ground.json",
          "/pa/units/orbital/orbital_fighter/orbital_fighter_ammo.json",
          "/pa/units/orbital/orbital_laser/orbital_laser_ammo.json",
          "/pa/units/orbital/orbital_railgun/orbital_railgun_ammo.json",
          "/pa/units/orbital/titan_orbital/titan_orbital_ammo.json",
        ];

        var legonisCost = [];
        var modUnitlegonisCost = function (unit) {
          legonisCost.push({
            file: unit,
            path: "build_metal_cost",
            op: "multiply",
            value: 0.75,
          });
        };
        _.forEach(legonisUnits, modUnitlegonisCost);
        var legonisDamage = [];
        var modUnitlegonisDamage = function (ammo) {
          legonisDamage.push(
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(legonisAmmo, modUnitlegonisDamage);
        var legonisHealth = [];
        var modUnitlegonisHealth = function (unit) {
          legonisHealth.push({
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.25,
          });
        };
        _.forEach(legonisUnits, modUnitlegonisHealth);
        var legonisSpeed = [];
        var modUnitlegonisSpeed = function (unit) {
          legonisSpeed.push(
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(legonisUnits, modUnitlegonisSpeed);
        var foundationCost = [];
        var modUnitFoundationCost = function (unit) {
          foundationCost.push({
            file: unit,
            path: "build_metal_cost",
            op: "multiply",
            value: 0.75,
          });
        };
        _.forEach(foundationUnits, modUnitFoundationCost);
        var foundationDamage = [];
        var modUnitFoundationDamage = function (ammo) {
          foundationDamage.push(
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(foundationAmmo, modUnitFoundationDamage);
        var foundationHealth = [];
        var modUnitFoundationHealth = function (unit) {
          foundationHealth.push({
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.25,
          });
        };
        _.forEach(foundationUnits, modUnitFoundationHealth);
        var foundationSpeed = [];
        var modUnitFoundationSpeed = function (unit) {
          foundationSpeed.push(
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(foundationUnits, modUnitFoundationSpeed);
        var synchronousCost = [];
        var modUnitsynchronousCost = function (unit) {
          synchronousCost.push({
            file: unit,
            path: "build_metal_cost",
            op: "multiply",
            value: 0.75,
          });
        };
        _.forEach(synchronousUnits, modUnitsynchronousCost);
        var synchronousDamage = [];
        var modUnitsynchronousDamage = function (ammo) {
          synchronousDamage.push(
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(synchronousAmmo, modUnitsynchronousDamage);
        var synchronousHealth = [];
        var modUnitsynchronousHealth = function (unit) {
          synchronousHealth.push({
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.25,
          });
        };
        _.forEach(synchronousUnits, modUnitsynchronousHealth);
        var synchronousSpeed = [];
        var modUnitsynchronousSpeed = function (unit) {
          synchronousSpeed.push(
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(synchronousUnits, modUnitsynchronousSpeed);
        var revenantsCost = [];
        var modUnitrevenantsCost = function (unit) {
          revenantsCost.push({
            file: unit,
            path: "build_metal_cost",
            op: "multiply",
            value: 0.75,
          });
        };
        _.forEach(revenantsUnits, modUnitrevenantsCost);
        var revenantsDamage = [];
        var modUnitrevenantsDamage = function (ammo) {
          revenantsDamage.push(
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(revenantsAmmo, modUnitrevenantsDamage);
        var revenantsHealth = [];
        var modUnitrevenantsHealth = function (unit) {
          revenantsHealth.push({
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 1.25,
          });
        };
        _.forEach(revenantsUnits, modUnitrevenantsHealth);
        var revenantsSpeed = [];
        var modUnitrevenantsSpeed = function (unit) {
          revenantsSpeed.push(
            {
              file: unit,
              path: "navigation.move_speed",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.brake",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.acceleration",
              op: "multiply",
              value: 1.25,
            },
            {
              file: unit,
              path: "navigation.turn_speed",
              op: "multiply",
              value: 1.25,
            }
          );
        };
        _.forEach(revenantsUnits, modUnitrevenantsSpeed);

        var legonisBuffs = [
          legonisCost,
          legonisDamage,
          legonisHealth,
          legonisSpeed,
        ];
        var foundationBuffs = [
          foundationCost,
          foundationDamage,
          foundationHealth,
          legonisSpeed,
        ];
        var synchronousBuffs = [
          synchronousCost,
          synchronousDamage,
          synchronousHealth,
          synchronousSpeed,
        ];
        var revenantsBuffs = [
          revenantsCost,
          revenantsDamage,
          revenantsHealth,
          revenantsSpeed,
        ];

        var factionBuffs = [
          legonisBuffs,
          foundationBuffs,
          synchronousBuffs,
          revenantsBuffs,
        ];

        // 0 = cost; 1 = damage; 2 = synchronous; 3 = speed
        var buffType = [0, 1, 2, 3];
      }

      var finishAis = populate.then(function (teamInfo) {
        if (model.makeGameBusy() !== busyToken) return;

        // DIFFICULTY RAMPING CODE
        var maxDist = _.reduce(
          game.galaxy().stars(),
          function (value, star) {
            return Math.max(star.distance(), value);
          },
          0
        );

        var setAIData = function (ai, dist, isBoss) {
          if (ai.personality === undefined) ai.personality = {};
          ai.personality.micro_type = model.customDifficultySettings.chosenMicroType();
          ai.personality.go_for_the_kill = model.customDifficultySettings.goForKill();
          ai.personality.priority_scout_metal_spots = model.customDifficultySettings.priorityScoutMetalSpots();
          ai.personality.factory_build_delay_min = model.customDifficultySettings.factoryBuildDelayMin();
          ai.personality.factory_build_delay_max = model.customDifficultySettings.factoryBuildDelayMax();
          ai.personality.unable_to_expand_delay = model.customDifficultySettings.unableToExpandDelay();
          ai.personality.enable_commander_danger_responses = model.customDifficultySettings.enableCommanderDangerResponses();
          ai.personality.per_expansion_delay = model.customDifficultySettings.perExpansionDelay();
          ai.personality.max_basic_fabbers = model.customDifficultySettings.maxBasicFabbers();
          ai.personality.max_advanced_fabbers = model.customDifficultySettings.maxAdvancedFabbers();
          ai.personality.personality_tags = model.customDifficultySettings.chosenPersonalityTags();
          if (
            model.customDifficultySettings.startingLocationEvaluationRadius() >
            0
          )
            ai.personality.starting_location_evaluation_radius = model.customDifficultySettings.startingLocationEvaluationRadius();
          else delete ai.personality.starting_location_evaluation_radius;
          if (isBoss) {
            ai.econ_rate =
              model.customDifficultySettings.econBase() +
              maxDist * model.customDifficultySettings.econRatePerDist();
            ai.bossCommanders = model.customDifficultySettings.bossCommanders();
          } else {
            ai.econ_rate =
              model.customDifficultySettings.econBase() +
              dist * model.customDifficultySettings.econRatePerDist();
          }
        };

        var aiFactions = _.range(GWFactions.length);
        aiFactions.splice(model.playerFactionIndex(), 1);

        _.forEach(teamInfo, function (info) {
          if (info.boss) {
            setAIData(info.boss, maxDist, true);
            info.boss.inventory = aiInventory.concat(bossInventory);
            if (model.customDifficultySettings.factionTech()) {
              var numBuffs = Math.floor(maxDist / 2);
              var typeOfBuffs = _.sample(buffType, numBuffs);
              _.times(typeOfBuffs.length, function (n) {
                info.boss.inventory = info.boss.inventory.concat(
                  factionBuffs[info.boss.faction][typeOfBuffs[n]]
                );
              });
            }
            var numMinions = Math.floor(
              model.customDifficultySettings.mandatoryMinions() +
                maxDist * model.customDifficultySettings.minionMod()
            );
            if (numMinions > 0) {
              info.boss.minions = [];
              _.times(numMinions, function () {
                var bossMinions = _.sample(GWFactions[info.faction].minions);
                setAIData(bossMinions, maxDist, true);
                bossMinions.color = bossMinions.color || info.boss.color;
                info.boss.minions.push(bossMinions);
              });
            }
            //console.debug("BOSS:", info.team.name, "| Eco:", info.boss.econ_rate, "| Minions:", numMinions, "| Max Distance", maxDist, "| Card", info.team.bossCard);
          }

          _.forEach(info.workers, function (worker) {
            worker.ai.inventory = aiInventory;
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.landAnywhereChance()
            )
              worker.ai.landAnywhere = true;
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.suddenDeathChance()
            )
              worker.ai.suddenDeath = true;
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.bountyModeChance()
            )
              worker.ai.bountyMode = true;
            worker.ai.bountyModeValue = model.customDifficultySettings.bountyModeValue();
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false);
            if (model.customDifficultySettings.factionTech()) {
              var numBuffs = Math.floor(dist / 2);
              var typeOfBuffs = _.sample(buffType, numBuffs);
              _.times(typeOfBuffs.length, function (n) {
                worker.ai.inventory = worker.ai.inventory.concat(
                  factionBuffs[worker.ai.faction][typeOfBuffs[n]]
                );
              });
            }
            var numMinions = Math.floor(
              model.customDifficultySettings.mandatoryMinions() +
                worker.star.distance() *
                  model.customDifficultySettings.minionMod()
            );
            if (numMinions > 0) {
              worker.ai.minions = [];
              _.times(numMinions, function () {
                var minions = _.sample(GWFactions[info.faction].minions);
                setAIData(minions, dist, false);
                minions.color = minions.color || worker.ai.color;
                worker.ai.minions.push(minions);
              });
            }

            worker.ai.foes = [];
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.ffaChance()
            ) {
              var hostileFactions = _.sample(
                _.without(aiFactions, worker.ai.faction)
              );
              var ffaFirstFaction = _.sample(
                GWFactions[hostileFactions].minions
              );
              var numFoes = Math.round((numMinions + 1) / 2);
              setAIData(ffaFirstFaction, dist, false);
              if (model.customDifficultySettings.factionTech()) {
                ffaFirstFaction.inventory = [];
                _.times(typeOfBuffs.length, function (n) {
                  ffaFirstFaction.inventory = ffaFirstFaction.inventory.concat(
                    factionBuffs[hostileFactions][typeOfBuffs[n]]
                  );
                });
              }
              ffaFirstFaction.color = ffaFirstFaction.color || worker.ai.color;
              ffaFirstFaction.commanderCount = numFoes;
              worker.ai.foes.push(ffaFirstFaction);

              if (
                Math.random() * 100 <=
                model.customDifficultySettings.ffaChance()
              ) {
                var hostileFactionsRemaining = _.sample(
                  _.without(aiFactions, worker.ai.faction, hostileFactions)
                );
                var ffaSecondFaction = _.sample(
                  GWFactions[hostileFactionsRemaining].minions
                );
                setAIData(ffaSecondFaction, dist, false);
                if (model.customDifficultySettings.factionTech()) {
                  ffaSecondFaction.inventory = [];
                  _.times(typeOfBuffs.length, function (n) {
                    ffaSecondFaction.inventory = ffaSecondFaction.inventory.concat(
                      factionBuffs[hostileFactionsRemaining][typeOfBuffs[n]]
                    );
                  });
                }
                ffaSecondFaction.color =
                  ffaSecondFaction.color || worker.ai.color;
                ffaSecondFaction.commanderCount = numFoes;
                worker.ai.foes.push(ffaSecondFaction);
              }
            }
            //console.debug(worker.ai.name, "| Eco:", worker.ai.econ_rate, "| Minions:", numMinions, "| Distance", dist);
          });
        });

        var gw_intro_systems = [
          {
            name: "!LOC:The Progenitors",
            description:
              "!LOC:What little is clear is that the galaxy was once inhabited by a sprawling empire, seemingly destroyed by conflict. The commanders refer to these beings as The Progenitors. Many commanders believe answers to their origins lie within the ruins of this once great civilization.",
          },
          {
            name: "!LOC:Galactic War",
            description:
              "!LOC:Some commanders fight because it's all they know, while others seek answers to their origins. Conflicts in motivation and creed drive the commanders into a war that is poised to ravage the galaxy for centuries.",
          },
          {
            name: "!LOC:The Commanders",
            description:
              "!LOC:The commanders have slumbered for millions of years, and awaken to a galaxy that contains only echoes of civilization. These ancient war machines now battle across the galaxy, following the only directives they still hold from long ago.",
          },
          {
            name: "!LOC:The Machine Liberation Army",
            description:
              "!LOC:Buried deep within the data banks of the oldest commanders are references to the MLA. Some commanders believe that at one time all the factions fought as one against the Progenitors, while others dismiss this as heresy.",
          },
          {
            name: "!LOC:The Legion",
            description:
              "!LOC:Scattered references point to the Progenitors using their most advanced technologies for some final conflict. Little more is known of the Legion, only that they were defeated.",
          },
          {
            name: "!LOC:The Union",
            description:
              "!LOC:Commanders on the fringes of the galaxy speak of a new force not of the four factions with units of many origins. It is rumoured that their forces include organics.",
          },
          {
            name: "!LOC:Queller",
            description:
              "!LOC:A neural network thought to have originally been used to train new commanders, it has continued its training cycles while they slumbered and is now the deadliest force in the galaxy.",
          },
        ];

        var n = 0;
        gw_intro_systems = _.shuffle(gw_intro_systems);
        _.forEach(game.galaxy().stars(), function (star) {
          var ai = star.ai();
          var system = star.system();
          if (!ai) {
            var intro_system = gw_intro_systems[n];
            if (intro_system) {
              system.name = intro_system.name;
              system.description = intro_system.description;
              n = n + 1;
            }
          }
          // eslint-disable-next-line lodash/prefer-filter
          _.forEach(star.system().planets, function (world) {
            if (world.starting_planet === true)
              if (world.generator) {
                world.generator.shuffleLandingZones = model.customDifficultySettings.shuffleSpawns();
              } else
                world.planet.shuffleLandingZones = model.customDifficultySettings.shuffleSpawns();
          });
        });

        if (model.creditsMode()) {
          var origin = game.galaxy().stars()[game.galaxy().origin()];
          origin.system().name = GWCredits.startSystem.name;
          origin.system().description = GWCredits.startSystem.description;
        }
      });

      var dealBossCards = finishAis.then(function () {
        return GWDealer.dealBossCards({
          galaxy: game.galaxy(),
          inventory: game.inventory(),
        });
      });

      dealBossCards.then(function () {
        if (model.makeGameBusy() !== busyToken) return;

        model.makeGameBusy(false);
        model.newGame(game);
        model.updateCommander();
        return game;
      });
    };

    model.makeGameOrRunCredits();
  }
);
