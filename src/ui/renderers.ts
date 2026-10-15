/**
 * Turns DialogContent into DOM. One function per content kind; all of them
 * degrade gracefully when optional data (media, links, dates) is missing.
 */
import type { SettingsStore } from '../lib/SettingsStore';
import { toSafeLink } from '../lib/links';
import type {
  CodecContent,
  DialogContent,
  DirectoryEntry,
  InfoPanel,
  InfoSection,
  LinkItem,
  MenuContent,
  NoteContent,
  ProjectMedia,
  ProjectRecord,
} from '../game/data/types';
import { KEY_LABELS } from '../game/config/constants';
import { button, h, uid } from './dom';
import type { ContentRenderer, Modal, Rendered } from './Modal';

export interface RenderContext {
  readonly dev: boolean;
  readonly settings: SettingsStore;
  readonly touch: () => boolean;
  readonly secretCounts: () => { found: number; total: number };
  readonly actions: {
    resume(): void;
    returnToHub(): void;
    toggleSound(): void;
    toggleMusic(): void;
    resetProgress(): void;
    directory(): DialogContent;
    tune(): void;
  };
}

const ENGINE_LABEL = { godot: 'Godot', unity: 'Unity', unreal: 'Unreal Engine' } as const;

function linkEl(
  label: string,
  href: string | null | undefined,
  hint?: string,
  dev = false,
): HTMLElement | null {
  const safe = toSafeLink(href);
  if (safe) {
    return h(
      'a',
      {
        class: 'btn btn--link',
        href: safe.href,
        target: safe.external ? '_blank' : null,
        rel: safe.external ? 'noopener noreferrer' : null,
      },
      label,
      safe.external ? h('span', { class: 'visually-hidden' }, ' (opens in a new tab)') : null,
    );
  }
  if (!dev) return null;
  return h(
    'span',
    { class: 'btn btn--disabled', title: hint ?? 'Not configured' },
    label,
    h('small', {}, href ? ' — invalid URL' : ' — not configured'),
  );
}

function linkRow(items: (HTMLElement | null)[], emptyText: string): HTMLElement {
  const present = items.filter((i): i is HTMLElement => i !== null);
  if (present.length === 0) return h('p', { class: 'muted' }, emptyText);
  return h('div', { class: 'link-row' }, ...present);
}

function mediaEl(media: ProjectMedia): HTMLElement {
  const fallback = () =>
    h(
      'div',
      { class: 'media media--missing', role: 'img', 'aria-label': media.alt },
      'Media unavailable',
    );
  if (media.type === 'video') {
    const video = h('video', {
      class: 'media__video',
      controls: true,
      preload: 'none',
      src: media.src,
      'aria-label': media.alt,
    });
    video.addEventListener('error', () => {
      video.replaceWith(fallback());
    });
    return h(
      'figure',
      { class: 'media' },
      video,
      media.caption ? h('figcaption', {}, media.caption) : null,
    );
  }
  const img = h('img', {
    class: 'media__img',
    src: media.src,
    alt: media.alt,
    loading: 'lazy',
    decoding: 'async',
  });
  img.addEventListener('error', () => {
    img.replaceWith(fallback());
  });
  return h(
    'figure',
    { class: 'media' },
    img,
    media.caption ? h('figcaption', {}, media.caption) : null,
  );
}

function renderProject(p: ProjectRecord, ctx: RenderContext): Rendered {
  const facts = h('dl', { class: 'facts' });
  const fact = (term: string, value: Node | string) => {
    facts.append(h('div', { class: 'facts__row' }, h('dt', {}, term), h('dd', {}, value)));
  };
  fact('Role', p.role);
  if (p.tech.length > 0)
    fact('Tech', h('ul', { class: 'chips' }, ...p.tech.map((t) => h('li', {}, t))));
  if (p.period) fact('Period', p.period);

  const links = p.links ?? {};
  const body = h(
    'div',
    { class: 'content content--project' },
    p.status === 'sample'
      ? h(
          'p',
          { class: 'badge badge--sample' },
          'Sample exhibit — replace with your work in src/game/data/projects.ts',
        )
      : null,
    h('p', { class: 'lead' }, p.tagline),
    ...(p.media ?? []).map(mediaEl),
    facts,
    ...p.description.map((para) => h('p', {}, para)),
    p.highlights.length > 0
      ? h(
          'section',
          {},
          h('h3', {}, 'Highlights'),
          h('ul', { class: 'bullets' }, ...p.highlights.map((x) => h('li', {}, x))),
        )
      : null,
    h(
      'section',
      {},
      h('h3', {}, 'Links'),
      linkRow(
        [
          linkEl('Play the build', links.demo, 'Set links.demo', ctx.dev),
          linkEl('itch.io', links.itch, 'Set links.itch', ctx.dev),
          linkEl('GitHub', links.github, 'Set links.github', ctx.dev),
          linkEl('Video', links.video, 'Set links.video', ctx.dev),
        ],
        'Links coming soon.',
      ),
    ),
  );
  return { title: p.title, kicker: `${ENGINE_LABEL[p.engine]} wing`, body };
}

function renderSection(section: InfoSection, ctx: RenderContext): HTMLElement {
  const heading = section.heading ? h('h3', {}, section.heading) : null;
  switch (section.kind) {
    case 'paragraphs':
      return h('section', {}, heading, ...section.paragraphs.map((p) => h('p', {}, p)));
    case 'list':
      return h(
        'section',
        {},
        heading,
        section.placeholder
          ? h(
              'p',
              { class: 'badge badge--sample' },
              'Sample content — replace in src/game/data/infoPanels.ts',
            )
          : null,
        h('ul', { class: 'bullets' }, ...section.items.map((i) => h('li', {}, i))),
      );
    case 'links':
      return h(
        'section',
        {},
        heading,
        linkRow(
          section.links.map((l: LinkItem) => linkEl(l.label, l.href, l.hint, ctx.dev)),
          'Coming soon.',
        ),
      );
  }
}

function renderInfo(panel: InfoPanel, ctx: RenderContext): Rendered {
  return {
    title: panel.title,
    ...(panel.kicker ? { kicker: panel.kicker } : {}),
    body: h('div', { class: 'content' }, ...panel.sections.map((s) => renderSection(s, ctx))),
  };
}

function renderNote(note: NoteContent): Rendered {
  return {
    title: note.title,
    body: h(
      'div',
      { class: 'content content--note' },
      ...note.lines.map((l) => h('p', {}, l)),
      note.footnote ? h('p', { class: 'footnote' }, note.footnote) : null,
    ),
  };
}

function renderCodec(codec: CodecContent, ctx: RenderContext): Rendered {
  let index = 0;
  const freq = h('output', { class: 'codec__freq', 'aria-live': 'polite' });
  const name = h('span', { class: 'codec__name' });
  const transcript = h('ol', { class: 'codec__transcript' });
  const extras = h('div', { class: 'codec__extras' });
  const statusId = uid('codec-status');

  const show = () => {
    const channel = codec.channels[index];
    if (!channel) return;
    freq.textContent = channel.frequency;
    name.textContent = channel.name;
    transcript.replaceChildren(
      ...channel.lines.map((line) =>
        h(
          'li',
          { class: `codec__line codec__line--${line.speaker}` },
          h('span', { class: 'codec__speaker' }, line.speaker === 'david' ? 'DAVID' : 'CONTROL'),
          h('span', { class: 'codec__text' }, line.text),
        ),
      ),
    );
    extras.replaceChildren();
    if (channel.showsProgress) {
      const { found, total } = ctx.secretCounts();
      extras.append(
        h('p', { id: statusId, class: 'codec__progress' }, `Secrets found: ${found} / ${total}`),
        button(
          'Forget my discoveries',
          () => {
            ctx.actions.resetProgress();
            show();
          },
          { class: 'btn btn--ghost', 'aria-describedby': statusId },
        ),
      );
    }
  };
  const tune = (step: number) => {
    index = (index + step + codec.channels.length) % codec.channels.length;
    ctx.actions.tune();
    show();
  };

  const prev = button(
    '‹',
    () => {
      tune(-1);
    },
    { class: 'btn btn--icon', 'aria-label': 'Previous frequency' },
  );
  const next = button(
    '›',
    () => {
      tune(1);
    },
    { class: 'btn btn--icon', 'aria-label': 'Next frequency' },
  );

  const body = h(
    'div',
    { class: 'codec' },
    h(
      'div',
      { class: 'codec__screen' },
      h('img', {
        class: 'codec__portrait',
        src: codec.portraits.david,
        alt: 'David, on the codec',
      }),
      h(
        'div',
        { class: 'codec__dial' },
        prev,
        h('div', { class: 'codec__readout' }, freq, name),
        next,
      ),
      h('img', {
        class: 'codec__portrait',
        src: codec.portraits.control,
        alt: 'Mission Control, on the codec',
      }),
    ),
    transcript,
    extras,
    h(
      'p',
      { class: 'footnote' },
      'A tribute to Metal Gear Solid. Not affiliated with its creators. Use ‹ › or the arrow keys to tune.',
    ),
  );
  body.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') tune(-1);
    else if (event.key === 'ArrowRight') tune(1);
    else return;
    event.preventDefault();
  });
  show();
  return { title: 'Codec', kicker: 'Back channel', body, variant: 'codec' };
}

/** A button that flips a setting and updates its own label, so focus stays put. */
function toggle(
  read: () => boolean,
  label: (on: boolean) => string,
  flip: () => void,
): HTMLButtonElement {
  const el = button(label(read()), () => {
    flip();
    el.textContent = label(read());
    el.setAttribute('aria-pressed', String(read()));
  });
  el.setAttribute('aria-pressed', String(read()));
  return el;
}

function renderMenu(menu: MenuContent, ctx: RenderContext, modal: Modal): Rendered {
  const found = menu.secrets.filter((x) => x.found).length;
  const touch = ctx.touch();
  const controls: [string, string][] = touch
    ? [
        ['Move', 'D-pad (bottom left)'],
        ['Interact', 'A button'],
        ['Menu', 'Menu button'],
      ]
    : [
        ['Move', 'WASD or arrow keys'],
        ['Interact', `${KEY_LABELS.interact}, Space or Enter`],
        ['Menu / close', KEY_LABELS.pause],
        ['Back to the Lobby', KEY_LABELS.hub],
        ['Mute', KEY_LABELS.mute],
      ];
  const body = h(
    'div',
    { class: 'content content--menu' },
    h(
      'div',
      { class: 'menu-actions' },
      button(
        'Resume',
        () => {
          ctx.actions.resume();
        },
        { class: 'btn btn--primary' },
      ),
      button('Exhibit directory', () => {
        modal.navigate(ctx.actions.directory());
      }),
      button('Return to the Lobby', () => {
        ctx.actions.returnToHub();
      }),
      toggle(
        () => !ctx.settings.value.muted,
        (on) => `Sound: ${on ? 'On' : 'Off'}`,
        () => {
          ctx.actions.toggleSound();
        },
      ),
      toggle(
        () => ctx.settings.value.music,
        (on) => `Music: ${on ? 'On' : 'Off'}`,
        () => {
          ctx.actions.toggleMusic();
        },
      ),
    ),
    h(
      'section',
      {},
      h('h3', {}, 'Controls'),
      h(
        'dl',
        { class: 'facts' },
        ...controls.map(([k, v]) =>
          h('div', { class: 'facts__row' }, h('dt', {}, k), h('dd', {}, v)),
        ),
      ),
    ),
    h(
      'section',
      {},
      h('h3', {}, `Secrets found: ${found} / ${menu.secrets.length}`),
      h(
        'ul',
        { class: 'secrets' },
        ...menu.secrets.map((x) =>
          h('li', { class: x.found ? 'is-found' : '' }, x.found ? x.title : '???'),
        ),
      ),
    ),
    h(
      'p',
      { class: 'footnote' },
      'Original pixel art, sound and code. Game references are fan tributes and are not affiliated with or endorsed by their owners.',
    ),
  );
  return { title: 'Paused', kicker: "David's Arcade", body };
}

function renderDirectory(entries: readonly DirectoryEntry[], modal: Modal): Rendered {
  const groups = new Map<string, DirectoryEntry[]>();
  for (const e of entries) groups.set(e.group, [...(groups.get(e.group) ?? []), e]);
  const body = h(
    'div',
    { class: 'content content--directory' },
    h('p', { class: 'muted' }, 'Everything in the arcade, without the walking.'),
    ...[...groups].map(([group, items]) =>
      h(
        'section',
        {},
        h('h3', {}, group),
        h(
          'ul',
          { class: 'directory' },
          ...items.map((item) =>
            h(
              'li',
              {},
              button(item.label, () => {
                modal.navigate(item.content);
              }),
            ),
          ),
        ),
      ),
    ),
  );
  return { title: 'Exhibit directory', body };
}

export function createRenderer(ctx: RenderContext): ContentRenderer {
  return (content, modal) => {
    switch (content.kind) {
      case 'project':
        return renderProject(content.project, ctx);
      case 'info':
        return renderInfo(content.panel, ctx);
      case 'note':
        return renderNote(content.note);
      case 'codec':
        return renderCodec(content.codec, ctx);
      case 'menu':
        return renderMenu(content.menu, ctx, modal);
      case 'directory':
        return renderDirectory(content.entries, modal);
    }
  };
}
