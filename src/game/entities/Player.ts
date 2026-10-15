/**
 * The player controller: smooth acceleration, Arcade Physics collision, a
 * small explicit state model and facing-aware animations. Input is passed in
 * each frame, so the class never reads the keyboard itself.
 */
import Phaser from 'phaser';
import type { Vec2 } from '../../lib/geometry';
import { stepVelocity } from '../../lib/movement';
import { DEPTH, MOVEMENT, PLAYER_BODY } from '../config/constants';
import { FACING_VECTORS, facingFromAxis, type Facing } from './facing';

export type PlayerState = 'idle' | 'walking' | 'interacting';
export type { Facing };

export const PLAYER_TEXTURE = 'player';
const COLUMNS = 7;
const ROW: Record<'down' | 'up' | 'side', number> = { down: 0, up: 1, side: 2 };
const BOX_ROW = 3;
const INTERACT_MS = 220;
const WALK_THRESHOLD = 6;

/** Registers the player animations once per game. */
export function createPlayerAnimations(anims: Phaser.Animations.AnimationManager): void {
  for (const [dir, row] of Object.entries(ROW)) {
    const base = row * COLUMNS;
    anims.create({
      key: `player:idle:${dir}`,
      frames: anims.generateFrameNumbers(PLAYER_TEXTURE, { frames: [base, base + 1] }),
      frameRate: 2,
      repeat: -1,
    });
    anims.create({
      key: `player:walk:${dir}`,
      frames: anims.generateFrameNumbers(PLAYER_TEXTURE, { start: base + 2, end: base + 5 }),
      frameRate: 9,
      repeat: -1,
    });
    anims.create({
      key: `player:interact:${dir}`,
      frames: anims.generateFrameNumbers(PLAYER_TEXTURE, { frames: [base + 6] }),
      frameRate: 1,
    });
  }
  const box = BOX_ROW * COLUMNS;
  anims.create({
    key: 'player:box:idle',
    frames: anims.generateFrameNumbers(PLAYER_TEXTURE, { frames: [box] }),
    frameRate: 1,
  });
  anims.create({
    key: 'player:box:walk',
    frames: anims.generateFrameNumbers(PLAYER_TEXTURE, { frames: [box + 1, box + 2] }),
    frameRate: 6,
    repeat: -1,
  });
}

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private facingDir: Facing = 'up';
  private currentState: PlayerState = 'idle';
  private interactUntil = 0;
  private disguised = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, PLAYER_TEXTURE, ROW.up * COLUMNS);
    this.sprite.setOrigin(0.5, 1);
    const body = this.body;
    body.setSize(PLAYER_BODY.w, PLAYER_BODY.h);
    body.setOffset(PLAYER_BODY.offsetX, PLAYER_BODY.offsetY);
    body.setCollideWorldBounds(false);
    this.playAnim();
  }

  get state(): PlayerState {
    return this.currentState;
  }

  get facing(): Facing {
    return this.facingDir;
  }

  get facingVector(): Vec2 {
    return FACING_VECTORS[this.facingDir];
  }

  get isDisguised(): boolean {
    return this.disguised;
  }

  /** The centre of the solid footprint — used for interaction and area checks. */
  get feet(): Vec2 {
    return { x: this.body.center.x, y: this.body.center.y };
  }

  update(time: number, deltaMs: number, axis: Vec2, speedMultiplier = 1): void {
    const body = this.body;
    const dt = Math.min(deltaMs, 50) / 1000;
    const v = stepVelocity(
      { x: body.velocity.x, y: body.velocity.y },
      axis,
      MOVEMENT,
      dt,
      speedMultiplier,
    );
    body.setVelocity(v.x, v.y);
    this.facingDir = facingFromAxis(axis, this.facingDir);

    const moving = Math.hypot(v.x, v.y) > WALK_THRESHOLD && (axis.x !== 0 || axis.y !== 0);
    if (time < this.interactUntil && !moving) this.currentState = 'interacting';
    else this.currentState = moving ? 'walking' : 'idle';
    this.sprite.setDepth(DEPTH.objects + this.sprite.y);
    this.playAnim();
  }

  /** Short "reach out" pose when using something. */
  playInteract(time: number): void {
    this.interactUntil = time + INTERACT_MS;
    this.halt();
    this.currentState = 'interacting';
    this.playAnim();
  }

  halt(): void {
    this.body.setVelocity(0, 0);
    if (this.currentState === 'walking') this.currentState = 'idle';
    this.playAnim();
  }

  teleport(x: number, y: number, facing: Facing = this.facingDir): void {
    this.body.reset(x, y);
    this.facingDir = facing;
    this.currentState = 'idle';
    this.sprite.setDepth(DEPTH.objects + this.sprite.y);
    this.playAnim();
  }

  setDisguised(disguised: boolean): void {
    this.disguised = disguised;
    this.playAnim();
  }

  private get body(): Phaser.Physics.Arcade.Body {
    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body))
      throw new Error('Player needs a dynamic body');
    return body;
  }

  private playAnim(): void {
    const s = this.sprite;
    if (this.disguised) {
      s.setFlipX(false);
      s.anims.play(this.currentState === 'walking' ? 'player:box:walk' : 'player:box:idle', true);
      return;
    }
    const dir = this.facingDir === 'left' || this.facingDir === 'right' ? 'side' : this.facingDir;
    s.setFlipX(this.facingDir === 'left');
    const anim =
      this.currentState === 'walking'
        ? 'walk'
        : this.currentState === 'interacting'
          ? 'interact'
          : 'idle';
    s.anims.play(`player:${anim}:${dir}`, true);
  }
}
