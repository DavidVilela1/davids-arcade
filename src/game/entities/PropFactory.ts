/**
 * Creates prop sprites, their solid footprints and exhibit markers from
 * resolved placements. Also registers prop animations.
 */
import Phaser from 'phaser';
import {
  PROP_DEFS,
  OVERLAY_FRAMES,
  propFrameNames,
  type PropDef,
  type PropId,
} from '../data/props';
import { TEXTURES } from '../config/assets';
import { DEPTH } from '../config/constants';
import type { ResolvedPlacement } from '../world/worldLayout';

export interface SpawnedProp {
  readonly placement: ResolvedPlacement;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly marker: Phaser.GameObjects.Sprite | null;
}

export function createPropAnimations(anims: Phaser.Animations.AnimationManager): void {
  for (const id of Object.keys(PROP_DEFS) as PropId[]) {
    const def: PropDef = PROP_DEFS[id];
    if (!def.anim) continue;
    anims.create({
      key: `prop:${id}`,
      frames: propFrameNames(id).map((frame) => ({ key: TEXTURES.props.key, frame })),
      frameRate: def.anim.fps,
      repeat: -1,
    });
  }
  anims.create({
    key: 'overlay:marker',
    frames: [0, 1].map((i) => ({
      key: TEXTURES.props.key,
      frame: `${OVERLAY_FRAMES.marker}_${i}`,
    })),
    frameRate: 2,
    repeat: -1,
  });
}

export function propFrameSize(
  textures: Phaser.Textures.TextureManager,
  prop: PropId,
): { w: number; h: number } {
  const frame = textures.getFrame(TEXTURES.props.key, propFrameNames(prop)[0]);
  if (!frame.name) throw new Error(`Missing atlas frame for ${prop}`);
  return { w: frame.width, h: frame.height };
}

export function spawnProps(
  scene: Phaser.Scene,
  placements: readonly ResolvedPlacement[],
  solids: Phaser.Physics.Arcade.StaticGroup,
  reducedMotion: boolean,
): SpawnedProp[] {
  return placements.map((p, index) => {
    const def: PropDef = PROP_DEFS[p.prop];
    const frames = propFrameNames(p.prop);
    const sprite = scene.add.sprite(p.x, p.y, TEXTURES.props.key, frames[0]).setOrigin(0, 0);
    if (def.anim) sprite.anims.play({ key: `prop:${p.prop}`, startFrame: index % def.anim.frames });

    const bottom = Math.max(p.y + p.h, ...p.bodies.map((b) => b.y + b.h));
    sprite.setDepth(
      def.layer === 'floor'
        ? DEPTH.floorProp
        : def.layer === 'wall'
          ? DEPTH.wallProp
          : DEPTH.objects + bottom,
    );

    for (const b of p.bodies) {
      const zone = scene.add.zone(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
      solids.add(zone);
    }

    let marker: Phaser.GameObjects.Sprite | null = null;
    if (p.marker) {
      marker = scene.add
        .sprite(p.x + p.w / 2, p.y - 4, TEXTURES.props.key, `${OVERLAY_FRAMES.marker}_0`)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.overlay);
      marker.anims.play('overlay:marker');
      if (!reducedMotion) {
        scene.tweens.add({
          targets: marker,
          y: marker.y - 3,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: Phaser.Math.Easing.Sine.InOut,
          delay: (index * 137) % 700,
        });
      }
    }
    return { placement: p, sprite, marker };
  });
}
