/**
 * Shared content types. Everything a visitor reads (projects, panels, notes,
 * codec transcripts) is plain data described here and rendered by the DOM UI.
 */

export type EngineId = 'godot' | 'unity' | 'unreal';

export type ProjectStatus = 'sample' | 'published' | 'hidden';

export interface ProjectMedia {
  /** Only local files are supported (under /public). Videos are never autoplayed. */
  readonly type: 'image' | 'video';
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
}

export interface ProjectLinks {
  readonly github?: string | null;
  readonly itch?: string | null;
  readonly demo?: string | null;
  readonly video?: string | null;
}

export interface ProjectRecord {
  /** Unique, kebab-case. */
  readonly id: string;
  readonly title: string;
  readonly engine: EngineId;
  /** One-liner shown first in the modal. */
  readonly tagline: string;
  /** Longer description, one string per paragraph. */
  readonly description: readonly string[];
  readonly role: string;
  readonly tech: readonly string[];
  /** Free-form, e.g. "2024 – 2025" or "Game jam, 48 h". */
  readonly period?: string;
  readonly highlights: readonly string[];
  readonly media?: readonly ProjectMedia[];
  readonly links?: ProjectLinks;
  /** `sample` entries are clearly labelled placeholders; `hidden` entries are not shown. */
  readonly status: ProjectStatus;
  /** Featured projects take the centre pedestal of their wing. */
  readonly featured?: boolean;
}

export interface LinkItem {
  readonly label: string;
  readonly href: string | null;
  /** Shown when `href` is null (development builds only). */
  readonly hint?: string;
}

export type InfoSection =
  | {
      readonly kind: 'paragraphs';
      readonly heading?: string;
      readonly paragraphs: readonly string[];
    }
  | {
      readonly kind: 'list';
      readonly heading?: string;
      readonly items: readonly string[];
      /** Marks the list as sample content that must be replaced. */
      readonly placeholder?: boolean;
    }
  | { readonly kind: 'links'; readonly heading?: string; readonly links: readonly LinkItem[] };

export interface InfoPanel {
  readonly id: string;
  readonly title: string;
  readonly kicker?: string;
  readonly sections: readonly InfoSection[];
}

export interface NoteContent {
  readonly title: string;
  readonly lines: readonly string[];
  /** e.g. "A tribute to Dark Souls" — keeps references explicit and unaffiliated. */
  readonly footnote?: string;
}

export interface CodecLine {
  readonly speaker: 'david' | 'control';
  readonly text: string;
}

export interface CodecChannel {
  readonly frequency: string;
  readonly name: string;
  readonly lines: readonly CodecLine[];
  /** The save line shows live discovery progress and a reset button. */
  readonly showsProgress?: boolean;
}

export interface CodecContent {
  readonly channels: readonly CodecChannel[];
  readonly portraits: { readonly david: string; readonly control: string };
}

export interface MenuContent {
  readonly secrets: readonly { readonly title: string; readonly found: boolean }[];
}

export interface DirectoryEntry {
  readonly id: string;
  readonly group: string;
  readonly label: string;
  readonly content: DialogContent;
}

export type DialogContent =
  | { readonly kind: 'project'; readonly project: ProjectRecord }
  | { readonly kind: 'info'; readonly panel: InfoPanel }
  | { readonly kind: 'note'; readonly note: NoteContent }
  | { readonly kind: 'codec'; readonly codec: CodecContent }
  | { readonly kind: 'menu'; readonly menu: MenuContent }
  | { readonly kind: 'directory'; readonly entries: readonly DirectoryEntry[] };
