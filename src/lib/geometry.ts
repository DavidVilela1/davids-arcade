/** Plain geometry types shared by game logic, tests and UI. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface PixelRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
