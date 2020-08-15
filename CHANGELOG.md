# CHANGELOG

## [Unreleased]

## [4.5.0] - 2020-08-15

- Turtle commanders use more fabbers
- Turtle sub commanders can use more fabbers than other sub commanders
- Uber has less commanders early on but more commanders later on
- Added buttons for changing custom difficulty field values
- Implemented minimum, maximum, and step values for custom difficulty fields
- Fixed bounty mode always using the default reward value
- Increased the size of bounty awarded above casual difficulty
- Smoothed curve across difficulties as to when they begin to receive tech buffs
- Added tooltip to galaxy size selection
- Corrected Worker being one commander short if they were the system owner
- Fixed a base game issue where multiple galaxy generations would cause an increasing number of AIs to be assigned incorrect values

## [4.4.1] - 2020-08-14

- Corrected commander count for older wars sometimes being wrong on intelligence reports

## [4.4.0] - 2020-08-13

- Allow the player to delete tech from their inventory at any time

## [4.3.0] - 2020-08-12

- Deal General Commander's minions as cards to your inventory
- Added Bot Anti-Air Tech card
- Fixed armies not always landing with multiple commanders even though intelligence said they have them
- Enabled the following tech cards:
  - Intelligence Fabrication Tech
  - Improved Intelligence Tech
  - Improved Energy Weapons

## [4.2.2] - 2020-08-07

- Fixed Cluster Worker not generating the right AI threat
- Defeating a boss in a new war will no longer sometimes defeat the treasure planet

## [4.2.1] - 2020-08-06

- Tidied up some Cluster boss descriptions

## [4.2.0] - 2020-08-05

- Planetary Intelligence now shows the number of commanders in a shared army configuration
- Threat levels now factor in the size of armies with multiple commanders
- Tried to ensure armies always have the correct number of commanders even after multiple galaxy generations
- Added a small variance to each enemy's eco
- Added a new faction called Cluster which you can fight as or against
- Added Bang Battle 3T V1 as temporary Cluster boss system with thanks to =VoW=BlackAngelLOL
- Fixed new loadouts being dealt as treasure more often than base game loadouts
- Fixed newly discovered loadouts requiring you to have an open slot in your inventory before they'd unlock
- Prevented inventory overlapping the intelligence panel
- Fixed Tougher Commanders not buffing boss commander weapons
- Corrected Kohr system name

## [4.1.0] - 2020-08-02

- Space Excavation Commander and Tactical Nuke Commander correctly file unit removal under dulls not buffs
- Added the unused base game Storage Commander loadout
- Casual through Gold scale up their commander numbers slower than before
- Fixed the General Commander failing to add cards to their inventory and being unable to start fights in new wars - thanks to EVmaker for the report
- Fixed the dealing of unlocked loadouts from the base game as treasure - thanks to EVmaker for the report

## [4.0.2] - 2020-08-1

- Prevent Rapid Deployment Commander breaking the treasure planet guardians

## [4.0.1] - 2020-08-1

- Removed the test commander loadout. That one is not for you :)

## [4.0.0] - 2020-08-01

- Fixed Bounties, Team Death, and Big Spawns sometimes being enabled even if you disabled them
- Added support for new loadouts and instructions for modders on how to make loadout mods compatible
- Added new loadouts for you to unlock in your wars
- Galactic War Unique Loadouts is not compatible with GWAIO in its current form and should be disabled. Its loadouts have been ported into this mod in accordance with its license requirements. Thanks to Nemuneko for their work.
- Changed mod priority to allow other mods to add loadouts through GWAIO
- Changed locked loadout hints
- As you go deeper into the galaxy you will now uncover larger systems
- Casual difficulty uses simpler systems

## [3.7.0] - 2020-07-26

- Faction Tech is no longer optional and is now integrated into the difficulty curve
- Shuffle Landing Zones is no longer optional
- Bosses no longer unlock loadouts
- Every war now features a treasure planet, with guardians who defend a loadout you are guaranteed not to have
- Removed Mirror Mode as an option - this is now used by treasure planets
- Fixed v1.2.0 - v2.0.4 wars losing connection to the server when starting a FFA battle

## [3.6.0] - 2020-07-20

- Added Faction Scaling (defaults to true) which adjusts the number of enemy factions in accordance with the galaxy size
- Expanded what is considered an orbital unit for the purposes of Revenants buffs when Faction Tech is active
- Corrected the Omega not having its anti-orbital weapon buffed for the Revenants
- Fixed Synchronous not receiving its nuke damage bonus with Faction Tech
- Added optional mode Mirror Mode which grants the AI the same tech buffs as the player

## [3.5.2] - 2020-07-19

- Fixed the fix for the Sub Commander card

## [3.5.1] - 2020-07-19

- Fixed Sub Commanders not being dealt if you didn't meet their requirements at the start of the war
- Fixed a typo in the Bounty Value tooltip

## [3.5.0] - 2020-07-18

- Ammunition Tech has been expanded to include reduced firing costs (or time in the case of the Ragnarok)

## [3.4.0] - 2020-07-18

- Legonis Machina receive buffs to the Unit Cannon with Faction Tech
- Added the faction tech buff type Build which improves fabber and factory speed and efficiency
- Fixed an error from v3.3.3 which prevented damage and speed buffs being applied in full - a new war is required for this fix

## [3.3.4] - 2020-07-16

- Corrected error with faction tech buffs being incorrectly applied for TITANS units when multiple factions were present in a system
- Fixed bosses in wars started between v1.0 and v2.2.0 not spawning multiple commanders

## [3.3.3] - 2020-07-16

- Cleaned up the code underpinning the mod
- Fixed save button for custom difficulty sometimes needing to be pressed twice
- Faction Tech now disabled by default

## [3.3.2] - 2020-07-14

- Fixed the new war UI not loading

## [3.3.1] - 2020-07-14

- Corrected an error in Planetary Intelligence that could delay the display of the jump button
- Cleaned up code for inserting HTML into gw_start

## [3.3.0] - 2020-07-13

- Added new option "Faction Tech" which applies random tech card bonuses to the AI

## [3.2.1] - 2020-07-12

- Corrected minions and additional factions being assigned the Tutorial Commander if Tougher Commanders was enabled

## [3.2.0] - 2020-07-11

Due to a bad merge the changes of v3.1.1 were not actually applied.

- Fixed AI not using starting location evaluation function
- Added starting location evaluation function to GW-Custom
- Replaced shadowing of gw_play.js with injection of code into the gw_play scene - thanks to [wondible](https://github.com/JustinLove) for his ever-invaluable aid
- Removed TITANS ownership requirement from Tougher Commanders as it no longer requires use of the TITANS Tutorial Commander
- Reduced health of Tougher Commanders from 1,000,000 to 25,000 to match Commander Armor Tech
- Removed build and storage bonuses from Tougher Commanders
- Tougher Commanders now applies Commander Combat Tech to all enemy commanders on a boss world

## [3.1.1] - 2020-07-10

- Reduced health of Tougher Commanders from 1,000,000 to 50,000
- Removed build and storage bonuses from Tougher Commanders

## [3.1.0] - 2020-07-09

- Added support for the new AI starting location evaluation function

## [3.0.0] - 2020-07-09

- Thanks to [PA Inc](https://planetaryannihilation.com/) for updating the server scripts to support all game modes in Galactic War
- Implemented support for:
  - bounty mode (bounties)
  - land anywhere (big spawns)
  - sudden death mode (team death)
- Replaced my shuffle solution with the new native spawn shuffling solution
  - Wars pre-v3 will not shuffle spawns
- Made landing zone shuffling optional
- Fixed gas giants being included in the planetary intelligence surface area count
- Updated difficulty tooltip recommendations
- Show the system's name in place of the primary AI's name
- Systems installed via Shared Systems for Galactic War will now show their description on the galaxy map
- Added new option "Tougher Commanders" for those who want the enemy to be harder to kill (TITANS only)
- Fixed bosses not spawning multiple commanders

## [2.3.3] - 2020-07-04

- Add support for Default personality tag to GW-CUSTOM
- Improved difficulty tooltips

## [2.3.2] - 2020-06-26

- Fix sub commander personalities not being translated

## [2.3.1] - 2020-06-26

- Add default personality tag to all AIs as a future-proofing measure

## [2.3.0] - 2020-06-25

- Updated difficulty descriptions
- Less fabbers used by both enemies and allies
- Reduced starting eco of Iron and Bronze
- Iron scales up its commander numbers slower
- Set Casual as the default difficulty
- Ensured mod properly setup to work with translations

## [2.2.0] - 2020-05-30

- Attempted to make Turtle slightly more viable
- Turtle has a higher focus on non-factory structures
- Swarm starts with more fabbers
- Ensure that even when alone at least a small amount of T1 is built

## [2.1.1] - 2020-05-22

- Replaced my ridiculously over-engineered randomised spawn solution with something much saner
- Randomisation is now done by army rather than by team

## [2.1.0] - 2020-05-20

- Removed personalities: Legate, Acolyte, Servant, Seeker
- Added personalities: Defender, Swarm, and Economist
- All bosses now use the Pumpkin Commander to make them clearly identifiable via their icon
- Allied and enemy commanders will sometimes change which available spawn they use on multi-planet systems
- The number of commanders in a boss army is now controlled by difficulty
- If an additional faction is present in a multi-planet system and has multiple commanders they may spawn on multiple worlds
- Team spawn assignments are randomised each time you start a battle
- Custom difficulty responds to setting changes slightly faster

## [2.0.4] - 2020-02-13

- Improved the granularity with which system threat is displayed at the upper bounds

## [2.0.3] - 2020-02-06

- Corrected grammatical errors

## [2.0.2] - 2020-01-25

- Update the mod's description
- Avoid multiple Invictus commanders within the Legonis Machina

## [2.0.1] - 2019-11-04

- Added some more lore to ensure full system coverage when Easier Start is selected
- You will no longer be offered a Sub Commander if you don't have a factory they can open with (air/bot/vehicle)

## [2.0] - 2019-11-03

- Clarified difficulty tooltip for custom difficulty
- Switched to a more recognisable ranking system for difficulty levels and smoothed the difficulty curve:
  - Bronze has become Iron
  - Copper has become Bronze
  - Gold grows its additional Commander count slower and starts later
  - Platinum has the additional Commander growth rate that Gold had previously
  - Platinum grows its eco slightly slower
  - Added Diamond difficulty which is identical to the old Platinum difficulty but with a higher starting eco
- Re-enabled custom difficulty as I have fixed the underlying bug
- Wait for player input to complete in a custom field before applying corrections

## [1.5.2] - 2019-11-01

- Disabled custom difficulty until I can resolve the underlying bug

## [1.5.1] - 2019-11-01

- Fixed enemies having no eco if the difficulty level wasn't changed
  - This has the side-effect of disabling enforcement of proper input into custom fields until I can fix the root cause

## [1.5.0] - 2019-10-31

- Added Copper difficulty as a stepping stone between Bronze and Silver
- Added Easier Start option which adds more neutral systems with free tech

## [1.4.1] - 2019-10-24

- Added support for the tutorial personality tag in custom difficulty mode
- Fixed some spelling errors

## [1.4.0] - 2019-10-21

- Added a custom difficulty to allow you to configure all the difficulty settings
- Updated some personality names to prevent word wrapping with new fonts
- Galaxy size no longer has any effect on the chance of an FFA occurring
- Fixed the enemy system owner sometimes spawning with multiple Commanders
- Fixed a bug in the base game causing the General Commander's Sub Commanders to sometimes have an eco modifier applied

## [1.3.0] - 2019-10-11

- Tried to improve the clarity of the difficulty tooltip for players for whom English is a second language
- The additional faction in an FFA has fewer Commanders
- Higher chance of an FFA at Casual, Bronze, Silver and Gold difficulties
- Lower chance of an FFA at Uber difficulty
- FFAs will sometimes be 4-way instead of 3-way
- Decreased the starting eco of Casual and Bronze

## [1.2.1] - 2019-10-07

- Fixed battles failing to launch if you were playing a war started with v1.1.0 or earlier and the battle was an FFA

## [1.2.0] - 2019-10-06

- Removed Bronze, Silver and Hard personalities
- Each faction has three Commanders which have adopted the playstyle of one of the other factions
- Removed boss eco bonus
- Fixed a bug which was causing some enemy Commanders to have incredibly high eco bonuses
- Bosses scale their eco bonus to match the size of the galaxy rather than their position within it
- Each boss now has three Commanders in its army instead of two
- An invading FFA enemy may bring multiple Commanders within its single army
- Chance of FFA lower at lower difficulties and higher at Uber

## [1.1.0] - 2019-10-05

- Rush spends less time at T1
- Rush is more aggressive
- Synchronous turtles prefer vehicles over bots
- Corrected number of fabbers turtles try to build when alone
- Implemented support for the new personality tags which allow configuration of different opening factories
- Platinum and Uber Commander personalities behave slightly more distinctly from other personalities across all factions
- Reduced maximum number of fabbers per army at all levels above Casual
- Adjusted Technologist fabber builds to compensate for their factory builds

## [1.0.2] - 2019-09-24

- Further correction of personality word wrapping

## [1.0.1] - 2019-09-23

- Update personality names to avoid wrapping and make them more interesting

## [1.0] - 2019-09-23

- Bronze increases its eco slightly faster over distance
- Sub Commanders will once again spawn wherever they want
- All difficulties are slower to increase the number of armies
- Minor increases to the starting eco of Gold and Platinum
- Remove delay for Bronze building from factories
- Platinum and Uber always start with at least two armies
- Reduced the eco bonus bosses receive
- All bosses use shared armies and attempt to spawn on multiple planets
- Foundation now has multiple starting planets in its boss system
- Bosses hide their personality
- Bosses scale their armies according to the size of the galaxy
- Corrected lowest threat rating being too low on the scale to ever register
- Improved accuracy of threat ratings
- Silver less effective at using higher levels of eco
- Bronze expands slower
- Added tooltip to explain the difficulty options

## [0.14.2] - 2019-09-12

- Fixed some personality names causing wrapping on the intel panel
- Renamed some personalities

## [0.14.1] - 2019-09-11

- Aggressive AIs are more aggressive
- Fixed surface area not always updating when system selection was changed

## [0.14] - 2019-09-09

- Turtle personality makes more initial fabbers at each tech level
- Integrated wondible's Section of Foreign Intelligence for galactic war
- Increased granularity of threat assessments
- Removed all enemy system descriptions to make more space for useful information
- Clearly identify additional factions in a system
- Added an overall system threat rating
- Each enemy shows their personality on the galaxy map
- Adjusted the number of fabbers each boss builds initially

## [0.13.1] - 2019-08-30

- Fixed enemies not always teching at the correct time

## [0.13] - 2019-08-27

- Sub Commanders display their personality when you find their card
- Prefixed difficulties to further differentiate them from skirmish difficulty and galaxy size
- Reduced the number of Commanders in the initial Platinum systems
- Platinum starts with a slightly higher eco

## [0.12.1] - 2019-08-17

- Fix for fights failing to start in some circumstances

## [0.12] - 2019-08-17

- Enemies account for their eco modifier when teching to T2
- Bosses and their minions now enjoy an eco-boost over surrounding systems
- Metrarch the Machinist and First Seeker Osiris try to start on a different planet to you
- The minions of Metrarch the Machinist and First Seeker Osiris try to start on the same planet as you
- Acolyte Agatho will provide greater ground cover for Inquisitor Nemicus's air
- Seeker Ankou and Seeker Barastyr now display distinct behaviour from one another
- Metrarch the Machinist and Servant Aust have personalities reflective of their new spawning behaviours
- Bronze and Silver start with a slightly lower eco
- Gold eco ramps up slightly faster
- Sub Commanders will always try to spawn on the same planet as the player
- Increased the chance of an FFA occurring at Silver and above
- Imperator Invictus is now truly legion, spawning multiple copies of itself across multiple worlds to form a single shared army
- First Seeker Osiris has a greater focus on orbital

## [0.11] - 2019-04-15

- Replaced vanilla Commander number scaling formula so that larger galaxies grow to use larger Commander counts
- Casual grows Commander count slightly slower

## [0.10.1] - 2019-04-05

- Fixed Platinum having one too many minions in each system

## [0.10] - 2019-04-03

- You will sometimes find another faction is contesting a system leading to a FFA occurring
- Added Section of Foreign Intelligence for galactic war as a dependency mod
- Improved distinctiveness of boss minion colours
- Bosses given smarter personalities

## [0.9] - 2019-04-01

- Fix minor error in a Synchronous personality
- Assigned each Commander a unique colour
- See which Sub Commanders perform well for you and drop the bad ones
- Identify which enemy Commander is the biggest threat
- Synchronous is now green to ensure enough distinct shades for all Commanders
- Ensure systems display faction colour and not Commander colour
- Many thanks to [wondible](https://github.com/JustinLove) for all his work on the JavaScript for this release
- Tweaked newest profiles to better match core intent and make them more distinctive across factions

## [0.8] - 2019-03-29

- Fixed Casual through Gold incorrectly loading vanilla difficulty levels
- Reduced file shadowing with thanks to [wondible](https://github.com/JustinLove)
- Enemy Commanders now utilise individual styles
- Updated difficulty guidance based on more personality controls being assigned to individual Commanders
- Updates to Commander personalities
- Difficulty settings now fully applied to bosses
- Added four new Commanders to each faction
- Reduced the effectiveness of all Sub Commanders
- Foundation leans more heavily into naval tech when they can
- A slight increase in boss difficulty through better economy handling and faster teching
- Revenants favour land over air
- Bronze and Silver micro better
- Silver spends excess resources better
- Corrected Synchronous only ever building three T1 factories until teching
- Foundation slightly more likely to use some ground units

## [0.7] - 2019-03-15

- Mod now removes the vanilla difficulty levels to ensure it is taking full effect
- Uber updated for the increased eco modifier ceiling
- Updated shadowed files

## [0.6] - 2019-01-14

- A huge overhaul of difficulty levels
  - All difficulties now use minions as a difficulty ramp tool
  - Platinum and below introduce minions earlier in the galaxy
  - Casual has a higher base economy
  - Casual uses the same system template as all other difficulty levels
  - Bronze has a higher base economy but gains economy over distance slower than before
  - Gold moves to T2 slightly later
  - Platinum now always has at least two minions in a system
  - Platinum handles its economy better
  - Uber is now set up as an ultimate challenge difficulty without any attempt to be fair

## [0.5] - 2019-01-13

- Fixed issue with turtling Sub Commander personalities only building a single factory
- Skewed personalities closer to Absurd skirmish difficulty settings except where specifically Queller personality aligned
- Updated Queller Sub Commander personalities with latest Queller personality settings
- Updated difficulty levels to use the latest Queller economic personality settings

## [0.4] - 2018-04-17

- Remove Q prefix from difficulties in a vain attempt to clarify that this is **not** using the Queller AI brain

## [0.3.1] - 2018-03-03

- Corrected what appears to be an error in the base game where one of the Foundation bosses was using Legonis Machina personality settings

## [0.3] - 2017-05-17

- Reduced the base level of eco that Gold through Uber start with
- Increased the base level of eco that Bronze and Silver start with
- Casual's expansion is no longer crippled
- Bronze expands a little faster
- Casual builds faster from its factories
- Bronze builds a little slower from its factories

## [0.2] - 2017-03-24

- Legate Kapowaz, Acolyte Osiris, Servant Beniesk and Seeker Banditks have undergone a personality change as the previous personality did not perform as intended
- Properly tagged mod to show support for PA classic and Titans
- Forum link goes to the right thread

## [0.1] - 2017-03-16

- Assign a general personality to each faction
- Reduce the number of minions per faction to 13
- Assign a unique commander model to each minion
- Name minion after commander to allow identification
- Assign a unique personality to each Sub Commander
- Append five new difficulty levels to Galactic War
