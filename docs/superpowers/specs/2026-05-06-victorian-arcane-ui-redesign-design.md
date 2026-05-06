# Victorian Arcane UI Redesign

## Goal

Improve the player app and storyteller app visual direction so they no longer feel like generic AI-generated dark dashboards. The new direction should feel specific to Blood on the Clocktower: theatrical, tactile, ominous, and usable during live play.

## Chosen Direction

Use a **Belle Epoque / Victorian arcane punk** direction with **Prussian Blue** as the magical accent.

The interface should feel like a magic-assisted Victorian game apparatus:

- brass, dark wood, parchment, ink, blood red, and candlelit black as the main material palette
- Prussian blue for magical lenses, night information, active apparatus states, and subtle arcane circuitry
- curved Belle Epoque framing, double rules, seals, circular gauges, clockwork motifs, and ledger-like sections
- restrained magic: no neon cyan, no cyberpunk glow, no purple gradient fantasy panels

This should not become a modern SaaS dashboard, and it should not become ornamental fantasy wallpaper. The best reference is a practical storyteller tool built out of Victorian records, tokens, brass mechanisms, and controlled magical indicators.

## App Personality

### Player App

The player app should feel like a **private docket**.

The player mostly needs to understand:

- who they are
- what their role does
- what phase the game is in
- whether they can act now
- what information they have received

Primary player screens should use parchment/ledger sections instead of generic cards. The role card can become a formal role docket with a seal/gauge area, double-rule dividers, and a clear phase ledger. Actions should still be obvious and reachable, but the button styling should look like a physical control or stamped command rather than a default rounded rectangle.

### Storyteller App

The storyteller app should feel like a **grimoire apparatus**, with separate interaction models for desktop web and mobile/tablet.

The storyteller needs fast operational scanning:

- player positions and roles
- alive/dead state
- poisoned/drunk/protected/cursed markers
- current phase and subphase
- night order progress
- pending judgement/action requests
- nomination, vote, execution, and traveller flow

The grimoire should remain dense and functional. Tokens can carry more of the theme through double borders, brass rings, Prussian-blue magical state marks, and dead/desaturated treatment. Side panels should feel like ledgers or apparatus modules, but avoid deep nested card stacks.

#### Desktop Host Console

The PC/web version should become the primary **live-run control console** for storytellers who can use a larger screen, keyboard, and mouse.

Desktop should prioritize:

- higher information density without hiding critical state behind bottom sheets
- simultaneous visibility of the player circle, night/order queue, current phase controls, vote/execution state, logs, and pending role requests
- left/right auxiliary rails or docked panels instead of modal-heavy flows where practical
- keyboard shortcuts for common storyteller actions
- hover/focus affordances and tooltips for compact icon controls
- faster player lookup and targeting interactions

Recommended desktop layout:

- center: large grimoire/player circle with token status marks
- left rail: phase/subphase controls, day/night progression, edition/game summary
- right rail: night queue, pending actions, selected player details, role reminders
- bottom strip: vote/execution/traveller state and high-priority alerts
- collapsible log drawer: searchable event log and storyteller notes

Initial shortcut targets:

- `Space`: advance the active night queue item when safe
- `N`: open nomination controls
- `V`: open or focus vote controls
- `L`: toggle log drawer
- `W`: open whispers panel
- `F`: focus player search
- `Esc`: close active modal/drawer
- number keys: quick-select visible players when an action target picker is open

Shortcuts must never silently perform destructive actions such as killing, executing, exiling, or resetting. Those actions should still require an explicit confirmation or focused command.

#### Mobile And Tablet Host App

The mobile/tablet app should remain a **touch-first grimoire**.

Mobile/tablet should prioritize:

- readable tokens and reliable drag/tap interaction
- progressive disclosure for dense panels
- large touch targets for night actions, voting, and player status changes
- modal flows where they prevent accidental destructive actions
- minimal keyboard assumptions

The mobile/tablet version can share the same Belle Epoque / Victorian arcane visual language, but it should not try to show every desktop panel at once. The goal is a reliable hand-held storyteller tool, not a shrunken desktop console.

## Visual System

### Palette

Use these as implementation anchors, adjusted as needed for contrast:

- Base black: `#0d0703`
- Deep umber: `#1e1005`
- Dark parchment: `#362008`
- Brass: `#b78642`
- Aged gold text: `#e9bd70`
- Parchment text: `#f0d8b3`
- Muted parchment: `#c8ae86`
- Blood action: `#8d3529`
- Blood highlight: `#da7a50`
- Prussian blue: `#2f4f8f`
- Sapphire lens: `#88aaf5`
- Midnight ink: `#10182f`

Prussian blue should be an accent, not the dominant color. Use it for magical affordances, active night information, selected apparatus states, and status markers where it helps readability.

### Shape And Material

- Prefer thin borders, double borders, circular gauges, and ledger dividers over generic filled cards.
- Keep corner radii intentional: small radii for ledger/panel surfaces, circular controls only for seals, gauges, tokens, or icon-only controls.
- Reduce repeated `borderRadius: 12` card patterns.
- Avoid large gradient backgrounds. Gradients are acceptable inside brass, blood, or magical apparatus controls when subtle.
- Use texture through layered borders and fine divider lines, not heavy background noise that hurts readability.

### Typography

Use the current React Native font stack for the first implementation pass to avoid native font churn. Create the Victorian feeling through:

- stronger role titles
- small uppercase labels with wider letter spacing
- clear hierarchy between role, phase, status, and body copy
- restrained decorative treatment only on headings and labels

If a later pass adds custom fonts, it should be a separate task with cross-platform rendering verification.

### Motion

Motion should feel mechanical or ritual-like:

- role reveal: seal/gauge opening, subtle brass shimmer
- night transition: slow vignette and apparatus dimming
- execution: blood-red stamped verdict, not flashy explosion
- active night role: Prussian-blue lens pulse, not neon glow

Respect low-power/reduced-motion settings. Keep core workflows usable without animation.

## Component Scope

### Shared UI Tokens

Introduce or update shared tokens in `packages/ui/src/tokens.ts` for the new palette and semantic surfaces:

- base surfaces
- ledger surfaces
- brass borders
- blood actions
- Prussian-blue apparatus accents
- muted/dead text states

Avoid duplicating raw colors independently across player and storyteller style files when the colors represent shared concepts.

### Player App Targets

Primary areas:

- `apps/player/src/styles/game.styles.ts`
- `apps/player/src/components/RoleCard.styles.ts`
- `apps/player/src/components/PhaseContent.styles.ts`
- `apps/player/src/components/NightActionPrompt.styles.ts`
- `apps/player/src/components/VotePrompt.tsx`
- major overlays such as death, execution, night fall, role reveal, gunslinger, scapegoat

Expected changes:

- convert the main role card into a docket-like visual surface
- turn phase/status information into ledger rows instead of generic badges
- make primary actions look like stamped or mechanical controls
- align event overlays with ritual/mechanical styling
- keep all current role and game logic untouched

### Storyteller App Targets

Primary areas:

- `apps/storyteller/src/styles/grimoire.styles.ts`
- `apps/storyteller/src/hooks/useResponsive.ts`
- `apps/storyteller/src/components/PlayerToken.styles.ts`
- `apps/storyteller/src/components/NightActionLog.styles.ts`
- `apps/storyteller/src/components/NightFeedbackPanel.styles.ts`
- `apps/storyteller/src/components/NightOrderPanel.styles.ts`
- top/bottom bars, phase bars, vote panel, role hint bars, modals

Expected changes:

- make the grimoire board feel like an apparatus page rather than a flat dark canvas
- restyle player tokens with brass/double-ring treatment
- use Prussian-blue marks for active night/magical information
- restyle side panels as ledger modules with clear headings and compact data
- split storyteller layout behavior into desktop console and mobile/tablet grimoire modes
- introduce non-destructive desktop keyboard shortcuts and focus states
- preserve fast scanning, drag/tap behavior, and current mobile layout behavior

## Implementation Constraints

- Do not change role rules, socket events, or game-state behavior as part of the visual pass.
- Keep existing component boundaries where practical.
- Prefer shared tokens and focused style changes before large component rewrites.
- Avoid adding heavy dependencies unless a specific visual requirement cannot be met otherwise.
- Maintain readable contrast on mobile screens and tablets.
- Verify that Korean text fits in buttons, badges, player tokens, overlays, and modal titles.
- Preserve low-power mode behavior and do not introduce mandatory expensive effects.
- Desktop shortcuts must be discoverable through tooltips or a compact shortcut reference, and must not trigger destructive game actions without confirmation.
- Desktop and mobile storyteller layouts may diverge in composition, but should share the same game state, socket events, and visual token system.

## Testing And Verification

The implementation should include:

- `pnpm lint`
- `pnpm typecheck`
- targeted component/unit tests only if behavior changes
- manual or screenshot verification of key screens:
  - player game screen in day, night, dead, vote, and role reveal states
  - storyteller grimoire with 6-12 players, night panel open, vote panel open, status markers, traveller markers
  - storyteller desktop web console at wide viewport with side rails, bottom alert strip, log drawer, and shortcut focus states
  - storyteller mobile/tablet grimoire with the same game state to confirm layout divergence does not hide required controls
  - overlays for execution/death/night/role reveal

If visual-only changes do not alter behavior, existing tests should remain passing without broad test rewrites.

## Non-Goals

- No modern SaaS/dashboard redesign.
- No cyan/teal cyberpunk palette.
- No purple magic-gradient theme.
- No full rewrite of player or storyteller app navigation.
- No custom font integration in the first visual implementation pass.
- No gameplay or socket behavior changes.
- No destructive one-key shortcuts.
