# CHANGELOG

## DEV

- Add support for Default personality tag to GW-CUSTOM

## v2.3.2 - 2020-06-26

- Fix sub commander personalities not being translated

## v2.3.1 - 2020-06-26

- Add default personality tag to all AIs as a future-proofing measure

## v2.3.0 - 2020-06-25

- Updated difficulty descriptions
- Less fabbers used by both enemies and allies
- Reduced starting eco of Iron and Bronze
- Iron scales up its commander numbers slower
- Set Casual as the default difficulty
- Ensured mod properly setup to work with translations

## v2.2.0 - 2020-05-30

- Attempted to make Turtle slightly more viable
- Turtle has a higher focus on non-factory structures
- Swarm starts with more fabbers
- Ensure that even when alone at least a small amount of T1 is built

## v2.1.1 - 2020-05-22

- Replaced my ridiculously over-engineered randomised spawn solution with something much saner
- Randomisation is now done by army rather than by team

## v2.1.0 - 2020-05-20

- Removed personalities: Legate, Acolyte, Servant, Seeker
- Added personalities: Defender, Swarm, and Economist
- All bosses now use the Pumpkin Commander to make them clearly identifiable via their icon
- Allied and enemy commanders will sometimes change which available spawn they use on multi-planet systems
- The number of commanders in a boss army is now controlled by difficulty
- If an additional faction is present in a multi-planet system and has multiple commanders they may spawn on multiple worlds
- Team spawn assignments are randomised each time you start a battle
- Custom difficulty responds to setting changes slightly faster

## v2.0.4 - 2020-02-13

- Improved the granularity with which system threat is displayed at the upper bounds

## v2.0.3 - 2020-02-06

- Corrected grammatical errors

## v2.0.2 - 2020-01-25

- Update the mod's description
- Avoid multiple Invictus commanders within the Legonis Machina

## v2.0.1 - 2019-11-04

- Added some more lore to ensure full system coverage when Easier Start is selected
- You will no longer be offered a Sub Commander if you don't have a factory they can open with (air/bot/vehicle)

## v2.0 - 2019-11-03

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

## v1.5.2 - 2019-11-01

- Disabled custom difficulty until I can resolve the underlying bug

## v1.5.1 - 2019-11-01

- Fixed enemies having no eco if the difficulty level wasn't changed
  - This has the side-effect of disabling enforcement of proper input into custom fields until I can fix the root cause

## v1.5.0 - 2019-10-31

- Added Copper difficulty as a stepping stone between Bronze and Silver
- Added Easier Start option which adds more neutral systems with free tech

## v1.4.1 - 2019-10-24

- Added support for the tutorial personality tag in custom difficulty mode
- Fixed some spelling errors

## v1.4.0 - 2019-10-21

- Added a custom difficulty to allow you to configure all the difficulty settings
- Updated some personality names to prevent word wrapping with new fonts
- Galaxy size no longer has any effect on the chance of an FFA occurring
- Fixed the enemy system owner sometimes spawning with multiple Commanders
- Fixed a bug in the base game causing the General Commander's Sub Commanders to sometimes have an eco modifier applied

## v1.3.0 - 2019-10-11

- Tried to improve the clarity of the difficulty tooltip for players for whom English is a second language
- The additional faction in an FFA has fewer Commanders
- Higher chance of an FFA at Casual, Bronze, Silver and Gold difficulties
- Lower chance of an FFA at Uber difficulty
- FFAs will sometimes be 4-way instead of 3-way
- Decreased the starting eco of Casual and Bronze

## v1.2.1 - 2019-10-07

- Fixed battles failing to launch if you were playing a war started with v1.1.0 or earlier and the battle was an FFA

## v1.2.0 - 2019-10-06

- Removed Bronze, Silver and Hard personalities
- Each faction has three Commanders which have adopted the playstyle of one of the other factions
- Removed boss eco bonus
- Fixed a bug which was causing some enemy Commanders to have incredibly high eco bonuses
- Bosses scale their eco bonus to match the size of the galaxy rather than their position within it
- Each boss now has three Commanders in its army instead of two
- An invading FFA enemy may bring multiple Commanders within its single army
- Chance of FFA lower at lower difficulties and higher at Uber

## v1.1.0 - 2019-10-05

- Rush spends less time at T1
- Rush is more aggressive
- Synchronous turtles prefer vehicles over bots
- Corrected number of fabbers turtles try to build when alone
- Implemented support for the new personality tags which allow configuration of different opening factories
- Platinum and Uber Commander personalities behave slightly more distinctly from other personalities across all factions
- Reduced maximum number of fabbers per army at all levels above Casual
- Adjusted Technologist fabber builds to compensate for their factory builds

## v1.0.2 - 2019-09-24

- Further correction of personality word wrapping

## v1.0.1 - 2019-09-23

- Update personality names to avoid wrapping and make them more interesting

## v1.0 - 2019-09-23

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

## v0.14.2 - 2019-09-12

- Fixed some personality names causing wrapping on the intel panel
- Renamed some personalities

## v0.14.1 - 2019-09-11

- Aggressive AIs are more aggressive
- Fixed surface area not always updating when system selection was changed

## v0.14 - 2019-09-09

- Turtle personality makes more initial fabbers at each tech level
- Integrated wondible's Section of Foreign Intelligence for galactic war
- Increased granularity of threat assessments
- Removed all enemy system descriptions to make more space for useful information
- Clearly identify additional factions in a system
- Added an overall system threat rating
- Each enemy shows their personality on the galaxy map
- Adjusted the number of fabbers each boss builds initially

## v0.13.1 - 2019-08-30

- Fixed enemies not always teching at the correct time

## v0.13 - 2019-08-27

- Sub Commanders display their personality when you find their card
- Prefixed difficulties to further differentiate them from skirmish difficulty and galaxy size
- Reduced the number of Commanders in the initial Platinum systems
- Platinum starts with a slightly higher eco

## v0.12.1 - 2019-08-17

- Fix for fights failing to start in some circumstances

## v0.12 - 2019-08-17

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

## v0.11 - 2019-04-15

- Replaced vanilla Commander number scaling formula so that larger galaxies grow to use larger Commander counts
- Casual grows Commander count slightly slower

## v0.10.1 - 2019-04-05

- Fixed Platinum having one too many minions in each system

## v0.10 - 2019-04-03

- You will sometimes find another faction is contesting a system leading to a FFA occurring
- Added Section of Foreign Intelligence for galactic war as a dependency mod
- Improved distinctiveness of boss minion colours
- Bosses given smarter personalities

## v0.9 - 2019-04-01

- Fix minor error in a Synchronous personality
- Assigned each Commander a unique colour
- See which Sub Commanders perform well for you and drop the bad ones
- Identify which enemy Commander is the biggest threat
- Synchronous is now green to ensure enough distinct shades for all Commanders
- Ensure systems display faction colour and not Commander colour
- Many thanks to wondible for all his work on the JavaScript for this release
- Tweaked newest profiles to better match core intent and make them more distinctive across factions

## v0.8 - 2019-03-29

- Fixed Casual through Gold incorrectly loading vanilla difficulty levels
- Reduced file shadowing with thanks to wondible
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

## v0.7 - 2019-03-15

- Mod now removes the vanilla difficulty levels to ensure it is taking full effect
- Uber updated for the increased eco modifier ceiling
- Updated shadowed files

## v0.6 - 2019-01-14

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

## v0.5 - 2019-01-13

- Fixed issue with turtling Sub Commander personalities only building a single factory
- Skewed personalities closer to Absurd skirmish difficulty settings except where specifically Queller personality aligned
- Updated Queller Sub Commander personalities with latest Queller personality settings
- Updated difficulty levels to use the latest Queller economic personality settings

## v0.4 - 2018-04-17

- Remove Q prefix from difficulties in a vain attempt to clarify that this is **not** using the Queller AI brain

## v0.3.1 - 2018-03-03

- Corrected what appears to be an error in the base game where one of the Foundation bosses was using Legonis Machina personality settings

## v0.3 - 2017-05-17

- Reduced the base level of eco that Gold through Uber start with
- Increased the base level of eco that Bronze and Silver start with
- Casual's expansion is no longer crippled
- Bronze expands a little faster
- Casual builds faster from its factories
- Bronze builds a little slower from its factories

## v0.2 - 2017-03-24

- Legate Kapowaz, Acolyte Osiris, Servant Beniesk and Seeker Banditks have undergone a personality change as the previous personality did not perform as intended
- Properly tagged mod to show support for PA classic and Titans
- Forum link goes to the right thread

## v0.1 - 2017-03-16

- Assign a general personality to each faction
- Reduce the number of minions per faction to 13
- Assign a unique commander model to each minion
- Name minion after commander to allow identification
- Assign a unique personality to each Sub Commander
- Append five new difficulty levels to Galactic War
