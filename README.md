# Galactic War Overhaul Readme

[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/Quitch/GW-AI-Overhaul)

This mod works with Planetary Annihilation: TITANS only. It changes the following elements of Galactic War:

- Restore faction personalities:
  - Legonis Machina: tank
  - Foundation: air/naval
  - Synchronous: bot
  - Revenants: orbital
- Customise each enemy/Sub Commander:
  - Unique model
  - Unique personality
  - Unique colour
  - Fight according to their faction's preferred style
- Eight new difficulties suitable for anyone from a new player to a veteran of the game
- Reduced Sub Commander effectiveness
- Adds the possibility of multiple factions in a system and an FFA occurring
- Adds support for shared army enemies
- Bosses are distinctly more difficult than the surrounding systems
- Added planetary intelligence to allow you to make meaningful decisions on the galactic map
- Randomised spawn assignments so maps remain fresh on replay
- Uses all game modes:
  - Bounty mode
  - Land anywhere
  - Sudden death
- You can give the enemy tougher commander units
- Option to give yourself more starting neutral systems
- The AI uses tech card buffs
- Guaranteed loadout to unlock every war
- 13 new loadouts
- Unlocks Galactic War's biggest planetary systems
- Adds the classic Galactic War systems in addition to the TITANS systems
- Adds a new faction
- Fixes all the errors in the tech cards
- 109 new tech cards
- Multiple AI opponents to choose from

Be sure to check out my guide on [adding more maps to Galactic War](https://planetaryannihilation.com/guides/galactic-war-difficulty-and-adding-more-maps/) to enhance the experience further.

## Installation

Install this mod via the Planetary Annihilation: TITANS in-game Community Mod manager.

## In Action

[![Dreadnought fights Uber difficulty](https://i3.ytimg.com/vi/0S9D-8toEo4/hqdefault.jpg)](https://www.youtube.com/watch?v=0S9D-8toEo4&list=PLQJ47Ozz5Z8cVOG_LodEWRHtHcFSKBA3e)

## Difficulty

Sub Commanders are not impacted by difficulty. At any difficulty level you can choose to enable Easier Start which provides you with more neutral planets with free tech.

![Casual badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/0_casual.png) **Casual**: for when you've completed the tutorial and are new to the game.

![Iron badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/1_iron.png) **Iron**: for when you've some PA experience under your belt.

![Bronze badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/2_bronze.png) **Bronze**: you've beaten vanilla Galactic War.

![Silver badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/3_silver.png) **Silver**: you can beat the skirmish AI.

![Gold badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/4_gold.png) **Gold**: you can beat the Queller AI.

![Platinum badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/5_platinum.png) **Platinum**: for when one enemy Commander is no longer a worthy challenge.

![Diamond badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/6_diamond.png) **Diamond**: for when your loadouts become too powerful.

![Uber badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/7_uber.png) **Uber**: for when you're a Galactic War master ready for the ultimate challenge.

![Custom badge](./ui/mods/com.pa.quitch.gwaioverhaul/images/8_custom.png) **Custom**: for when you want to create your own challenge.

### Difficulty Options

- **Faction Scaling**: the number of factions put into the galaxy depends on its size.
- **System Scaling**: system size depends on how far into the galaxy you are.
- **Easier Start**: choose to have four neutral systems to plunder at the start instead of the usual two.
- **Tougher Commanders**: the AI has Commander Armor Tech.

## Planetary Intelligence

Each system will display the following information:

- **System Area**: the total surface size of all planets, excluding gas giants.
- **Threat Level**: based on the total eco score of all enemies.
- **Bounties**: gain an eco bonus for each army destroyed. Enemies gain these too.
- **Land Anywhere**: you can land anywhere on any starting planet.
- **Sudden Death**: the defeat of a single army on a team leads to the defeat of the entire team. This includes Sub Commanders.
- **Threat**: the eco threat of that Commander. This increases the deeper you proceed into the galaxy.
- **Personality**: the playstyle adopted by the Commander. Some are better than others and it's up to you to figure out which.
- **Additional Factions**: the system is a FFA and these factions will fight against you, each other, and the primary faction.

### AI Buffs

- **Build**: AI has Improved Build Arms.
- **Combat**: AI has Combat Tech.
- **Cost**: AI has Fabrication Tech.
- **Damage**: AI has Ammunition Tech.
- **Health**: AI has Armour Tech.
- **Speed**: AI has Engine Tech.

These buffs are applied to commanders and then on a per-faction basis:

- **Legonis Machina**: vehicle units and factories
- **Foundation**: air and naval units and factories
- **Synchronous**: bot units and factories
- **Revenants**: orbital units, orbital and superweapon structures
- **Cluster**: all structures

### Commander Threat Scale

From easiest to hardest:

- Worthless
- Helpless
- Weakling
- Inexperienced
- Competent
- Skilled
- Experienced
- Veteran
- Masterful
- Hardcore
- Dangerous
- Deadly
- Inhuman
- Genocidal
- Nightmare
- Demigod
- Godlike
- Titan

## Compatible Loadouts

If you are adding new loadouts to the game and want to be compatible, then you will need to do the following:

1. Add the following to the gw_start scene:

   ```javascript
   if (!model.gwaioNewStartCards) model.gwaioNewStartCards = [];
   if (!model.gwaioAllStartCards) model.gwaioAllStartCards = [];
   if (!model.gwaioTreasureCards) model.gwaioTreasureCards = [];
   model.gwaioNewStartCards.push({ id: "YOUR_LOADOUT_ID" });
   model.gwaioAllStartCards.push("YOUR_LOADOUT_ID");
   model.gwaioTreasureCards.push({ id: "YOUR_LOADOUT_ID" });
   ```

2. Ensure your cards are in `coui://ui/main/game/galactic_war/cards/`

3. Add `coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js` and `gwaioTech` to your loadout's `define()` function

4. Within the `if (!buffCount)` block of your loadout add:

   ```javascript
   if (inventory.getTag("global", "playerFaction") === 4)
     inventory.addMods(gwaioTech.clusterCommanders);
   ```

## Compatible Tech Cards

If you are adding new tech cards to the game and want to be compatible, then you will need to do the following:

1. Add the following to the gw_play scene:

   ```javascript
   if (!model.gwaioDeck) model.gwaioDeck = [];
   if (!model.gwaioCardsToUnits) model.gwaioCardsToUnits = [];
   model.gwaioDeck.push("YOUR_TECH_ID");
   model.gwaioCardsToUnits.push({
     id: "YOUR_TECH_ID",
     // Use the base_commander for commander and always the use unit, not the ammo, etc.
     units: ["AFFECTED_UNIT_PATH"],
   });
   ```

2. Ensure your cards are in `coui://ui/main/game/galactic_war/cards/`

## How to Report a Bug

Use the template below:

### Attestation

[ ] I have verified this bug with all other mods disabled

[ ] I did not create this war while using one of the documented incompatible mods

### Describe the bug

A clear and concise description of what the bug is.

### To Reproduce

Steps to reproduce the behaviour:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected behaviour

A clear and concise description of what you expected to happen.

### Screenshots

If applicable, add screenshots to help explain your problem.

### GWO Info

Taken from the top-right GWO panel:

- Version:
- Difficulty:
- Size:
- AI:
- Options:

### Additional context

Add any other context about the problem here.

### Logs

Please attach the most recent [client and server log](https://support.planetaryannihilation.com/kb/faq.php?id=182) immediately following the bug occurring.

## FAQ

**Q. Why am I not seeing the latest changes in my war?**

Many changes will only apply to new wars.

**Q. Why am I seeing multiple Commanders for a single enemy army?**

Both bosses and FFA factions will use Shared Armies to allow for multiple Commanders within a single army. This provides them with more additional build power and more lives. It allows them to connect multiple planets very quickly.

**Q. Why aren't awarded bounties showing on the player list?**

Galactic War hides eco modifiers from the player list. The bounties are still being awarded. If you gain one it will show below your eco bar.

## Known Issues

1. Announcer states "Enemy SXX detected" when you first encounter Cluster Security.

## Recommended mods

- Shared Systems for galactic war

## Incompatible mods

- Enemy ramp for galactic war
- Challenge Levels for galactic war
- Section of Foreign Intelligence for galactic war
- Unique Commander Loadouts
- Galactic War Unique Loadouts

## Thanks to

- wondible, who continues to be amazing with his JavaScript support and for his mod Section of Foreign Intelligence for Galactic War, a modified version of which is included within this mod
- PA Inc, for including official translations for the mod and assistance in integrating AI modifications
- nemuneko, whose Unique Commander Loadouts for Galactic War are included in this mod
- WPMarshall, for the Cluster faction logo and home system
- trialq, whose discontinued Galactic War Loadouts mod has been partially included in this mod
- Tristan, who created the casual, iron, and diamond icons
