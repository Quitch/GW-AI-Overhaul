# Galactic War AI Overhaul Readme

## Description

This mod works with both Planetary Annihilation and Planetary Annihilation: TITANS. It changes the following elements of Galactic War:

- Restore faction personalities:
  - Legonis Machina: land
  - Foundation: air/naval
  - Synchronous: balanced
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

Be sure to check out my guide on [adding more maps to Galactic War](https://planetaryannihilation.com/guides/galactic-war-difficulty-and-adding-more-maps/) to enhance the experience further.

## Installation

Install this mod via the Planetary Annihilation: TITANS in-game Community Mod manager.

## In Action

[![Table and Chums tries the mod for the first time.](https://i3.ytimg.com/vi/-0csZIM12N0/maxresdefault.jpg)](https://www.youtube.com/watch?v=-0csZIM12N0&list=PLQJ47Ozz5Z8cVOG_LodEWRHtHcFSKBA3e)

## Difficulty

Sub Commanders are not impacted by difficulty. At any difficulty level you can choose to enable Easier Start which provides you with more neutral planets with free tech.

![Casual badge](./images/casual.png) **Casual**: for when you've completed the tutorial and are new to the game.

![Iron badge](./images/iron.png) **Iron**: for when you've some PA experience under your belt.

![Bronze badge](./images/bronze.png) **Bronze**: you've beaten vanilla Galactic War.

![Silver badge](./images/silver.png) **Silver**: you can beat the skirmish AI.

![Gold badge](./images/gold.png) **Gold**: you can beat the Queller AI.

![Platinum badge](./images/platinum.png) **Platinum**: for when one enemy Commander is no longer a worthy challenge.

![Diamond badge](./images/diamond.png) **Diamond**: for when your loadouts become too powerful.

![Uber badge](./images/uber.png) **Uber**: for when you're a Galactic War master ready for the ultimate challenge.

![Custom badge](./images/custom.png) **Custom**: for when you want to create your own challenge.

### Difficulty Options

- **Faction Scaling**: the number of factions put into the galaxy depends on its size.

- **Easier Start**: choose to have four neutral systems to plunder at the start instead of the usual two.

- **Tougher Commanders**: enemies have Commander Armour Tech and bosses have Commander Combat Tech.

## Planetary Intelligence

Each system will display the following information:

- **System Area**: the total surface size of all planets, excluding gas giants.

- **Threat Level**: based on the total eco score of all enemies.

- **Bounties**: gain an eco bonus for each army destroyed. Enemies gain these too.

- **Big Spawns**: you can land anywhere on any starting planet.

- **Team Death**: the defeat of a single army on a team leads to the defeat of the entire team. This includes Sub Commanders.

- **Build**: AI has Improved Fabricator Build Arms.

- **Cost**: AI has Fabrication Tech.

- **Damage**: AI has Ammunition Tech.

- **Health**: AI has Armour Tech.

- **Speed**: AI has Engine Tech.

- **Threat**: the eco threat of that Commander. This increases the deeper you proceed into the galaxy.

- **Personality**: the playstyle adopted by the Commander. Some are better than others and it's up to you to figure out which.

- **Additional Factions**: the system is a FFA and these factions will fight against you, each other, and the primary faction.

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

## Compatible Loadouts

If you are adding new loadouts to the game and want to be GWAIO compatible, then you will need to do the following:

1. Add the following to the gw_start scene

   ```javascript
   if (model.gwaioNewStartCards)
     model.gwaioNewStartCards.push({ id: "YOUR_LOADOUT_ID" });
   else model.gwaioNewStartCards = [{ id: "YOUR_LOADOUT_ID" }];
   if (model.gwaioAllStartCards)
     model.gwaioAllStartCards.push("YOUR_LOADOUT_ID");
   else model.gwaioAllStartCards = ["YOUR_LOADOUT_ID"];
   if (model.gwaioTreasureCards)
     model.gwaioTreasureCards.push({ id: "YOUR_LOADOUT_ID" });
   else model.gwaioTreasureCards = [{ id: "YOUR_LOADOUT_ID" }];
   ```

2. Ensure your loadout cards are in coui://ui/main/game/galactic_war/cards/

3. Add com.pa.quitch.gwaioverhaul as a dependency if you're not rolling your own card dealing solution

## FAQ

**Q. Can I use an AI mod like Queller?**

No. Queller won't break this mod, it simply won't be used.

**Q. Will Sub Commanders fighting for me have the same personality if I fight against them?**

Yes. Mostly.

**Q. Are all Sub Commanders created equal?**

No, some are objectively stupider than others.

**Q. Is there a "fair" difficulty level?**

No. I felt it was pointless to create a level where each battle is easier than the last.

**Q. Why am I not seeing the latest changes in my war?**

Many changes will only apply to new wars.

**Q. Why am I seeing multiple Commanders for a single enemy army?**

Both bosses and FFA factions will use Shared Armies to allow for multiple Commanders within a single army. This provides them with more additional build power and more lives. It allows them to connect multiple planets very quickly.

**Q. Why aren't awarded bounties showing on the player list?**

Galactic War hides eco modifiers from the player list. The bounties are still being awarded. If you gain one it will show below your eco bar.

**Q. Why are those turrets moving?**

When the Synchronous have the speed bonus their defences will move to engage you when you get close.

## Known Issues

1. Continue War does not continue the war if more than one enemy faction remains alive. Use Quit then Return to Galactic War to work around this.

## Recommended mods

- Shared Systems for galactic war

## Incompatible mods

- Enemy ramp for galactic war
- Challenge Levels for galactic war
- Section of Foreign Intelligence for galactic war
- Galactic War Unique Loadouts

## Thanks to

- wondible, who continues to be amazing with his JavaScript support
- PA Inc, for including official translations for the mod
- nemuneko, whose Unique Commander Loadouts for Galactic War are included in this mod
- wpmarshall, for the Hive faction logo
