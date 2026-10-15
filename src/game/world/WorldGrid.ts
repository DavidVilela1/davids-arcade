/**
 * Builds the logical tile grid (floor / wall / void + area ownership) from the
 * declarative room data. Pure and Phaser-free so it can be unit-tested.
 */
import type { AreaId, FloorRect } from '../data/world';

export type CellKind = 'void' | 'wall' | 'floor';

export interface Cell {
  readonly kind: CellKind;
  readonly area: AreaId | null;
}

export class WorldGrid {
  private readonly cells: Cell[];

  constructor(
    readonly cols: number,
    readonly rows: number,
    floors: readonly FloorRect[],
  ) {
    this.cells = Array.from({ length: cols * rows }, () => ({ kind: 'void', area: null }));
    for (const { area, rect } of floors) {
      for (let y = rect.y; y < rect.y + rect.h; y++)
        for (let x = rect.x; x < rect.x + rect.w; x++) this.put(x, y, { kind: 'floor', area });
    }
    // Wrap every floor tile in walls: one tile on the sides and south, three to
    // the north so wall faces (two rows) and a wall top fit above each room.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (this.kind(x, y) !== 'floor') continue;
        for (let dy = -3; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (this.inBounds(x + dx, y + dy) && this.kind(x + dx, y + dy) === 'void')
              this.put(x + dx, y + dy, { kind: 'wall', area: null });
      }
    }
    // Close one-tile gaps between neighbouring wall bands so no void shows through.
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        if (
          this.kind(x, y) === 'void' &&
          ((this.kind(x, y - 1) === 'wall' && this.kind(x, y + 1) === 'wall') ||
            (this.kind(x - 1, y) === 'wall' && this.kind(x + 1, y) === 'wall'))
        )
          this.put(x, y, { kind: 'wall', area: null });
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  get(x: number, y: number): Cell {
    if (!this.inBounds(x, y)) return { kind: 'void', area: null };
    const cell = this.cells[y * this.cols + x];
    if (!cell) throw new Error(`Cell ${x},${y} missing`);
    return cell;
  }

  kind(x: number, y: number): CellKind {
    return this.get(x, y).kind;
  }

  isFloor(x: number, y: number): boolean {
    return this.kind(x, y) === 'floor';
  }

  isSolid(x: number, y: number): boolean {
    return !this.isFloor(x, y);
  }

  areaAt(x: number, y: number): AreaId | null {
    return this.get(x, y).area;
  }

  private put(x: number, y: number, cell: Cell): void {
    if (this.inBounds(x, y)) this.cells[y * this.cols + x] = cell;
  }
}
