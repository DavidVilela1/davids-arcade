/**
 * The project registry — the only file you need to edit to add, change or
 * remove portfolio exhibits. Projects are placed automatically on the
 * pedestals of their engine's wing (see EXHIBIT_SLOTS in world.ts).
 *
 * The three entries below are SAMPLES. They intentionally contain no real
 * claims about past work; replace them with your own projects.
 */
import type { ProjectRecord } from './types';

export const PROJECTS: readonly ProjectRecord[] = [
  {
    id: 'sample-godot',
    title: 'Sample Project — Replace with Your Work',
    engine: 'godot',
    status: 'sample',
    tagline: 'Placeholder exhibit for a Godot project.',
    description: [
      'This pedestal is waiting for one of your Godot projects.',
      'Edit src/game/data/projects.ts to set the title, description, role, tech stack, highlights, media and links. Put screenshots or GIFs in public/game/projects/.',
    ],
    role: 'Your role (e.g. solo developer, gameplay programmer)',
    tech: ['Godot', 'Your languages and tools'],
    period: 'Start – End',
    highlights: [
      'Your most impressive technical achievement',
      'A system, tool or mechanic you are proud of',
    ],
    media: [
      {
        type: 'image',
        src: 'game/projects/sample-godot.png',
        alt: 'Placeholder artwork labelled "Sample media — replace with your work"',
      },
    ],
    links: { github: null, itch: null, demo: null },
  },
  {
    id: 'sample-unity',
    title: 'Sample Project — Replace with Your Work',
    engine: 'unity',
    status: 'sample',
    tagline: 'Placeholder exhibit for a Unity project.',
    description: [
      'This pedestal is waiting for one of your Unity projects.',
      'Each project entry supports a playable build link, a GitHub repository, an itch.io page and local media.',
    ],
    role: 'Your role',
    tech: ['Unity', 'Your languages and tools'],
    period: 'Start – End',
    highlights: ['A highlight worth a recruiter’s attention'],
    media: [
      {
        type: 'image',
        src: 'game/projects/sample-unity.png',
        alt: 'Placeholder artwork labelled "Sample media — replace with your work"',
      },
    ],
    links: { github: null, itch: null, demo: null },
  },
  {
    id: 'sample-unreal',
    title: 'Sample Project — Replace with Your Work',
    engine: 'unreal',
    status: 'sample',
    featured: true,
    tagline: 'Placeholder exhibit for an Unreal Engine project — the Boss Room centrepiece.',
    description: [
      'The featured project sits at the centre of the Boss Room, at the end of the red carpet. Pick the project you want recruiters to see first.',
      'Set `featured: true` on any project to give it the centre pedestal of its wing.',
    ],
    role: 'Your role',
    tech: ['Unreal Engine', 'Your languages and tools'],
    period: 'Start – End',
    highlights: ['Your headline achievement'],
    media: [
      {
        type: 'image',
        src: 'game/projects/sample-unreal.png',
        alt: 'Placeholder artwork labelled "Sample media — replace with your work"',
      },
    ],
    links: { github: null, itch: null, demo: null },
  },
];
