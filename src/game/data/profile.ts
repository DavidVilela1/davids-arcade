/**
 * Who the arcade belongs to. Edit this file to change names, bio and links.
 *
 * Contact URLs are intentionally `null` until you fill them in: unconfigured
 * links are hidden in production builds and flagged in development builds.
 */
import type { LinkItem } from './types';

export interface Profile {
  readonly name: string;
  readonly alias: string;
  readonly arcadeName: string;
  readonly tagline: string;
  /** Drafted from the discovery interview. Rewrite it in your own voice. */
  readonly bio: readonly string[];
  readonly traits: readonly string[];
  readonly engines: readonly string[];
  readonly favoriteGames: readonly string[];
  readonly influences: readonly string[];
  readonly contacts: readonly LinkItem[];
  /** A local file such as `cv/david-vilela-cv.pdf` placed in /public, or an https URL. */
  readonly cvUrl: string | null;
}

export const PROFILE: Profile = {
  name: 'David Vilela',
  alias: 'pizza is good bruh',
  arcadeName: "David's Arcade",
  tagline: 'An interactive game development portfolio.',
  bio: [
    "I'm David — a game developer who works across Godot, Unity and Unreal Engine.",
    'Curious by default, independent by habit and an open-source enjoyer by conviction. I play a lot of games, and I like taking hardware apart almost as much as I like building software.',
    'This arcade is my portfolio: every wing holds work from a different engine. Have a look around — and maybe check the floors.',
  ],
  traits: [
    'Curious',
    'Independent',
    'Open-source enjoyer',
    'Gamer',
    'Hardware & electronics enthusiast',
  ],
  engines: ['Godot', 'Unity', 'Unreal Engine'],
  favoriteGames: [
    'Metal Gear Solid',
    'Ace Combat 8',
    'Project Zomboid',
    'Ready or Not',
    'Clair Obscur: Expedition 33',
  ],
  influences: [
    'Metal Gear Solid',
    'Grand Theft Auto',
    'The Elder Scrolls',
    "Baldur's Gate",
    'Dark Souls',
    'Clair Obscur: Expedition 33',
    'Project Zomboid',
    'Call of Duty',
  ],
  contacts: [
    { label: 'GitHub', href: null, hint: 'Set the GitHub URL in src/game/data/profile.ts' },
    { label: 'itch.io', href: null, hint: 'Set the itch.io URL in src/game/data/profile.ts' },
    { label: 'Email', href: null, hint: 'Use a mailto: link, e.g. mailto:you@example.com' },
    { label: 'LinkedIn', href: null, hint: 'Set the LinkedIn URL in src/game/data/profile.ts' },
    {
      label: 'Software Development Portfolio',
      href: null,
      hint: 'Link your existing software portfolio here',
    },
  ],
  cvUrl: null,
};
