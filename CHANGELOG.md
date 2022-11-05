# CHANGELOG

## Unreleased

### Fixed

- AI spawn preference not being set correctly when more than six commanders were present for a single army

## v5.47.1 - 2022-09-20

### Changed

- Removed Queller AI files from the mod, the copy that ships with PA is now used

### Fixed

- New wars failing to start if Bronze, Silver, or Gold difficulty was chosen

## v5.47.0 - 2022-09-19

### Changed

- Updated AI, code, and cards for changes in PA 116242
- Removed mandatory AI personality tags from UI
- TITANS and Penchant AI only build AA in Unit Cannon if air units exist within the system

## v5.46.0 - 2022-08-16

### Changed

- Planetary Radar no longer triggers alerts
- AI Tech additions to the threat level better handle multiple commanders
- Tech mirroring has a larger threat bonus
- Adjusted how allies are factored into the threat value

### Fixed

- GWO Panel not displaying army information for vanilla GW saves
- Large threats using scientific notation

## v5.45.4 - 2022-08-12

### Fixed

- Cleaner implementation of the previous fix

## v5.45.3 - 2022-08-12

### Fixed

- Tech modifications to the AI's behaviour not being loaded

## v5.45.2 - 2022-08-11

### Fixed

- Base game error where modifiers from Tech cards were not applied to spawned units (such as Dox from a Lob)
- Base game error where spawned units were not treated as the same type for the purpose of selection as built copies of the unit

## v5.45.1 - 2022-08-07

### Fixed

- Modifiers from Tech cards not being applied

## v5.45.0 - 2022-08-06

### Changed

- Updated Penchant AI to v2.4.0

### Fixed

- Cluster trying to build things it couldn't if it wasn't the primary faction in the system

## v5.44.0 - 2022-08-01

### Changed

- Available Technology renamed to Available Tech to be consistent with Galactic War terminology
- Allies are identified by ALLY appearing next to the faction name

### Fixed

- Revenant Omegas not receiving buffs to all their ammos
- Revenant Unit Cannons not receiving the build speed buff
- Foundation air factories not receiving the build speed buff
- Cluster not receiving build speed buffs on all factories

## v5.43.0 - 2022-07-31

### Changed

- Armies with multiple commanders are more likely to spawn on multiple worlds if possible
- Upgrade Techs
  - Advanced Fabrication Aircraft
  - Advanced Fabrication Bot
  - Stryker

### Fixed

- War failing to start if the number of factions needed to be reduced to fit the number of available stars
- Minions of the primary faction AI spawning as copies of the primary AI instead of themselves
- Hummingbird Upgrade Tech not adding the appropriate unit type tag

## v5.42.0 - 2022-07-23

### Changed

- Tourist Commander no longer has access to the Jig
- Revert Spinner upgrade to a rate-of-fire buff
- AI Bugfixes and Enhancements updated to v2.11.0

### Fixed

- Queller AI faction personalities not always being correctly set

## v5.41.1 - 2022-07-20

### Fixed

- Minions being incorrectly inherited when a system is taken over

## v5.41.0 - 2022-07-20

### Added

- Bugs lore to the opening systems
- When a faction is defeated any systems they owned with other factions present will be taken over by one of those factions

### Changed

- Improved distinctiveness of Cluster colours

### Fixed

- Efficiency Tech tooltip listing storage structures twice
- Systems from a faction whose boss you have defeated offering you tech you already have
- AI colours not being removed on defeat from systems with an ally or additional factions present
- Super Weapon Fabrication Tech being offered before you have access to advanced tech

## v5.40.0 - 2022-07-17

### Changed

- Orbital Launder Upgrade Tech grants access to the Jig

### Fixed

- Factory upgrade techs' tooltip's unit list
- Vehicle Factory Upgrade Tech unlocking the wrong units

## v5.39.8 - 2022-07-17

### Fixed

- Enemies failing to spawn if the player had more commanders than the faction had unique colours

## v5.39.7 - 2022-07-16

### Fixed

- Allies appearing if you're playing as Space Excavation Commander
- Basic Factory upgrades not unlocking structures for the advanced fabricator

## v5.39.6 - 2022-07-15

### Fixed

- Cluster Boss having too many minions

## v5.39.5 - 2022-07-15

### Fixed

- Cards which grant access to advanced units correctly show all the advanced units that are unlocked
- Advanced Defense Technology being offered when the player doesn't have access to T2
- Catalyst Upgrade Technology not allowing for all routes to access the Catalyst

## v5.39.4 - 2022-07-14

### Fixed

- Paratrooper Commander being unable to build the Manhattan in the Unit Cannon

## v5.39.3 - 2022-07-12

### Changed

- Update Queller AI to v5.23.1

### Fixed

- Disabled units being present in the player's inventory if multiple cards added them

## v5.39.2 - 2022-07-07

### Fixed

- Queller AI attempting to build Colonels as Cluster

## v5.39.1 - 2022-07-06

### Changed

- Updated Penchant AI to v2.1.1

### Fixed

- Cluster systems having more than one Worker army
- Cluster AIs attempting to build Angels and Colonels

## v5.39.0 - 2022-07-04

### Changed

- Reduced bounty values to one decimal place at all levels so the UI will never lie about your eco bonus
- Bolding of inner rings indicating an ally or FFA

### Fixed

- Duplicate inner ring bitmaps being created
- Mouse hover sometimes on the wrong system after a planet with an ally or FFA is displayed
- Tech not being deletable if GWO was applied to a non-GWO save
- Expanded tech not being dealt if GWO was applied to a non-GWO save
- Tech deals breaking if GWO was applied to a non-GWO save

## v5.38.0 - 2022-07-03

### Added

- The inner ring of a system indicates whether any other factions are present

### Changed

- Threat Level is now numerical
- Removed individual army threat assessments
- Factor system ally into threat assessment
- AI Tech is approximated into the system threat rating
- Multiple commanders being in an army is factored into the system threat rating

### Fixed

- Table rows and data not aligning

## v5.37.1 - 2022-07-02

### Fixed

- Deals sometimes containing duplicate cards

## v5.37.0 - 2022-07-01

### Added

- Systems will sometimes feature an allied commander

### Fixed

- Personality tags not being correctly restored if the last war used Custom difficulty
- The Guardians' commander colour

## v5.36.2 - 2022-06-24

### Fixed

- AI not building fabbers from bot and vehicle factories if the player had the Bot or Vehicle Factory Upgrade Tech

## v5.36.1 - 2022-06-23

### Fixed

- Potential for card deals to break

## v5.36.0 - 2022-06-22

### Added

- Setting to choose between the basic tech deck and the expanded GWO deck
- New and improved interface for customising AI difficulty settings
- System complexity now decoupled from difficulty and selectable as the war option Simple Systems
- Your previous war settings are remembered

### Changed

- Diamond and Uber have less additional commanders
- Beginner never receives AI tech
- Beginner grows its eco slower
- Casual through Platinum start gaining AI tech slightly later
- Cluster is disabled if TITANS is not enabled
- Commander Upgrade Tech improved
- General Commander starts with the Skitter

## v5.35.0 - 2022-06-15

### Added

- Loadout badges for completing a war in hardcore mode

### Changed

- Queller AI updated to v5.23.0
- Updated Queller AI personality for Revenants
- Removed orbital delay from all Queller AIs

## v5.34.0 - 2022-06-11

### Changed

- Enemy Queller AIs use different behaviours for each faction
- Queller AI uses some of its FFA behaviour for FFAs
- Queller AI updated to v5.22.0

### Fixed

- Don't deal Sub Commander Fabber Tech if the AI is Queller

## v5.33.0 - 2022-06-10

### Changed

- Spinner Upgrade Tech changes targeting instead of rate of fire

### Fixed

- Skitter weapon not receiving correct stats or buffs
- Firefly weapon not receiving correct stats or buffs

## v5.32.0 - 2022-06-09

### Changed

- Queller AI updated to v5.21.0

## v5.31.0 - 2022-06-05

### Changed

- Intelligence Fabrication Tech now applies to Teleporters
- Queller no longer modifies its teching time in accordance with the econ rate modifier
- Meta penchant reflects changes to meta
- Updated faction tooltip to reflect Cluster being unable to build Angels and Colonels
- Queller AI updated to v5.20.0

### Fixed

- Base game error where Intelligence Fabrication Tech didn't reduce its chance of being dealt in larger galaxies
- Intelligence Fabrication Tech tooltip displaying the wrong units (thanks to Lula Mae for the report)

## v5.30.0 - 2022-06-01

### Changed

- Beginner loadout victory icon

### Fixed

- Paratrooper loadout missing units from Unit Cannon after player gained tech (with thanks to Zarc for the report)
- AI missing some units that Paratrooper makes available in the Unit Cannon

## v5.29.1 - 2022-05-07

### Fixed

- CEO Commander not being able to build Colonels

## v5.29.0 - 2022-05-02

### Added

- Beginner difficulty below Casual

### Changed

- Sub Commander Tactics Tech improves non-Queller Sub Commander eco wastage handling
- Reduced the number of fabbers each difficulty may use when TITANS or Penchant AI is in use
- Platinum gains slightly less eco as you get deeper into the galaxy
- Queller updated to version 5.20-beta
- Queller Sub Commanders use the Q-Silver brain instead of Q-Gold
- Sub Commander Tactics Tech upgrades Queller Sub Commanders from Q-Silver to Q-Gold

### Fixed

- Jig still being counted as a storage unit for the purpose of tooltips
- Queller AI being selectable if you weren't running TITANS

## v5.28.0 - 2022-04-16

### Added

- The system intelligence panel displays a card you are guaranteed to get offered if you conquer the system
- Zoom level fix on war commencement from Bigger Galactic War

### Changed

- Increased chance of bounty mode for Bronze difficulty and higher
- Increased chance of land anywhere for all difficulties
- Buffed the following cards:
  - Barracuda Upgrade Tech
  - Catalyst Upgrade Tech
  - Firefly Upgrade Tech
  - Halley Upgrade Tech
  - Helios Upgrade Tech
  - Kraken Upgrade Tech
  - Nuclear Missile Launcher Upgrade Tech
  - Skitter Upgrade Tech
  - Spark Upgrade Tech
  - Unit Cannon Upgrade Tech
- Changed the following cards:
  - Jig Upgrade Tech
  - Narwhal Upgrade Tech
  - Omega Upgrade Tech
  - Squall Upgrade Tech
- Modified the implementation of Bluehawk Upgrade Tech to allow for independent targeting
- Nerfed Atlas Upgrade Tech
- All loadouts start with the ARKYD
- Upgrades which require another unit now add that unit to your inventory
- Allow Nomad loadout units to be pushed
- AIs won't build land titans due to pathing issues
- Commanders assigned colour by faction in order of spawn to improve visual clarity
- Defense Fabrication Tech doesn't reduce the cost of the anti-nuke missiles

### Fixed

- Errors in tech card tooltips
- Workers always receive at least one extra commander if a system should have minions
- Removed references to an unused Helios weapon
- Hotfix for old versions being unnecessarily applied on the start of a new war
- Rapid Deployment Commander not changing the behaviour of the Advanced Naval Fabricator
- Stinger Upgrade Tech
- Slammer torpedo is buffed by bot buffs not structure buffs
- Defense Tech Commander not reducing cost of Umbrellas
- Omega Upgrade Tech being tied to ownership of irrelevant units
- Improved Energy Weapons never being dealt

## v5.27.0 - 2021-12-23

### Changed

- Galactic War setup is much more responsive as the galaxy is now only generated once you click "Go To War" and not every time you change a setting
- Buffed Catalyst Upgrade Tech
- Removed Tougher Commanders option from setup as this is now integrated into the AI buffs system

### Fixed

- Selection icon not being removed from the system the player started at
- Structure Armor Tech not including the Halley in its tooltip
- Orbital Engine Tech tooltip including structures
- Bot Combat Tech health and speed bonuses not being applied to the Gil-E
- Complete Bot Tech tooltip not listing the Stinger or Gil-E
- Complete Orbital Tech tooltip not listing the ARKYD
- Stinger Upgrade tooltip
- Tooltips for Vehicle Factory and Advanced Vehicle Factory being reversed

## v5.26.1 - 2021-12-08

### Fixed

- Foundation AI buffs treating naval factories as mobile units

## v5.26.0 - 2021-12-05

### Added

- Icons for upgrade cards to differentiate them from other cards

## v5.25.0 - 2021-11-21

### Added

- New tech cards:
  - Sub Commander Duplication Tech
  - Sub Commander Fabber Tech
  - Sub Commander Tactics Tech

### Fixed

- Inventory tooltips clashing with system tooltips when four techs were displayed

## v5.24.2 - 2021-11-19

### Fixed

- Selecting a loadout added by GWO prevents you from starting a new war

## v5.24.1 - 2021-11-15

### Fixed

- Explore causing a lock-up on wars from before v4.13.0
- Further clean-up of errors being generated by old saves

## v5.24.0 - 2021-11-14

### Change

- Sub Commanders now have the full penchant effect applied to them

### Fixed

- More graceful handling of really old save games

## v5.23.0 - 2021-11-13

### Change

- Sub Commanders will have a personality penchant when the Penchant AI is in use

### Fixed

- A system's primary faction Penchant AI sometimes behaving according to a different penchant than intelligence shows

## v5.22.1 - 2021-10-01

### Fixed

- Commanders will always open with their favourite factory type due to flaws uncovered in the percent_open implementation

## v5.22.0 - 2021-09-18

### Change

- Paratrooper Commander halves the cost of its starting factories
- Paratrooper Commander adds unlocked units to the Unit Cannon
- Paratrooper Commander Sub Commanders give higher priority to Unit Cannons

### Fixed

- Paratrooper Commander Sub Commanders not building Unit Cannons with their commanders

## v5.21.1 - 2021-08-27

### Fixed

- Scans failing to complete due to Quitch being a pillock

## v5.21.0 - 2021-08-27

### Change

- Improved compatibility of cards which modify buildable_types
- Paratrooper Commander starts with all units buildable by the Unit Cannon unlocked and upgradable

### Fixed

- Dox upgrades correctly offered to Paratrooper and Artillery Commanders

## v5.20.1 - 2021-08-25

### Fixed

- Spelling

## v5.20.0 - 2021-08-25

### Change

- Inferno Upgrade Tech has been changed due to passive self-healing being broken
- Vanguard Upgrade Tech is now an improved version of the Inferno Upgrade Tech
- CEO Commander has been completely overhauled to better differentiate it from the Storage Commander

## v5.19.0 - 2021-08-19

### Change

- Space Excavation Commander's Jigs no longer extend their arms, so as to avoid visual clutter at the ground layer
- Defense Tech Commander no longer starts with the bot factory
- Defense Tech Commander modifiers are now applied to Catapults, Umbrellas, and Anchors for the purpose of consistency

### Fixed

- Buff Commander applying speed bonuses to the Lob
- Swarm Commander applying speed bonuses to the Lob

## v5.18.1 - 2021-08-15

### Change

- Updated file shadows

### Fixed

- Reduction to the maximum amount of allowed water/lava on a planet to avoid edge-case lava planets
- Angel shooting orbital after being upgraded
- Newly introduced incompatibility with Shared Systems for Galactic War

## v5.18.0 - 2021-08-09

### Change

- Air Commander is unlocked by default
- Bot Commander is unlocked by default
- Orbital Commander is unlocked by default

### Fixed

- Game hanging when scanning a treasure planet and all loadouts are already unlocked
- Angel Upgrade not working

## v5.17.1 - 2021-08-08

### Fixed

- Slammer Upgrade Tech not being applied
- Swarm Commander correctly recognised by bot techs

## v5.17.0 - 2021-08-06

### Change

- Factions at Casual difficulty never have more than one commander in a system
- Iron through Gold introduce additional commanders later
- Platinum increases its commander numbers slightly slower
- The primary system faction (excluding bosses) does not gain both an eco-boost and an additional commander at the same time
- Slightly higher chance of an FFA
- Higher chance of land anywhere being enabled
- Reduced the number of boss commanders for Iron through Diamond
- Penchant AI uses the Stitch to build mines
- Penchant Heavy no longer builds Stitches
- All Penchants build Skitters again so as to have mine vision

## v5.16.0 - 2021-08-02

### Change

- Sub Commanders with basic factory upgrades will build advanced fabbers when they can afford them

## v5.15.0 - 2021-07-30

### Change

- Galaxy setup won't make planets larger than 800 radius

### Fixed

- Rapid Deployment Sub Commanders not building Hermes on single planet systems
- Rapid Deployment Sub Commanders not building their initial Orbital Fabber
- Rapid Deployment Sub Commanders never teching to advanced tech
- Rapid Deployment Sub Commanders taking too long to go orbital

## v5.14.3 - 2021-07-29

### Change

- Better description for the Storage Commander

### Fixed

- Sub Commanders building too many factories when using Rapid Deployment Commander loadout
- Basic factory upgrades being dealt to Rapid Deployment Commander

## v5.14.2 - 2021-07-25

### Fixed

- Rapid Deployment Commander not being able to build Kestrels
- Rapid Deployment Commander building some orbital units on the ground

## v5.14.1 - 2021-07-25

### Change

- Squall Upgrade Tech uses an air picture

### Fixed

- Rapid Deployment Commander no longer has immediate access to T2 orbital
- Rapid Deployment Commander not being able to build subs

## v5.14.0 - 2021-07-19

### Change

- The Guardians won't tell you their Penchant personality
- AI has added logic for handling the Phoenix upgrade
- Tailor Queller's handling of the Leveler upgrade

### Fixed

- Phoenixes not damaging structures following upgrade
- Closed a couple of gaps in the AI's air logic

## v5.13.2 - 2021-07-15

### Fixed

- Rapid Deployment Sub Commanders not building Stingers
- Sub Commanders not utilising player tech fully if the Penchant AI was in use

## v5.13.1 - 2021-07-15

### Fixed

- AI tooltip not marked for translation.

## v5.13.0 - 2021-07-15

### Added

- New AI called Penchant
  - Uses the Titans AI as a base
  - Each enemy has a favoured style of play which is reflected in their unit choices
  - This information is added to the enemy's personality in the intelligence panel
  - Sub Commanders are unaffected

### Change

- Increased the amount of freedom procedural maps have in using water and lava
- Increased the range of metal density and clusters used by procedural generation
- AI selection moved to a drop-down
- Removed code now present in the base game

### Fixed

- Rerolls being offered for loadouts
- Assault Commander loadout missing the Stinger
- Titans AI not building the Stinger from the Unit Cannon
- Setup column being too tall for the screen causing the entire page to scroll instead of just the column - with thanks to burntcustard
- Queller Sub Commanders not scouting on small planets when only vehicles were available
- Titans AI not building torpedo launchers
- AI uses Stitches again
- Upgraded Umbrellas shooting the ground on small planets

## v5.12.0 - 2021-07-04

### Change

- AI Tech
  - Damage increased includes Commander Ammunition Tech
  - Health increased includes Commander Armor Tech
  - Speed increased includes Commander Engine Tech
  - Builds faster includes Improved Commander Build Arms
  - Enhanced combat units includes Commander Combat Tech
  - Enhanced commanders no longer dealt
  - Revenant tech bonuses applied to Catalysts
- Legonis Machina and Synchronous put more emphasis on their preferred unit type
- Uber, Platinum, and Gold personalities now adhere to the build preferences of the faction

### Fixed

- AI commander torpedo and AA ammo not being included in commander damage buffs
- AI Tech speed increases not being applied to air units
- Cluster boss commander not receiving combat tech damage bonuses

## v5.11.0 - 2021-07-03

### Change

- Buffed the following upgrade techs:
  - Omega

### Fixed

- Orbital Fabrication Bot upgrade not dealt if you're using the Orbital Commander loadout

## v5.10.3 - 2021-07-02

### Fixed

- Galactic Map code not working

## v5.10.2 - 2021-07-02

### Change

- Remove cards fixed by 115863

### Fixed

- Change to code to hopefully resolve any remaining issues with the navigation buttons on the galaxy map
- Complete Orbital Tech being offered to Orbital, Hoarder, and Space Excavation Commanders

## v5.10.1 - 2021-06-29

### Fixed

- Corrected name and description of Pelter Upgrade Tech

## v5.10.0 - 2021-06-28

### Change

- AI Tech "Combat tech" now listed as "Combat units enhanced"
- Stinger now included by default in all tech and loadouts providing basic bot units

### Fixed

- Buff Commander and Swarm Commander not modifying the Stinger's damage
- Removed Stinger files and modifications now included in the base game

## v5.9.0 - 2021-06-27

### Added

- Combat tech is now an AI Tech, increasing health, speed, and damage

### Change

- All difficulty levels below Uber have AI Tech appear earlier in the galaxy
- Removed mine vision from AI's Commander Combat Tech
- Rebalanced AI Tech:
  - Legonis Machina only buffs tank units and factories, not bots
  - Synchronous buffs bot units and factories, not structures
  - Cluster buffs structures, not basic units

### Fixed

- Rerolls being offered for new loadouts
- AI speed tech being applied to structures
- ARKYD and Advanced Radar Satellite being swapped in tooltips
- Tougher Commanders not being applied to the Cluster boss

## v5.8.0 - 2021-06-23

### Change

- Updated Queller AI to v5.15.0

## v5.7.1 - 2021-06-22

### Fixed

- Nomad Commander no longer prevents nuke launchers and anti-nuke launchers from building missiles

## v5.7.0 - 2021-06-22

### Change

- AI builds Kaiju when alone and the player has the Kaiju upgrade
- AI won't build Colonels or Mends from the basic Bot Factory when using the Bot Factory upgrade
- AI won't use basic fabbers to build advanced economy even when it has upgrades that allow it to

### Fixed

- Errors and inconsistencies in base game tech cards
  - Advanced Defense Technology
    - Correctly adds the Advanced Torpedo Launcher to the player's unit list
- Hoarder Commander not being offered upgrades for techs it started with access to
- Hoarder Commander being offered tech cards for things it already had
- Minor clash in AI modifications between the Vehicle Factory upgrade and the Leveler upgrade
- Queller AI support for Single Laser Defense Tower upgrade
- Planetary Radar Upgrade Tech being offered before you have the Planetary Radar
- Radar upgrade correctly recognises that Defense Tech Commander no longer starts with Radar
- Queller Guardians won't build T1 units from T2 factories when encountering T1 factory upgrade tech
- Typo in Catapult upgrade description
- Queller enemies from wars prior to v5.6.0 doing nothing after spawning

## v5.6.0 - 2021-06-20

### Added

- Sub Commanders and The Guardians now support every tech and loadout the AI engine is able to

### Change

- Chance of being dealt Bot Anti-Air Tech is higher if you don't have other forms of mobile anti-air
- Updated AI Bugfixes and Enhancements to v2.7.0
- Defense Tech Commander no longer gives Radar to the commander
- Titans AI only builds anti-air when the enemy has air
- Titans AI will build the Hermes Space Probe on single planet systems
- Vehicle Factory Upgrade Tech uses a picture of vehicle factory

### Fixed

- Sub Commanders incorrectly being dealt if you used the Space Excavation Commander
- Orbital Fabrication Bot Upgrade Tech being dealt if you used the Space Excavation Commander
- Queller AI handling of Cluster Security
- Assault Commander allowing you to regain the units it removes
- Queller Sub Commanders for wars started prior to v5.3.0

## v5.5.3 - 2021-06-08

### Fixed

- Bug in tooltips preventing you moving to systems with a particular configuration

## v5.5.2 - 2021-06-08

### Fixed

- Issues with UI elements not correctly updating or displaying at all

## v5.5.1 - 2021-06-07

### Fixed

- Tooltips for planets with a water height but no water depth
- Leviathan Upgrade Tech not applying its changes

## v5.5.0 - 2021-06-04

### Change

- Bosses more closely aligned to the faction personality

## v5.4.1 - 2021-06-03

### Fixed

- Firefly Upgrade Tech not applying one of its effects
- Solar Array Upgrade Tech tied to a valid sound effect
- Solar Array Upgrade Tech causing the game to hang when entering battle against The Guardians

## v5.4.0 - 2021-06-02

### Change

- Inquisitor Nemicus focuses on naval and air forces
- Foundation's home system has been redesigned to increase the water presence
- The Cluster's home system's third planet is now a starting planet
- Increased the number of spawns in the Cluster home system

### Fixed

- Jig Upgrade Tech still being disabled
- Some bosses using suboptimal eco handling settings

## v5.3.2 - 2021-06-01

### Fixed

- General Commander data bank reduction not being applied

## v5.3.1 - 2021-06-01

### Fixed

- Queller AI not doing anything after spawning
- Removed unused files from Queller AI to reduce mod size

## v5.3.0 - 2021-05-30

### Added

- New "wipe" op that cards can be used to remove text from a string

### Change

- Buffed the following upgrade techs:
  - Commander
  - Energy Storage
  - Firefly
  - Metal Storage
  - Skitter
  - Spinner
  - Stryker
- When Queller AI is enabled Sub Commanders use the Q-Gold brain rather than Q-Uber
- Overhauled the threat ratings in the intelligence panel to smooth their progression
- Updated AI Bugfixes and Enhancements to v2.6.0
- Updated Queller AI to v5.14.0

### Fixed

- Pelican Upgrade Tech compatible with the Nomad Commander
- Possible fix for issues where JUMP and FIGHT would not appear

## v5.2.5 - 2021-05-29

### Change

- Orca Upgrade Tech only applies to the destroyer's surface weapon
- Kraken Upgrade Tech only applies to the advanced submarine's surface weapon

### Fixed

- Advanced Energy Plant Upgrade Tech description
- Ares Upgrade Tech not utilising its full range
- Jig Upgrade Tech not doing what it said it did
- Hoarder Commander wiping out its own inventory when returning to the galaxy map

## v5.2.4 - 2021-05-28

### Fixed

- Corrected tooltip for Firefly upgrade

## v5.2.3 - 2021-05-28

### Fixed

- Corrected tooltips for and about Planetary Radar

### Known Issues

- Queller AI from older version saves will no longer work

## v5.2.2 - 2021-05-25

### Fixed

- Removed attack command from Nomad Commander units that don't have an offensive weapon

## v5.2.1 - 2021-05-24

### Fixed

- Advanced Fabrication Bot Upgrade Tech having too high a chance of being drawn

## v5.2.0 - 2021-05-24

### Added

- Player army information to GWO panel

### Changed

- Reduced starting eco levels for Casual through Gold
- Improved how the GWO panel displays war options

### Fixed

- Rapid Commander not including the Colonel in its modifications
- Some Titans AI personalities sometimes not building a factory in low eco situations on specific map configurations
- Nomad Commander physics issues - this may have been a cause of crashes
- Nomad Commander unit transporting not functioning for all the units it was supposed to
- Mine Upgrade being offered before you had access to mines
- Rapid Commander orbital factories and fabber not having access to the correct set of units

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

- Removed use of lodash aliases to future-proof for move to v4

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
