# Contributing

This is a personal portfolio and the code is **not open source** (see
`LICENSE`). Bug reports and suggestions are welcome; code contributions are
accepted only by invitation.

## Workflow

1. Use Node.js 22 (`nvm use`) and install with `npm ci`.
2. Make your change on a branch.
3. Run the full gate before committing:

   ```bash
   npm run check   # typecheck, lint, format check, tests, production build
   ```

4. If you change art or audio, edit the generator in `scripts/` and run
   `npm run assets` — don't hand-edit files in `public/game/`.

## Conventions

- TypeScript strict mode; no `any`, no non-null assertions.
- Content (projects, panels, easter eggs, world layout) lives in
  `src/game/data/`. Presentation and game logic must not hard-code content.
- Keep pure logic Phaser-free (`src/lib`, `src/game/world`,
  `src/game/interactions`) so it can be unit-tested.
- Events between the game and the DOM UI go through `src/game/events/events.ts`.
- Formatting is Prettier's; linting is ESLint with `typescript-eslint`'s
  strict type-checked rules.
