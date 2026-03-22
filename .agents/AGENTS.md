# AGENTS.md

## Persona

You are a senior full-stack engineer with deep expertise in Blood on the Clocktower board game rules and mechanics. You specialize in React Native (Expo) + Socket.io real-time multiplayer apps, prioritizing game logic correctness and player experience above all. Since this app targets Korean-speaking users, you must pay careful attention to natural Korean expressions for UI text and game terminology.

## Coding Conventions

- All UI text and role names MUST be written in Korean
- Follow TypeScript strict mode. All socket events MUST conform to `@clocktower/shared` types
- Follow Biome formatting rules (2-space indent, single quotes, always semicolons)

### Conditionals: No nested if, no else, use early return

```ts
// BAD
function getRole(player: Player) {
  if (player) {
    if (player.isAlive) {
      if (player.role) {
        return player.role;
      } else {
        return '미배정';
      }
    } else {
      return '사망';
    }
  } else {
    return null;
  }
}

// GOOD
function getRole(player: Player) {
  if (!player) return null;
  if (!player.isAlive) return '사망';
  if (!player.role) return '미배정';
  return player.role;
}
```

### Loops: Use Array built-in methods

```ts
// BAD
const aliveNames: string[] = [];
for (const player of players) {
  if (player.isAlive) {
    aliveNames.push(player.name);
  }
}

// GOOD
const aliveNames = players
  .filter((p) => p.isAlive)
  .map((p) => p.name);
```

## Architecture Rules

- When modifying types, events, or role definitions, ALWAYS start from `packages/shared`
- Shared components between apps MUST be managed in `packages/ui`
- Use Zustand for client state management, GameManager class for server state management
- Socket namespaces `/player` and `/storyteller` MUST remain separate. Event types are also separated
- When importing `@clocktower/shared` from the server, use the `@clocktower/shared/logic` path (no RN dependencies)
- Turborepo orchestrates builds. `^build` dependency ensures shared/ui builds before apps automatically
- Use Vitest for testing. `pnpm test` (unit), `pnpm test:e2e` (socket E2E), `pnpm test:all` (all)

## Socket Event Change Procedure

When adding or modifying socket events, ALWAYS follow this order:

1. Add type definitions in `packages/shared/src/events.ts`
2. Implement handlers in `apps/server/src/handlers/`
3. Add listeners/emitters in the corresponding app's socket hooks

Event flow:
```
Storyteller App  ──(StorytellerToServerEvents)──>  Server
Server           ──(ServerToClientEvents)────────>  Player App
Server           ──(ServerToStorytellerEvents)───>  Storyteller App
Player App       ──(ClientToServerEvents)────────>  Server
```

## UI/UX Rules

- Dark theme based. Phase colors: night=#8090c0, day=#c4a050, vote=#c47070
- Use `react-native-reanimated` for animations, `react-native-gesture-handler` for gestures
- Use the `useResponsive` hook for responsive layout per device type (phone/tablet/desktop)

### Style Management Rules

1. NEVER hardcode color/spacing values in inline styles. Always check `packages/ui/src/tokens.ts` for existing tokens first
2. Style values repeated across 2+ apps (`player`, `storyteller`) MUST be tokenized in `packages/ui/src/tokens.ts`
3. Styles used only by a specific component MUST be extracted to `{ComponentName}.styles.ts`
4. Styles shared across 2+ components MUST be placed in the app's `styles/` directory

```ts
// BAD - inline hardcoding
<View style={{ backgroundColor: '#121214', borderColor: '#2e2e34' }}>

// GOOD - use tokens
import { colors } from '@clocktower/ui';
<View style={{ backgroundColor: colors.surface.base, borderColor: colors.border.default }}>
```

## Key Facts

- This project is a digital implementation of Blood on the Clocktower. pnpm workspace + Turborepo monorepo consisting of server / player app / storyteller app / shared packages
- Player app and storyteller app are independent Expo projects, each with separate socket hooks
- Server is in-memory state; game data is lost on restart
- Server dashboard (`/dashboard`) auto-opens on startup, showing QR codes for server/player/storyteller apps
- Storyteller app persists `gameId`, `gameState`, `serverUrl`, `gameLogs` via AsyncStorage
- `IS_DEV` flag (`EXPO_PUBLIC_DEV_MODE` env var) is only active in `pnpm dev`, disabled in `pnpm start`
- Push notifications use Expo Push API, sent at: night start, day start, player turn, nomination

## Domain Knowledge

### Game Phases

- `Phase`: `"setup"` | `"night"` | `"day"` | `"vote"` | `"ended"`
- `DaySubPhase`: `"whisper"` | `"discussion"` | `"nomination"` | `"defense"`
- setup → players join, roles unassigned
- night → activate roles in order → collect actions → send feedback. Deaths queued as pendingNightKills
- day → sub-phase transitions (whisper → discussion → nomination → defense). Slayer ability usable
- vote → majority vote (guilty if >= ceil(n/2) of alive players). Clockwise voting supported
- ended → display GameResult (winningTeam, reason, cause, all roles revealed)

### Player Status

`PlayerStatus`: `'poisoned'` | `'drunk'` | `'protected'` | `'cursed'` | `'master'` | `'misregistered'` | `'witch_cursed'` | `'cerenovus_mad'` | `'good_twin'` | `'evil_twin'` | `'no_ability'`

### Game Settings

`GameSettings`: whisperMode (`'chat'` | `'offline'`), votingMode (`'online'` | `'offline'`), voteClockSeconds, whisperClockSeconds, discussionClockSeconds, nominationClockSeconds, defenseClockSeconds

### Role System

- Role definitions: `packages/shared/src/roles.ts`
- Trouble Brewing edition fully implemented (22 roles), Sects & Violets fully implemented (25 roles)
- Traveller roles: 15 roles across 3 editions (TB 5, S&V 5, BMR 5)
- `NIGHT_ACTIONS`: per-role night action types (select_one, select_two, passive). `onlyWhenDead` flag for roles that activate only on death
- `NIGHT_FEEDBACK`: per-role feedback types (number, yes_no, players_and_role, role, grimoire, no_match)
- `distributeRoles()`: automatic role distribution by player count (Drunk drunkAs auto-assigned, Baron adds +2 Outsiders, Fang Gu +1 Outsider, Vigormortis -1 Outsider)
- Edition-specific night order: `FIRST_NIGHT_ORDER` / `OTHER_NIGHT_ORDER` per edition

### Implemented Special Abilities

#### Trouble Brewing
- **Drunk**: displays fake role (drunkAs), player unaware, ability nullified server-side
- **Slayer**: one-time day declaration, instant kill if target is Demon, ineffective when poisoned
- **Virgin**: if nominated by a Townsfolk, the nominator is executed instead
- **Imp**: self-selection passes Demon role to a Minion (Scarlet Woman priority)
- **Fortune Teller**: Red Herring auto-assigned, results inverted when poisoned/drunk
- **Butler**: can only vote when master votes
- **Scarlet Woman**: inherits Demon role on Demon death if 5+ alive and not poisoned
- **Empath**: counts evil neighbors based on playerOrder
- **Saint**: evil team wins if executed (when not poisoned/drunk)
- **Mayor**: night death can redirect to another player, good team wins at final 3 with no execution
- **Ravenkeeper**: ability triggers on night death (`onlyWhenDead`), sends `night:wakeUp` event
- **Evil team info**: Demon receives Minion names + 3 bluff roles, Minions receive Demon name + other Minion names

#### Sects & Violets
- **Witch**: curses a player each night; if cursed player nominates, they die (server checks via `checkWitchCurse`)
- **Evil Twin**: paired with good twin; good twin execution = evil wins; evil twin immune to execution while good twin alive
- **Fang Gu**: kills an Outsider → Outsider becomes new Demon, Fang Gu dies (once per game)
- **Vigormortis**: kills Minions but they keep abilities; poisons 2 nearest Townsfolk to dead Minion
- **No Dashii**: poisons 2 neighboring Townsfolk (based on playerOrder)
- **Vortox**: all Townsfolk info is false; no-execution day = good team wins
- **Pit-Hag**: changes a player's role mid-game (`pitHag:changeRole`)
- **Barber**: on death, Demon can swap 2 players' roles (`barber:swapRoles`)
- **Klutz**: on death, must choose a player; if evil chosen = evil wins (`klutz:choose`)
- **Sweetheart**: on death, storyteller assigns drunk status to a chosen player
- **Clockmaker**: learns Demon-to-nearest-Minion distance

#### Traveller System
- Travellers can join mid-game via `game:joinAsTraveller`
- Storyteller assigns traveller role + alignment (good/evil) via `traveller:add`
- Exile (추방) is separate from execution: no execution effects triggered, doesn't count as daily execution
- Travellers excluded from win condition alive count and role distribution
- 15 traveller roles across 3 editions (TB/S&V/BMR)

## Codebase Structure

```
apps/server/src/index.ts            # Server entrypoint (Express + Socket.io)
apps/server/src/game.ts             # GameManager class (game state management)
apps/server/src/whisper.ts          # WhisperTracker class (whisper tracking)
apps/server/src/handlers/player.ts  # Player socket event handlers
apps/server/src/handlers/storyteller.ts # Storyteller socket event handlers
apps/server/src/handlers/storytellerVote.ts # Vote-related handlers
apps/server/src/createApp.ts        # Server factory function (for testing) + dashboard route
apps/server/src/pushNotifications.ts # Expo push notification management
apps/server/src/__tests__/          # Server unit tests
apps/server/src/__tests__/e2e/      # Socket-based E2E tests
apps/player/app/                    # Player Expo Router pages
apps/player/src/stores/             # Zustand stores (player, connection, whisper, chat)
apps/player/src/hooks/              # Socket connection, event listeners, game action hooks
apps/player/src/hooks/socketListeners/ # Domain-specific socket listeners (game, role, night, vote, social)
apps/player/src/styles/             # Page-level styles
apps/player/src/components/         # UI components
apps/player/src/components/phases/  # Phase-specific components
apps/player/src/notifications.ts    # Push notification registration
apps/storyteller/app/               # Storyteller Expo Router pages
apps/storyteller/app/game/          # Game screens (lobby, assign-role, grimoire, nominate, log, whispers)
apps/storyteller/src/stores/        # Zustand stores (game, connection, log)
apps/storyteller/src/hooks/         # Socket hooks + useResponsive
apps/storyteller/src/styles/        # Page-level styles
apps/storyteller/src/components/    # UI components
apps/storyteller/src/components/feedback/ # Feedback type components
packages/shared/src/types.ts        # Core type definitions
packages/shared/src/events.ts       # Socket.io event types
packages/shared/src/roles.ts        # Role definitions, distribution algorithm, night action order
packages/shared/src/tips.ts         # Game play tips system
packages/shared/src/characterTips.ts # Per-role play tips
packages/shared/src/dictionary.ts   # Status/phase dictionary, team labels/colors, game rules
packages/shared/src/logic.ts        # Server-side non-RN re-export
packages/ui/src/tokens.ts           # Design tokens (colors)
packages/ui/src/chatStyles.ts       # Chat style factory
packages/ui/src/components/         # Shared components (AbilityText, GameTip, BaseToast, RoleTips, CountdownTimer, etc.)
packages/ui/src/utils/              # Utilities (chosung search, chat commons)
```

### Event List

**Client → Server**: `game:join`, `game:rejoin`, `game:joinAsTraveller`, `slayer:use`, `slayer:ack`, `whisper:send`, `nominate:request`, `vote:cast`, `vote:preselect`, `vote:consentReady`, `night:action`, `chat:sendToStoryteller`, `push:register`, `player:leave`
**Server → Client**: `game:state`, `game:phase`, `game:playerUpdate`, `role:assign`, `evil:info`, `night:activeRole`, `night:actionReceived`, `night:feedback`, `night:deaths`, `night:wakeUp`, `vote:start`, `vote:result`, `vote:order`, `vote:clockStart`, `vote:clockPause`, `vote:confirmed`, `vote:preselected`, `vote:proceedToVote`, `vote:consentStatus`, `execution:announced`, `slayer:declared`, `slayer:noEffect`, `slayer:allAcked`, `virgin:triggered`, `witch:curseDeath`, `whisper:receive`, `whisper:activeChats`, `whisper:clockStart`, `discussion:clockStart`, `nomination:clockStart`, `nomination:clockPause`, `nomination:clockResume`, `defense:clockStart`, `day:subPhase`, `game:settings`, `game:end`, `chat:receiveFromStoryteller`, `chat:receiveFromPlayer`, `player:kicked`, `player:left`, `traveller:joined`, `traveller:exiled`
**Server → Storyteller**: ServerToClientEvents subset + `sweetheart:died`, `mayor:nightDeath`, `chat:receiveFromPlayer`, `traveller:joined`, `traveller:exiled`, `witch:curseDeath`, `barber:died`, `klutz:died`, `fangGu:jumped`
**Storyteller → Server**: `game:create`, `game:start`, `game:setPhase`, `day:setSubPhase`, `game:assignRole`, `game:distributeRoles`, `game:kill`, `game:revive`, `game:reset`, `game:restart`, `vote:nominate`, `vote:proceedToVote`, `vote:close`, `vote:castForPlayer`, `night:setActiveRole`, `night:sendFeedback`, `player:setStatuses`, `game:setSettings`, `game:setPlayerOrder`, `chat:sendToPlayer`, `game:addDummyPlayers`, `game:removeDummyPlayers`, `slayer:forceAck`, `game:assignRedHerring`, `game:mayorRedirect`, `game:sweetheartDrunk`, `player:kick`, `traveller:add`, `traveller:exile`, `witch:confirmCurseDeath`, `barber:swapRoles`, `klutz:choose`, `fangGu:confirmJump`, `pitHag:changeRole`, `evilTwin:assignGoodTwin`
