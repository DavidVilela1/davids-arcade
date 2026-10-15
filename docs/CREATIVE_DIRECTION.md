# Creative direction — David's Arcade

_Locked in after the discovery interview (October 2026)._

## Identity

|                       |                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------- |
| Name                  | **David's Arcade**                                                                    |
| Owner                 | David “pizza is good bruh” Vilela                                                     |
| Traits to communicate | Curious · Independent · Open-source enjoyer · Gamer · Hardware/electronics enthusiast |
| Mood                  | Cozy and nostalgic, with a mysterious after-hours undercurrent                        |
| Avoid                 | Neon colours, emoji, generic developer memes                                          |

## Visual language

- **Palette:** 33 colours. Near-black inks, maroon and crimson, warm
  off-white, muted brass and candle light. There is one cool accent per wing
  (teal-sage for Godot, slate for Unity, black stone with red trim for Unreal),
  plus a green phosphor used only for terminals.
- **Pixel rules:** 16×16 tiles, 16×24 characters, ink outlines, light from the
  top-left, crisp integer scaling (never smoothed).
- **Perspective:** 3/4 top-down. North walls show two rows of wall face; all
  other walls show their tops.
- **UI:** dark panels with a brass pixel frame and maroon header gradient, set
  in a monospace system font. The codec uses its own green phosphor skin.

## Room layout

```
        +-----------+-------------+-----------+
        |  GODOT    |   UNREAL    |  UNITY    |   The Boss Room: one hall, three wings
        |  wing     | boss wing   |  wing     |   (each wing has its own door from the Lobby)
        +----+------+------+------+-----+-----+
+------+ |              LOBBY                | +----------+
| DEV  |=|  marquee · bonfire · cabinets     |=| WORKSHOP |
| ROOM | |                                   | | (grate!) |
+------+ +-----------------------------------+ +----------+
                    ... the crawlspace and the hidden room lie below the Workshop.
```

| Room                        | Purpose                           | Notes                                                            |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| Lobby (hub)                 | Welcome, orientation              | Red carpet leads straight north to the featured exhibit          |
| Godot wing                  | Godot projects                    | Teal floor with node-graph inlays, sculptures                    |
| Unreal wing — the Boss Room | Unreal projects, featured project | Black stone, banners, candelabras, a dormant bipedal tank        |
| Unity wing                  | Unity projects                    | Slate modular panels and bolts                                   |
| Dev Bedroom                 | About                             | Desk PC (bio), bed, books, pizza tower                           |
| Workshop                    | Skills · Contact · CV             | Notice board, red phone, filing cabinet, workbench, oscilloscope |
| Crawlspace and hidden room  | The big MGS tribute               | Slow crawl, “!” alert, codec terminal, cardboard box             |

## Interaction model

- Walk with WASD, the arrow keys or the touch D-pad. Interact with E, Space,
  Enter or the A button.
- A contextual prompt appears only when something is in reach. The nearest
  object wins, with a bonus for whatever you are facing.
- Essential content (exhibits and the About, Skills, Contact and CV panels)
  has a bobbing brass marker. Secrets have no marker.
- All reading happens in accessible DOM dialogs. The game pauses while one is
  open.
- **Esc** opens the menu (resume, directory, return to the Lobby, sound and
  music, controls, secrets list). **H** returns to the Lobby from anywhere.
- The title screen offers **“Browse exhibits as a list”**, a no-walking path
  through all content for recruiters and assistive-technology users.

## Easter-egg philosophy

Easter eggs should be recognisable on sight, but you have to find them. They
must never block the main path. All art and text are original, and each
tribute says which game it honours and that it is unaffiliated.

| Tribute                            | Where                        | What it does                                                                                                                                                                      |
| ---------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metal Gear Solid (the big one)** | Workshop → loose floor grate | A crawlspace, an “!” alert, a codec with tunable frequencies (140.85 Mission Control, a 140.96 “save line” showing your progress, 141.12 Pizza line) and a wearable cardboard box |
| Metal Gear Solid                   | Unreal wing                  | A dormant bipedal tank statue as the room's “boss”                                                                                                                                |
| Dark Souls                         | Lobby, plus floor messages   | The bonfire becomes your return point. Three glowing floor messages; one hints at the grate                                                                                       |
| Ace Combat                         | Bedroom corner               | A model jet with a PIZZA 1 decal and radio chatter                                                                                                                                |
| Project Zomboid                    | Bedroom window               | Boarded from the inside, with a survivor's note                                                                                                                                   |
| Baldur's Gate                      | Bedroom                      | A d20 you can actually roll                                                                                                                                                       |
| Ready or Not                       | Workshop                     | A locked door you can check under with a mirror                                                                                                                                   |
| The Elder Scrolls                  | Workshop                     | A suspicious sweetroll                                                                                                                                                            |
| Call of Duty                       | Lobby corner                 | A memorial where F (or E) pays respects                                                                                                                                           |
| Clair Obscur: Expedition 33        | Godot wing corner            | An unfinished painting with a fresh “33”                                                                                                                                          |
| Personal                           | Bedroom                      | A load-bearing pizza tower credited to the alias                                                                                                                                  |

The pause menu tracks secrets found (14). Progress is stored locally and can be
reset from the codec save line.

## Portfolio content schema

`ProjectRecord` in `src/game/data/types.ts` has these fields:

- **Identity:** `id`, `title`, `engine`, `status` (`sample`, `published` or
  `hidden`), `featured`
- **Description:** `tagline`, `description[]`, `role`, `tech[]`, `period`,
  `highlights[]`
- **Media and links:** `media[]` (local images or videos with alt text) and
  `links` (`github`, `itch`, `demo`, `video`)

Three clearly labelled samples (one per engine) ship until real projects are
added. Personal details live in `src/game/data/profile.ts`. Contact URLs start
empty rather than invented.

## Audio

All audio is original chiptune, synthesised offline:

- **Ambient loop:** a 16-second A-minor progression (Am, Fmaj7, Dm7, E) built
  from a soft arpeggio, a triangle bass and an echo.
- **Effects:** 12 short sounds, including a codec ring, the “!” alert and the
  bonfire.

Audio stays silent until the visitor's first deliberate action. Sound and
music each have a toggle, and the choice persists between visits.
