/**
 * Registry validation. Runs in unit tests and, in development builds, at
 * start-up so content mistakes show up as console warnings immediately.
 */
import { isSafeLocalPath, toSafeLink } from '../../lib/links';
import type { LinkItem, ProjectRecord } from './types';

const ENGINES = new Set(['godot', 'unity', 'unreal']);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateProjects(projects: readonly ProjectRecord[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const p of projects) {
    const where = `project "${p.id}"`;
    if (!ID.test(p.id)) errors.push(`${where}: id must be kebab-case`);
    if (seen.has(p.id)) errors.push(`${where}: duplicate id`);
    seen.add(p.id);
    if (!ENGINES.has(p.engine)) errors.push(`${where}: unknown engine "${p.engine}"`);
    if (p.title.trim() === '') errors.push(`${where}: title is required`);
    if (p.tagline.trim() === '') errors.push(`${where}: tagline is required`);
    if (p.role.trim() === '') errors.push(`${where}: role is required`);
    if (p.description.length === 0)
      errors.push(`${where}: description needs at least one paragraph`);
    for (const m of p.media ?? []) {
      if (!isSafeLocalPath(m.src)) errors.push(`${where}: media "${m.src}" must be a local path`);
      if (m.alt.trim() === '') errors.push(`${where}: media "${m.src}" needs alt text`);
    }
    for (const [key, value] of Object.entries(p.links ?? {})) {
      if (typeof value === 'string' && value !== '' && !toSafeLink(value)) {
        errors.push(`${where}: link "${key}" must be https:// or a local path`);
      }
    }
  }
  return errors;
}

export function validateLinks(links: readonly LinkItem[]): string[] {
  return links
    .filter((l) => l.href !== null && !toSafeLink(l.href))
    .map(
      (l) => `contact "${l.label}": "${l.href ?? ''}" must be https://, mailto: or a local path`,
    );
}

export function visibleProjects(projects: readonly ProjectRecord[]): ProjectRecord[] {
  return projects.filter((p) => p.status !== 'hidden');
}
