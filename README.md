# David's Arcade

A retro, top-down pixel-art RPG that doubles as **David Vilela's game
development portfolio**. Visitors explore an after-hours arcade:

- a Lobby,
- a Boss Room split into **Godot**, **Unreal** and **Unity** wings, each with
  its own project exhibits,
- a Dev Bedroom (About),
- a Workshop (Skills, Contact, CV),
- and a hidden back channel for those who look closely.

![The Boss Room: Unreal wing in the centre, Godot and Unity wings at the sides](docs/screenshots/boss-room.png)

|                                              |                                            |
| -------------------------------------------- | ------------------------------------------ |
| ![Title screen](docs/screenshots/title.png)  | ![The Lobby](docs/screenshots/lobby.png)   |
| ![Dev Bedroom](docs/screenshots/bedroom.png) | ![Workshop](docs/screenshots/workshop.png) |

> **Status:** fully playable. The three projects are clearly labelled
> **samples**, and contact links and the CV are **not configured yet** — see
> [Before you publish](#before-you-publish).

---

## Contents

1. [Features](#features)
2. [Quick start](#quick-start)
3. [Scripts](#scripts)
4. [Architecture](#architecture)
5. [Folder structure](#folder-structure)
6. [Adding, updating and removing projects](#adding-updating-and-removing-projects)
7. [Personal details, contact links and CV](#personal-details-contact-links-and-cv)
8. [Customising the world](#customising-the-world)
9. [Easter eggs](#easter-eggs)
10. [Changing controls](#changing-controls)
11. [Customising the UI](#customising-the-ui)
12. [Art and audio pipeline](#art-and-audio-pipeline)
13. [Accessibility, performance and browser support](#accessibility-performance-and-browser-support)
14. [Testing and quality gates](#testing-and-quality-gates)
15. [Deploying: Git, GitHub and Vercel](#deploying-git-github-and-vercel)
16. [Before you publish](#before-you-publish)
17. [Troubleshooting](#troubleshooting)
18. [Licensing and attribution](#licensing-and-attribution)

---

## Features

- **A real little game, not a web page with a sprite.**
  - Smooth acceleration, collision against walls and furniture, and 4-way
    animated walking, idle and interact poses.
  - Y-sorted depth.
  - Area banners, fade transitions, flickering cabinets, candles and
    oscilloscopes.
  - Corner correction, so doorways never snag.
- **Original pixel art and chiptune audio**, generated reproducibly by
  scripts in this repo. Nothing is downloaded or copied.
- **Data-driven content.** Projects, panels, easter eggs and the map itself
  are typed data. Adding a project means editing one file.
- **Accessible portfolio UI.**
  - Every description is a semantic HTML `<dialog>` with focus management,
    Escape/backdrop/Close to dismiss, and focus restoration.
  - A **“Browse exhibits as a list”** mode skips the walking entirely.
- **Desktop and mobile.** Keyboard controls, plus an on-screen 8-way D-pad and
  an A button on touch devices.
- **Crisp integer scaling** at any window size. The view never stretches
  pixels or shows the void beyond the map.
- **Sound that behaves.** Nothing plays before the first click or key press.
  Sound and music have separate toggles, remembered between visits.
- **14 secrets**, mostly tributes to David's favourite games, rendered in
  original art. The big one is hidden under the Workshop.
- **Production-minded.**
  - Strict TypeScript and ESLint's strict type-checked rules.
  - 63 unit tests, including a physical reachability check proving every
    exhibit and secret can be reached.
  - Strict Content-Security-Policy, no runtime network requests, works offline.

## Quick start

**Prerequisites:** Node.js **22.12 or newer** (22 LTS recommended; see
`.nvmrc`) and npm 10+. Git is optional until you deploy.

```bash
# from the project folder
npm ci            # install exact locked dependencies
npm run dev       # start the dev server, then open http://localhost:5173
```

If you use nvm: `nvm install && nvm use` picks up `.nvmrc`.

Controls: **WASD / arrow keys** to move, **E / Space / Enter** to interact,
**Esc** for the menu, **H** to return to the Lobby, **M** to mute. On touch
devices, use the D-pad and the **A** button.

## Scripts

| Command                           | What it does                                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server with hot reload (development build: content warnings in the console, unconfigured links shown as hints) |
| `npm run build`                   | Type-checks, then builds the production site into `dist/`                                                               |
| `npm run preview`                 | Serves `dist/` locally **with the same security headers as Vercel**                                                     |
| `npm run typecheck`               | `tsc` in strict mode for app code and for tests/config                                                                  |
| `npm run lint` / `lint:fix`       | ESLint (`typescript-eslint` strict and stylistic, type-checked)                                                         |
| `npm run format` / `format:check` | Prettier                                                                                                                |
| `npm test` / `test:watch`         | Vitest unit tests                                                                                                       |
| `npm run assets`                  | Regenerates all art and audio in `public/game/`                                                                         |
| `npm run check`                   | Everything above in sequence — run before every commit or deploy                                                        |

## Architecture

```
            ┌──────────────── main.ts ────────────────┐
            │ creates shared services and injects them │
            └──────┬───────────────┬──────────────┬────┘
                   │               │              │
          GameplayLock     SettingsStore     GameEventBus (typed)
                   │               │              │
   ┌───────────────┴──── Phaser ───┴──┐   ┌───────┴──────── DOM UI ─────────┐
   │ BootScene  → loads assets        │   │ UiController                     │
   │ MainScene  → orchestrates:       │◄─►│  Modal (<dialog>) + renderers    │
   │   WorldGrid / autotile (pure)    │   │  Hud, TitleScreen, TouchControls │
   │   worldLayout (pure)             │   └──────────────────────────────────┘
   │   Player, PropFactory            │
   │   InputController (DOM keys)     │      Phaser renders the world.
   │   EffectRunner, AudioManager     │      HTML/CSS renders the portfolio.
   └──────────────────────────────────┘
```

Key ideas:

- **The game and the UI never import each other.** They talk through
  `src/game/events/events.ts`: centralised event names
  (`exhibit:open`, `exhibit:close`, `prompt:change`, …) with typed payloads.
- **One pause mechanism.** `GameplayLock` holds named reasons
  (`title`, `dialog`, `menu`, `transition`). While any reason is held:
  - physics is paused,
  - the player halts,
  - input is cleared, so keys can't stick.

  After a dialog closes there is a 150 ms grace period, so the key that closed
  it can't immediately reopen it.

- **Keyboard input is read from DOM events** (`InputController`), not
  Phaser's keyboard plugin. Space and Enter therefore keep working on focused
  buttons, and the game never steals keys from the dialog.
- **Pure logic is Phaser-free and unit-tested.** This covers:
  - world building and autotiling,
  - interaction resolution (nearest, with a bonus for what you face),
  - movement, scaling, corner correction and link safety,
  - settings persistence and easter-egg effects.
- **Content is data:** `src/game/data/*.ts`.

## Folder structure

```
davids-arcade/
├── public/
│   ├── favicon.svg              # generated pixel favicon
│   └── game/                    # generated assets (do not hand-edit)
│       ├── tiles/               # tileset.png + tileset.json (tile name → index)
│       ├── sprites/             # player.png, props.png + props.json (atlas)
│       ├── portraits/           # codec portraits
│       ├── projects/            # project media (put your screenshots here)
│       ├── audio/               # sound effects + ambient loop (.wav)
│       └── ASSET_MANIFEST.json  # provenance + SHA-256 of every asset
├── scripts/
│   ├── generate-assets.mjs      # entry point: npm run assets
│   ├── lib/pixel.mjs            # palette, canvas, PNG encoder, bitmap font
│   ├── art/                     # tiles, player, props, extras (portraits, media)
│   └── audio/                   # synth + sound/music compositions
├── src/
│   ├── main.ts                  # bootstrap + dependency wiring
│   ├── game/
│   │   ├── Game.ts              # Phaser config, integer scaling, teardown
│   │   ├── config/              # constants (keys, tuning, depths), asset keys
│   │   ├── data/                # ← CONTENT: projects, profile, panels, eggs, world, props
│   │   ├── entities/            # Player, PropFactory, facing
│   │   ├── events/              # typed event contract
│   │   ├── interactions/        # Interactable + resolveInteraction
│   │   ├── scenes/              # BootScene, MainScene
│   │   ├── systems/             # InputController, AudioManager, EffectRunner
│   │   └── world/               # WorldGrid, autotile, worldLayout, laneAssist
│   ├── lib/                     # EventBus, GameplayLock, SettingsStore, links, scaling, movement
│   ├── ui/                      # Modal, renderers, Hud, TitleScreen, TouchControls, ui.css
│   ├── styles/main.css          # tokens, layout, reduced-motion
│   └── types/global.d.ts        # dev-only test hook typing
├── tests/                       # Vitest suites + world reachability helper
├── docs/                        # creative direction, screenshots
├── index.html, vite.config.ts, vitest.config.ts, eslint.config.js, tsconfig*.json
├── vercel.json                  # build settings + security headers
└── LICENSE, THIRD_PARTY_NOTICES.md, ASSET_CREDITS.md, SECURITY.md, CONTRIBUTING.md
```

## Adding, updating and removing projects

All projects live in **`src/game/data/projects.ts`**. Each project is placed
automatically on a pedestal in its engine's wing.

1. Put media in `public/game/projects/`, for example `my-game-1.png`, a
   `.gif`, or a short `.mp4`/`.webm`. Videos never autoplay.
2. Add an entry, or replace one of the samples:

   ```ts
   {
     id: 'night-courier',                     // unique, kebab-case
     title: 'Night Courier',
     engine: 'unity',                         // 'godot' | 'unity' | 'unreal'
     status: 'published',                     // 'sample' | 'published' | 'hidden'
     featured: true,                          // optional: takes the wing's centre pedestal
     tagline: 'One-line hook shown first.',
     description: ['Paragraph one.', 'Paragraph two.'],
     role: 'Solo developer',
     tech: ['Unity', 'C#', 'Shader Graph'],
     period: '2025',                          // optional, free text
     highlights: ['Your most impressive technical achievement'],
     media: [
       { type: 'image', src: 'game/projects/my-game-1.png', alt: 'Describe the image' },
       { type: 'video', src: 'game/projects/trailer.mp4', alt: 'Gameplay trailer', caption: 'Trailer' },
     ],
     links: {
       github: 'https://github.com/you/night-courier',
       itch: 'https://you.itch.io/night-courier',
       demo: null,                            // null or omitted = hidden
     },
   },
   ```

3. Run `npm test`. The registry is validated for unique ids, required fields,
   alt text, local media paths that exist, and `https:`-only links.

Things to know:

- **Remove** a project by deleting its entry. **Hide** it temporarily with
  `status: 'hidden'`.
- **Order:** the featured project goes first (the centre pedestal), then the
  others in file order (left, then right).
- **More than three projects in one wing?** Add positions to `EXHIBIT_SLOTS`
  in `src/game/data/world.ts`. The tests warn if a wing overflows and confirm
  each new pedestal is reachable.
- Missing optional fields are fine. No media shows nothing, and no links shows
  “Links coming soon.” A broken image is replaced with “Media unavailable”.

## Personal details, contact links and CV

Edit **`src/game/data/profile.ts`**:

- `name`, `alias`, `arcadeName`, `bio` (drafted from your interview — rewrite
  it in your own voice), `traits`, `engines`, `favoriteGames`, `influences`.
- `contacts`: set each `href`.
  - GitHub, itch.io, LinkedIn and portfolio: use `https://…`.
  - Email: use `mailto:you@example.com`.
- `cvUrl`: drop your PDF into `public/cv/` and set
  `cvUrl: 'cv/your-name-cv.pdf'`.

Unconfigured (`null`) links are **hidden in production** and shown as dashed
hints in development. Skills placeholders are in
`src/game/data/infoPanels.ts`, marked `placeholder: true`. Replace them and
remove the flag.

## Customising the world

The map is declared in **`src/game/data/world.ts`**:

- **`ROOMS`** — floor rectangles (tiles), each tagged with an area. Walls are
  generated automatically around them, three tiles tall on north sides for the
  3/4 wall faces.
- **`DOORS`** — floor rectangles carved through walls.
- **`AREAS`** — each area's name, banner subtitle, floor and wall theme, camera
  region, and optional speed multiplier (the crawlspace uses 0.55).
- **`CARPETS`** — 9-slice carpet rectangles (`red` or `rug`).
- **`PLACEMENTS`** — props by sprite top-left in tiles (fractions allowed),
  with optional interactions and markers.
- **`EXHIBIT_SLOTS`**, **`POINTS`** (spawn, bonfire, teleports) and
  **`REGIONS`** (camera bounds).

Prop behaviour (animation, layer, solid footprint) is in
`src/game/data/props.ts`. After editing, `npm test` proves that:

- every floor tile is enclosed,
- every interactable can physically be reached with the player's hitbox,
- every prop frame exists.

## Easter eggs

Defined in **`src/game/data/easterEggs.ts`**:

- **Tribute:** each egg has an id, a title (shown in the pause menu once
  found), a prompt, an optional note dialog and an optional effect.
- **Effects:** `roll-d20`, `toggle-box`, `open-codec`, `rest-bonfire`, and
  others, implemented in `src/game/systems/EffectRunner.ts`.
- **Counting:** eggs with `secret: true` count toward the total. Eggs that
  share a `discoveryId` count once, like the three floor messages.

Place an egg in the world with `interact: { kind: 'egg', id: '…' }` in
`PLACEMENTS`. The codec's frequencies and dialogue are in the `CODEC` constant
in the same file.

Spoilers for testing: Workshop → bottom-right grate (E twice) → crawl → hidden
room.

## Changing controls

`src/game/config/constants.ts`:

- `KEY_BINDINGS` maps actions to [`KeyboardEvent.code`](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code)
  values (physical keys, so WASD also works on AZERTY layouts).
- `KEY_LABELS` controls what prompts display.
- `MOVEMENT` tunes speed, acceleration and deceleration.
- `RESUME_GRACE_MS` and `FOOTSTEP_INTERVAL_MS` tune the feel.

Touch dead zone and layout are in `src/ui/TouchControls.ts` and `src/ui/ui.css`.

## Customising the UI

- Colours and fonts are CSS custom properties at the top of
  `src/styles/main.css`. They mirror the pixel palette in
  `scripts/lib/pixel.mjs`.
- Component styles are in `src/ui/ui.css`. The pixel frame is the
  `.modal__frame` / `.title__card` block, and the codec skin is
  `.modal--codec`.
- Dialog markup per content type is in `src/ui/renderers.ts`. The UI never
  uses `innerHTML`.
- No web fonts are loaded; the UI uses the system monospace stack, keeping the
  site fully offline and CSP-clean.

## Art and audio pipeline

Everything in `public/game/` comes from `npm run assets`:

- **`scripts/lib/pixel.mjs`** — the 33-colour palette, an RGBA canvas with
  pixel helpers, ASCII sprite stamping, an original 5×7 bitmap font, a
  dependency-free PNG encoder and an atlas packer.
- **`scripts/art/*.mjs`** — tiles (floors, autotiled wall tops, wall faces,
  carpets, shadows), the player (assembled from upper-body and leg rows so
  walk cycles stay consistent), props, codec portraits (converted to a green
  phosphor ramp), sample media and the favicon.
- **`scripts/audio/*.mjs`** — a tiny oscillator synth (square, triangle,
  noise, envelopes, echo) and the compositions for 12 effects and the 16 s
  ambient loop.

Output is **deterministic**: `ASSET_MANIFEST.json` records a SHA-256 per file.
To tweak art, edit the generator and re-run it; don't paint over the PNGs,
or your edits will be overwritten next time.

Want hand-painted art instead? Replace the PNGs with same-layout files from
Aseprite or a similar tool. Keep the frame names in `props.json` and the tile
names in `tileset.json`, stop running `npm run assets`, and record the change
in `ASSET_CREDITS.md`.

## Accessibility, performance and browser support

**Accessibility**

- Native `<dialog>` with labelled titles, focus moved into the dialog and
  restored afterwards.
- Visible focus rings, keyboard-reachable everything, and `aria-live` status
  for area changes and toasts.
- A list-based directory of all content for non-gaming visitors.
- `prefers-reduced-motion` disables fades, shakes, marker bobbing and CSS
  animations.
- Text contrast meets WCAG AA on all panels. Red is used only for accents,
  never for body text.

**Performance**

| Asset                                | Size                                |
| ------------------------------------ | ----------------------------------- |
| App code                             | ~23 KB gzipped                      |
| Phaser (separate, long-cached chunk) | ~332 KB gzipped                     |
| Art                                  | ~12 KB                              |
| Audio (WAV)                          | ~1 MB, mostly the 16 s ambient loop |

- If bandwidth matters more than build simplicity, convert the loop to OGG or
  MP3 and update `MUSIC.url`.
- The game makes no network requests after load and pauses when the tab is
  hidden.

**Browsers:** the latest two versions of Chrome, Edge, Firefox and Safari,
desktop and mobile. WebGL is used when available, with an automatic Canvas
fallback.

## Testing and quality gates

```bash
npm run check
```

This runs type checking, ESLint, the Prettier check, Vitest (63 tests) and the
production build. The test suites cover:

- **world** — the map is enclosed, regions are big enough for any viewport,
  and every interactable and room can be reached with the real hitbox from
  spawn (or from the crawlspace for the hidden room). This is the softlock
  guard.
- **interactions** — nearest-target selection, facing bonus, reach, and
  deterministic ties.
- **input** — key mapping, edge-triggered interact, key-repeat, cleared state
  on lock, the grace period and touch input.
- **projects** — registry validation, sample labelling, media existence,
  featured-slot assignment and overflow warnings.
- **lib / game logic** — the event bus, lock, settings persistence (including
  corrupt or blocked storage), integer scaling, movement, the D-pad, easter-egg
  effects, autotiling and corner correction.

Browser behaviour was verified with an automated headless-Chromium playtest
during development:

- movement and collision,
- prompts and opening/closing dialogs with E, Space, Escape and the Close
  button,
- no stuck keys and no immediate re-open,
- the pause menu,
- every room,
- the full secret route, the codec and the box,
- returning to the Lobby,
- touch controls on a 390 × 844 phone viewport,
- the production build under the CSP with zero console errors.

That harness isn't shipped, because it relies on a Linux-only Chromium
package. Re-test manually after big changes with `npm run build && npm run
preview`.

## Deploying: Git, GitHub and Vercel

You said you already have GitHub and Vercel accounts. Steps marked 🔐 need you
to sign in; everything else is copy-paste.

### 1. Git (first time only)

Install Git from <https://git-scm.com/downloads>, then:

```bash
git config --global user.name "David Vilela"
git config --global user.email "you@example.com"
```

### 2. Create the local repository

```bash
cd path/to/davids-arcade
npm ci
npm run check                 # make sure everything is green first
git init -b main
git status                    # review what will be committed
```

Confirm that `node_modules/`, `dist/` and any `.env*` files are **not**
listed; `.gitignore` excludes them. This project needs no secrets or
environment variables.

```bash
git add .
git commit -m "Initial commit: David's Arcade"
```

### 3. Push to GitHub 🔐

1. Go to <https://github.com/new>. Name the repository `davids-arcade`, and
   **don't** add a README, .gitignore or licence (they already exist).
2. Choose **Private** or **Public**. With _all rights reserved_, public means
   people can view the code but have no right to reuse it.
3. Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/davids-arcade.git
git push -u origin main
```

Later changes:

```bash
npm run check
git add .
git commit -m "Describe the change"
git push
```

### 4. Deploy on Vercel 🔐

1. Go to <https://vercel.com/new> and **Import** the `davids-arcade`
   repository. Grant Vercel access to it if asked.
2. Vercel reads `vercel.json`, and the defaults are already correct:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** default (`npm ci` via the lockfile)
   - **Environment variables:** none needed
3. Click **Deploy**. When it finishes, open the production URL and check:
   - the title screen appears,
   - you can walk north to the exhibit and open it,
   - there are no errors in the browser console (F12).
4. From then on, every `git push` to `main` redeploys automatically, and pull
   requests get preview URLs.

**Node version:** Vercel uses the `engines.node` field (`>=22.12.0`). If the
dashboard pins an older Node version, set it to 22.x under _Settings →
General_.

**Custom domain (optional) 🔐:** _Project → Settings → Domains → Add_, then
follow the DNS instructions shown (usually an `A` record or a `CNAME` at your
registrar). HTTPS is issued automatically.

`vercel.json` only sets the build output and security/cache headers. There
are no rewrites: this is a single page with static assets, so none are
needed.

## Before you publish

- [ ] Replace the three sample projects in `src/game/data/projects.ts` (or
      mark the ones you don't want as `hidden`).
- [ ] Set your contact URLs and `cvUrl` in `src/game/data/profile.ts`.
- [ ] Rewrite the bio in your own voice and replace the sample skills in
      `src/game/data/infoPanels.ts`.
- [ ] Add your own screenshots, GIFs or videos to `public/game/projects/`, and
      make sure you have the rights to them.
- [ ] Run `npm run dev` and check the console for `[content]` warnings.
- [ ] `npm run check`, then deploy.

## Troubleshooting

| Symptom                                             | Fix                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci` fails with an engine error                 | Use Node 22.12+ (`nvm install 22 && nvm use 22`).                                                                                                                       |
| Blank page after opening `dist/index.html` directly | Browsers block module scripts from `file://`. Use `npm run preview`.                                                                                                    |
| No sound                                            | Audio only starts after you click **Enter the arcade**. Check the HUD **Sound** button and the **Music** toggle in the menu (Esc). Some browsers mute autoplaying tabs. |
| Keys move the page or do nothing                    | Click the game once so the page has focus. If a dialog is open, close it with Esc.                                                                                      |
| Pixel art looks blurry                              | Browser zoom isn't 100%, or the OS scaling is fractional. Integer scaling is computed in CSS pixels.                                                                    |
| A new prop or project overlaps something            | Run `npm test`. The reachability test names the blocked interactable; move it in `world.ts`.                                                                            |
| Vercel build fails at `tsc`                         | Run `npm run check` locally. The build type-checks first by design.                                                                                                     |
| Vercel shows a 404 for assets                       | Make sure `public/game/` was committed and not ignored.                                                                                                                 |
| You changed art but nothing changed                 | Run `npm run assets`, then hard-refresh (Ctrl/Cmd+Shift+R).                                                                                                             |

## Licensing and attribution

- **This project is proprietary — all rights reserved** (see `LICENSE`), as
  you chose. People may view the code; nobody may reuse, copy or redistribute
  it without your written permission. This README isn't legal advice. If you
  later want others to reuse the code, an MIT licence for code (and/or a
  separate licence for art) is the usual next step.
- **Third-party software:** Phaser and eventemitter3 (MIT) are bundled; their
  notices are in `THIRD_PARTY_NOTICES.md`. Development tools aren't shipped.
- **Assets:** all original; see `ASSET_CREDITS.md` and
  `public/game/ASSET_MANIFEST.json`.
- **Tributes:** game and engine names are trademarks of their owners and are
  used only for reference. No affiliation is implied, and every tribute says
  so in-game.
