/**
 * Heads-up display: interaction prompt, area banner, toasts, the secrets
 * counter, the onboarding hint and the always-visible Sound / Menu buttons.
 */
import { KEY_LABELS } from '../game/config/constants';
import { button, h } from './dom';

const AREA_MS = 2400;
const TOAST_MS = 3200;
const HINT_MS = 11000;

export interface HudCallbacks {
  readonly onMenu: () => void;
  readonly onToggleSound: () => void;
}

export class Hud {
  readonly element: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly promptKey: HTMLElement;
  private readonly promptLabel: HTMLElement;
  private readonly area: HTMLElement;
  private readonly toasts: HTMLElement;
  private readonly secrets: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly soundBtn: HTMLButtonElement;
  private areaTimer = 0;
  private hintTimer = 0;

  constructor(
    parent: HTMLElement,
    callbacks: HudCallbacks,
    private readonly isTouch: () => boolean,
  ) {
    this.promptKey = h('kbd', { class: 'prompt__key' });
    this.promptLabel = h('span', { class: 'prompt__label' });
    this.prompt = h('div', { class: 'prompt', hidden: true }, this.promptKey, this.promptLabel);
    this.area = h('div', { class: 'area-banner', role: 'status', hidden: true });
    this.toasts = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    this.secrets = h('div', { class: 'hud__secrets', hidden: true });
    this.hint = h('div', { class: 'hint', hidden: true });
    this.soundBtn = button(
      'Sound',
      () => {
        callbacks.onToggleSound();
      },
      { class: 'btn btn--hud' },
    );
    const menuBtn = button(
      'Menu',
      () => {
        callbacks.onMenu();
      },
      { class: 'btn btn--hud', 'aria-keyshortcuts': 'Escape' },
    );

    this.element = h(
      'div',
      { class: 'hud' },
      h(
        'div',
        { class: 'hud__top' },
        this.secrets,
        h('div', { class: 'hud__buttons' }, this.soundBtn, menuBtn),
      ),
      this.area,
      this.toasts,
      this.hint,
      this.prompt,
    );
    parent.append(this.element);
  }

  setPrompt(label: string | null): void {
    if (!label) {
      this.prompt.hidden = true;
      return;
    }
    this.promptKey.textContent = this.isTouch() ? 'A' : KEY_LABELS.interact;
    this.promptLabel.textContent = label;
    this.prompt.hidden = false;
  }

  showArea(name: string, subtitle: string): void {
    window.clearTimeout(this.areaTimer);
    this.area.replaceChildren(h('strong', {}, name), h('span', {}, subtitle));
    this.area.hidden = false;
    this.area.classList.remove('is-leaving');
    this.areaTimer = window.setTimeout(() => {
      this.area.hidden = true;
    }, AREA_MS);
  }

  toast(message: string): void {
    const el = h('div', { class: 'toast' }, message);
    this.toasts.append(el);
    while (this.toasts.childElementCount > 3) this.toasts.firstElementChild?.remove();
    window.setTimeout(() => {
      el.remove();
    }, TOAST_MS);
  }

  setSecrets(found: number, total: number): void {
    this.secrets.hidden = found === 0;
    this.secrets.textContent = `Secrets ${found}/${total}`;
  }

  setSound(on: boolean): void {
    this.soundBtn.textContent = on ? 'Sound: On' : 'Sound: Off';
    this.soundBtn.setAttribute('aria-pressed', String(on));
  }

  showHint(): void {
    this.hint.textContent = this.isTouch()
      ? 'Use the D-pad to move and A to interact. Glowing markers show the exhibits.'
      : `WASD / arrow keys to move · ${KEY_LABELS.interact} to interact · ${KEY_LABELS.pause} for the menu`;
    this.hint.hidden = false;
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => {
      this.hint.hidden = true;
    }, HINT_MS);
  }

  destroy(): void {
    window.clearTimeout(this.areaTimer);
    window.clearTimeout(this.hintTimer);
    this.element.remove();
  }
}
