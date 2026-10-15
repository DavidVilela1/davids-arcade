/**
 * Easter eggs as data. Each egg is a world object with a prompt, a note shown
 * in the DOM dialog and an optional effect handled by EffectRunner.
 *
 * Every reference below is an original tribute: original art, original text,
 * no copied assets, and no affiliation with the games' owners is implied.
 */
import { PROFILE } from './profile';
import type { CodecContent, NoteContent } from './types';

export type EggEffect =
  | 'rest-bonfire'
  | 'roll-d20'
  | 'toggle-box'
  | 'open-grate'
  | 'climb-down'
  | 'climb-up'
  | 'open-codec'
  | 'insert-coin';

export interface EasterEggDef {
  readonly id: string;
  /** Eggs sharing a discovery id count once (e.g. the three floor messages). */
  readonly discoveryId?: string;
  /** Shown in the pause menu once found. */
  readonly title: string;
  readonly prompt: string;
  readonly note?: NoteContent;
  readonly effect?: EggEffect;
  /** Counts toward "Secrets found". */
  readonly secret: boolean;
}

const tribute = (game: string) => `A tribute to ${game}. Not affiliated with its creators.`;

export const EASTER_EGGS: readonly EasterEggDef[] = [
  {
    id: 'bonfire',
    title: 'The bonfire',
    prompt: 'Rest at bonfire',
    effect: 'rest-bonfire',
    secret: true,
    note: {
      title: 'Bonfire',
      lines: [
        'A coiled sword hums quietly in the ash. The warmth is out of proportion to the size of the flame.',
        'BONFIRE LIT. This is now your return point — press H, or use the menu, to come back here from anywhere.',
      ],
      footnote: tribute('Dark Souls'),
    },
  },
  {
    id: 'message-lobby',
    discoveryId: 'floor-messages',
    title: 'Messages on the floor',
    prompt: 'Read message',
    secret: true,
    note: {
      title: 'A message glows on the floor',
      lines: ['“Praise the arcade!”', 'Rated: Good ×33'],
      footnote: tribute('Dark Souls'),
    },
  },
  {
    id: 'message-unity',
    discoveryId: 'floor-messages',
    title: 'Messages on the floor',
    prompt: 'Read message',
    secret: true,
    note: {
      title: 'A message glows on the floor',
      lines: ['“Be wary of scope creep, therefore ship it.”', 'Rated: Good ×140'],
      footnote: tribute('Dark Souls'),
    },
  },
  {
    id: 'message-workshop',
    discoveryId: 'floor-messages',
    title: 'Messages on the floor',
    prompt: 'Read message',
    secret: true,
    note: {
      title: 'A message glows on the floor',
      lines: ['“Hidden path ahead. Try down.”', 'Rated: Good ×85'],
      footnote: tribute('Dark Souls'),
    },
  },
  {
    id: 'model-jet',
    title: 'The model jet',
    prompt: 'Inspect model',
    secret: true,
    note: {
      title: 'Model fighter jet',
      lines: [
        'A hand-built model fighter with a crimson tail stripe. The nose decal reads PIZZA 1.',
        'Somewhere, a radio crackles: “Pizza 1, Fox Two. Tally ho.”',
      ],
      footnote: tribute('Ace Combat'),
    },
  },
  {
    id: 'boarded-window',
    title: 'The boarded window',
    prompt: 'Inspect window',
    secret: true,
    note: {
      title: 'Boarded window',
      lines: [
        'Planks are nailed across the window — from the inside. A note is pinned to the frame:',
        '“Day 1. Power’s still on. Still making games.”',
        'Underneath, in smaller letters: “This is how you died. Probably scope creep.”',
      ],
      footnote: tribute('Project Zomboid'),
    },
  },
  {
    id: 'd20',
    title: 'The d20',
    prompt: 'Roll the d20',
    effect: 'roll-d20',
    secret: true,
  },
  {
    id: 'pizza-tower',
    title: 'The pizza tower',
    prompt: 'Inspect boxes',
    secret: true,
    note: {
      title: 'A load-bearing tower of pizza boxes',
      lines: [
        `Structural engineering by David “${PROFILE.alias}” Vilela.`,
        'The top box is empty. Of course it is.',
      ],
    },
  },
  {
    id: 'sweetroll',
    title: 'The sweetroll',
    prompt: 'Inspect plate',
    secret: true,
    note: {
      title: 'A sweetroll',
      lines: [
        'A sweetroll on a chipped plate, still warm.',
        'You get the distinct feeling that someone is about to ask whether you stole it.',
      ],
      footnote: tribute('The Elder Scrolls'),
    },
  },
  {
    id: 'storage-door',
    title: 'The locked door',
    prompt: 'Check under door',
    secret: true,
    note: {
      title: 'Locked storage door',
      lines: [
        'You slide a mirror under the door.',
        'Room is clear: one soldering iron, a box of cables nobody will ever untangle, and a sign that reads “NO BREACHING”.',
        'The door stays locked. You leave it that way.',
      ],
      footnote: tribute('Ready or Not'),
    },
  },
  {
    id: 'memorial',
    title: 'The memorial',
    prompt: 'Pay respects',
    secret: true,
    note: {
      title: 'Memorial',
      lines: [
        'For every prototype that never shipped.',
        'You press F. (E works too. It’s the thought that counts.)',
      ],
      footnote: tribute('Call of Duty'),
    },
  },
  {
    id: 'easel',
    title: 'The unfinished painting',
    prompt: 'Look at painting',
    secret: true,
    note: {
      title: 'An unfinished canvas',
      lines: [
        'A distant monolith under a pale sky. Above it, a number in fresh red paint: 33.',
        'The brush is still wet. Best not to celebrate any birthdays for a while.',
      ],
      footnote: tribute('Clair Obscur: Expedition 33'),
    },
  },
  {
    id: 'mech',
    title: 'The dormant tank',
    prompt: 'Inspect statue',
    secret: true,
    note: {
      title: 'A dormant bipedal tank',
      lines: [
        'A walking battle tank prototype, bolted to its plinth. Its single red eye flickers… then thinks better of it.',
        'The maintenance tag reads: “Do not activate before the portfolio is finished.”',
      ],
      footnote: tribute('Metal Gear Solid'),
    },
  },
  {
    id: 'grate',
    title: 'The loose grate',
    prompt: 'Inspect grate',
    effect: 'open-grate',
    secret: false,
    note: {
      title: 'Floor grate',
      lines: [
        'One of the floor grates is loose. Someone has scratched a tiny “!” into the frame.',
        'You lift it aside. A crawlspace runs beneath the workshop.',
      ],
    },
  },
  {
    id: 'grate-open',
    title: 'The crawlspace',
    prompt: 'Climb down',
    effect: 'climb-down',
    secret: false,
  },
  {
    id: 'ladder',
    title: 'Ladder',
    prompt: 'Climb up',
    effect: 'climb-up',
    secret: false,
  },
  {
    id: 'codec',
    title: 'The back channel',
    prompt: 'Use terminal',
    effect: 'open-codec',
    secret: true,
  },
  {
    id: 'cardboard-box',
    title: 'Standard-issue cardboard box',
    prompt: 'Hide in box',
    effect: 'toggle-box',
    secret: true,
  },
  {
    id: 'cabinet',
    title: 'Arcade cabinet',
    prompt: 'Insert coin',
    effect: 'insert-coin',
    secret: false,
  },
];

/** Shown by the arcade cabinets; one line per coin, cycling. */
export const CABINET_LINES: readonly string[] = [
  'INSERT COIN — this cabinet runs a game that doesn’t exist yet. High score: PIZZA 999999.',
  'The attract mode loops a demo of a racing game set entirely at night. You want to play it. You can’t. Yet.',
  'GAME OVER. Continue? 9… 8… 7… The cabinet has opinions about your reflexes.',
];

/** A discovery granted by entering the hidden room rather than touching an object. */
export const ROOM_DISCOVERY = { id: 'secret-room', title: 'The hidden room' } as const;

export const CODEC: CodecContent = {
  portraits: { david: 'game/portraits/david.png', control: 'game/portraits/control.png' },
  channels: [
    {
      frequency: '140.85',
      name: 'Mission Control',
      lines: [
        {
          speaker: 'control',
          text: 'You found the back channel. Not many visitors make it down the crawlspace.',
        },
        { speaker: 'david', text: 'The grate was loose. Someone should really fix that.' },
        {
          speaker: 'control',
          text: 'Listen carefully. Your target is David Vilela, game developer. Godot, Unity, Unreal — he moves between engines like they are rooms in the same building.',
        },
        {
          speaker: 'control',
          text: 'Profile says curious, independent, open-source by conviction and a gamer by default. Also a hardware tinkerer: if it has a circuit board, he has opened it.',
        },
        { speaker: 'david', text: 'That is… uncomfortably accurate.' },
        {
          speaker: 'control',
          text: 'Your mission: study the exhibits in the Boss Room, then make contact through the red phone in the Workshop. And the box in the corner is standard issue. Use it.',
        },
      ],
    },
    {
      frequency: '140.96',
      name: 'Save line',
      showsProgress: true,
      lines: [
        {
          speaker: 'control',
          text: 'This frequency used to save your progress. Here, the arcade only remembers which secrets you have found — stored in this browser, nowhere else.',
        },
      ],
    },
    {
      frequency: '141.12',
      name: 'Pizza line',
      lines: [
        { speaker: 'david', text: 'Pizza is good, bruh.' },
        { speaker: 'control', text: '…Is that a code phrase?' },
        { speaker: 'david', text: 'It is a philosophy.' },
      ],
    },
  ],
};

export function findEgg(id: string): EasterEggDef | undefined {
  return EASTER_EGGS.find((e) => e.id === id);
}

export function discoveryIdOf(egg: EasterEggDef): string {
  return egg.discoveryId ?? egg.id;
}

/** Unique secrets that count toward the total, in a stable display order. */
export function secretCatalogue(): { id: string; title: string }[] {
  const seen = new Map<string, string>();
  for (const egg of EASTER_EGGS) {
    if (!egg.secret) continue;
    const id = discoveryIdOf(egg);
    if (!seen.has(id)) seen.set(id, egg.title);
  }
  seen.set(ROOM_DISCOVERY.id, ROOM_DISCOVERY.title);
  return [...seen].map(([id, title]) => ({ id, title }));
}

export function rollD20Note(roll: number): NoteContent {
  const lines =
    roll === 20
      ? ['Natural 20!', 'Critical success. Inspiration granted — go open an exhibit.']
      : roll === 1
        ? ['Natural 1.', 'The die skitters under the bed. Critical failure, but a funny one.']
        : [
            `You rolled a ${roll}.`,
            roll >= 10 ? 'That passes the check.' : 'Not your best roll. Try again?',
          ];
  return {
    title: 'A crimson d20',
    lines,
    footnote: tribute("Baldur's Gate"),
  };
}
