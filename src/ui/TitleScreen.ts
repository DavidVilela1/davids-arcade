/**
 * The title card. Its "Enter" button is the user gesture that unlocks audio,
 * and it offers a no-walking route straight to the exhibit directory.
 */
import { PROFILE } from '../game/data/profile';
import { button, h } from './dom';

export interface TitleCallbacks {
  readonly onEnter: () => void;
  readonly onDirectory: () => void;
  readonly onToggleSound: () => boolean;
}

export class TitleScreen {
  readonly element: HTMLDialogElement;

  constructor(parent: HTMLElement, callbacks: TitleCallbacks, soundOn: boolean, isTouch: boolean) {
    const enter = button(
      'Enter the arcade',
      () => {
        this.close();
        callbacks.onEnter();
      },
      { class: 'btn btn--primary btn--large' },
    );
    const directory = button('Browse exhibits as a list', () => {
      callbacks.onDirectory();
    });
    const sound = button(
      `Sound: ${soundOn ? 'On' : 'Off'}`,
      () => {
        const on = callbacks.onToggleSound();
        sound.textContent = `Sound: ${on ? 'On' : 'Off'}`;
        sound.setAttribute('aria-pressed', String(on));
      },
      { 'aria-pressed': String(soundOn) },
    );

    const controls = isTouch
      ? 'D-pad to move · A to interact · Menu button to pause'
      : 'WASD / arrows to move · E or Space to interact · Esc for the menu';

    this.element = h(
      'dialog',
      { class: 'title', 'aria-labelledby': 'title-heading', 'aria-describedby': 'title-desc' },
      h(
        'div',
        { class: 'title__card' },
        h('p', { class: 'title__kicker' }, 'An interactive game development portfolio'),
        h('h1', { id: 'title-heading', class: 'title__name' }, PROFILE.arcadeName),
        h(
          'p',
          { id: 'title-desc', class: 'title__by' },
          `by ${PROFILE.name}`,
          h('span', {}, `“${PROFILE.alias}”`),
        ),
        h('div', { class: 'title__actions' }, enter, directory, sound),
        h('p', { class: 'title__controls' }, controls),
      ),
    );
    // Escape on the title screen does nothing: it is the entrance, not a popup.
    this.element.addEventListener('cancel', (event) => {
      event.preventDefault();
    });
    parent.append(this.element);
    this.element.showModal();
    enter.focus();
  }

  close(): void {
    if (this.element.open) this.element.close();
    this.element.remove();
  }
}
