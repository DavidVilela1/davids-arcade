/**
 * Persists the few things worth remembering between visits: sound settings
 * and which secrets were found. Storage failures (private mode, blocked
 * cookies) degrade to in-memory state without errors.
 */

export interface Settings {
  readonly muted: boolean;
  readonly music: boolean;
  readonly discoveries: readonly string[];
  readonly grateOpen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  music: true,
  discoveries: [],
  grateOpen: false,
};

export const STORAGE_KEY = 'davids-arcade:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function sanitize(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
  const v = value as Partial<Record<keyof Settings, unknown>>;
  return {
    muted: typeof v.muted === 'boolean' ? v.muted : DEFAULT_SETTINGS.muted,
    music: typeof v.music === 'boolean' ? v.music : DEFAULT_SETTINGS.music,
    discoveries: Array.isArray(v.discoveries)
      ? [...new Set(v.discoveries.filter((d): d is string => typeof d === 'string'))]
      : [],
    grateOpen: typeof v.grateOpen === 'boolean' ? v.grateOpen : DEFAULT_SETTINGS.grateOpen,
  };
}

export class SettingsStore {
  private state: Settings;
  private readonly listeners = new Set<(s: Settings) => void>();

  constructor(private readonly storage: StorageLike | null) {
    this.state = this.load();
  }

  /** Uses window.localStorage when it is actually usable. */
  static fromBrowser(): SettingsStore {
    try {
      const s = window.localStorage;
      const probe = `${STORAGE_KEY}:probe`;
      s.setItem(probe, '1');
      s.removeItem(probe);
      return new SettingsStore(s);
    } catch {
      return new SettingsStore(null);
    }
  }

  get value(): Settings {
    return this.state;
  }

  update(patch: Partial<Settings>): void {
    this.state = sanitize({ ...this.state, ...patch });
    this.save();
    for (const l of [...this.listeners]) l(this.state);
  }

  /** Returns true when the discovery is new. */
  discover(id: string): boolean {
    if (this.state.discoveries.includes(id)) return false;
    this.update({ discoveries: [...this.state.discoveries, id] });
    return true;
  }

  resetProgress(): void {
    this.update({ discoveries: [], grateOpen: false });
  }

  subscribe(listener: (s: Settings) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private load(): Settings {
    if (!this.storage) return DEFAULT_SETTINGS;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      return raw ? sanitize(JSON.parse(raw)) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private save(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota or privacy mode: keep working in memory.
    }
  }
}
