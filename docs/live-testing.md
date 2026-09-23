# Live testing

No test here starts PA ([testing.md](testing.md), "What tests cannot cover").
This page is how to check a change in a running game: how to launch a client you
can script, what the logs prove, and the calls that reach each part of a war
without playing it by hand.

Everything below was done on the shipping Coherent UI build. Paths under
`%LOCALAPPDATA%` are `%LOCALAPPDATA%\Uber Entertainment\Planetary Annihilation\`.

## A test client

Launch `bin_x64\PA.exe` directly with:

| Flag                       | Why                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `--coherent_port=<port>`   | Opens the UI debugger on that port. This is how you run JavaScript in a scene.            |
| `--devmode`                | Shows the `gw_play` cheat panel, and lets `live_game` grant vision. One word, no hyphen.  |
| `--localstorageurl=<name>` | Picks the profile folder. Use one that is not your own, so a test cannot damage your war. |
| `--ai-log`                 | Makes the server log what each AI army loads and which orders it was refused.             |

A bad flag exits before a log file is written. `PA.exe --help` lists them all.

**A profile has its own mod list.** Mod files are shared, but which mods are
enabled is stored per profile. A new profile is therefore a stock game until
you enable this mod on it, and it plays the Galactic War intro video. Only one
client can use a profile at a time.

**Check which GWO is mounted.** The repo is the folder mod
`com.pa.quitch.gwaioverhaul-dev`. The release zip is
`com.pa.quitch.gwaioverhaul`. A profile can have both enabled, and then the
release code can be what runs. Read `api.mods.getMounted("client", true)`
before you trust a result. A test mod whose `dependencies` names the release
identifier enables the release zip as a side effect.

**What needs a restart.** PA reads a mod's files from disk on every scene load,
so an edit to an existing file needs only
`api.game.debug.reloadScene(api.Panel.pageId)`. PA lists each mod's files once,
at launch. A new file, a deleted file, and a `modinfo.json` change all need a
client restart. This matters when you `git checkout` between two branches under
a running client: an A/B that only edits files is valid, and one that adds a
file is not.

**Use the Coherent debugger protocol, not a modern browser's DevTools.** Pointing
current Chrome or Edge DevTools at the port has killed the Coherent host
process. `Page.captureScreenshot` is not supported, so check visuals by eye.
Engine `api.*` calls return a promise, and the debugger's evaluate does not
wait: store the result on `window` and read it in a second call. A throw inside
a jQuery `.then` callback is swallowed, so a probe that reads a resolved value
wrongly looks the same as a promise that never settles. Put a `try`/`catch` in
the probe before you conclude that something hangs.

## The logs

- Client: `%LOCALAPPDATA%\log\PA-<timestamp>.txt`. All scene console output,
  tagged `[JS/<scene>]`. Two clients write to the same folder, so pick the file
  by launch time.
- Server: `%LOCALAPPDATA%\server-<timestamp>.txt`. One per battle or co-op
  session.

Lines to ignore: `:1: Uncaught TypeError: undefined is not a function` on every
scene load, and `Failed loading coui://download/community-mods-<scene>.js with
404`. Both are stock.

Lines that mean something:

- `War created successfully using Galactic War Overhaul v<x>` is not the end of
  war creation. The navigation to `gw_play` is. A registered loadout id with no
  card file logs `Script error for: cards/<id>` and leaves the client on
  `gw_start` for ever.
- `battle preparation failed: <stack>` is a throw inside a referee. Fight is
  re-enabled afterwards ([architecture.md](architecture.md)).
  `model.gwoLaunchProgress` holds the stage the launch reached.
- With `--ai-log`, the server log has `Army: <name> - Loading unit map <path>`
  for every map each army loaded. Without the flag the server prints
  `The AI has ancountered an error. Please enable AI logging` instead, which
  is not a failure.
- An order that succeeds is silent. `FactoryManager: Attempted to order a
factory [<spec>] to build [...]` and the `FabberManager` equivalent are
  refusals, and they prove that the named factory or fabber exists.
  `Creating a new base` every second with `No presence on planet` means that
  the AI has nothing it can build.
- The first `recvCmd msg` line in the server log is the referee payload. Parse
  it to see the build lists each `ai_path` received.

AI armies start to act about two minutes into the landing phase, and the server
lands a human who has not chosen a site at the same time. A battle that nobody
plays still produces this evidence.

## Driving a war

**Create one.** In `gw_start`, set the stock observables (`newGameSeed`,
`newGameName`, `newGameSizeIndex`, `newGameCoopPlayers`,
`newGamePerPlayerTechCards`) and the fields of `model.gwoDifficultySettings`,
then call `model.navToNewGame()`. GWO generates the galaxy on that call and
retries a spawn shortage, so wait for the `gw_play` scene and not for a return
value. A generation that gives up sets `model.gwoWarGenerationError()`. The new war becomes the profile's `gw_active_game`. That
`localStorage` value is a JSON string: a bare number makes `gw_play` log
`failed to load game` and exit.

**Move about.** `model.cheats` exists with or without `--devmode`; the flag
only shows the buttons. `noFog(true)` lets you select and move to stars you
cannot reach. `jump(model, starIndex)` takes an index, not a star. Under GWO
the stock Explore button is hidden, so deal with `model.explore()` after
`model.selection.star(model.game().currentStar())`. `model.win(i)` takes card
`i`. `turnState` is on `model.game()`, not on `model`. `model.move()` reloads
the scene, so anything you put on `window` is gone afterwards.

**Give a card.** `model.cheats.giveCardId("<id>"); model.cheats.giveCard();`.
`giveCard` takes no argument. A Sub Commander test needs a factory card first:
`gwc_minion` is only dealt to an inventory that holds a basic land factory.

**Resolve a battle without playing it.** The `Cheat` button calls
`fight(model, event, true)`, and then `model.win(-1)` or `model.lose()` ends
it. Poll `model.fighting()` between the two. Winning every AI star ends the
war, because a boss is one of them.

**Start a real battle with `model.fight(model, null, false)`.** Never
`model.fight()`. Stock declares `fight(model, event, cheat)`, and that first
parameter hides the global `model` for the whole function. With no argument, a
line after `battleConfig` is set throws inside a jQuery callback, which
swallows it. Both referees finish, `launchingFight` stays true, nothing is
logged, and the battle never starts. The Fight button passes the model, so no
player can reach this.

**Leave a battle** with `model.abandon()` and then `model.navToGalacticWar()`.
`model.exitGame()` closes PA. A surrendered solo battle is a loss, and it moves
`currentStar` back to the previous star.

**Fake a win.** Nothing in `live_game` can win a Galactic War battle, because
the server ignores the control cheats unless the game is a sandbox. Surrender,
wait for the loss to save, then rewrite the save before you return:

```js
requireGW(["shared/gw_common"], function (GW) {
  var id = ko.observable().extend({ local: "gw_active_game" })();
  GW.manifest.loadGame(id).then(function (game) {
    game.lastBattleResult("win");
    GW.manifest.saveGame(game);
  });
});
```

**See the units on the field.** Launch with `--devmode`. When the commander has
landed, run this in the `live_game_devmode.html` panel:

```js
var flags = [true, true, true]; // one per army
model.send_message("change_vision_flags", { vision_flags: flags });
api.Panel.message(api.Panel.parentId, "panel.invoke", [
  "playerVisionFlags",
  flags,
]);
```

Then, in `live_game/live_game.html`,
`api.getWorldView(0).getArmyUnits(armyIndex, planetIndex)` resolves to the unit
ids by spec. The army is an index from 0, not an id. Use the spawn planet. The
call returns nothing before the human has landed. A battle opens about twenty
panels, so match the debugger target on `live_game/live_game.html` and not on
`live_game`.

## The referees without a battle

Hire the real referee from the `gw_play` console and read what it would send:

```js
requireGW(["pages/gw_play/gw_referee"], function (GWReferee) {
  GWReferee.hire(model.game()).then(
    function (referee) {
      window.__referee = referee; // referee.files(), referee.config()
    },
    function (error) {
      window.__referee = "REJECTED " + error;
    }
  );
});
```

Set `model.game().currentStar(n)` first to choose the star, and put it back
afterwards. A wrapper object round the game does not work, because
`shared/ai.js` reads `model.game()` itself. A star with no AI makes the hire
reject. A hire takes 10 to 60 seconds with race mods active, and it unmounts
memory files, so reload the scene between hires.

The co-op chain needs stock's referee between the two, or the per-player
referee rejects with a player and army mismatch:
`GWReferee.hire(game)`, then `gw_coop_referee.apply(referee, options)`, then
`gw_per_player_tech_referee.apply(referee, options)`, with `options` as
`{ active: true, sharedControl: false, perPlayerTechCards: true,
connectedClients: _.cloneDeep(model.gwCampaignConnectedClients()) }`.

To exercise a failure path, stub only the call under test. A blanket stub of a
shared module fails the host's own hire first, because it runs first.

For the army configuration alone, `gw_play/referee_config.js` returns a factory
that writes to `self.config`. Call it with a fake `self` that has `game`,
`files`, `config`, and `biomeServed`.

## Co-op with two clients

Use two profiles on two ports. Finish every mod change, and every restart, on
both profiles before the session starts. All profiles share
`download/community-mods-client.zip`, which holds the scene mod list, so
applying mods on one client rewrites what the other loads at its next scene.

1. Host, in `gw_play`: `model.openToCoop()`, then `model.addGwCampaignSlot()`
   if the war was made for one player. An empty slot blocks Fight, Explore, and
   Move for the host.
2. Viewer, in `start`: `model.navToServerBrowser()`. In `server_browser`, take
   the row whose `region` is `"Local"`, which can take ten seconds to appear,
   then `model.currentSelectedGame(row); model.tryToJoinGame()`. Do not match
   on the name: other people's public games are in the same list.
3. Under per-player tech the viewer lands in `gw_coop_per_player_loadout`:
   `model.activeStartCardIndex(i); model.submitLoadout()`. Pick a stock id. A
   card the viewer's profile lacks rejects the submit, and nothing on screen
   says so.

A profile that never signed in has no `uberId`, and per-player tech then never
resolves the viewer's record. Give it an identity in `start`, before it joins:

```js
ko.observable().extend({ session: "uberId" })("9000000000000001");
ko.observable().extend({ session: "displayName" })("viewer");
```

The identity lasts for the process. Going back through `start` clears
`displayName`. A viewer sees the loadout scene once per identity, so use a new
id to test that scene again. `model.buildStartingInventory(id, commander,
galaxy, star)` builds a loadout without submitting it, which tests many ids in
one visit.

Only the host can change the war. `model.cheats.jump` is not sent to viewers,
and a viewer's copy of the war is then out of step. A viewer answers a loadout
offer with `model.win(i)`. `submitCoopTechCardChoice` goes round GWO's
interception of that offer. A viewer leaves through the menu:
`model.leaveCoopSession()` called directly leaves a ghost client on the host.

With GW Server Mods active, `model.fight` returns before `launchingFight` turns
true, because the stock launch waits on the mount.

## Proving that a change alters nothing

For a refactor, generate the same war on both sides and compare:

1. `git checkout` the base, create a war with a fixed `newGameSeed`, and keep
   `JSON.stringify(model.game().save())`.
2. `git checkout` the branch, reload the scene, and create the same war.
3. Diff the two. Only the player's own commander differs; stock picks it
   without the seed.

Card gives compare the same way through `model.cheats.giveCard` and
`inventory.mods()`. Do not use `gwc_minion` for this, because its cheat path
draws with `_.sample`.

A repeated deal at one star differs unless you reset what it reads: clear
`star.cardList([])`, set `model.gwoRerollsUsed(0)` and
`game.turnState("begin")`, and restore the inventory from an
`inventory.save()` snapshot. Then call `model.explore(true)`.

With Shared Systems for Galactic War enabled, GWO's own system generation does
not run, so a change to it tests as no change.
