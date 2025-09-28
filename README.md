# Galactic War Overhaul Readme

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
- Nine new difficulties suitable for anyone from a new player to a veteran of the game
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
- Option to give yourself more starting neutral systems
- The AI uses tech card buffs
- Guaranteed loadout to unlock every war
- 17 new loadouts
- Unlocks Galactic War's biggest planetary systems
- Adds the classic Galactic War systems in addition to the TITANS systems
- Adds a new faction
- Fixes all the errors in the tech cards
- Over 100 new tech cards
- Multiple AI opponents to choose from

Be sure to check out my guide on [adding more maps to Galactic War](https://planetaryannihilation.com/guides/galactic-war-difficulty-and-adding-more-maps/) to enhance the experience further.

## Installation

1. Uninstall/delete any existing copy of the mod.
2. Download the [latest release](https://github.com/Quitch/GW-AI-Overhaul/releases/latest).
3. Extract the zip to `%localappdata%\Uber Entertainment\Planetary Annihilation\client_mods` - this should create a "Galactic War Overhaul" folder under client_mods
4. In PA Community Mods enable the Galactic War Overhaul (local) mod

## Discussion

Join the [Planetary Annihilation official Discord](https://discord.gg/pa).

## In Action

[![Dreadnought fights Uber difficulty](https://i3.ytimg.com/vi/0S9D-8toEo4/hqdefault.jpg)](https://www.youtube.com/watch?v=0S9D-8toEo4&list=PLQJ47Ozz5Z8cVOG_LodEWRHtHcFSKBA3e)

## Difficulty

Sub Commanders are not impacted by difficulty. At any difficulty level you can choose to enable Easier Start which provides you with more neutral planets with free tech.

![Beginner badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/-1_beginner.png) **Beginner**: you've completed the tutorial and are new to the game.

![Casual badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/0_casual.png) **Casual**: you've some PA experience under your belt.

![Iron badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/1_iron.png) **Iron**: you've overcome your turtle instincts.

![Bronze badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/2_bronze.png) **Bronze**: you've beaten vanilla Galactic War.

![Silver badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/3_silver.png) **Silver**: you've beaten the skirmish AI.

![Gold badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/4_gold.png) **Gold**: you've beaten the Queller AI.

![Platinum badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/5_platinum.png) **Platinum**: one enemy Commander is no longer a worthy challenge.

![Diamond badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/6_diamond.png) **Diamond**: your loadouts are too powerful.

![Uber badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/7_uber.png) **Uber**: you're a Galactic War master ready for the ultimate challenge.

![Custom badge](./ui/mods/com.pa.quitch.gwaioverhaul/shared/img/8_custom.png) **Custom**: you want to create your own challenge.

### Difficulty Options

- **Faction Scaling**: the number of factions put into the galaxy depends on its size.
- **System Scaling**: system size depends on how far into the galaxy you are.
- **Easier Start**: choose to have four neutral systems to plunder at the start instead of the usual two.

## Planetary Intelligence

Each system will display the following information:

- **System Area**: the total surface size of all planets, excluding gas giants.
- **Threat Level**: based on the total eco score of all enemies.
- **Bounties**: gain an eco bonus for each army destroyed. Enemies gain these too.
- **Land Anywhere**: you can land anywhere on any starting planet.
- **Sudden Death**: the defeat of a single army on a team leads to the defeat of the entire team. This includes Sub Commanders.
- **Personality**: the playstyle adopted by the Commander. Some are better than others and it's up to you to figure out which.
- **Additional Factions**: the system is a FFA and these factions will fight against you, each other, and the primary faction.

### AI Buffs

- **Build**: Improved Build Arms
- **Combat**: Combat Tech
- **Cost**: Fabrication Tech
- **Damage**: Ammunition Tech
- **Factory**: Cooldown Tech
- **Health**: Armour Tech
- **Speed**: Engine Tech

These buffs are applied to commanders on a per-faction basis:

- **Legonis Machina**: vehicle units and factories
- **Foundation**: air and naval units and factories
- **Synchronous**: bot units and factories
- **Revenants**: orbital units, orbital and superweapon structures
- **Cluster**: all structures

## Compatible Loadouts & Tech Cards

To create a GWO compatible loadout or tech card, please see the [New GW Cards repository](https://github.com/Quitch/New-GW-Cards/).

## FAQ

**Q. Why am I not seeing the latest changes in my war?**

Many changes will only apply to new wars.

**Q. Why am I seeing multiple Commanders for a single enemy army?**

Both bosses and FFA factions will use Shared Armies to allow for multiple Commanders within a single army. This provides them with more additional build power and more lives. It allows them to connect multiple planets very quickly.

**Q. Why aren't awarded bounties showing on the player list?**

Galactic War hides eco modifiers from the player list. The bounties are still being awarded. If you gain one it will show below your eco bar.

## Report a Bug

Open a [new issue](https://github.com/Quitch/GW-AI-Overhaul/issues) on the GitHub repository.

### Known issues

- Some users have reported instances of the sim freezing while the UI continues to respond. If this occurs, go to Settings - Server and set Local Server to ON and Local Server Multi-Threading to OFF.

## Recommended mods

- Shared Systems for galactic war
- AI Chat
- AI Personality Names

## Incompatible mods

- Aurora Artillery
- Challenge Levels for galactic war
- Enemy ramp for galactic war
- Galactic War Unique Loadouts
- More Pew Pew
- Section of Foreign Intelligence for galactic war
- Selection and combat grouping mods e.g. Air Scout Select
- Client mod which modifies unit files and is incompatible with PA 116982 or later. Disable any unit, selection, FX, or faction mod which hasn't been updated since at least 12 June 2023.

## Thanks to

- wondible, who continues to be amazing with his JavaScript support and for his mod Section of Foreign Intelligence for Galactic War, a modified version of which is included within this mod
- PA Inc, for including official translations for the mod and assistance in integrating AI modifications
- nemuneko, whose Unique Commander Loadouts for Galactic War are included in this mod
- WPMarshall, for the Cluster faction logo and home system
- trialq, whose discontinued Galactic War Loadouts mod has been partially included in this mod
- Tristan, who created the casual, iron, and diamond icons
- tatapstar for the mod's icon
