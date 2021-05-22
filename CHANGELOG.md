# CHANGELOG

## v5.1.0 - 2021-05-22

### Added

- New tech cards:
  - Planetary Radar
  - Planetary Radar Upgrade
- Titans AI support for:
  - Planetary Radar
  - Stinger
- Ability to reroll the tech offered to you

### Changed

- Backpacker Commander starts with more units
- Buffed the following unit upgrades:
  - Advanced Torpedo Launcher
  - Kraken
  - Orbital Fabrication Bot
  - Orca
  - Phoenix
  - Solar Array
  - Stinger
  - Teleporter
- Nerfed the following unit upgrades:
  - Bumblebee
- Disabled building of the Stitch by the AI due to failure to treat it as a combat unit in Galactic War

## v5.0.0 - 2021-05-19

### Added

- New loadouts:
  - Backpacker Commander
  - Hoarder Commander
- Integrated the following AI enhancements with thanks to PA Inc for their guidance:
  - [AI Bugfixes and Enhancements](https://forums.planetaryannihilation.com/threads/server-ai-bugfixes-and-enhancements.73444/) v2.5.0
  - [Queller AI](https://forums.planetaryannihilation.com/threads/server-queller-ai.65795/) v5.13.0

### Changed

- System Scaling option isn't shown at setup if Shared Systems for Galactic War is in use
- Reduced the number of Workers per Cluster system
- Improved granularity of system threat level at all difficulties
- The following loadouts use multipliers rather than fixed values to account for balance changes to the game:
  - Planetary Excavation Commander
  - Space Excavation Commander
- Space Excavation Commander can no longer build the Solar Array
- Added percentage information to many loadout descriptions where it was previously missing

### Fixed

- Complete Orbital Tech being offered when you were using the Space Excavation loadout

## v4.23.0 - 2021-05-14

### Changed

- Buffed the following unit upgrades:
  - Inferno
- Gold difficulty AI is slightly less effective at using its resources
- All difficulties below Uber introduce additional commanders later than previously
- Silver through Diamond introduce AI buffs later than previously

### Fixed

- Reduced aliasing on Diamond rank icon

## v4.22.1 - 2021-05-12

### Changed

- Updated Diamond rank icon

### Fixed

- Disabled some debugging that had been left active
- Galata upgrade not causing damage to its targets

## v4.22.0 - 2021-05-11

### Added

- Restored Tougher Commander option for new wars especially for Dreadnought and his big puppy dog eyes.
- Loadouts change their icon to show the highest difficulty war you've won with them. This is not retrospective. Thanks to Tristan for providing icons to fill in the gaps in the PA ladder system.

### Changed

- Commander AI buff has had Improved Commander Build Arms added to it
- AI buff for commanders renamed to distinguish it from Tougher Commanders
- Tougher Commanders now only applies the Commander Armor Tech

### Fixed

- Tougher Commanders not being applied in older saves
- Tougher Commanders only being applied to the primary AI faction in a system
- Galata and Flak upgrade cards not correctly displaying affected units in their tooltip

## v4.21.1 - 2021-05-10

### Fixed

- Skitter upgrade not correctly applying all its buffs
- Skitter upgrade preventing battles from starting if you also had T1 air

## v4.21.0 - 2021-05-10

### Added

- 38 unit upgrade cards, every unit now has an associated upgrade for a total of 109
- Your system lore preference is now saved between wars

### Changed

- Simplified upgrade tech checks to improve future compatibility
- Buffed the following unit upgrades:
  - Advanced Radar
  - Angel
  - Ant
  - Astraeus
  - Firefly
  - Laser Defense Tower
  - Leviathan
  - Manhattan
  - Phoenix
  - Radar
  - Skitter
  - Slammer
  - Stingray
  - SXX-1304 Laser Platform
- Nerfed the following unit upgrades:
  - Grenadier
- Removed Tougher Commanders option from war setup
- Tougher Commanders added as an AI buff
- Foundation invest more heavily into their navy where possible
- Tougher Commanders gives enemy commanders mine vision
- Luddites no longer tech late but instead maintain a high ratio of T1 to T2 factories
- Rush is no longer bot focused
- Economist builds less defences
- Increased naval usage by Uber, Platinum, and Gold
- AI buffs appear one system earlier at Silver and above
- AI buffs appear one system later at Bronze and below
- Sub-commanders produce less fabbers

### Fixed

- Fabrication Bot, Stitch, and Mend being misidentified in the What Units? tooltip
- Chance of receiving some naval techs being too high
- Cluster Worker Rush using the wrong number of fabbers

## v4.20.2 - 2021-05-04

### Fixed

- Lore overrides system descriptions when using Shared Systems for Galactic War

## v4.20.1 - 2021-05-02

### Fixed

- Additional difficulty options not being translated

## v4.20.0 - 2021-05-01

### Added

- Ability to disable system scaling and have all system sizes used at all distances

## v4.19.1 - 2021-05-01

### Fixed

- Grammatical errors in the lore

## v4.19.0 - 2021-05-01

### Added

- Lore from the original pre-release Galactic War
- Option to disable lore during Galactic War setup

## v4.18.7 - 2021-04-20

### Fixed

- Fix a timing bug that could cause difficulty values to be incorrectly set

## v4.18.6 - 2021-01-30

### Fixed

- Continue War does not return you to the galactic map if more than one enemy faction remains alive. Without the game breaking side-effects. For reals this time.

## v4.18.5 - 2021-01-30

### Fixed

- Rolled back the alternate Continue War fix as that also works locally but not via Community Mods

## v4.18.4 - 2021-01-30

### Fixed

- Continue War does not return you to the galactic map if more than one enemy faction remains alive
  - The previous fix which worked in local testing fails when loaded via Community Mods for reasons I don't understand, so a slightly clunkier fix has been implemented
- Galactic War Overhaul panel showing the wrong difficulty if you are using Shared Systems for Galactic War
- Vehicle Ammunition Tech chance being set too high

## v4.18.3 - 2021-01-30

### Fixed

- Rolled back previous fix due to working locally but not via Community Mods

## v4.18.2 - 2021-01-30

### Fixed

- Continue War does not return you to the galactic map if more than one enemy faction remains alive

## v4.18.1 - 2021-01-28

### Fixed

- Error preventing battles launching

## v4.18.0 - 2021-01-28

### Added

- Upgrade tech cards for T1 factories
- The Guardians are marked by their own icon on the map

### Changed

- Reduced chance of receiving an upgrade tech card

### Fixed

- Planet alignment with text in intelligence panel
- Guardian tech modifier not always showing on the intelligence panel

## v4.17.1 - 2021-01-16

### Fixed

- Support translation of new tooltips
- Original personalities behaving incorrectly
- Moon tooltips showing water and temperature information

## v4.17.0 - 2021-01-15

### Added

- Tooltips to planets on the intelligence panel with data about metal, radius, etc.
- Starting planet icons on intelligence panel
- Thruster icons for smashable planets on intelligence panel

## v4.16.0 - 2021-01-13

### Changed

- Revisions to faction personalities

### Fixed

- Inventory cards not displaying when clicked

## v4.15.0 - 2021-01-12

### Changed

- Reduced file shadowing
- Minor performance optimisations
- Enemy Commanders displayed by faction in the intelligence panel
- Only display active AI tech and game modifiers
- Updated AI tech and game modifier names
- Removed titles from AI Commander names
- List Guardian unique tech bonus in intelligence panel

### Fixed

- Tooltips showing on a new loadout card if you refreshed the UI
- Tutorial breakage

## v4.14.0 - 2021-01-10

### Changed

- Always offer Additional Data Bank as a fourth card when the inventory is full
- Each Sub Commander in your tech banks reduces the chance of finding another
- Nomad Commander loadout can no longer move metal extractors

### Fixed

- Deep Space Radar and Umbrella using wrong navigation settings under Nomad Commander loadout
- Nomad Commander buildings blocking the location they were built at even after moving elsewhere
- Structures overlapping when executing an attack move

## v4.13.2 - 2021-01-10

### Fixed

- Custom difficulty recognised by the Galactic War Overhaul information panel
- Nomad Commander's orbital structures can now move
- Nomad Commander's structures now hover
- Single Laser Defense Tower Upgrade will work correctly with the Nomad Commander loadout

## v4.13.1 - 2021-01-07

### Fixed

- Gil-E Upgrade Tech causing Gil-E to deal no damage

## v4.13.0 - 2021-01-05

### Added

- Information panel detailing the current war's settings

### Changed

- Vertical padding added to intelligence data

### Fixed

- Align table data to colon where wrapping has occurred

## v4.12.1 - 2021-01-04

### Changed

- The player's name is displayed on the player list in place of "Player"

### Fixed

- Omega Upgrade Tech card never being dealt
- Squall Upgrade Tech card never being dealt
- Typhoon Upgrade Tech card never being dealt
- Advanced Laser Defense Tower Upgrade Tech card never being dealt

## v4.12.0 - 2021-01-01

### Changed

- Spacing on intelligence tables
- Single Laser Defense Tower Upgrade Tech card has a new effect

### Fixed

- Broken tooltips on three of the new tech cards
- CSS classes

## v4.11.0 - 2020-12-24

### Added

- 65 new tech cards to discover in your wars

### Changed

- Mod now named Galactic War Overhaul

### Fixed

- Errors and inconsistencies in base game tech cards
  - Combat Commander Tech
    - Card has the same chance of appearing in a medium size galaxy as any other size
  - Orbital Combat Tech
    - Card has the same chance of appearing in a medium size galaxy as any other size
  - Economy Fabrication Tech
    - Inconsistent chance of appearing across different galaxy sizes
  - Intelligence Fabrication Tech
    - Card has the same chance of appearing in an epic or larger size galaxy as smaller sizes
  - Orbital Fabrication Tech
    - Card has the same chance of appearing in an epic or larger size galaxy as smaller sizes
  - Storage Compression Tech
    - Card has the same chance of appearing in a medium size galaxy as any other size
  - Efficiency Tech
    - Card has the same chance of appearing in a medium size galaxy as any other size
  - Bot Combat Tech
    - Correctly offered when player using the Bot Commander loadout
  - Bot Ammunition Tech
    - Correctly offered when player using the Bot Commander loadout
  - Bot Engine Tech
    - Correctly offered when player using the Bot Commander loadout
  - Bot Fabrication Tech
    - Correctly offered when player using the Bot Commander loadout
  - Bot Armor Tech
    - Correctly offered when player using the Bot Commander loadout
  - Vehicle Combat Tech
    - Correctly offered when player using the Vehicle Commander loadout
  - Vehicle Ammunition Tech
    - Correctly offered when player using the Vehicle Commander loadout
  - Vehicle Engine Tech
    - Correctly offered when player using the Vehicle Commander loadout
  - Vehicle Fabrication Tech
    - Correctly offered when player using the Vehicle Commander loadout
  - Vehicle Armor Tech
    - Correctly offered when player using the Vehicle Commander loadout
- Bot Anti-Air Tech breaking acquire buttons on new tech display or failing to be added to your inventory successfully

## v4.10.3 - 2020-11-30

### Changed

- Tourist Commander description clarifies the behaviour of Sub Commanders

### Fixed

- Storage Commander appearing as locked and unlocked after being unlocked

## v4.10.2 - 2020-11-20

### Fixed

- No longer modifies the tutorial

## 4.10.1 - 2020-11-06

### Fixed

- Spelling

## v4.10.0 - 2020-11-02

## Added

- Nomad Commander loadout
- Updated loadouts from trialq's discontinued Galactic War Loadouts mod
  - Swarm Commander loadout
  - Buff Commander loadout

## Changed

- Some Synchronous personalities now use more basic fabbers

## Fixed

- Custom loadouts showing a Which Units? tooltip

## v4.9.2 - 2020-11-01

### Changed

- Removed use of lodash aliases to futureproof for move to v4

### Fixed

- Cluster Worker Sub Commanders will build again

## v4.9.1 - 2020-09-16

### Removed

- Support for Classic due to Cluster's dependency on TITANS' units

### Fixed

- Workers not building
  - This bug will remain in wars started with v4.8.0 and v4.9.0

## v4.9.0 - 2020-09-08

### Added

- TITANS now uses the classic systems in addition to its own, making for an additional nine systems

## v4.8.0 - 2020-09-07

### Added

- New home system for Cluster courtesy of WPMarshall

### Changed

- Workers can now see as far as an Angel
- Boss systems now named for their faction only
- Boss planets use the old system names

### Fixed

- Safeguard to protect against loadouts showing a Which Units? tooltip

## v4.7.3 - 2020-09-02

### Fixed

- Some loadouts not showing on the new war screen

## v4.7.2 - 2020-08-25

### Fixed

- Hide tooltip from Sub Commander cards in your inventory

## v4.7.1 - 2020-08-24

### Fixed

- Stinger missing from bot card tooltips

## v4.7.0 - 2020-08-21

### Changed

- Reduced the number of commanders in the boss, guardian, and worker armies at Casual difficulty
- Reduced the chance of a FFA occurring at all difficulty levels

## v4.6.1 - 2020-08-19

### Fixed

- Large tooltips for tech cards format themselves to try and fit within the available space
- Air Ammunition Tech tooltip not listing all units
- Structure Armor Tech tooltip not listing all units
- Structure Combat Tech tooltip not listing all units
- Fixed some of my fixes:
  - Structure Armor Tech
    - Fixed
      - Anchor
  - Structure Combat Tech
    - Fixed
      - Anchor
      - Halley
      - Unit Cannon
- Additional issues in the base game cards:
  - Air Ammunition Tech
    - Fixed
      - Hummingbird ammo
  - Air Combat Tech
    - Fixed
      - Hummingbird ammo
  - Structure Armor Tech
    - Added
      - Halley

## v4.6.0 - 2020-08-19

### Added

- Faction tooltip explaining the style used by the enemy and Sub Commanders
- Complete Energy Tech card
- Tooltips on cards listing which units they affect

### Changed

- Made the FFA Chance tooltip more accurate
- Added the Stinger (Bot AA) to the following cards:
  - Bot Ammunition Tech
  - Bot Armor Tech
  - Bot Combat Tech
  - Bot Engine Tech
  - Bot Fabrication Tech

### Fixed

- All known issues and inconsistencies with the base game tech cards:
  - Air Ammunition Tech
    - Added
      - Strafer
  - Air Combat Tech
    - Added
      - Strafer ammo
  - Bot Engine Tech
    - Fixed
      - Colonel
      - Locusts
      - Spark
  - Complete Energy Tech
    - Added
      - Artemis
      - Helios
      - Icarus
      - Spark
      - Wyrm
      - Zeus
    - Removed
      - Catapult
      - Hornet
      - Stingray
      - Teleporter
      - Umbrella
  - Defense Ammunition Tech
    - Added
      - Advanced Torpedo Launcher
      - Anchor
      - Torpedo Launcher
  - Defense Fabrication Tech
    - Added
      - Anchor
  - Improved Energy Weapons
    - Added
      - Artemis
      - Helios
      - Icarus
      - Spark
      - Wyrm
      - Zeus
    - Removed
      - Catapult
      - Hornet
      - Stingray
      - Umbrella
  - Improved Fabricator Build Arms
    - Added
      - Colonel
      - Unit Cannon
    - Fixed
      - Angel
  - Intelligence Fabrication Tech
    - Added
      - Firefly
      - Hermes
      - Piranha
      - Skitter
      - Stingray
      - Vanguard
  - Naval Ammunition Tech
    - Added
      - Narwhal torpedo (classic only)
      - Squall torpedo
  - Naval Combat Tech
    - Added
      - Narwhal torpedo (classic only)
      - Squall torpedo
  - Orbital Armor Tech
    - Removed
      - Anchor
      - Jig
      - Orbital Factory
  - Orbital Combat Tech
    - Removed
      - Anchor
      - Jig
      - Orbital Factory
  - Orbital Fabrication Tech
    - Removed
      - Anchor
      - Jig
  - Structure Armor Tech
    - Added
      - Anchor
      - Unit Cannon
  - Structure Combat Tech
    - Added
      - Advanced Torpedo Launcher ammo
      - Anchor
      - Anchor ammo
      - Halley
      - Torpedo Launcher ammo
      - Unit Cannon

## v4.5.1 - 2020-08-16

- Fixed Security Turtle advanced fabber ratio

## v4.5.0 - 2020-08-15

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

## v4.4.1 - 2020-08-14

- Corrected commander count for older wars sometimes being wrong on intelligence reports

## v4.4.0 - 2020-08-13

- Allow the player to delete tech from their inventory at any time

## v4.3.0 - 2020-08-12

- Deal General Commander's minions as cards to your inventory
- Added Bot Anti-Air Tech card
- Fixed armies not always landing with multiple commanders even though intelligence said they have them
- Enabled the following tech cards:
  - Intelligence Fabrication Tech
  - Improved Intelligence Tech
  - Improved Energy Weapons

## v4.2.2 - 2020-08-07

- Fixed Cluster Worker not generating the right AI threat
- Defeating a boss in a new war will no longer sometimes defeat the treasure planet

## v4.2.1 - 2020-08-06

- Tidied up some Cluster boss descriptions

## v4.2.0 - 2020-08-05

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

## v4.1.0 - 2020-08-02

- Space Excavation Commander and Tactical Nuke Commander correctly file unit removal under dulls not buffs
- Added the unused base game Storage Commander loadout
- Casual through Gold scale up their commander numbers slower than before
- Fixed the General Commander failing to add cards to their inventory and being unable to start fights in new wars - thanks to EVmaker for the report
- Fixed the dealing of unlocked loadouts from the base game as treasure - thanks to EVmaker for the report

## v4.0.2 - 2020-08-1

- Prevent Rapid Deployment Commander breaking the treasure planet guardians

## v4.0.1 - 2020-08-1

- Removed the test commander loadout. That one is not for you :)

## v4.0.0 - 2020-08-01

- Fixed Bounties, Team Death, and Big Spawns sometimes being enabled even if you disabled them
- Added support for new loadouts and instructions for modders on how to make loadout mods compatible
- Added new loadouts for you to unlock in your wars
- Galactic War Unique Loadouts is not compatible with GWAIO in its current form and should be disabled. Its loadouts have been ported into this mod in accordance with its license requirements. Thanks to Nemuneko for their work.
- Changed mod priority to allow other mods to add loadouts through GWAIO
- Changed locked loadout hints
- As you go deeper into the galaxy you will now uncover larger systems
- Casual difficulty uses simpler systems

## v3.7.0 - 2020-07-26

- Faction Tech is no longer optional and is now integrated into the difficulty curve
- Shuffle Landing Zones is no longer optional
- Bosses no longer unlock loadouts
- Every war now features a treasure planet, with guardians who defend a loadout you are guaranteed not to have
- Removed Mirror Mode as an option - this is now used by treasure planets
- Fixed v1.2.0 - v2.0.4 wars losing connection to the server when starting a FFA battle

## v3.6.0 - 2020-07-20

- Added Faction Scaling (defaults to true) which adjusts the number of enemy factions in accordance with the galaxy size
- Expanded what is considered an orbital unit for the purposes of Revenants buffs when Faction Tech is active
- Corrected the Omega not having its anti-orbital weapon buffed for the Revenants
- Fixed Synchronous not receiving its nuke damage bonus with Faction Tech
- Added optional mode Mirror Mode which grants the AI the same tech buffs as the player

## v3.5.2 - 2020-07-19

- Fixed the fix for the Sub Commander card

## v3.5.1 - 2020-07-19

- Fixed Sub Commanders not being dealt if you didn't meet their requirements at the start of the war
- Fixed a typo in the Bounty Value tooltip

## v3.5.0 - 2020-07-18

- Ammunition Tech has been expanded to include reduced firing costs (or time in the case of the Ragnarok)

## v3.4.0 - 2020-07-18

- Legonis Machina receive buffs to the Unit Cannon with Faction Tech
- Added the faction tech buff type Build which improves fabber and factory speed and efficiency
- Fixed an error from v3.3.3 which prevented damage and speed buffs being applied in full - a new war is required for this fix

## v3.3.4 - 2020-07-16

- Corrected error with faction tech buffs being incorrectly applied for TITANS units when multiple factions were present in a system
- Fixed bosses in wars started between v1.0 and v2.2.0 not spawning multiple commanders

## v3.3.3 - 2020-07-16

- Cleaned up the code underpinning the mod
- Fixed save button for custom difficulty sometimes needing to be pressed twice
- Faction Tech now disabled by default

## v3.3.2 - 2020-07-14

- Fixed the new war UI not loading

## v3.3.1 - 2020-07-14

- Corrected an error in Planetary Intelligence that could delay the display of the jump button
- Cleaned up code for inserting HTML into gw_start

## v3.3.0 - 2020-07-13

- Added new option "Faction Tech" which applies random tech card bonuses to the AI

## v3.2.1 - 2020-07-12

- Corrected minions and additional factions being assigned the Tutorial Commander if Tougher Commanders was enabled

## v3.2.0 - 2020-07-11

Due to a bad merge the changes of v3.1.1 were not actually applied.

- Fixed AI not using starting location evaluation function
- Added starting location evaluation function to GW-Custom
- Replaced shadowing of gw_play.js with injection of code into the gw_play scene - thanks to wondible for his ever-invaluable aid
- Removed TITANS ownership requirement from Tougher Commanders as it no longer requires use of the TITANS Tutorial Commander
- Reduced health of Tougher Commanders from 1,000,000 to 25,000 to match Commander Armor Tech
- Removed build and storage bonuses from Tougher Commanders
- Tougher Commanders now applies Commander Combat Tech to all enemy commanders on a boss world

## v3.1.1 - 2020-07-10

- Reduced health of Tougher Commanders from 1,000,000 to 50,000
- Removed build and storage bonuses from Tougher Commanders

## v3.1.0 - 2020-07-09

- Added support for the new AI starting location evaluation function

## v3.0.0 - 2020-07-09

- Thanks to PA Inc for updating the server scripts to support all game modes in Galactic War
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

## v2.3.3 - 2020-07-04

- Add support for Default personality tag to GW-CUSTOM
- Improved difficulty tooltips

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
