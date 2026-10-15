/**
 * The arcade world. This scene orchestrates: it builds the map from data,
 * spawns props and the player, and wires systems together. Game rules live in
 * the systems and pure modules it calls.
 */
import Phaser from 'phaser';
import type { GameplayLock } from '../../lib/GameplayLock';
import type { SettingsStore } from '../../lib/SettingsStore';
import type { Vec2 } from '../../lib/geometry';
import { DATA, TEXTURES, type SfxKey } from '../config/assets';
import { AUDIO, DEPTH, FOOTSTEP_INTERVAL_MS, RESUME_GRACE_MS } from '../config/constants';
import { EASTER_EGGS, ROOM_DISCOVERY, findEgg } from '../data/easterEggs';
import { INFO_PANELS } from '../data/infoPanels';
import { PROFILE } from '../data/profile';
import { PROJECTS } from '../data/projects';
import type { DialogContent } from '../data/types';
import { validateLinks, validateProjects } from '../data/validation';
import {
  AREAS,
  CARPETS,
  DOORS,
  EXHIBIT_SLOTS,
  PLACEMENTS,
  POINTS,
  REGIONS,
  ROOMS,
  TILE,
  WORLD_COLS,
  WORLD_ROWS,
  type AreaId,
  type RegionId,
} from '../data/world';
import { Player, type Facing } from '../entities/Player';
import { propFrameSize, spawnProps, type SpawnedProp } from '../entities/PropFactory';
import { GameEvent, type GameEventBus } from '../events/events';
import { resolveInteraction, type Interactable } from '../interactions/interactions';
import { AudioManager } from '../systems/AudioManager';
import { EffectRunner, type EffectHost, type TravelTarget } from '../systems/EffectRunner';
import { InputController, type KeyEventTarget } from '../systems/InputController';
import { EMPTY, buildTileLayers, parseTilesetManifest } from '../world/autotile';
import { laneAssist } from '../world/laneAssist';
import { WorldGrid } from '../world/WorldGrid';
import { layoutWorld } from '../world/worldLayout';

export const MAIN_SCENE = 'main';

export interface MainSceneDeps {
  readonly bus: GameEventBus;
  readonly lock: GameplayLock;
  readonly settings: SettingsStore;
  readonly reducedMotion: boolean;
  readonly keyTarget: KeyEventTarget;
}

/** Read-only state exposed to automated browser tests in development builds. */
export interface ArcadeDebugState {
  readonly x: number;
  readonly y: number;
  readonly area: AreaId | null;
  readonly locked: boolean;
  readonly prompt: string | null;
  readonly playerState: string;
  readonly disguised: boolean;
}

const CAMERA_FOLLOW_OFFSET_Y = 12;
const FADE_MS = 180;

export class MainScene extends Phaser.Scene implements EffectHost {
  private grid!: WorldGrid;
  private player!: Player;
  private controls!: InputController;
  private audio!: AudioManager;
  private effects!: EffectRunner;
  private props: SpawnedProp[] = [];
  private interactables: Interactable[] = [];
  private currentArea: AreaId | null = null;
  private currentRegion: RegionId = 'main';
  private promptLabel: string | null = null;
  private target: Interactable | null = null;
  private lastStep = 0;
  private readonly cleanups: (() => void)[] = [];

  constructor(private readonly deps: MainSceneDeps) {
    super(MAIN_SCENE);
  }

  create(): void {
    const { bus, lock, settings } = this.deps;
    this.cameras.main.setBackgroundColor('#0e0b0c');
    this.grid = new WorldGrid(WORLD_COLS, WORLD_ROWS, [...ROOMS, ...DOORS]);
    const wallLayer = this.buildTilemap();

    const layout = layoutWorld({
      placements: PLACEMENTS,
      projects: PROJECTS,
      slots: EXHIBIT_SLOTS,
      frameSize: (prop) => propFrameSize(this.textures, prop),
      eggPrompt: (id) => findEgg(id)?.prompt ?? 'Inspect',
    });
    if (import.meta.env.DEV) {
      for (const w of [
        ...layout.warnings,
        ...validateProjects(PROJECTS),
        ...validateLinks(PROFILE.contacts),
      ])
        console.warn(`[content] ${w}`);
    }

    const solids = this.physics.add.staticGroup();
    this.props = spawnProps(this, layout.placements, solids, this.deps.reducedMotion);
    this.interactables = this.props.flatMap((p) =>
      p.placement.interactable ? [p.placement.interactable] : [],
    );

    this.player = new Player(this, POINTS.spawn.x, POINTS.spawn.y);
    this.physics.add.collider(this.player.sprite, wallLayer);
    this.physics.add.collider(this.player.sprite, solids);

    const cam = this.cameras.main;
    cam.setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.15, 0.15);
    cam.setFollowOffset(0, CAMERA_FOLLOW_OFFSET_Y);
    this.setRegion('main', true);

    this.controls = new InputController(this.deps.keyTarget);
    this.audio = new AudioManager(this.sound, settings);
    this.effects = new EffectRunner(this, settings);
    this.applyGrateVisual(settings.value.grateOpen);

    this.cleanups.push(
      lock.subscribe((locked) => {
        this.onLockChange(locked);
      }),
      bus.on(GameEvent.ExhibitClose, () => {
        this.audio.play('ui_close');
      }),
      bus.on(GameEvent.Start, () => {
        this.audio.start();
      }),
      bus.on(GameEvent.ReturnToHub, () => {
        this.transitionTo(POINTS.bonfire, 'down');
      }),
      bus.on(GameEvent.ResetProgress, () => {
        settings.resetProgress();
        this.applyGrateVisual(false);
        this.player.setDisguised(false);
        this.toast('Discoveries forgotten. The grate is back in place.');
      }),
      bus.on(GameEvent.VirtualAxis, (axis) => {
        this.controls.setVirtualAxis(axis);
      }),
      bus.on(GameEvent.VirtualInteract, () => {
        this.controls.pressVirtual('interact');
      }),
      bus.on(GameEvent.UiSound, ({ key }) => {
        this.audio.play(key);
      }),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shutdown();
    });

    this.onLockChange(lock.locked);
    this.updateArea();
    this.installDebugHook();
    bus.emit(GameEvent.Ready, undefined);
  }

  override update(time: number, delta: number): void {
    if (this.deps.lock.locked) return;

    if (this.controls.consume('pause')) {
      this.deps.bus.emit(GameEvent.MenuRequest, undefined);
      return;
    }
    if (this.controls.consume('mute')) {
      const muted = !this.deps.settings.value.muted;
      this.deps.settings.update({ muted });
      this.toast(muted ? 'Sound off (M)' : 'Sound on (M)');
    }
    if (this.controls.consume('hub')) {
      this.transitionTo(POINTS.bonfire, 'down');
      return;
    }

    const area = this.currentArea ? AREAS[this.currentArea] : null;
    const axis = laneAssist(this.grid, this.player.feet, this.controls.axis());
    this.player.update(time, delta, axis, area?.speed ?? 1);
    if (this.player.state === 'walking' && time - this.lastStep > FOOTSTEP_INTERVAL_MS) {
      this.lastStep = time;
      this.audio.play('step', AUDIO.stepVolume);
    }
    this.updateArea();

    this.target = resolveInteraction(
      this.player.feet,
      this.player.facingVector,
      this.interactables,
    );
    this.setPrompt(
      this.target ? this.target.prompt : this.player.isDisguised ? 'Step out of the box' : null,
    );

    if (this.controls.consume('interact')) this.interact(time);
  }

  // --- EffectHost ------------------------------------------------------------

  openDialog(id: string, content: DialogContent): void {
    this.audio.play('ui_open');
    const marker = this.props.find((p) => p.placement.interactable?.id === id)?.marker;
    marker?.setAlpha(0.45);
    this.deps.bus.emit(GameEvent.ExhibitOpen, { id, content });
  }

  playSfx(key: SfxKey): void {
    this.audio.play(key);
  }

  toast(message: string): void {
    this.deps.bus.emit(GameEvent.Toast, { message });
  }

  secretFound(title: string, found: number, total: number): void {
    this.deps.bus.emit(GameEvent.SecretFound, { title, found, total });
  }

  toggleDisguise(): boolean {
    const next = !this.player.isDisguised;
    this.player.setDisguised(next);
    return next;
  }

  setGrateOpen(open: boolean): void {
    this.deps.settings.update({ grateOpen: open });
    this.applyGrateVisual(open);
  }

  travel(target: TravelTarget): void {
    if (target === 'duct') this.transitionTo(POINTS.ductEntry, 'left');
    else this.transitionTo(POINTS.grateExit, 'down');
  }

  flash(): void {
    if (!this.deps.reducedMotion) this.cameras.main.flash(260, 224, 197, 142);
  }

  // --- internals -------------------------------------------------------------

  private buildTilemap(): Phaser.Tilemaps.TilemapLayer {
    const manifest = parseTilesetManifest(this.cache.json.get(DATA.tileset.key));
    const layers = buildTileLayers(this.grid, manifest, AREAS, CARPETS);
    const map = this.make.tilemap({
      tileWidth: TILE,
      tileHeight: TILE,
      width: WORLD_COLS,
      height: WORLD_ROWS,
    });
    const tiles = map.addTilesetImage(TEXTURES.tileset.key, TEXTURES.tileset.key, TILE, TILE, 0, 0);
    if (!tiles) throw new Error('Tileset failed to load');
    const make = (name: string, data: number[][], depth: number): Phaser.Tilemaps.TilemapLayer => {
      const layer = map.createBlankLayer(name, tiles);
      if (!layer) throw new Error(`Could not create layer ${name}`);
      layer.putTilesAt(data, 0, 0).setDepth(depth);
      return layer;
    };
    make('ground', layers.ground, DEPTH.ground);
    make('carpets', layers.carpets, DEPTH.carpet);
    make('shadows', layers.shadows, DEPTH.shadow);
    const walls = make('walls', layers.walls, DEPTH.walls);
    walls.setCollisionByExclusion([EMPTY]);
    return walls;
  }

  private interact(time: number): void {
    const target = this.target;
    if (!target) {
      if (this.player.isDisguised) {
        this.player.setDisguised(false);
        this.audio.play('box');
      }
      return;
    }
    this.player.playInteract(time);
    this.audio.play('interact');
    const action = target.action;
    switch (action.kind) {
      case 'project': {
        const project = PROJECTS.find((p) => p.id === action.projectId);
        if (project) this.openDialog(target.id, { kind: 'project', project });
        break;
      }
      case 'info':
        this.openDialog(target.id, { kind: 'info', panel: INFO_PANELS[action.panelId] });
        break;
      case 'egg': {
        const egg = findEgg(action.eggId);
        if (egg) this.effects.run(egg, target.id);
        break;
      }
    }
  }

  private onLockChange(locked: boolean): void {
    this.controls.setEnabled(!locked, RESUME_GRACE_MS);
    if (locked) {
      this.player.halt();
      this.physics.world.pause();
      this.setPrompt(null);
    } else {
      this.physics.world.resume();
    }
  }

  private setPrompt(label: string | null): void {
    if (label === this.promptLabel) return;
    this.promptLabel = label;
    this.deps.bus.emit(GameEvent.PromptChange, label ? { label } : null);
  }

  private updateArea(): void {
    const feet = this.player.feet;
    const area = this.grid.areaAt(Math.floor(feet.x / TILE), Math.floor(feet.y / TILE));
    if (!area || area === this.currentArea) return;
    const previous = this.currentArea;
    this.currentArea = area;
    const def = AREAS[area];
    this.setRegion(def.region);
    this.deps.bus.emit(GameEvent.AreaEnter, { id: area, name: def.name, subtitle: def.subtitle });
    if (area === 'secret' && previous === 'duct') this.raiseAlert();
  }

  private setRegion(region: RegionId, force = false): void {
    if (region === this.currentRegion && !force) return;
    this.currentRegion = region;
    const r = REGIONS[region];
    this.cameras.main.setBounds(r.x, r.y, r.w, r.h);
  }

  private raiseAlert(): void {
    this.audio.play('alert');
    const { x, y } = this.player.sprite;
    const mark = this.add
      .sprite(x, y - 26, TEXTURES.props.key, 'alert')
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.overlay);
    if (!this.deps.reducedMotion) {
      mark.setScale(0.4);
      this.tweens.add({
        targets: mark,
        scale: 1,
        duration: 120,
        ease: Phaser.Math.Easing.Back.Out,
      });
      this.cameras.main.shake(120, 0.004);
    }
    this.time.delayedCall(900, () => {
      mark.destroy();
    });
    this.effects.discover(ROOM_DISCOVERY.id, ROOM_DISCOVERY.title);
  }

  private transitionTo(point: Vec2, facing: Facing): void {
    const { lock, reducedMotion } = this.deps;
    const cam = this.cameras.main;
    const arrive = () => {
      this.player.teleport(point.x, point.y, facing);
      this.updateArea();
      cam.centerOn(point.x, point.y - CAMERA_FOLLOW_OFFSET_Y);
      if (!reducedMotion) cam.fadeIn(FADE_MS, 14, 11, 12);
      lock.release('transition');
    };
    lock.acquire('transition');
    if (reducedMotion) {
      arrive();
      return;
    }
    cam.fadeOut(FADE_MS, 14, 11, 12);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, arrive);
  }

  private applyGrateVisual(open: boolean): void {
    const grate = this.props.find((p) => p.placement.handle === 'grate');
    if (!grate) return;
    grate.sprite.setFrame(open ? 'grate_open' : 'grate_closed');
    const egg = EASTER_EGGS.find((e) => e.id === (open ? 'grate-open' : 'grate'));
    const index = this.interactables.findIndex((i) => i.id === grate.placement.key);
    const current = this.interactables[index];
    if (!egg || !current) return;
    this.interactables[index] = {
      ...current,
      prompt: egg.prompt,
      action: { kind: 'egg', eggId: egg.id },
    };
  }

  private installDebugHook(): void {
    if (!import.meta.env.DEV) return;
    window.__ARCADE__ = {
      state: (): ArcadeDebugState => ({
        x: Math.round(this.player.sprite.x),
        y: Math.round(this.player.sprite.y),
        area: this.currentArea,
        locked: this.deps.lock.locked,
        prompt: this.promptLabel,
        playerState: this.player.state,
        disguised: this.player.isDisguised,
      }),
      teleport: (x: number, y: number) => {
        this.player.teleport(x, y);
        this.updateArea();
      },
    };
  }

  private shutdown(): void {
    for (const c of this.cleanups.splice(0)) c();
    this.controls.destroy();
    this.audio.destroy();
    if (import.meta.env.DEV) delete window.__ARCADE__;
  }
}
