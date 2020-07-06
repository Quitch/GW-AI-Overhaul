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
  easierStart: ko.observable(false),
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

model.customDifficultySettings.easierStart.subscribe(function () {
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
      '<div><input type="checkbox", data-bind="checked: model.customDifficultySettings.goForKill" />' +
      '<span style="margin-left: 6px;"></span><loc>Target Weakest</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Focus on weakest enemy.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: model.customDifficultySettings.priorityScoutMetalSpots" />' +
      '<span style="margin-left: 6px;"></span><loc>Scout Metal First</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Scout around metal spots rather than at random.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: model.customDifficultySettings.useEasierSystemTemplate" />' +
      '<span style="margin-left: 6px;"></span><loc>Easy Systems</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Greater number of single planet systems. Does not affect bosses.\'">?</span></div>' +
      '<div><input type="checkbox", data-bind="checked: model.customDifficultySettings.enableCommanderDangerResponses" />' +
      '<span style="margin-left: 6px;"></span><loc>Commander Leaves Planet</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Allow Commanders to travel by orbital transport and teleporter.\'">?</span></div>' +
      '<div><select data-bind="options: model.customDifficultySettings.microType, optionsText: model.customDifficultySettings.getmicroTypeDescription, value:model.customDifficultySettings.chosenMicroType"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Micro</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:How well the AI handles its armies in combat.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.mandatoryMinions" />' +
      '<span style="margin-left: 6px;"></span><loc>Mandatory Minions</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Number of additional Commanders in every system.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.minionMod" />' +
      '<span style="margin-left: 6px;"></span><loc>Minion Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Mandatory Minions + Star Distance * Minion Modifier = number of additional enemy Commanders.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.factoryBuildDelayMin" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (min)</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Minimum number of seconds between units produced from a factory.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.factoryBuildDelayMax" />' +
      '<span style="margin-left: 6px;"></span><loc>Unit Production Delay (max)</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Maximum number of seconds between units produced from a factory.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.unableToExpandDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Unable To Expand Delay</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Additional amount of time in seconds before recognising that it is contained.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.perExpansionDelay" />' +
      '<span style="margin-left: 6px;"></span><loc>Per Expansion Delay</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Delay in seconds between the creation of new bases.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.econBase" />' +
      '<span style="margin-left: 6px;"></span><loc>Base Econ Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage modifier to all sources of income where 1 = 100%.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.econRatePerDist" />' +
      '<span style="margin-left: 6px;"></span><loc>Distance Econ Modifier</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage points added to the Base Econ Modifier for each hop the enemy is from the starting star.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.maxBasicFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Basic Fabbers</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most basic fabbers each enemy army will build.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.maxAdvancedFabbers" />' +
      '<span style="margin-left: 6px;"></span><loc>Max Advanced Fabbers</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:The most advanced fabbers each enemy army will build.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.ffaChance" />' +
      '<span style="margin-left: 6px;"></span><loc>FFA Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of a FFA occuring.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bossCommanders" />' +
      '<span style="margin-left: 6px;"></span><loc>Boss Commanders</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Number of commanders present in each boss army.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.landAnywhereChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Big Spawns Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of land anywhere being enabled.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.suddenDeathChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Team Death Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of sudden death mode being enabled.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bountyModeChance" />' +
      '<span style="margin-left: 6px;"></span><loc>Bounties Chance</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage chance per star of bounty mode being enabled.\'">?</span></div>' +
      '<div><input type="number" style="width: 50px; padding-bottom: 0px;" data-bind="textInput: model.customDifficultySettings.bountyModeValue" />' +
      '<span style="margin-left: 6px;"></span><loc>Bounty Value</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Percentage eco bonus per army kilk.\'">?</span></div>' +
      '<div><select data-bind="options: model.customDifficultySettings.personalityTags, optionsText: model.customDifficultySettings.getpersonalityTagsDescription, selectedOptions: model.customDifficultySettings.chosenPersonalityTags", multiple="true"></select>' +
      '<span style="margin-left: 6px;"></span><loc>Additional Settings</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:Default = leave enabled.<br><br>Lobotomy = apply the tutorial restrictions on the AI so that it poses almost no threat.<br><br>Slower Expansion = takes longer to grow its economy.<br><br>Prevent Waste = turns excess eco into more factories.<br><br>Use Ctrl to select multiple options and deselect currently selected options.\'">?</span></div>' +
      "<div class='btn_hero' data-bind=\"click: saveCustomDifficultySettings, click_sound: 'default', rollover_sound: 'default', css: { btn_hero_disabled: !model.customDifficultySettings.unsavedChanges() }\">" +
      '<div class="btn_label" style="width:175px;"><loc>Save</loc></div></div>' +
      "</div>" +
      '<div class="form-group" id="easier-start">' +
      '<div><input type="checkbox", data-bind="checked: model.customDifficultySettings.easierStart" />' +
      '<span style="margin-left: 6px;"></span><loc>Easier Start</loc>' +
      '<span class="info_tip" data-bind="tooltip: \'!LOC:More neutral systems with free technology.\'">?</span></div>' +
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
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.landAnywhereChance()
            ) {
              worker.ai.landAnywhere = true;
            }
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.suddenDeathChance()
            ) {
              worker.ai.suddenDeath = true;
            }
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.bountyModeChance()
            ) {
              worker.ai.bountyMode = true;
            }
            worker.ai.bountyModeValue = model.customDifficultySettings.bountyModeValue();
            var dist = worker.star.distance();
            setAIData(worker.ai, dist, false);
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
            if (
              Math.random() * 100 <=
              model.customDifficultySettings.ffaChance()
            ) {
              var hostileFactions = _.sample(
                _.without(aiFactions, worker.ai.faction)
              );
              worker.ai.foes = [];
              var ffaFirstFaction = _.sample(
                GWFactions[hostileFactions].minions
              );
              setAIData(ffaFirstFaction, dist, false);
              var numFoes = Math.round((numMinions + 1) / 2);
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
                world.generator.shuffleLandingZones = true;
              } else world.planet.shuffleLandingZones = true;
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
