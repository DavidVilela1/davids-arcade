/**
 * The single source of truth for "is gameplay suspended?". Anything that
 * covers the game (a dialog, the pause menu, the title screen) acquires a
 * named reason; gameplay resumes only when every reason is released.
 */
export type LockReason = 'title' | 'dialog' | 'menu' | 'transition';

export class GameplayLock {
  private readonly reasons = new Set<LockReason>();
  private readonly listeners = new Set<(locked: boolean) => void>();

  get locked(): boolean {
    return this.reasons.size > 0;
  }

  has(reason: LockReason): boolean {
    return this.reasons.has(reason);
  }

  acquire(reason: LockReason): void {
    const was = this.locked;
    this.reasons.add(reason);
    if (!was) this.notify();
  }

  release(reason: LockReason): void {
    if (!this.reasons.delete(reason)) return;
    if (!this.locked) this.notify();
  }

  /** Called with the new state whenever it flips between locked and unlocked. */
  subscribe(listener: (locked: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of [...this.listeners]) l(this.locked);
  }
}
