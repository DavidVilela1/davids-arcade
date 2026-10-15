/**
 * A minimal element builder. All text goes through textContent and all
 * attributes through setAttribute — the UI never uses innerHTML, so content
 * files cannot inject markup.
 */
export type Child = Node | string | null | undefined | false;
export type Attrs = Record<string, string | number | boolean | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    el.setAttribute(name, value === true ? '' : String(value));
  }
  append(el, ...children);
  return el;
}

export function append(parent: Element, ...children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

export function button(
  label: string,
  onClick: (event: MouseEvent) => void,
  attrs: Attrs = {},
): HTMLButtonElement {
  const el = h('button', { type: 'button', class: 'btn', ...attrs }, label);
  el.addEventListener('click', onClick);
  return el;
}

let idCounter = 0;
export function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
