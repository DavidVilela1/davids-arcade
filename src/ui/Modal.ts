/**
 * The accessible dialog shell used for exhibits, panels, notes, the codec,
 * the exhibit directory and the pause menu. Built on <dialog> + showModal(),
 * which makes the game inert behind it and traps focus natively.
 *
 * - Escape, the Close button and clicking the backdrop all close it.
 * - Focus moves into the dialog on open and returns where it was on close.
 * - While open it holds a GameplayLock reason, which pauses the game.
 */
import type { GameplayLock, LockReason } from '../lib/GameplayLock';
import type { DialogContent } from '../game/data/types';
import { h } from './dom';

export interface Rendered {
  readonly title: string;
  readonly kicker?: string;
  readonly body: HTMLElement;
  /** Extra class on the dialog, e.g. for the codec's special styling. */
  readonly variant?: string;
}

export type ContentRenderer = (content: DialogContent, modal: Modal) => Rendered;

export interface OpenOptions {
  /** World object that opened the dialog; reported back on close. */
  readonly sourceId?: string;
  readonly reason?: Extract<LockReason, 'dialog' | 'menu'>;
}

export class Modal {
  readonly element: HTMLDialogElement;
  private readonly titleEl: HTMLHeadingElement;
  private readonly kickerEl: HTMLParagraphElement;
  private readonly bodyEl: HTMLDivElement;
  private readonly backBtn: HTMLButtonElement;
  private stack: DialogContent[] = [];
  private sourceId: string | null = null;
  private reason: Extract<LockReason, 'dialog' | 'menu'> = 'dialog';
  private returnFocus: Element | null = null;
  private renderer: ContentRenderer | null = null;

  constructor(
    parent: HTMLElement,
    private readonly lock: GameplayLock,
    private readonly onClosed: (sourceId: string | null) => void,
    private readonly fallbackFocus: HTMLElement,
  ) {
    const titleId = 'modal-title';
    this.titleEl = h('h2', { id: titleId, class: 'modal__title' });
    this.kickerEl = h('p', { class: 'modal__kicker' });
    this.backBtn = h(
      'button',
      { type: 'button', class: 'btn btn--ghost modal__back', hidden: true },
      '‹ Back',
    );
    const closeBtn = h(
      'button',
      { type: 'button', class: 'btn btn--ghost modal__close', 'aria-label': 'Close' },
      'Close',
    );
    this.bodyEl = h('div', { class: 'modal__body', tabindex: -1 });
    this.element = h(
      'dialog',
      { class: 'modal', 'aria-labelledby': titleId },
      h(
        'div',
        { class: 'modal__frame' },
        h(
          'header',
          { class: 'modal__header' },
          this.backBtn,
          h('div', { class: 'modal__heading' }, this.kickerEl, this.titleEl),
          closeBtn,
        ),
        this.bodyEl,
      ),
    );
    parent.append(this.element);

    closeBtn.addEventListener('click', () => {
      this.close();
    });
    this.backBtn.addEventListener('click', () => {
      this.back();
    });
    this.element.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
    // Clicks on the ::backdrop land on the <dialog> itself.
    this.element.addEventListener('click', (event) => {
      if (event.target === this.element) this.close();
    });
  }

  setRenderer(renderer: ContentRenderer): void {
    this.renderer = renderer;
  }

  get isOpen(): boolean {
    return this.element.open;
  }

  get current(): DialogContent | null {
    return this.stack[this.stack.length - 1] ?? null;
  }

  open(content: DialogContent, options: OpenOptions = {}): void {
    if (this.isOpen) {
      // Never stack duplicate dialogs; replace the content instead.
      this.stack = [content];
      this.sourceId = options.sourceId ?? null;
      this.render();
      return;
    }
    this.returnFocus = document.activeElement;
    this.stack = [content];
    this.sourceId = options.sourceId ?? null;
    this.reason = options.reason ?? 'dialog';
    this.lock.acquire(this.reason);
    this.render();
    this.element.showModal();
    this.bodyEl.focus({ preventScroll: true });
  }

  /** Shows another piece of content inside the same dialog (with a Back button). */
  navigate(content: DialogContent): void {
    this.stack.push(content);
    this.render();
    this.bodyEl.focus({ preventScroll: true });
  }

  back(): void {
    if (this.stack.length <= 1) return;
    this.stack.pop();
    this.render();
    this.bodyEl.focus({ preventScroll: true });
  }

  /** Re-renders the current content (e.g. after a setting changes). */
  refresh(): void {
    if (this.isOpen) this.render(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.element.close();
    this.stack = [];
    const source = this.sourceId;
    this.sourceId = null;
    this.lock.release(this.reason);
    const target = this.returnFocus;
    this.returnFocus = null;
    if (target instanceof HTMLElement && target.isConnected && target !== document.body)
      target.focus();
    else this.fallbackFocus.focus({ preventScroll: true });
    this.onClosed(source);
  }

  private render(keepScroll = false): void {
    const content = this.current;
    if (!content || !this.renderer) return;
    const scroll = keepScroll ? this.bodyEl.scrollTop : 0;
    const rendered = this.renderer(content, this);
    this.titleEl.textContent = rendered.title;
    this.kickerEl.textContent = rendered.kicker ?? '';
    this.kickerEl.hidden = !rendered.kicker;
    this.backBtn.hidden = this.stack.length <= 1;
    this.element.className = rendered.variant ? `modal modal--${rendered.variant}` : 'modal';
    this.bodyEl.replaceChildren(rendered.body);
    this.bodyEl.scrollTop = scroll;
  }
}
