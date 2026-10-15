/**
 * The About / Skills / Contact / CV panels, built from PROFILE so personal
 * details live in one place.
 */
import { PROFILE } from './profile';
import type { InfoPanel } from './types';

export type InfoPanelId = 'about' | 'skills' | 'contact' | 'cv';

export const INFO_PANELS: Readonly<Record<InfoPanelId, InfoPanel>> = {
  about: {
    id: 'about',
    title: `About ${PROFILE.name}`,
    kicker: `a.k.a. “${PROFILE.alias}”`,
    sections: [
      { kind: 'paragraphs', paragraphs: PROFILE.bio },
      { kind: 'list', heading: 'In five words', items: PROFILE.traits },
      { kind: 'list', heading: 'Favourite games right now', items: PROFILE.favoriteGames },
      {
        kind: 'list',
        heading: 'Games that shaped how I think about design',
        items: PROFILE.influences,
      },
    ],
  },
  skills: {
    id: 'skills',
    title: 'Skills',
    kicker: 'The notice board',
    sections: [
      { kind: 'list', heading: 'Engines', items: PROFILE.engines },
      {
        kind: 'list',
        heading: 'Languages & tools',
        placeholder: true,
        items: ['Sample — replace with your languages', 'Sample — replace with your tools'],
      },
      {
        kind: 'list',
        heading: 'Beyond the engine',
        items: ['Open-source software', 'Hardware & electronics tinkering'],
      },
    ],
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    kicker: 'The red phone',
    sections: [
      {
        kind: 'paragraphs',
        paragraphs: ['Want to talk about a role, a jam or a game? Pick a line.'],
      },
      { kind: 'links', links: PROFILE.contacts },
    ],
  },
  cv: {
    id: 'cv',
    title: 'Curriculum Vitae',
    kicker: 'The filing cabinet',
    sections: [
      {
        kind: 'links',
        links: [
          {
            label: 'Download CV (PDF)',
            href: PROFILE.cvUrl,
            hint: 'Put your PDF in public/cv/ and set cvUrl in src/game/data/profile.ts',
          },
        ],
      },
      {
        kind: 'paragraphs',
        heading: 'Software portfolio',
        paragraphs: [
          'My traditional software engineering work lives in a separate portfolio — see the Contact panel.',
        ],
      },
    ],
  },
};
