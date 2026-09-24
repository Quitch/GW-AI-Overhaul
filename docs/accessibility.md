# Accessibility

This page records GWO's audit against WCAG 2.2 at Level AAA, and the rules that
keep new markup in line with it.

## Scope

The audit covers only the markup GWO owns: the files under
`ui/mods/com.pa.quitch.gwaioverhaul/`, including the stock panels GWO replaces
outright (`#hover-card`, `#system-card`, the tech-card options bar, and the
planet list). Stock UI around it is out of scope, even where GWO's controls use
stock classes.

Two groups of criteria are out of scope, because the engine cannot support them:

- **Keyboard operation and focus.** Coherent UI (Chrome 40) never moves focus
  on Tab, not even between two plain `<input>` elements. Other default key
  actions work, so this was measured, not assumed. Without Tab navigation,
  nothing can reach GWO's controls from the keyboard, and focus indicators and
  focus order have nothing to act on. A mod could implement Tab navigation
  itself, but that would make GWO's scenes behave unlike every other scene in the
  game.
- **Programmatic semantics.** Coherent UI exposes no accessibility tree, so no
  screen reader can read PA. ARIA roles, accessible names, `alt` text, and
  status messages would reach no one.

## Rules for new markup

- **A tooltip trigger carries `gwo-tip`.** `shared/tooltips.js` then lets
  Escape dismiss the tooltip (1.4.13), and keeps it open while the pointer is
  over it. Bootstrap 3 would otherwise hide it as the pointer leaves the
  trigger, and stock sets `pointer-events: none` on every tooltip.
  `shared/tooltips.css` gives the tooltip a line height of 1.5 (1.4.8), lets a
  showing tooltip take the pointer, and gives an `info_tip` "?" a 24px target
  (2.5.8). A tooltip that would cover neighbouring targets the player sweeps
  across, as the planet icons' do, is left out of the pointer rule.
- **Text contrast is 7:1** against the worst background it can sit on (1.4.6).
  Where a panel is translucent, work out that worst case with a white galaxy
  behind it. That is why the war information panel is 95% opaque and its
  warnings are `#f99`.
- **A control's outline is 3:1** against its background (1.4.11).
- **A click target is 44 × 44px** (2.5.5). To reach that without changing a
  stock-styled control's look, give it a transparent `::before` hit area, and
  check that the area does not overlap the next target. Stock's switch rows sit
  on a 44px pitch, so a switch can grow 7px up and down and no further. Stock
  sets `box-sizing: border-box` globally, so padding added to reach 44px needs
  `content-box`.
- **An action that cannot be undone asks first** (3.3.6). Delete Tech changes
  to "Delete this Tech?" on the first press, and deletes on the second.

## Results

Status values:

- **Pass**: meets the criterion as shipped.
- **Fixed**: met after this audit.
- **N/A**: GWO has no content of that kind.
- **Engine**: out of scope for the engine reasons above.
- **Gap**: a known failure, with the reason it remains.

### Perceivable

| SC     | Level | Status | Notes                                                                                                                                                                                                                                                            |
| ------ | ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1  | A     | Engine | Text alternatives. No accessibility tree.                                                                                                                                                                                                                        |
| 1.2.x  | A–AAA | N/A    | GWO has no audio or video content.                                                                                                                                                                                                                               |
| 1.3.1  | A     | Engine | Info and relationships.                                                                                                                                                                                                                                          |
| 1.3.2  | A     | Engine | Meaningful sequence.                                                                                                                                                                                                                                             |
| 1.3.3  | A     | Pass   | No instruction depends on shape, position, or sound.                                                                                                                                                                                                             |
| 1.3.4  | AA    | N/A    | Desktop only.                                                                                                                                                                                                                                                    |
| 1.3.5  | AA    | Engine | No fields collect personal data, and the purpose would not be exposed anyway.                                                                                                                                                                                    |
| 1.3.6  | AAA   | Engine | Identify purpose.                                                                                                                                                                                                                                                |
| 1.4.1  | A     | Pass   | Red warnings are headed "Incompatible Mods" or "Missing Races"; the selected Commander tile has a white border and a glow, not only a colour change.                                                                                                             |
| 1.4.2  | A     | N/A    | Only short UI sounds.                                                                                                                                                                                                                                            |
| 1.4.3  | AA    | Fixed  | See 1.4.6.                                                                                                                                                                                                                                                       |
| 1.4.4  | AA    | Engine | The engine has no browser zoom, and GWO's panels are laid out at the game's fixed UI scale.                                                                                                                                                                      |
| 1.4.5  | AA    | Pass   | No images of text.                                                                                                                                                                                                                                               |
| 1.4.6  | AAA   | Fixed  | War panel warnings `red` → `#f99` and panel 90% → 95% opaque (worst case 7.7:1); war-generation error `#f36a6a` → `#f99`; launch-progress steps white at 0.55 → 0.8 alpha (worst case 9.9:1). Other GWO text was already 7:1 or better.                          |
| 1.4.7  | AAA   | N/A    | No speech audio.                                                                                                                                                                                                                                                 |
| 1.4.8  | AAA   | Gap    | Fixed: GWO tooltips now use a line height of 1.5, and every text block is under 80 characters wide and left-aligned. Gap: the player cannot choose text and background colours, and text cannot be resized to 200%. The game has no mechanism for either.        |
| 1.4.9  | AAA   | Pass   | No images of text.                                                                                                                                                                                                                                               |
| 1.4.10 | AA    | Engine | Reflow needs zoom, which the engine lacks.                                                                                                                                                                                                                       |
| 1.4.11 | AA    | Fixed  | The Commander tile and AI-table dropdown outlines were 2.8:1; raised to 3.5:1. The option-row dividers are decorative.                                                                                                                                           |
| 1.4.12 | AA    | Engine | The player cannot apply their own text spacing.                                                                                                                                                                                                                  |
| 1.4.13 | AA    | Gap    | Fixed: GWO tooltips stay open while hovered, and Escape dismisses them (`shared/tooltips.js`). Gap: planet-icon tooltips do not stay open under the pointer, because each covers the next planets in its row and would stop a sweep along the row reaching them. |

### Operable

| SC     | Level | Status | Notes                                                                                                                                                                                                                                                                                         |
| ------ | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1  | A     | Engine | No Tab focus navigation (see Scope).                                                                                                                                                                                                                                                          |
| 2.1.2  | A     | Engine | As 2.1.1.                                                                                                                                                                                                                                                                                     |
| 2.1.3  | AAA   | Engine | As 2.1.1.                                                                                                                                                                                                                                                                                     |
| 2.1.4  | A     | Pass   | GWO adds no single-key shortcuts. Escape only acts while a GWO tooltip is showing.                                                                                                                                                                                                            |
| 2.2.1  | A     | Pass   | No time limits. The co-op ping cooldown limits pings, not the player.                                                                                                                                                                                                                         |
| 2.2.2  | A     | Pass   | The only moving content is the loading spinner, shown while a battle launches.                                                                                                                                                                                                                |
| 2.2.3  | AAA   | Pass   | No timing.                                                                                                                                                                                                                                                                                    |
| 2.2.4  | AAA   | Pass   | Co-op pings mark the map and do not interrupt.                                                                                                                                                                                                                                                |
| 2.2.5  | AAA   | N/A    | No authentication.                                                                                                                                                                                                                                                                            |
| 2.2.6  | AAA   | N/A    | No data is lost to inactivity.                                                                                                                                                                                                                                                                |
| 2.3.1  | A     | Pass   | Nothing flashes.                                                                                                                                                                                                                                                                              |
| 2.3.2  | AAA   | Pass   | Nothing flashes.                                                                                                                                                                                                                                                                              |
| 2.3.3  | AAA   | Pass   | The only animation is a 0.2s opacity fade on the launch overlay, which is not motion.                                                                                                                                                                                                         |
| 2.4.1  | A     | Engine | Bypass blocks is a keyboard criterion.                                                                                                                                                                                                                                                        |
| 2.4.2  | A     | N/A    | A scene is not a page with a title the player can see.                                                                                                                                                                                                                                        |
| 2.4.3  | A     | Engine | Focus order.                                                                                                                                                                                                                                                                                  |
| 2.4.4  | A     | N/A    | No links.                                                                                                                                                                                                                                                                                     |
| 2.4.5  | AA    | N/A    | Not a set of web pages.                                                                                                                                                                                                                                                                       |
| 2.4.6  | AA    | Pass   | Headings and labels describe their content.                                                                                                                                                                                                                                                   |
| 2.4.7  | AA    | Engine | Focus visible.                                                                                                                                                                                                                                                                                |
| 2.4.8  | AAA   | N/A    | Not a set of web pages.                                                                                                                                                                                                                                                                       |
| 2.4.9  | AAA   | N/A    | No links.                                                                                                                                                                                                                                                                                     |
| 2.4.10 | AAA   | Pass   | Panels and modals are divided under headings.                                                                                                                                                                                                                                                 |
| 2.4.11 | AA    | Engine | Focus not obscured.                                                                                                                                                                                                                                                                           |
| 2.4.12 | AAA   | Engine | As 2.4.11.                                                                                                                                                                                                                                                                                    |
| 2.4.13 | AAA   | Engine | Focus appearance.                                                                                                                                                                                                                                                                             |
| 2.5.1  | A     | Pass   | Single clicks only.                                                                                                                                                                                                                                                                           |
| 2.5.2  | A     | Pass   | Knockout `click` fires on release.                                                                                                                                                                                                                                                            |
| 2.5.3  | A     | Engine | Label in name.                                                                                                                                                                                                                                                                                |
| 2.5.4  | A     | N/A    | No motion input.                                                                                                                                                                                                                                                                              |
| 2.5.5  | AAA   | Gap    | Fixed at 44px: the configure buttons, modal close buttons, switches, AI dropdowns, hover-card close, Reroll and Dismiss Tech, the favourite star, and the planet icons. Gap: the "?" tips reach 24px (2.5.8) but not 44px, because a larger area would cover the control directly below them. |
| 2.5.6  | AAA   | Pass   | Any pointer works.                                                                                                                                                                                                                                                                            |
| 2.5.7  | AA    | Pass   | No dragging.                                                                                                                                                                                                                                                                                  |
| 2.5.8  | AA    | Fixed  | The 15px "?" tips were 2px from the control below; they now have a 24px target that grows up and sideways.                                                                                                                                                                                    |

### Understandable

| SC    | Level | Status | Notes                                                                                              |
| ----- | ----- | ------ | -------------------------------------------------------------------------------------------------- |
| 3.1.1 | A     | Engine | Language of page.                                                                                  |
| 3.1.2 | A     | Engine | Language of parts.                                                                                 |
| 3.1.3 | AAA   | Pass   | Game terms are explained in the tooltips beside them.                                              |
| 3.1.4 | AAA   | Pass   | Abbreviations (FFA, AI) are explained in the tooltips beside them.                                 |
| 3.1.5 | AAA   | Pass   | Labels and tooltips are short, plain sentences.                                                    |
| 3.1.6 | AAA   | N/A    | No words whose meaning depends on pronunciation.                                                   |
| 3.2.1 | A     | Engine | On focus.                                                                                          |
| 3.2.2 | A     | Pass   | Changing a setting never navigates. The Apply button commits a modal's settings.                   |
| 3.2.3 | AA    | Pass   | GWO's controls sit in the same place in every war.                                                 |
| 3.2.4 | AA    | Pass   | The same function has the same label everywhere.                                                   |
| 3.2.5 | AAA   | Pass   | Changes of context happen only on request.                                                         |
| 3.2.6 | A     | N/A    | No help mechanism repeated across pages.                                                           |
| 3.3.1 | A     | Pass   | War generation failure is described in text above Go To War.                                       |
| 3.3.2 | A     | Pass   | Every setting has a visible label.                                                                 |
| 3.3.3 | AA    | Pass   | The generation error says what to do.                                                              |
| 3.3.4 | AA    | Pass   | See 3.3.6.                                                                                         |
| 3.3.5 | AAA   | Pass   | Every setting has a "?" tooltip.                                                                   |
| 3.3.6 | AAA   | Fixed  | Delete Tech now asks for a second press. The modals already let the player close without applying. |
| 3.3.7 | A     | N/A    | Nothing is entered twice.                                                                          |
| 3.3.8 | AA    | N/A    | No authentication.                                                                                 |
| 3.3.9 | AAA   | N/A    | No authentication.                                                                                 |

### Robust

| SC    | Level | Status | Notes              |
| ----- | ----- | ------ | ------------------ |
| 4.1.2 | A     | Engine | Name, role, value. |
| 4.1.3 | AA    | Engine | Status messages.   |
