import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { INFO_PANELS } from '../src/game/data/infoPanels';
import { PROFILE } from '../src/game/data/profile';
import { PROJECTS } from '../src/game/data/projects';
import type { ProjectRecord } from '../src/game/data/types';
import { validateLinks, validateProjects, visibleProjects } from '../src/game/data/validation';
import { assignProjectsToSlots } from '../src/game/world/worldLayout';
import { EXHIBIT_SLOTS } from '../src/game/data/world';

const base: ProjectRecord = {
  id: 'ok',
  title: 'T',
  engine: 'godot',
  tagline: 't',
  description: ['d'],
  role: 'r',
  tech: [],
  highlights: [],
  status: 'published',
};

describe('project registry', () => {
  it('is valid', () => {
    expect(validateProjects(PROJECTS)).toEqual([]);
    expect(validateLinks(PROFILE.contacts)).toEqual([]);
  });

  it('labels every sample entry clearly', () => {
    for (const p of PROJECTS.filter((x) => x.status === 'sample'))
      expect(p.title).toMatch(/Sample/);
  });

  it('only references media files that exist', () => {
    for (const p of PROJECTS)
      for (const m of p.media ?? [])
        expect(
          existsSync(fileURLToPath(new URL(`../public/${m.src}`, import.meta.url))),
          m.src,
        ).toBe(true);
  });

  it('catches common mistakes', () => {
    const errors = validateProjects([
      { ...base, id: 'Bad Id' },
      { ...base, id: 'dup' },
      { ...base, id: 'dup' },
      { ...base, id: 'links', links: { github: 'http://insecure.example' } },
      {
        ...base,
        id: 'media',
        media: [{ type: 'image', src: 'https://cdn.example/x.png', alt: '' }],
      },
    ]);
    expect(errors.join('\n')).toMatch(/kebab-case/);
    expect(errors.join('\n')).toMatch(/duplicate/);
    expect(errors.join('\n')).toMatch(/link "github"/);
    expect(errors.join('\n')).toMatch(/local path/);
    expect(errors.join('\n')).toMatch(/alt text/);
  });

  it('hides hidden projects and gives the featured one the centre pedestal', () => {
    const projects: ProjectRecord[] = [
      { ...base, id: 'a', engine: 'unity' },
      { ...base, id: 'b', engine: 'unity', featured: true },
      { ...base, id: 'c', engine: 'unity', status: 'hidden' },
    ];
    expect(visibleProjects(projects).map((p) => p.id)).toEqual(['a', 'b']);
    const { placements } = assignProjectsToSlots(projects, EXHIBIT_SLOTS);
    expect(placements[0]?.id).toBe('exhibit:b');
    expect(placements[0]?.x).toBe(EXHIBIT_SLOTS.unity[0]?.x);
    expect(placements).toHaveLength(2);
  });

  it('warns instead of crashing when a wing runs out of pedestals', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ ...base, id: `p${String(i)}` }));
    expect(assignProjectsToSlots(many, EXHIBIT_SLOTS).warnings).toHaveLength(2);
  });

  it('has all four info panels', () => {
    expect(Object.keys(INFO_PANELS).sort()).toEqual(['about', 'contact', 'cv', 'skills']);
  });
});
