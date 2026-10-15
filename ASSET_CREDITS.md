# Asset credits and provenance

Every image and sound in this project is **original** and was created
specifically for David's Arcade. Nothing is downloaded, traced or sampled from
other games, asset stores or websites.

| Kind                                    | Files                               | Source                                                                   |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Tiles (floors, walls, carpets, shadows) | `public/game/tiles/*`               | Procedurally drawn by `scripts/art/tiles.mjs`                            |
| Player sprite sheet                     | `public/game/sprites/player.png`    | Hand-authored ASCII pixel maps in `scripts/art/player.mjs`               |
| Props, exhibits, signage                | `public/game/sprites/props.*`       | `scripts/art/props.mjs` (primitives + ASCII stamps)                      |
| Codec portraits                         | `public/game/portraits/*`           | `scripts/art/extras.mjs`                                                 |
| Sample project media                    | `public/game/projects/sample-*.png` | `scripts/art/extras.mjs` — clearly labelled placeholders                 |
| Favicon                                 | `public/favicon.svg`                | `scripts/art/extras.mjs`                                                 |
| Sound effects and ambient loop          | `public/game/audio/*.wav`           | Synthesised by `scripts/audio/*.mjs` (square/triangle/noise oscillators) |
| Bitmap font used on signs               | baked into the images above         | Original 5×7 glyph set in `scripts/lib/pixel.mjs`                        |

- **Licence:** same as the project — all rights reserved (see `LICENSE`).
- **Third-party assets:** none. `public/game/ASSET_MANIFEST.json` lists every
  generated file with its size and SHA-256, and `thirdPartyAssets` is empty.
- **Regenerating:** `npm run assets`. Output is deterministic, so a clean
  regeneration produces byte-identical files.

## Tributes

Several easter eggs reference games David loves. They are expressed through
original drawings and original writing only — for example a generic cardboard
box, a sword in a bonfire, a model jet with a made-up decal, a d20. Each
tribute's dialog says which game it honours and that it is not affiliated with
its creators.

## Adding your own media

When you add screenshots, GIFs or videos of your projects to
`public/game/projects/`, you are responsible for having the rights to them.
If you add any third-party asset (font, music, sprite), record it here with
its author, source URL and licence, and add a matching entry to
`THIRD_PARTY_NOTICES.md`.
