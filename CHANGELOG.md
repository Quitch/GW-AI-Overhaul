# CHANGELOG

## DEV

- Rush spends less time at T1
- Rush is more aggressive
- Synchronous turtles prefer vehicles over bots
- Corrected number of fabbers turtles try to build when alone
- Implemented support for the new personality tags which allow configuration of different opening factories
- Platinum and Uber Commander personalities behave slightly more distinctly from other personalities across all factions
- Reduced maximum number of fabbers per army at all levels above Casual

## 1.0.2 - 2019-09-24

- Further correction of personality word wrapping

## 1.0.1 - 2019-09-23

- Update personality names to avoid wrapping and make them more interesting

## 1.0 - 2019-09-23

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

## 0.14.2 - 2019-09-12

- Fixed some personality names causing wrapping on the intel panel
- Renamed some personalities

## 0.14.1 - 2019-09-11

- Aggressive AIs are more aggressive
- Fixed surface area not always updating when system selection was changed

## 0.14 - 2019-09-09

- Turtle personality makes more initial fabbers at each tech level
- Integrated wondible's Section of Foreign Intelligence for Galactic War
- Increased granularity of threat assessments
- Removed all enemy system descriptions to make more space for useful information
- Clearly identify additional factions in a system
- Added an overall system threat rating
- Each enemy shows their personality on the galaxy map
- Adjusted the number of fabbers each boss builds initially

## 0.13.1 - 2019-08-30

- Fixed enemies not always teching at the correct time

## 0.13 - 2019-08-27

- Sub Commanders display their personality when you find their card
- Prefixed difficulties to further differentiate them from skirmish difficulty and galaxy size
- Reduced the number of Commanders in the initial Platinum systems
- Platinum starts with a slightly higher eco

## 0.12.1 - 2019-08-17

- Fix for fights failing to start in some circumstances

## 0.12 - 2019-08-17

- Enemies account for their eco modifier when teching to T2
- Bosses and their minions now enjoy an eco boost over surrounding systems
- Metrarch the Machinist and First Seeker Osiris try to start on a different planet to you
- The minions of Metrarch the Machinist and First Seeker Osiris try to start on the same planet as you
- Acolyte Agatho will provide greater ground cover for Inquisitor Nemicus's air
- Seeker Ankou and Seeker Barastyr now display distinct behaviour from one another
- Metrarch the Machinist and Servant Aust have personalities reflective of their new spawning behaviours
- Bronze and Silver start with a slightly lower eco
- Gold eco ramps up slightly faster
- Sub Commanders will always try to spawn on the same planet as the player
- Increased the chance of a FFA occurring at Silver and above
- Imperator Invictus is now truly legion, spawning multiple copies of itself across multiple worlds to form a single shared army
- First Seeker Osiris has a greater focus on orbital

## 0.11 - 2019-04-15

- Replaced vanilla Commander number scaling formula so that larger galaxies grow to use larger Commander counts
- Casual grows Commander count slightly slower

## 0.10.1 - 2019-04-05

- Fixed Platinum having one too many minions in each system

## 0.10 - 2019-04-03

- You will sometimes find another faction is contesting a system leading to a FFA occurring
- Added Section of Foreign Intelligence for galactic war as a dependency mod
- Improved distinctiveness of boss minion colours
- Bosses given smarter personalities

## 0.9 - 2019-04-01

- Fix minor error in a Synchronous personality
- Assigned each Commander a unique colour
- See which Sub Commanders perform well for you and drop the bad ones
- Identify which enemy Commander is the biggest threat
- Synchronous is now green to ensure enough distinct shades for all Commanders
- Ensure systems display faction colour and not Commander colour
- Many thanks to wondible for all his work on the JavaScript for this release
- Tweaked newest profiles to better match core intent and make them more distinctive across factions

## 0.8 - 2019-03-29

- Fixed Casual through Gold incorrectly loading vanilla difficulty levels
- Reduced file shadowing with thanks to wondible
- Enemy Commanders now utilise individual styles
- Updated difficulty guidance based on more personality controls being assigned to individual Commanders
- Updates to Commander personalities
- Difficulty settings now fully applied to bosses
- Added four new Commanders to each faction
- Reduced the effectiveness of all Sub Commanders
- Foundation lean more heavily into naval tech when they can
- Slight increase in boss difficulty through better economy handling and faster teching
- Revenants favour land over air
- Bronze and Silver micro better
- Silver spends excess resources better
- Corrected Synchronous only ever building three T1 factories until teching
- Foundation slightly more likely to use some ground units

## 0.7 - 2019-03-15

- Mod now removes the vanilla difficulty levels to ensure it is taking full effect
- Uber updated for the increased eco modifier ceiling
- Updated shadowed files

## 0.6 - 2019-01-14

- Huge overhaul of difficulty levels
  - All difficulties now use minions as a difficulty ramp tool
  - Platinum and below introduce minions earlier in the galaxy
  - Casual has a higher base economy
  - Casual uses the same system template as all other difficulty levels
  - Bronze has a higher base economy but gains economy over distance slower than before
  - Gold moves to T2 slightly later
  - Platinum now always has at least two minions in a system
  - Platinum handles its economy better
  - Uber is now setup as an ultimate challenge difficulty without attempt to be fair

## 0.5 - 2019-01-13

- Fixed issue with turtling Sub Commander personalities only building a single factory
- Skewed personalities closer to Absurd skirmish difficulty settings except where specifically Queller personality aligned
- Updated Queller Sub Commander personalities with latest Queller personality settings
- Updated difficulty levels to use the latest Queller economic personality settings

## 0.4 - 2018-04-17

- Remove Q prefix from difficulties in vain attempt to clarify that this is **not** using the Queller AI brain

## 0.3.1 - 2018-03-03

- Corrected what appears to be an error in the base game where one of the Foundation bosses was using Legonis Machina personality settings

## 0.3 - 2017-05-17

- Reduced base level of eco that Gold through Uber start with
- Increased base level of eco that Bronze and Silver start with
- Casual's expansion is no longer crippled
- Bronze expands a little faster
- Casual builds faster from its factories
- Bronze builds a little slower from its factories

## 0.2 - 2017-03-24

- Legate Kapowaz, Acolyte Osiris, Servant Beniesk and Seeker Banditks have undergone a personality change as the previous personality did not perform as intended
- Properly tagged mod to show support for PA classic and Titans
- Forum link goes to the right thread

## 0.1 - 2017-03-16

- Assign a general personality to each faction
- Reduce number of minions per faction to 13
- Assign a unique commander model to each minion
- Name minion after commander to allow identification
- Assign unique personality to each Sub Commander
- Append five new difficulty levels to Galactic War
