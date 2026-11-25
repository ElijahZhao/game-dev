/* G2 开放世界：草原 / 竹林 / 沙漠 / 雪原 / 火山，30 屏 30×17
 *
 * 设计边界：
 *   - 单屏 480×272（30×17 格 ×16px），镜头仍是 640×360，能看到相邻屏边缘；
 *   - 五种地表群系共用同一套走 / 采 / 谈 / 打动词，任务、资源和 HUD 按群系配置；
 *   - 世界 Boss 仍只在 field-6，任务不跨群系记账；
 *   - 火山第二委托完成后解锁篝火传送，只去已访问过的篝火；
 *   - 仍只写 na.world，不碰主线 na.save。
 */
import { S, VEC, ANGLE } from '../core/config.js';
import { loadSave } from '../systems/save.js';
import { NAV } from '../systems/nav.js';
import { loadWorldSave, patchWorldSave } from '../systems/worldSave.js';
import { TouchControls, isTouchDevice } from '../systems/input.js';
import { UI } from '../systems/ui/tokens.js';
import { makePanel, makeCard, makeText } from '../systems/ui/primitives.js';

/* G0 的 640×360 是“镜头尺寸”；单屏改为 30×17 格的 480×272，镜头仍按 S 尺寸。 */
const SCREEN_W = 480;
const SCREEN_H = 272;
const WORLD_Y = Math.max(32, Math.round((S.H - SCREEN_H) / 2));
const VIEW_W = S.W;
const VIEW_H = S.H;
const SPEED = 78;
const PLAYER_MAX_HP = 20;
const GATHER_MS = 2000;
const RESPAWN_MS = 90000;
const BATTLE_HERB_RESPAWN_MS = 45000;
const MOB_HEAL = 3;
const ATTACK_CD = 320;
const ATTACK_RANGE = 62;
const ATTACK_DMG = 3;
const IFRAME = 700;
const BOSS_TURN_MS = 1600;
const QUEST_LABEL = { none: '未接委托', active: '采集', done: '委托完成' };
const BIOME_LABEL = { field: '草原', bamboo: '竹林', desert: '沙海', snow: '雪原', volcano: '火山' };
/* G3 世界 Boss：96×96 四向 atlas 的帧序 0 前 / 1 左 / 2 后 / 3 右。
 * 竹林 Boss 的脚底统一在 73/96；苔背巨兽三姿态各有 1–2px 差，保留逐姿态。 */
const BOSS_ART = {
  mossBeast: {
    tex: { idle: 'mossBeastIdle', charge: 'mossBeastCharge', roar: 'mossBeastRoar' },
    origin: { idle: 66 / 96, charge: 72 / 96, roar: 65 / 96 },
    scale: 2.2, standoff: 122, pounceGap: 118, pounceR: 126, swipeR: 96, swipeWarn: 96,
    shadow: [118, 20], glowY: 30, labelY: 152,
    tint: UI.world.fieldLight,
  },
  bambooMirage: {
    tex: { idle: 'bambooMirageIdle', charge: 'bambooMirageCharge', roar: 'bambooMirageRoar' },
    origin: { idle: 73 / 96, charge: 73 / 96, roar: 73 / 96 },
    scale: 1.8, standoff: 104, pounceGap: 48, pounceR: 58, swipeR: 62, swipeWarn: 62,
    shadow: [78, 14], glowY: 24, labelY: 126,
    tint: UI.world.herb,
  },
  sandMirage: {
    tex: { idle: 'sandMirageIdle', charge: 'sandMirageCharge', roar: 'sandMirageRoar' },
    origin: { idle: 65 / 96, charge: 65 / 96, roar: 65 / 96 },
    // 体宽约 154px：站位留 132，近身 104 内横扫，拉开则扑沙。
    scale: 2.4, standoff: 132, swipeAt: 104,
    pounceGap: 92, pounceR: 100, swipeR: 112, swipeWarn: 104,
    shadow: [142, 18], glowY: 28, labelY: 100,
    tint: UI.world.desert, mirage: true,
    // 原 3D 件在沙底上偏亮，战斗里压一档暖褐，保住蜃的沙色又不至于和地面融成一片。
    bodyTint: 0xa68f73,
  },
};
const bossArt = (id) => BOSS_ART[id] || BOSS_ART.mossBeast;
/* G3-3 Boss 场小怪：沙蚋。四向 × idle / skitter，按脚底 44/64 锚定。 */
const MINION_ART = {
  sandScarab: {
    idle: 'sandScarabIdle', skitter: 'sandScarabSkitter',
    scale: 1.35, origin: 44 / 64, shadow: [30, 8],
  },
};
const WORLD_TOUCH = [
  { id: 'attack', label: '攻', r: 22, fx: 38, fy: 42 },
  { id: 'interact', label: 'E', r: 18, fx: 84, fy: 28 },
  { id: 'escape', label: '返', r: 15, fx: 34, fy: 112 },
];

const TINT = {
  field: UI.world.field, bamboo: UI.world.bamboo, desert: UI.world.desert,
  snow: UI.world.snow, volcano: UI.world.volcano,
};

/* 尺寸基线：玩家 16×16 源帧 ×2 = 32px 高。所有摆件按“可见像素高度”对齐：
 * 树 / 门 / 祠 >= 2.5 个玩家，灌木 / 采集物 <= 1.3 个玩家，NPC 约 1.0–1.2 个玩家。
 * 这里的倍率只修正素材库与 3D 件的画布留白，p.scale 仍保留逐屏变化。 */
const PLAYER_H = 32;
const PROP_SCALE = {
  tree: 1.8, bush: 0.9, bamboo: 1.1, bambooGate: 1.0, desertArch: 1.0,
  desertDeadTree: 1.35, desertPalm: 1.5, campfire: 1.3,
  desertRock: 2.5, desertScrub: 1.3, desertDune: 1.0,
  snowPine: 1.0, snowShrine: 1.1, snowLantern: 1.3,
  volcanoSpire: 1.2, volcanoVent: 2.0, volcanoForge: 1.0,
  volcanoLava: 3.0,
};

/* 群系任务配置：数据键、存档键、HUD 文案、NPC 素材都在这里对齐。
 * 不再用 bamboo 单布尔分派；沙漠和后续雪原 / 火山复用同一结构。 */
const QUEST_PROFILE = {
  field: {
    biome: 'field', questDef: 'quest', questSave: 'quest', herbSave: 'herbs',
    item: '草药', unit: '株', npcAsset: 'villager2', npcScale: 2, glowTint: UI.world.herbGold,
    glowScale: 1.1, labelY: 44, promptY: 58,
    readyHint: '草药够了 · 去找村医阿杏交付',
    respawn: '一丛草药重新长成了',
  },
  bamboo: {
    biome: 'bamboo', questDef: 'bambooQuest', questSave: 'bambooQuest', herbSave: 'bambooHerbs',
    item: '雾竹', unit: '株', npcAsset: 'bambooHermit', npcScale: 0.9, glowTint: UI.world.herb,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '雾竹够了 · 去找竹隐交付',
    respawn: '一丛雾竹重新长成了',
  },
  desert: {
    biome: 'desert', questDef: 'desertQuest', questSave: 'desertQuest', herbSave: 'desertHerbs',
    item: '沙枣', unit: '颗', npcAsset: 'desertNomad', npcScale: 0.95, glowTint: UI.world.herbGold,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '沙枣够了 · 去找沙婆阿砾交付',
    respawn: '一丛沙枣重新长成了',
  },
  snow: {
    biome: 'snow', questDef: 'snowQuest', questSave: 'snowQuest', herbSave: 'snowHerbs',
    item: '雪灯', unit: '盏', npcAsset: 'snowKeeper', npcScale: 0.9, glowTint: UI.world.snowLight,
    glowScale: 1.1, labelY: 46, promptY: 60,
    readyHint: '雪灯够了 · 去雪祠找阿霁交付',
    respawn: '一盏雪灯草重新亮了',
  },
  volcano: {
    biome: 'volcano', questDef: 'volcanoQuest', questSave: 'volcanoQuest', herbSave: 'volcanoHerbs',
    item: '火种', unit: '枚', npcAsset: 'volcanoSmith', npcScale: 0.95, glowTint: UI.world.ember,
    glowScale: 1.2, labelY: 46, promptY: 60,
    readyHint: '火种够了 · 去铁砧找赤砧交付',
    respawn: '一枚火种在灰里重新亮了',
    quest2Def: 'volcanoQuest2', quest2Save: 'volcanoQuest2', ventSave: 'volcanoVents',
    item2: '炉眼', unit2: '处',
    readyHint2: '三处炉眼已淬 · 回铁砧找赤砧',
  },
};

function profileFor(biome) { return QUEST_PROFILE[biome] || QUEST_PROFILE.field; }
function profileForNpc(npc) { return QUEST_PROFILE[npc && npc.quest] || QUEST_PROFILE.field; }

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function mixColor(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return ((Math.round(ar + (br - ar) * t) << 16)
    | (Math.round(ag + (bg - ag) * t) << 8)
    | Math.round(ab + (bb - ab) * t));
}

function hudText(scene, x, y, text, role = 'body', opts = {}) {
  const { depth = 800, background = UI.hud.bg, padding = { x: 6, y: 4 }, ...style } = opts;
  const t = makeText(scene, x, y, text, role, {
    ...style,
    ...(background ? { backgroundColor: background, padding } : {}),
  });
  return t.setScrollFactor(0).setDepth(depth);
}

function screenPanel(scene, opts) {
  const p = makePanel(scene, opts);
  p.container.setScrollFactor(0);
  return p;
}

function destroyRow(row) {
  if (!row) return;
  if (row.card) { row.card.container.destroy(); row.card.hit.destroy(); return; }
  row.destroy();
}

function asNumber(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeRect(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const x = asNumber(raw.x, 0);
  const y = asNumber(raw.y, 0);
  const w = asNumber(raw.w, 0);
  const h = asNumber(raw.h, 0);
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h, ramp: Array.isArray(raw.ramp) ? raw.ramp : null };
}

function normalizeProps(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p) => Array.isArray(p) && p.length >= 3).map((p) => ({
    kind: String(p[0]),
    x: asNumber(p[1], 0),
    y: asNumber(p[2], 0),
    scale: Math.max(0.5, asNumber(p[3], 1)),
  }));
}

function normalizeWorld(raw) {
  const src = raw && Array.isArray(raw.screens) ? raw.screens : [];
  const screens = src.filter((s) => s && s.id).map((s, i) => ({
    id: String(s.id),
    name: String(s.name || s.id),
    short: String(s.short || s.name || s.id),
    biome: String(s.biome || 'field'),
    weather: String(s.weather || 'clear'),
    weatherName: String(s.weatherName || '晴'),
    deco: Array.isArray(s.deco) ? s.deco : [],
    props: normalizeProps(s.props),
    herbs: Array.isArray(s.herbs) ? s.herbs.filter((h) => Array.isArray(h) && h.length >= 2) : [],
    npc: s.npc || null,
    plateau: normalizeRect(s.plateau),
    cave: normalizeRect(s.cave),
    x: i * SCREEN_W,
  }));
  const q = raw && raw.quest ? raw.quest : {};
  const bq = raw && raw.bambooQuest ? raw.bambooQuest : {};
  const dq = raw && raw.desertQuest ? raw.desertQuest : {};
  const sq = raw && raw.snowQuest ? raw.snowQuest : {};
  const vq = raw && raw.volcanoQuest ? raw.volcanoQuest : {};
  const vq2 = raw && raw.volcanoQuest2 ? raw.volcanoQuest2 : {};
  const bossesRaw = Array.isArray(raw && raw.bosses)
    ? raw.bosses
    : (raw && raw.boss ? [raw.boss] : []);
  const screenIds = new Set(screens.map((s) => s.id));
  const quenches = (Array.isArray(raw && raw.quenches) ? raw.quenches : [])
    .filter((q) => q && q.id && screenIds.has(String(q.screen)))
    .map((q) => ({
      id: String(q.id), name: String(q.name || q.id), screen: String(q.screen),
      x: asNumber(q.x, 0), y: asNumber(q.y, 0),
    }));
  const campfires = (Array.isArray(raw && raw.campfires) ? raw.campfires : [])
    .filter((c) => c && c.id && screenIds.has(String(c.screen)))
    .map((c) => ({
      id: String(c.id), name: String(c.name || c.id), screen: String(c.screen),
      x: asNumber(c.x, 0), y: asNumber(c.y, 0),
      spawnX: asNumber(c.spawnX, asNumber(c.x, 0) - 36), spawnY: asNumber(c.spawnY, asNumber(c.y, 0) - 2),
    }));
  const bosses = [];
  for (const b of bossesRaw) {
    if (!b || !b.id || !b.screen || !screenIds.has(String(b.screen))) continue;
    const screen = String(b.screen);
    if (bosses.some((x) => x.screen === screen)) continue;
    bosses.push({
      id: String(b.id),
      name: String(b.name || b.id),
      screen,
      x: asNumber(b.x, 240),
      y: asNumber(b.y, 190),
      hp: Math.max(1, Math.round(asNumber(b.hp, 64))),
      dmg: Math.max(1, Math.round(asNumber(b.dmg, 4))),
      rewardTokens: Math.max(0, Math.round(asNumber(b.rewardTokens, 3))),
      art: String(b.art || 'mossBeast'),
      title: String(b.title || '星火守巢者'),
      victoryTitle: String(b.victoryTitle || '星火的碎片 · 已归位'),
      victoryBody: String(b.victoryBody || '这片群系的远征，暂时告一段落。'),
      memorialText: String(b.memorialText || '星火已归位'),
      minionRespawnMs: Math.max(2000, Math.round(asNumber(b.minionRespawnMs, 9000))),
      minionDropChance: Math.min(1, Math.max(0, asNumber(b.minionDropChance, 0.35))),
      minions: (Array.isArray(b.minions) ? b.minions : []).filter((m) => m && m.kind).map((m) => ({
        kind: String(m.kind),
        x: asNumber(m.x, 0),
        y: asNumber(m.y, 0),
        hp: Math.max(1, Math.round(asNumber(m.hp, 6))),
        dmg: Math.max(1, Math.round(asNumber(m.dmg, 2))),
      })),
    });
  }
  return {
    screens, quenches, campfires, bosses,
    quest: {
      id: String(q.id || 'herb5'),
      name: String(q.name || '草药五株'),
      need: Math.max(1, Math.round(asNumber(q.need, 5))),
      yield: Math.max(1, Math.round(asNumber(q.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(q.rewardTokens, 1))),
    },
    bambooQuest: {
      id: String(bq.id || 'bamboo4'),
      name: String(bq.name || '雾竹三味'),
      need: Math.max(1, Math.round(asNumber(bq.need, 4))),
      yield: Math.max(1, Math.round(asNumber(bq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(bq.rewardTokens, 2))),
    },
    desertQuest: {
      id: String(dq.id || 'desert5'),
      name: String(dq.name || '沙海拾味'),
      need: Math.max(1, Math.round(asNumber(dq.need, 5))),
      yield: Math.max(1, Math.round(asNumber(dq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(dq.rewardTokens, 2))),
    },
    snowQuest: {
      id: String(sq.id || 'snow5'),
      name: String(sq.name || '雪灯五盏'),
      need: Math.max(1, Math.round(asNumber(sq.need, 5))),
      yield: Math.max(1, Math.round(asNumber(sq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(sq.rewardTokens, 2))),
    },
    volcanoQuest: {
      id: String(vq.id || 'volcano5'),
      name: String(vq.name || '拾火五枚'),
      need: Math.max(1, Math.round(asNumber(vq.need, 5))),
      yield: Math.max(1, Math.round(asNumber(vq.yield, 2))),
      rewardTokens: Math.max(0, Math.round(asNumber(vq.rewardTokens, 2))),
    },
    volcanoQuest2: {
      id: String(vq2.id || 'volcanoForge3'),
      name: String(vq2.name || '三淬归火'),
      need: Math.max(1, Math.round(asNumber(vq2.need, 3))),
      rewardTokens: Math.max(0, Math.round(asNumber(vq2.rewardTokens, 3))),
    },
  };
}

export class World extends Phaser.Scene {
  constructor() { super('world'); }

  create() {
    this.main = loadSave();
    this.charId = ['ninja', 'mage', 'knight'].includes(this.main.lastChar) ? this.main.lastChar : 'ninja';
    this.world = normalizeWorld(window.__worldData);
    this.save = loadWorldSave();
    this.screens = this.world.screens;
    this.bossByScreen = new Map(this.world.bosses.map((b) => [b.screen, b]));
    this.worldWidth = this.screens.length * SCREEN_W;
    this.blockers = [];
    this.screenIndex = -1;
    this.screenId = '';
    this.layer = 'surface';
    this.weather = 'clear';
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.atkAt = -9999;
    this.face = 'down';
    this.talking = false;
    this.talk = null;
    this.panelOpen = false;
    this.panel = null;
    this.modal = null;
    this.victory = false;
    this.dead = false;
    this.boss = null;
    this.bossActive = false;
    this.bossDead = false;
    this.bossSpawn = null;
    this.arenaLine = null;
    this.bossHidden = [];
    this.bossEdge = [];
    this.mobs = [];
    this.loot = [];
    this.minionMax = 0;
    this.minionRespawnAt = 0;
    this.mobKills = 0;
    this.attackBtn = null;
    this.attackT = null;
    this.pointerTarget = null;
    this.herbs = [];
    this.gathering = null;
    this.npc = null;
    this.npcs = [];
    this.quenches = [];
    this.campfires = [];
    this.touchCtl = null;
    this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
    this.travelPanel = null;

    if (!this.screens.length) {
      this.add.text(VIEW_W / 2, VIEW_H / 2, 'world.json 缺失', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
      }).setOrigin(0.5);
      return;
    }

    this.buildBackdrop();
    this.buildGround();
    this.buildTerrain();
    this.buildNPC();
    this.buildHerbs();
    this.buildQuenches();
    this.buildCampfires();
    this.buildPlayer();
    this.buildWeather();
    this.buildHud();
    this.bindInput();
    this.buildTouch();

    this.cameras.main.setBounds(0, 0, this.worldWidth, VIEW_H);
    // 0.1/帧 在 60fps 下约 0.45s 收敛；镜头可以同时看到两屏边缘。
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#0d1017');
    this.cameras.main.setRoundPixels(true);
    this.applyScreen(0, true);
    this.updateLayer(true);
    this.updateHud();

    if (location.search.indexOf('debug') >= 0) window.__world = this;
  }

  /* ---------- 世界底图 ---------- */
  buildBackdrop() {
    this.add.rectangle(0, 0, this.worldWidth, VIEW_H, UI.world.backdrop)
      .setOrigin(0).setDepth(-3);
    // 上下留出窄条：上边给 HUD，下边给生命 / Boss 血条和操作提示。
    this.add.rectangle(0, 0, this.worldWidth, WORLD_Y, 0x1d2a1f)
      .setOrigin(0).setDepth(-2);
    this.add.rectangle(0, WORLD_Y + SCREEN_H, this.worldWidth, VIEW_H - WORLD_Y - SCREEN_H, 0x0b120d)
      .setOrigin(0).setDepth(-2);
  }

  makeSeamTexture() {
    if (this.textures.exists('__worldSeamG1')) return;
    const cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 1;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 1);
    this.textures.addCanvas('__worldSeamG1', cv);
  }

  buildGround() {
    this.makeSeamTexture();
    // 先铺一层整块底色，填掉 16px 图块在 480px 屏边界留下的透明缝。
    this.add.rectangle(0, WORLD_Y, this.worldWidth, SCREEN_H, UI.world.backdrop)
      .setOrigin(0).setDepth(-0.5);
    this.screens.forEach((s) => {
      const tint = TINT[s.biome] || TINT.field;
      const ground = s.biome === 'desert' ? 'desertTile'
        : (s.biome === 'snow' ? 'snowTile' : (s.biome === 'volcano' ? 'volcanoTile' : 'field'));
      const groundFrame = (s.biome === 'desert' || s.biome === 'snow' || s.biome === 'volcano') ? 0 : 21;
      const whiteGround = s.biome === 'desert' || s.biome === 'snow' || s.biome === 'volcano';
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, SCREEN_H, tint, 1)
        .setOrigin(0).setDepth(-0.4);
      this.add.tileSprite(s.x, WORLD_Y, SCREEN_W, SCREEN_H, ground, groundFrame)
        .setOrigin(0).setTint(whiteGround ? 0xffffff : tint).setDepth(0);
      const shade = s.biome === 'snow' ? 0.035 : (s.biome === 'desert' ? 0.10 : (s.biome === 'volcano' ? 0.16 : 0.07));
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, SCREEN_H, 0x0a120c, shade)
        .setOrigin(0).setDepth(1);
      const rim = s.biome === 'snow' ? UI.world.snowLight
        : (s.biome === 'desert' ? 0xe5c37d : (s.biome === 'volcano' ? UI.world.volcanoLight : UI.world.fieldLight));
      const rimAlpha = s.biome === 'snow' ? 0.32 : (s.biome === 'desert' ? 0.20 : (s.biome === 'volcano' ? 0.30 : 0.16));
      this.add.rectangle(s.x, WORLD_Y, SCREEN_W, 3, rim, rimAlpha)
        .setOrigin(0).setDepth(1.4);
      s.deco.forEach((d) => {
        const [dx, dy, frame = 0, scale = 1] = d;
        const decoAlpha = s.biome === 'snow' ? 0.28 : (s.biome === 'desert' ? 0.32 : (s.biome === 'volcano' ? 0.30 : 0.42));
        this.add.image(s.x + dx, WORLD_Y + dy, 'floorDetail', frame)
          .setScale(scale).setAlpha(decoAlpha).setTint(tint).setDepth(2);
      });
      if (s.biome === 'field') {
        const beam = this.add.image(s.x + 330, WORLD_Y + 20, 'ray', 0)
          .setOrigin(0.5, 0).setScale(1.2, 1.7).setRotation(0.16)
          .setAlpha(0.06).setTint(0xd8f0c8).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
        this.tweens.add({ targets: beam, alpha: 0.03, duration: 1800, yoyo: true, repeat: -1 });
      }
      if (s.biome === 'desert') {
        const dune = this.add.ellipse(s.x + 238, WORLD_Y + 254, 300, 34, 0xdfbf82, 0.12)
          .setOrigin(0.5, 0.5).setDepth(2.4);
        dune.setBlendMode(Phaser.BlendModes.ADD);
      }
      if (s.biome === 'snow') {
        this.add.ellipse(s.x + 238, WORLD_Y + 250, 316, 36, UI.world.snowLight, 0.10)
          .setOrigin(0.5, 0.5).setDepth(2.3);
        this.add.ellipse(s.x + 118, WORLD_Y + 210, 160, 22, UI.world.snowDark, 0.08)
          .setOrigin(0.5, 0.5).setDepth(2.35);
      }
      if (s.biome === 'volcano') {
        this.add.ellipse(s.x + 238, WORLD_Y + 251, 322, 34, UI.world.volcanoLight, 0.11)
          .setOrigin(0.5, 0.5).setDepth(2.3).setBlendMode(Phaser.BlendModes.ADD);
        this.add.ellipse(s.x + 128, WORLD_Y + 208, 150, 22, UI.world.volcanoDark, 0.16)
          .setOrigin(0.5, 0.5).setDepth(2.35);
      }
      this.add.text(s.x + 16, WORLD_Y + 12, s.name, {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      }).setAlpha(0.55).setDepth(3);
    });

    for (let i = 1; i < this.screens.length; i += 1) {
      const bx = this.screens[i].x;
      this.add.image(bx, WORLD_Y, '__worldSeamG1')
        .setOrigin(0.5, 0).setDisplaySize(112, SCREEN_H)
        .setTint(mixColor(TINT[this.screens[i - 1].biome] || TINT.field, TINT[this.screens[i].biome] || TINT.field, 0.55)).setAlpha(0.56).setDepth(1.6);
    }
  }

  /* ---------- 台地 / 洞穴 / 摆件 ---------- */
  addBlock(s, x, y, w, h) {
    if (!w || !h) return;
    this.blockers.push({ x: s.x + x, y: WORLD_Y + y, w, h });
  }

  buildTerrain() {
    this.screens.forEach((s) => {
      if (s.plateau) this.buildPlateau(s, s.plateau);
      if (s.cave) this.buildCave(s, s.cave);
      s.props.forEach((p) => this.buildProp(s, p));
    });
  }

  buildPlateau(s, p) {
    const px = s.x + p.x;
    const py = WORLD_Y + p.y;
    this.add.rectangle(px, py + p.h, p.w + 8, 7, 0x0a120c, 0.35)
      .setOrigin(0).setDepth(4);
    this.add.tileSprite(px, py, p.w, p.h, 'field', 21)
      .setOrigin(0).setTint(UI.world.plateau).setDepth(5);
    this.add.rectangle(px, py, p.w, 3, UI.world.fieldLight, 0.6)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px, py + p.h - 4, p.w, 4, UI.world.plateauEdge, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px, py, 3, p.h, UI.world.plateauEdge, 0.85)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(px + p.w - 3, py, 3, p.h, UI.world.plateauEdge, 0.85)
      .setOrigin(0).setDepth(6);
    const ramp = Array.isArray(p.ramp) ? p.ramp : [p.w / 2, 44];
    const rampX = clamp(asNumber(ramp[0], p.w / 2), 8, p.w - 8);
    const rampW = clamp(asNumber(ramp[1], 44), 20, 60);
    this.add.rectangle(px + rampX, py + p.h - 6, rampW, 10, 0xa9c884, 0.3)
      .setOrigin(0, 0).setDepth(6.2);
    this.add.text(px + 8, py + 7, '台地', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.foot,
    }).setAlpha(0.65).setDepth(7);

    const edge = 7;
    this.addBlock(s, p.x, p.y, p.w, edge);
    this.addBlock(s, p.x, p.y, edge, p.h);
    this.addBlock(s, p.x + p.w - edge, p.y, edge, p.h);
    this.addBlock(s, p.x, p.y + p.h - edge, rampX, edge);
    this.addBlock(s, p.x + rampX + rampW, p.y + p.h - edge, p.w - rampX - rampW, edge);
  }

  buildCave(s, c) {
    const cx = s.x + c.x;
    const cy = WORLD_Y + c.y;
    this.add.rectangle(cx, cy, c.w, c.h, 0x0b120d, 0.42)
      .setOrigin(0).setDepth(4);
    this.add.tileSprite(cx + 5, cy + 5, c.w - 10, c.h - 10, 'floorDungeon', 0)
      .setOrigin(0).setTint(UI.world.cave).setAlpha(0.86).setDepth(5);
    this.add.rectangle(cx, cy + 4, c.w, 5, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx, cy + c.h - 5, c.w, 5, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx, cy, 5, c.h, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.rectangle(cx + c.w - 5, cy, 5, c.h, 0x111810, 0.95)
      .setOrigin(0).setDepth(6);
    this.add.image(cx + c.w / 2, cy + 6, 'caveMouth')
      .setOrigin(0.5, 1).setDepth(6.5);
    this.add.text(cx + 8, cy - 17, '地穴', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 2 },
    }).setAlpha(0.8).setDepth(7);

    const mouth = 48;
    const edge = 7;
    const mouthL = c.x + c.w / 2 - mouth / 2;
    const mouthR = c.x + c.w / 2 + mouth / 2;
    this.addBlock(s, c.x, c.y, mouthL - c.x, edge);
    this.addBlock(s, mouthR, c.y, c.x + c.w - mouthR, edge);
    this.addBlock(s, c.x, c.y, edge, c.h);
    this.addBlock(s, c.x + c.w - edge, c.y, edge, c.h);
    this.addBlock(s, c.x, c.y + c.h - edge, c.w, edge);
  }

  buildProp(s, p) {
    const base = PROP_SCALE[p.kind] || 1;
    const k = p.scale * base;
    const x = s.x + p.x;
    const y = WORLD_Y + p.y;
    if (p.kind === 'tree') {
      this.add.ellipse(x, y - 3, 34 * k, 9 * k, 0x000000, 0.25).setDepth(17);
      this.add.image(x, y, 'worldTree')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 8, p.y - 12, 16, 12);
    } else if (p.kind === 'bush') {
      this.add.ellipse(x, y - 2, 24 * k, 7 * k, 0x000000, 0.2).setDepth(17);
      this.add.image(x, y, 'worldBush')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 5, p.y - 7, 10, 7);
    } else if (p.kind === 'bamboo') {
      this.add.ellipse(x, y - 3, 34 * k, 8 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'bambooGrove')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 10, p.y - 12, 20, 12);
    } else if (p.kind === 'bambooGate') {
      this.add.ellipse(x, y - 2, 72 * k, 10 * k, 0x000000, 0.22).setDepth(17);
      this.add.image(x, y, 'bambooGate')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      // Only the two posts block; the gate opening stays walkable.
      this.addBlock(s, p.x - 46 * k, p.y - 12, 8, 12);
      this.addBlock(s, p.x + 38 * k, p.y - 12, 8, 12);
    } else if (p.kind === 'desertArch') {
      this.add.ellipse(x, y - 2, 92 * k, 12 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'desertArch')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 42 * k, p.y - 14, 10, 14);
      this.addBlock(s, p.x + 32 * k, p.y - 14, 10, 14);
    } else if (p.kind === 'desertDeadTree') {
      this.add.ellipse(x, y - 3, 36 * k, 9 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'desertDeadTree')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 8, p.y - 18, 16, 16);
    } else if (p.kind === 'desertPalm') {
      this.add.ellipse(x, y - 2, 30 * k, 8 * k, 0x000000, 0.2).setDepth(17);
      this.add.image(x, y, 'desertPalm')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 7, p.y - 9, 14, 9);
    } else if (p.kind === 'desertRock') {
      this.add.ellipse(x, y - 2, 40 * k, 10 * k, 0x000000, 0.22).setDepth(17);
      this.add.image(x, y, 'desertRock')
        .setOrigin(0.5, 45 / 64).setScale(k).setDepth(18);
      // 只挡柱脚，不挡顶部；玩家仍可贴近石柱绕打。
      this.addBlock(s, p.x - 18 * k, p.y - 14, 36 * k, 14);
    } else if (p.kind === 'desertScrub') {
      this.add.ellipse(x, y - 2, 22 * k, 6 * k, 0x000000, 0.18).setDepth(17);
      this.add.image(x, y, 'desertShrub')
        .setOrigin(0.5, 1).setScale(k).setDepth(18).setTint(0xe4d2a2);
    } else if (p.kind === 'desertDune') {
      // 低矮沙脊：只做地形层，不挡走位，也不盖住 Boss 的脚底 / 预警圈。
      const w = 78 * k;
      const h = 22 * k;
      this.add.ellipse(x, y - h * 0.34, w, h, 0xc9ad74, 0.12)
        .setDepth(2.45).setBlendMode(Phaser.BlendModes.ADD);
      this.add.ellipse(x - w * 0.16, y - h * 0.58, w * 0.54, h * 0.54, 0xd8bd88, 0.08)
        .setDepth(2.5);
      this.add.ellipse(x, y - 2, w * 1.04, 7, 0x000000, 0.06).setDepth(2.4);
      for (let i = 0; i < 3; i += 1) {
        this.add.rectangle(x - w * 0.28 + i * w * 0.28, y - h * 0.62, w * 0.22, 1, 0x9b7b42, 0.08)
          .setDepth(2.55).setRotation(i % 2 ? 0.08 : -0.06);
      }
    } else if (p.kind === 'snowPine') {
      this.add.ellipse(x, y - 3, 36 * k, 9 * k, 0x000000, 0.22).setDepth(17);
      this.add.image(x, y, 'snowPine')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 9, p.y - 12, 18, 12);
    } else if (p.kind === 'snowShrine') {
      this.add.circle(x, y - 66 * k, 44 * k, 0xa9e8ff, 0.08)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.ellipse(x, y - 2, 78 * k, 12 * k, 0x000000, 0.24).setDepth(17);
      this.add.image(x, y, 'snowShrine')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 38 * k, p.y - 14, 76 * k, 14);
    } else if (p.kind === 'volcanoForge') {
      this.add.image(x, y - 40, 'aura', 0).setScale(3.2)
        .setTint(UI.world.volcanoLight).setAlpha(0.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.ellipse(x, y - 2, 92 * k, 13 * k, 0x000000, 0.28).setDepth(17);
      this.add.image(x, y, 'volcanoForge')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 42 * k, p.y - 16, 84 * k, 16);
    } else if (p.kind === 'volcanoLava') {
      this.add.image(x, y - 10, 'aura', 0).setScale(2.4)
        .setTint(UI.world.volcanoLight).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(16);
      this.add.image(x, y, 'volcanoLava')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
    } else if (p.kind === 'volcanoSpire') {
      this.add.ellipse(x, y - 3, 32 * k, 9 * k, 0x000000, 0.26).setDepth(17);
      this.add.image(x, y, 'volcanoSpire')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
      this.addBlock(s, p.x - 10 * k, p.y - 20, 20 * k, 20);
    } else if (p.kind === 'volcanoVent') {
      this.add.image(x, y - 8, 'aura', 0).setScale(1.7)
        .setTint(UI.world.volcanoLight).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.image(x, y, 'volcanoVent')
        .setOrigin(0.5, 1).setScale(k).setDepth(18);
    } else if (p.kind === 'campfire') {
      this.add.circle(x, y - 8, 28 * k, 0xff9a4a, 0.10)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
      this.add.ellipse(x, y - 1, 24 * k, 7 * k, 0x000000, 0.22).setDepth(17);
      this.add.sprite(x, y, 'campfire', 0)
        .setOrigin(0.5, 1).setScale(k).setDepth(18).play('campfire-burn');
      this.add.text(x, y - 28 * k, '篝火', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.muted,
      }).setOrigin(0.5, 1).setAlpha(0.65).setDepth(19);
    }
  }

  /* ---------- 村医 / 竹隐：每个群系最多一个 NPC ---------- */
  buildNPC() {
    this.npcs = [];
    this.screens.forEach((s, idx) => {
      if (!s.npc) return;
      const n = s.npc;
      const x = s.x + asNumber(n.x, 300);
      const y = WORLD_Y + asNumber(n.y, 200);
      const p = profileForNpc(n);
      const glow = this.add.image(x, y - 10, 'aura', 0)
        .setScale(p.glowScale).setAlpha(0.16).setTint(p.glowTint)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.tweens.add({ targets: glow, alpha: 0.06, scale: p.glowScale + 0.4, duration: 900, yoyo: true, repeat: -1 });
      const sprite = this.add.sprite(x, y, p.npcAsset, n.frame || 0)
        .setOrigin(0.5, 1).setScale(p.npcScale).setDepth(25);
      this.tweens.add({ targets: sprite, y: y - 2, duration: 620, yoyo: true, repeat: -1 });
      const label = this.add.text(x, y - p.labelY, String(n.name || '村民'), {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.primary,
        backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(40);
      const prompt = this.add.text(x, y - p.promptY, 'E 交谈', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
        backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        if (this.talking || this.panelOpen || this.gathering || this.bossActive) return;
        if (this.distPlayer(x, y) <= 52) this.interactNpc(this.nearestNpc());
        else this.pointerTarget = { x, y };
      });
      this.npcs.push({ ...n, x, y, sprite, label, prompt, screenIndex: idx, quest: n.quest || 'field' });
    });
  }

  nearestNpc() {
    let best = null;
    let bestD = 999;
    this.npcs.forEach((n) => {
      const d = this.distPlayer(n.x, n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return bestD <= 80 ? best : null;
  }

  /* ---------- 草药 ---------- */
  buildHerbs() {
    this.screens.forEach((s) => {
      const prof = profileFor(s.biome);
      s.herbs.forEach((h, i) => {
        const x = s.x + asNumber(h[0], 0);
        const y = WORLD_Y + asNumber(h[1], 0);
        const desert = s.biome === 'desert';
        const snow = s.biome === 'snow';
        const volcano = s.biome === 'volcano';
        const battle = !!h[2];
        const glow = this.add.circle(x, y - 6, snow ? 12 : (desert ? 15 : 12), battle ? UI.world.herb : prof.glowTint, snow ? 0.10 : (desert ? (battle ? 0.16 : 0.08) : 0.10))
          .setDepth(23).setBlendMode(Phaser.BlendModes.ADD);
        const herbAsset = desert ? 'desertShrub' : (snow ? 'snowLantern' : (volcano ? 'volcanoEmber' : 'herb'));
        const herbScale = desert ? 1.7 : (snow ? 1.3 : (volcano ? 1.3 : 1.0));
        const sprite = this.add.sprite(x, y, herbAsset, 0)
          .setOrigin(0.5, 1).setScale(herbScale).setDepth(24);
        this.tweens.add({ targets: sprite, y: y - 3, duration: 760 + i * 90, yoyo: true, repeat: -1 });
        const prompt = this.add.text(x, y - (desert || snow || volcano ? 32 : 24), battle ? 'E 采沙蓬' : 'E 采集', {
          fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
          backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
        }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
        sprite.setInteractive({ useHandCursor: true });
        const node = {
          id: s.id + '-' + i, screen: s.id, screenIndex: this.screens.indexOf(s), biome: s.biome,
          x, y, sprite, glow, prompt, active: true, respawnAt: 0, battle, heal: battle ? 2 : 0,
        };
        sprite.on('pointerdown', () => {
          if (this.talking || this.panelOpen || this.gathering) return;
          if (!node.active) return;
          if (this.bossActive && !node.battle) return;
          if (this.distPlayer(x, y) <= 48) {
            if (node.battle) this.pickBattleHerb(node);
            else this.startGather(node);
          } else this.pointerTarget = { x, y };
        });
        this.herbs.push(node);
      });
    });
  }

  /* ---------- 火山第二委托：三处炉眼 ---------- */
  buildQuenches() {
    this.quenches = [];
    const quenchedIds = this.save.volcanoVents || [];
    this.world.quenches.forEach((q) => {
      const si = this.screens.findIndex((s) => s.id === q.screen);
      if (si < 0) return;
      const s = this.screens[si];
      const x = s.x + q.x;
      const y = WORLD_Y + q.y;
      const glow = this.add.image(x, y - 12, 'aura', 0)
        .setScale(1.1).setAlpha(0).setTint(UI.world.snowLight)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(16).setVisible(false);
      const ring = this.add.circle(x, y - 8, 19, 0xbfe9ff, 0)
        .setStrokeStyle(1, 0xbfe9ff, 0.55).setDepth(17).setVisible(false);
      const prompt = this.add.text(x, y - 40, 'E 淬火', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
        backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
      const zone = this.add.circle(x, y - 8, 26, 0x000000, 0.001)
        .setDepth(45).setInteractive({ useHandCursor: true });
      const quench = { ...q, x, y, screenIndex: si, glow, ring, prompt, zone, quenched: quenchedIds.includes(q.id) };
      zone.on('pointerdown', () => {
        if (this.talking || this.panelOpen || this.gathering || this.bossActive) return;
        if (!quench.quenched && this.distPlayer(x, y) <= 48) this.quenchAt(quench);
      });
      this.quenches.push(quench);
    });
    this.refreshQuenchVisuals();
  }

  refreshQuenchVisuals() {
    const active = this.save.volcanoQuest2 === 'active';
    this.quenches.forEach((q) => {
      const show = active && !q.quenched;
      q.glow.setVisible(show || q.quenched).setAlpha(q.quenched ? 0.03 : 0.18);
      q.ring.setVisible(show);
      q.prompt.setVisible(false);
    });
  }

  /* ---------- 篝火传送点 ---------- */
  buildCampfires() {
    this.campfires = [];
    this.world.campfires.forEach((c) => {
      const si = this.screens.findIndex((s) => s.id === c.screen);
      if (si < 0) return;
      const s = this.screens[si];
      const x = s.x + c.x;
      const y = WORLD_Y + c.y;
      const prompt = this.add.text(x, y - 42, 'E 传送', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
        backgroundColor: UI.hud.bg, padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1).setDepth(46).setVisible(false);
      const zone = this.add.circle(x, y - 10, 26, 0x000000, 0.001)
        .setDepth(45).setInteractive({ useHandCursor: true });
      const camp = { ...c, x, y, screenIndex: si, prompt, zone };
      zone.on('pointerdown', () => {
        if (this.talking || this.panelOpen || this.gathering || this.bossActive || this.dead || this.victory) return;
        if (this.distPlayer(x, y) <= 48) this.interactCampfire();
      });
      this.campfires.push(camp);
    });
  }

  nearestCampfire() {
    let best = null;
    let bestD = 999;
    this.campfires.forEach((c) => {
      const d = this.distPlayer(c.x, c.y);
      if (d < bestD) { bestD = d; best = c; }
    });
    return bestD <= 60 ? best : null;
  }

  nearestQuench() {
    let best = null;
    let bestD = 999;
    this.quenches.forEach((q) => {
      if (q.quenched) return;
      const d = this.distPlayer(q.x, q.y);
      if (d < bestD) { bestD = d; best = q; }
    });
    return bestD <= 56 ? best : null;
  }

  travelUnlocked() {
    return this.save.volcanoQuest2 === 'done';
  }

  interactCampfire() {
    if (!this.travelUnlocked()) {
      this.toast('篝火还没记住你 · 先完成熔匠的三淬归火');
      return;
    }
    this.openTravel();
  }

  quenchAt(q) {
    if (!q || q.quenched) return;
    if (this.save.volcanoQuest2 !== 'active') {
      this.toast('炉眼还没醒 · 先接赤砧的三淬归火');
      return;
    }
    const ids = [...(this.save.volcanoVents || []), q.id];
    this.save = patchWorldSave({ volcanoVents: ids });
    q.quenched = true;
    q.prompt.setVisible(false);
    q.zone.disableInteractive();
    q.glow.setTint(UI.world.ember).setAlpha(0.04).setVisible(true);
    q.ring.setVisible(false);
    const flash = this.add.circle(q.x, q.y - 10, 18, 0xbfe9ff, 0.55)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(27);
    this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    const count = ids.length;
    const need = this.world.volcanoQuest2.need;
    this.toast('炉眼已淬 · ' + count + '/' + need);
    if (count >= need) this.toast(profileFor('volcano').readyHint2);
    this.updateHud();
  }

  openTravel() {
    if (!this.travelUnlocked()) return;
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    const W = Math.min(390, VIEW_W - 40);
    const H = 70 + this.campfires.length * 30 + 34;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    this.panelOpen = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '篝火 · 已记住的路', 'h2', { color: UI.text.heading }));
    p.add(makeText(this, 14, 34, '只去已经走过的篝火 · 点击落点传送', 'caption', { color: UI.text.muted }));
    const rows = this.campfires.map((c, i) => {
      const screen = this.screens[c.screenIndex];
      const visited = this.save.visited.includes(c.screen);
      const here = c.screenIndex === this.screenIndex;
      const label = c.name + ' · ' + (BIOME_LABEL[screen.biome] || screen.biome) + (here ? ' · 此处' : (visited ? '' : ' · 未点亮'));
      const accent = here ? UI.color.selected : (visited ? UI.color.gold : UI.color.lineMuted);
      const card = makeCard(this, {
        x: x + 16, y: y + 62 + i * 30, w: W - 32, h: 26,
        accent, state: visited ? 'default' : 'locked', depth: 104,
        onClick: visited ? () => this.travelTo(c) : undefined,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: visited ? (here ? UI.text.gold : UI.text.primary) : UI.text.disabled,
      }));
      return { card };
    });
    const close = makeCard(this, {
      x: x + 16, y: y + H - 40, w: W - 32, h: 26,
      accent: UI.color.lineMuted, depth: 104, onClick: () => this.closePanel(),
    });
    close.container.setScrollFactor(0);
    close.hit.setScrollFactor(0);
    close.add(makeText(this, 12, 7, '留在原地', 'body', { color: UI.text.muted }));
    rows.push({ card: close });
    this.panel = { dim, panel: p, rows, type: 'travel' };
    this.updateHud();
  }

  travelTo(camp) {
    if (!camp) return;
    if (camp.screenIndex === this.screenIndex) {
      this.toast('已经在这里了');
      this.closePanel();
      return;
    }
    this.closePanel();
    const s = this.screens[camp.screenIndex];
    this.player.setPosition(s.x + camp.spawnX, WORLD_Y + camp.spawnY);
    this.player.shadow.setPosition(this.player.x, this.player.y - 2);
    this.applyScreen(camp.screenIndex);
    this.cameras.main.scrollX = clamp(this.player.x - VIEW_W / 2, 0, this.worldWidth - VIEW_W);
    this.cameras.main.scrollY = 0;
    this.updateLayer(true);
    this.updateHud();
    this.toast('篝火已记住 · ' + camp.name);
  }

  /* ---------- 玩家 ---------- */
  buildPlayer() {
    const skin = this.charId;
    const startX = this.screens[0].x + 72;
    const startY = WORLD_Y + 185;
    this.player = this.add.sprite(startX, startY, 'walk', 0)
      .setOrigin(0.5, 1).setScale(2).setDepth(30);
    this.player.shadow = this.add.ellipse(startX, startY - 2, 22, 6, 0x000000, 0.25)
      .setDepth(29);
    this.face = 'down';
    this.player.anims.play('p-' + skin + '-idle-down');
    this.charSkin = skin;
  }

  /* ---------- 三种天气 ---------- */
  makeVignette() {
    if (this.textures.exists('worldVigG1')) return;
    const cv = document.createElement('canvas');
    cv.width = VIEW_W;
    cv.height = VIEW_H;
    const ctx = cv.getContext('2d');
    const grd = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 430);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.52, 'rgba(0,0,0,0.04)');
    grd.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.textures.addCanvas('worldVigG1', cv);
  }

  buildWeather() {
    this.makeVignette();
    this.rain = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: VIEW_W + 20 },
      y: -12,
      lifespan: { min: 620, max: 980 },
      speedX: { min: -14, max: 8 },
      speedY: { min: 190, max: 280 },
      scaleX: { min: 0.35, max: 0.65 },
      scaleY: { min: 1.1, max: 1.8 },
      alpha: { start: 0.85, end: 0.18 },
      quantity: 2,
      frequency: 36,
      tint: UI.world.rain,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.rain.stop();

    this.fogMist = this.add.particles(0, 0, 'dust', {
      x: { min: -40, max: VIEW_W + 40 },
      y: { min: 40, max: VIEW_H - 20 },
      lifespan: { min: 1500, max: 2600 },
      speedX: { min: -24, max: 14 },
      speedY: { min: -5, max: 5 },
      scale: { min: 0.65, max: 1.7 },
      alpha: { start: 0.15, end: 0 },
      quantity: 1,
      frequency: 90,
      tint: UI.world.fog,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.fogMist.stop();

    // 沙尘：横向风沙 + 褐色近地层，遮住远景但不改判定。
    this.dustStorm = this.add.particles(0, 0, 'dust', {
      x: { min: VIEW_W + 20, max: VIEW_W + 80 },
      y: { min: 44, max: VIEW_H - 18 },
      lifespan: { min: 900, max: 1600 },
      speedX: { min: -110, max: -42 },
      speedY: { min: 8, max: 34 },
      scaleX: { min: 0.4, max: 1.1 },
      scaleY: { min: 0.2, max: 0.5 },
      alpha: { start: 0.7, end: 0.05 },
      quantity: 2,
      frequency: 26,
      tint: UI.world.dust,
    }).setScrollFactor(0).setDepth(796);
    this.dustStorm.stop();

    // 雪：小片缓慢落下，偏蓝白；和沙尘共用 Snow.png 粒子纹理，不新增运行时依赖。
    this.snowFall = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: VIEW_W + 20 },
      y: -12,
      lifespan: { min: 1700, max: 2800 },
      speedX: { min: -26, max: 18 },
      speedY: { min: 48, max: 96 },
      scaleX: { min: 0.45, max: 0.95 },
      scaleY: { min: 0.45, max: 0.95 },
      alpha: { start: 0.72, end: 0.08 },
      quantity: 2,
      frequency: 44,
      tint: 0xe9fbff,
      blendMode: 'ADD',
    }).setScrollFactor(0).setDepth(795);
    this.snowFall.stop();
    this.snowVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.snowVeil, 0.08)
      .setOrigin(0).setScrollFactor(0).setDepth(792).setAlpha(0);

    // 落灰：比雪更慢、更暗，带一点余烬的暖色；和雪共用 dust 纹理。
    this.ashFall = this.add.particles(0, 0, 'dust', {
      x: { min: -20, max: VIEW_W + 20 },
      y: -12,
      lifespan: { min: 2200, max: 3600 },
      speedX: { min: -18, max: 14 },
      speedY: { min: 28, max: 58 },
      scaleX: { min: 0.35, max: 0.85 },
      scaleY: { min: 0.35, max: 0.85 },
      alpha: { start: 0.58, end: 0.04 },
      quantity: 2,
      frequency: 54,
      tint: UI.world.ash,
    }).setScrollFactor(0).setDepth(795);
    this.ashFall.stop();
    this.ashVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.volcanoVeil, 0.10)
      .setOrigin(0).setScrollFactor(0).setDepth(793).setAlpha(0);

    this.dustVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.dustVeil, 0.13)
      .setOrigin(0).setScrollFactor(0).setDepth(791).setAlpha(0);
    this.fogVeil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.fogVeil, 0.16)
      .setOrigin(0).setScrollFactor(0).setDepth(790).setAlpha(0);
    this.caveShade = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.world.caveVeil, 0.52)
      .setOrigin(0).setScrollFactor(0).setDepth(788).setAlpha(0);
    this.worldVig = this.add.image(0, 0, 'worldVigG1').setOrigin(0)
      .setDisplaySize(VIEW_W, VIEW_H).setScrollFactor(0).setDepth(789).setAlpha(0.12);
  }

  applyWeather(s) {
    this.weather = s.weather;
    this.rain.stop();
    this.fogMist.stop();
    this.dustStorm.stop();
    this.snowFall.stop();
    this.ashFall.stop();
    this.fogVeil.setAlpha(0);
    this.dustVeil.setAlpha(0);
    this.snowVeil.setAlpha(0);
    this.ashVeil.setAlpha(0);
    this.worldVig.setAlpha(s.weather === 'fog' ? 0.48
      : (s.weather === 'dust' ? 0.34
        : (s.weather === 'snow' ? 0.22 : (s.weather === 'ash' ? 0.30 : 0.12))));
    if (s.weather === 'rain') this.rain.start();
    if (s.weather === 'fog') {
      this.fogMist.start();
      this.fogVeil.setAlpha(0.15);
    }
    if (s.weather === 'dust') {
      this.dustStorm.start();
      this.dustVeil.setAlpha(0.13);
    }
    if (s.weather === 'snow') {
      this.snowFall.start();
      this.snowVeil.setAlpha(0.08);
    }
    if (s.weather === 'ash') {
      this.ashFall.start();
      this.ashVeil.setAlpha(0.10);
    }
  }

  /* ---------- HUD ---------- */
  buildHud() {
    this.hudBg = this.add.rectangle(0, 0, VIEW_W, 36, UI.color.panel, 0.82)
      .setOrigin(0).setScrollFactor(0).setDepth(800);
    this.hudTitle = hudText(this, 12, 7, '远征', 'h2', { background: null });
    this.hudPlace = hudText(this, VIEW_W - 12, 7, '', 'body', {
      background: null, color: UI.text.muted, origin: [1, 0],
    });
    this.hudQuest = hudText(this, VIEW_W - 12, 20, '', 'body', {
      background: null, color: UI.text.body, origin: [1, 0],
    });
    this.hudHint = hudText(this, VIEW_W / 2, VIEW_H - 18, '', 'body', {
      background: UI.hud.bgSoft, color: UI.text.foot, origin: [0.5, 0],
    });

    this.hpIcon = this.add.image(12, VIEW_H - 30, 'heart')
      .setScrollFactor(0).setDepth(812);
    this.hpText = hudText(this, 32, VIEW_H - 40, '', 'caption', {
      background: null, color: UI.text.body, depth: 812,
    });
    this.hpBarBg = this.add.rectangle(32, VIEW_H - 28, 90, 8, 0x000000, 0.58)
      .setOrigin(0).setScrollFactor(0).setDepth(812);
    this.hpBar = this.add.rectangle(34, VIEW_H - 26, 86, 4, UI.world.hp, 1)
      .setOrigin(0).setScrollFactor(0).setDepth(813);

    this.bossName = hudText(this, VIEW_W / 2, VIEW_H - 58, '', 'h2', {
      background: UI.hud.bgSoft, color: UI.text.danger, origin: [0.5, 0], depth: 820,
    }).setVisible(false);
    this.bossBarBg = this.add.rectangle(VIEW_W / 2 - 130, VIEW_H - 42, 260, 8, 0x000000, 0.62)
      .setOrigin(0).setScrollFactor(0).setDepth(812).setVisible(false);
    this.bossBar = this.add.rectangle(VIEW_W / 2 - 127, VIEW_H - 40, 254, 4, UI.world.boss, 1)
      .setOrigin(0).setScrollFactor(0).setDepth(813).setVisible(false);

    this.attackBtn = this.add.rectangle(VIEW_W - 82, VIEW_H - 46, 70, 24, UI.color.panelRaised, 0.9)
      .setOrigin(0).setScrollFactor(0).setDepth(821).setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.attackT = hudText(this, VIEW_W - 47, VIEW_H - 39, '攻击', 'body', {
      background: null, color: UI.text.heading, origin: [0.5, 0], depth: 822,
    }).setVisible(false);
    this.attackBtn.on('pointerdown', () => this.attack());
    this.updateHp();
  }

  updateHp() {
    if (!this.hpBar) return;
    this.hpText.setText('HP ' + this.hp + ' / ' + this.maxHp);
    this.hpBar.width = Math.max(0, 86 * (this.hp / this.maxHp));
    this.hpBar.setFillStyle(this.hp <= 7 ? UI.world.hpLow : UI.world.hp, 1);
  }

  updateBossBar() {
    if (!this.bossBar || !this.boss) return;
    const B = this.boss;
    this.bossName.setText(B.name + '  ' + Math.max(0, B.hp) + ' / ' + B.maxHp);
    this.bossBar.width = Math.max(0, 254 * (Math.max(0, B.hp) / B.maxHp));
    this.bossBarBg.setVisible(this.bossActive);
    this.bossBar.setVisible(this.bossActive);
    this.bossName.setVisible(this.bossActive);
  }

  updateHud() {
    if (!this.hudTitle) return;
    const s = this.screens[this.screenIndex] || this.screens[0];
    const prof = profileFor(s.biome);
    const q = this.world[prof.questDef];
    const questState = this.save[prof.questSave];
    const herbCount = this.save[prof.herbSave];
    const q2 = prof.quest2Def ? this.world[prof.quest2Def] : null;
    const q2State = q2 ? this.save[prof.quest2Save] : 'none';
    const ventCount = q2 ? (this.save[prof.ventSave] || []).length : 0;
    this.hudTitle.setText('远征 · ' + (s.short || s.name));
    const layerName = this.layer === 'cave' ? ' · 地穴' : (this.layer === 'plateau' ? ' · 台地' : '');
    this.hudPlace.setText(s.weatherName + ' · 第 ' + (this.screenIndex + 1) + '/' + this.screens.length + ' 屏' + layerName);
    let item = prof.item;
    let count = herbCount;
    let qs = QUEST_LABEL[questState] || QUEST_LABEL.none;
    if (q2 && questState === 'done') {
      item = prof.item2;
      count = ventCount;
      qs = q2State === 'done' ? '已淬' : (q2State === 'active' ? '淬火' : '待接');
      if (q2State === 'active') {
        qs = '淬火 ' + Math.min(ventCount, q2.need) + '/' + q2.need;
        if (ventCount >= q2.need) qs = '可交付 ' + q2.need + '/' + q2.need;
      }
    } else if (questState === 'active') {
      qs = '采集 ' + Math.min(herbCount, q.need) + '/' + q.need;
      if (herbCount >= q.need) qs = '可交付 ' + q.need + '/' + q.need;
    }
    this.hudQuest.setText(item + ' ' + count + ' · ' + qs + ' · 碎片 ' + this.save.tokens);
    const gold = questState === 'done' && (!q2 || q2State === 'done');
    this.hudQuest.setColor(gold ? UI.text.gold : UI.text.body);
    this.hudHint.setText(this.hudHintText());
    this.updateHp();
    this.updateBossBar();
    const showAttack = this.bossActive && !this.panelOpen && !this.talking && !this.dead && !this.victory && !this.touchCtl;
    if (this.attackBtn) {
      this.attackBtn.setVisible(showAttack);
      this.attackT.setVisible(showAttack);
    }
  }

  hudHintText() {
    if (this.gathering) return '正在采集 · 移动会打断';
    if (this.dead) return '星火熄灭 · R 重新挑战 / ESC 回小屋';
    if (this.bossActive) {
      const name = this.boss?.name || '世界 Boss';
      return this.touchCtl ? '点按「攻」击败' + name + ' · 点按「返」回小屋' : 'SPACE / J 攻击 · 击败' + name + ' · ESC 回小屋';
    }
    const s = this.screens[this.screenIndex] || this.screens[0];
    const prof = profileFor(s.biome);
    const q = this.world[prof.questDef];
    const questState = this.save[prof.questSave];
    const herbCount = this.save[prof.herbSave];
    const q2 = prof.quest2Def ? this.world[prof.quest2Def] : null;
    const q2State = q2 ? this.save[prof.quest2Save] : 'none';
    const ventCount = q2 ? (this.save[prof.ventSave] || []).length : 0;
    if (q2 && questState === 'done') {
      if (q2State === 'none') return '找赤砧接「' + q2.name + '」 · ESC 回小屋';
      if (q2State === 'active' && ventCount < q2.need) {
        return '靠近炉眼按 E 淬火 · 还差 ' + (q2.need - ventCount) + ' 处 · ESC 回小屋';
      }
      if (q2State === 'active' && ventCount >= q2.need) return prof.readyHint2 + ' · ESC 回小屋';
      return '篝火旁按 E 传送 · ESC 回小屋';
    }
    if (questState === 'active' && herbCount >= q.need) {
      return prof.readyHint + ' · ESC 回小屋';
    }
    if (this.touchCtl) return '摇杆移动 · E 采集 / 交谈 · 攻 攻击 · 返 回小屋';
    return 'WASD / 方向键 移动 · E 采集 / 交谈 · SPACE / J 攻击 · ESC 回小屋';
  }

  toast(msg) {
    if (this.toastT) this.toastT.destroy();
    this.toastT = hudText(this, VIEW_W / 2, 44, msg, 'body', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 900,
    });
    this.time.delayedCall(1700, () => {
      if (this.toastT) this.toastT.destroy();
      this.toastT = null;
    });
  }

  banner(text) {
    if (this.dead) return;
    if (this.bannerT) this.bannerT.destroy();
    this.bannerT = hudText(this, VIEW_W / 2, 82, text, 'h1', {
      background: UI.hud.bgSoft, color: UI.text.heading, origin: [0.5, 0], depth: 850,
    }).setAlpha(0);
    this.tweens.add({
      targets: this.bannerT, alpha: 1, duration: 220, yoyo: true, hold: 700,
      onComplete: () => { if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; } },
    });
  }

  buildTouch() {
    if (!isTouchDevice()) return;
    this.touchCtl = new TouchControls(this, {
      attack: () => {
        if (!this.talking && !this.panelOpen && !this.dead && !this.victory) this.attack();
      },
      interact: () => {
        if (!this.talking && !this.panelOpen && !this.dead && !this.victory && !this.gathering) this.onAction();
      },
      escape: () => this.onEsc(),
    }, WORLD_TOUCH);
    this.events.once('shutdown', () => {
      if (this.touchCtl) { this.touchCtl.destroy(); this.touchCtl = null; }
    });
  }

  /* ---------- 屏幕切换 ---------- */
  applyScreen(index, initial = false) {
    const s = this.screens[index];
    if (!s) return;
    this.screenIndex = index;
    this.screenId = s.id;
    this.applyWeather(s);
    if (!this.save.visited.includes(s.id)) {
      this.save = patchWorldSave({ visited: [...this.save.visited, s.id] });
    }
    this.updateLayer(true);
    this.updateHud();
    if (!initial) this.banner(s.name);
    const bossDef = this.bossByScreen.get(s.id);
    if (bossDef) this.enterBossScreen(bossDef);
  }

  bossDone(def) {
    if (!def) return false;
    if (this.save.bosses && this.save.bosses[def.id] === 'done') return true;
    // v7 旧档兼容：boss 字段只代表草原苔背巨兽。
    return def.id === 'mossBeast' && this.save.boss === 'done';
  }

  bossSpawnFor(def) {
    const si = this.screens.findIndex((s) => s.id === def.screen);
    if (si < 0) return null;
    const s = this.screens[si];
    return {
      x: s.x + def.x, y: WORLD_Y + def.y,
      screenIndex: si, screen: s, def,
    };
  }

  enterBossScreen(def) {
    const spawn = this.bossSpawnFor(def);
    if (!spawn) return;
    this.bossSpawn = spawn;
    if (this.bossDone(def)) {
      this.showMemorial(def);
      return;
    }
    if (!this.boss || this.boss.id !== def.id) this.spawnBoss(def);
    if (!this.bossActive && !this.bossDead) this.startBossFight();
  }

  /* ---------- 输入 ---------- */
  bindInput() {
    this.keys = this.input.keyboard.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
    });
    this.input.keyboard.on('keydown-E', () => this.onAction());
    this.input.keyboard.on('keydown-ESC', () => this.onEsc());
    this.input.keyboard.on('keydown-SPACE', () => this.attack());
    this.input.keyboard.on('keydown-J', () => this.attack());
    this.input.keyboard.on('keydown-R', () => {
      if (this.dead) this.retryBoss();
    });
    this.input.mouse?.disableContextMenu();
    this.stickRing = this.add.graphics().setScrollFactor(0).setDepth(700);
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (this.touchCtl && this.touchCtl.hitTest(pointer.x, pointer.y)) return;
      if (this.talking) { this.advanceTalk(); return; }
      if (this.panelOpen || this.gathering || this.dead || this.victory) return;
      if (isTouchDevice() && pointer.y >= 38 && pointer.y <= VIEW_H - 58) {
        this.stick = { active: true, ox: pointer.x, oy: pointer.y, dx: 0, dy: 0 };
      }
      if (currentlyOver && currentlyOver.length) return;
      if (pointer.y < 38 || pointer.y > VIEW_H - 58) return;
      this.pointerTarget = { x: pointer.worldX, y: pointer.worldY };
    });
    this.input.on('pointermove', (pointer) => {
      if (!this.stick.active) return;
      const v = new Phaser.Math.Vector2(pointer.x - this.stick.ox, pointer.y - this.stick.oy);
      const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
      const len = v.length();
      if (len > 10) {
        const mag = Math.min(len, limit);
        v.normalize();
        this.stick.dx = (v.x * mag) / limit;
        this.stick.dy = (v.y * mag) / limit;
        this.pointerTarget = null;
      } else {
        this.stick.dx = 0; this.stick.dy = 0;
      }
    });
    const releaseStick = () => {
      this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
      if (this.stickRing) this.stickRing.clear();
    };
    this.input.on('pointerup', releaseStick);
    this.input.on('pointerupoutside', releaseStick);
    this.input.addPointer(1);
    ['W', 'A', 'S', 'D'].forEach((k) => {
      this.input.keyboard.on('keydown-' + k, () => { this.pointerTarget = null; });
    });
  }

  onEsc() {
    if (this.victory) { this.closeVictory(); return; }
    if (this.dead) { this.leave(); return; }
    if (this.panelOpen) { this.closePanel(); return; }
    if (this.talking) { this.closeTalk(); return; }
    if (this.gathering) { this.cancelGather(); return; }
    this.leave();
  }

  leave() {
    try { this.sound.play('ui', { volume: 0.3 }); } catch (e) {}
    if (!NAV.back()) this.scene.start('title');
  }

  onAction() {
    if (this.victory) { this.closeVictory(); return; }
    if (this.dead) { this.retryBoss(); return; }
    if (this.talking) { this.advanceTalk(); return; }
    if (this.panelOpen || this.gathering) return;
    if (this.bossActive) {
      const battle = this.nearestHerb(true);
      if (battle && this.distPlayer(battle.x, battle.y) <= 46) { this.pickBattleHerb(battle); return; }
      this.attack();
      return;
    }
    const quench = this.nearestQuench();
    if (quench && this.distPlayer(quench.x, quench.y) <= 48) {
      this.quenchAt(quench);
      return;
    }
    const camp = this.nearestCampfire();
    if (camp && this.travelUnlocked() && this.distPlayer(camp.x, camp.y) <= 48) {
      this.openTravel();
      return;
    }
    const herb = this.nearestHerb();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) {
      if (herb.battle) this.pickBattleHerb(herb);
      else this.startGather(herb);
      return;
    }
    if (camp && this.distPlayer(camp.x, camp.y) <= 48) {
      this.toast('篝火还没记住你 · 先完成熔匠的三淬归火');
      return;
    }
    const npc = this.nearestNpc();
    if (npc && this.distPlayer(npc.x, npc.y) <= 52) {
      this.interactNpc(npc);
      return;
    }
    this.toast('走近草药、炉眼、篝火或村民再按 E');
  }

  /* ---------- 移动与每帧 ---------- */
  update(time, delta) {
    if (!this.player || !this.screens) return;
    if (this.touchCtl) this.touchCtl.setEnabled(!this.panelOpen && !this.talking && !this.gathering && !this.dead && !this.victory);
    this.drawStickRing();
    if (this.dead || this.victory) return;
    if (this.panelOpen) return;
    if (this.talking) return;
    if (this.gathering) {
      this.updateGather(delta);
      this.updateHud();
      return;
    }
    let vx = 0;
    let vy = 0;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown) vx -= 1;
    if (k.right.isDown || k.d.isDown) vx += 1;
    if (k.up.isDown || k.w.isDown) vy -= 1;
    if (k.down.isDown || k.s.isDown) vy += 1;
    if (this.stick.active) { vx += this.stick.dx; vy += this.stick.dy; }

    if (vx || vy) {
      this.pointerTarget = null;
      this.movePlayer(vx, vy, delta);
    } else if (this.pointerTarget) {
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const d = Math.hypot(dx, dy);
      if (d <= 4) {
        this.pointerTarget = null;
        this.playIdle();
      } else {
        this.movePlayer(dx / d, dy / d, delta);
      }
    } else {
      this.playIdle();
    }

    this.player.shadow.x = this.player.x;
    this.player.shadow.y = this.player.y - 2;
    this.updateLayer();
    this.updatePrompts();
    this.updateRespawns(time);
    this.updateBoss(time, delta);
    this.updateMobs(time, delta);
    this.updateLoot();
    const next = clamp(Math.floor((this.player.x + 2) / SCREEN_W), 0, this.screens.length - 1);
    if (next !== this.screenIndex) this.applyScreen(next);
  }

  drawStickRing() {
    if (!this.stickRing) return;
    this.stickRing.clear();
    if (!this.stick.active || this.panelOpen || this.talking || this.gathering) return;
    const limit = Math.min(this.scale.width, this.scale.height) * 0.18;
    this.stickRing.lineStyle(1, 0xffffff, 0.3).strokeCircle(this.stick.ox, this.stick.oy, limit);
    this.stickRing.fillStyle(0xffffff, 0.55)
      .fillCircle(this.stick.ox + this.stick.dx * limit, this.stick.oy + this.stick.dy * limit, 4);
  }

  movePlayer(vx, vy, delta) {
    const d = Math.hypot(vx, vy) || 1;
    let mul = this.weather === 'rain' ? 1.05 : (this.weather === 'fog' ? 0.92 : (this.weather === 'dust' ? 0.94 : (this.weather === 'snow' ? 0.90 : 1)));
    if (this.layer === 'cave') mul *= 0.9;
    const step = SPEED * mul * (delta / 1000);
    let nx = this.player.x + (vx / d) * step;
    let ny = this.player.y + (vy / d) * step;
    nx = clamp(nx, 8, this.worldWidth - 8);
    ny = clamp(ny, WORLD_Y + 14, WORLD_Y + SCREEN_H - 10);
    if (this.bossActive && this.bossSpawn) {
      nx = clamp(nx, this.bossSpawn.screen.x + 24, this.bossSpawn.screen.x + SCREEN_W - 24);
    }
    if (!this.isBlocked(nx, this.player.y)) this.player.x = nx;
    if (!this.isBlocked(this.player.x, ny)) this.player.y = ny;
    if (Math.abs(vx) > Math.abs(vy)) this.face = vx < 0 ? 'left' : 'right';
    else this.face = vy < 0 ? 'up' : 'down';
    const anim = 'p-' + this.charSkin + '-walk-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  isBlocked(x, y) {
    const fx = x;
    const fy = y - 4;
    const r = 7;
    for (let i = 0; i < this.blockers.length; i += 1) {
      const b = this.blockers[i];
      if (fx + r > b.x && fx - r < b.x + b.w && fy + r > b.y && fy - r < b.y + b.h) return true;
    }
    return false;
  }

  playIdle() {
    const anim = 'p-' + this.charSkin + '-idle-' + this.face;
    if (this.player.anims.currentAnim?.key !== anim) this.player.anims.play(anim, true);
  }

  updateLayer(force = false) {
    const s = this.screens[this.screenIndex];
    if (!s) return;
    let layer = 'surface';
    const lx = this.player.x - s.x;
    const ly = this.player.y - WORLD_Y;
    if (s.cave && lx >= s.cave.x + 6 && lx <= s.cave.x + s.cave.w - 6
      && ly >= s.cave.y + 8 && ly <= s.cave.y + s.cave.h - 6) layer = 'cave';
    else if (s.plateau && lx >= s.plateau.x + 4 && lx <= s.plateau.x + s.plateau.w - 4
      && ly >= s.plateau.y + 4 && ly <= s.plateau.y + s.plateau.h - 4) layer = 'plateau';
    if (layer !== this.layer || force) {
      this.layer = layer;
      this.caveShade.setAlpha(layer === 'cave' ? 0.46 : 0);
      this.updateHud();
    }
  }

  distPlayer(x, y) {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y - 14, x, y - 8);
  }

  nearestHerb(battleOnly = false) {
    let best = null;
    let bestD = 999;
    this.herbs.forEach((n) => {
      if (!n.active || (battleOnly && !n.battle)) return;
      const d = this.distPlayer(n.x, n.y);
      if (d < bestD) { bestD = d; best = n; }
    });
    return bestD <= 80 ? best : null;
  }

  updatePrompts() {
    const busy = this.talking || this.panelOpen || !!this.gathering || this.dead || this.victory;
    this.herbs.forEach((n) => n.prompt.setVisible(false));
    this.npcs.forEach((n) => n.prompt.setVisible(false));
    this.quenches.forEach((q) => q.prompt.setVisible(false));
    this.campfires.forEach((c) => c.prompt.setVisible(false));
    if (busy) return;
    // Boss 战里保留一处“沙蓬”风险采集：E 快采回血，不冻结 Boss。
    if (this.bossActive) {
      const battle = this.nearestHerb(true);
      if (battle && this.distPlayer(battle.x, battle.y) <= 48) battle.prompt.setVisible(true);
      return;
    }
    const quench = this.nearestQuench();
    if (quench && this.save.volcanoQuest2 === 'active' && this.distPlayer(quench.x, quench.y) <= 48) {
      quench.prompt.setVisible(true);
      return;
    }
    const camp = this.nearestCampfire();
    if (camp && this.travelUnlocked() && this.distPlayer(camp.x, camp.y) <= 48) {
      camp.prompt.setVisible(true);
      return;
    }
    const herb = this.nearestHerb();
    if (herb && this.distPlayer(herb.x, herb.y) <= 46) {
      herb.prompt.setVisible(true);
      return;
    }
    const npc = this.nearestNpc();
    if (npc && this.distPlayer(npc.x, npc.y) <= 52) npc.prompt.setVisible(true);
  }

  updateRespawns(time) {
    this.herbs.forEach((n) => {
      if (!n.active && n.respawnAt && time >= n.respawnAt) {
        n.active = true;
        n.respawnAt = 0;
        n.sprite.setVisible(true);
        n.glow.setVisible(true);
        this.toast(n.battle ? '沙蓬重新抽叶' : profileFor(n.biome).respawn);
      }
    });
  }

  /* ---------- 采集读条 ---------- */
  startGather(node) {
    if (!node || !node.active || this.gathering) return;
    if (node.battle) { this.pickBattleHerb(node); return; }
    if (this.bossActive) return;
    this.pointerTarget = null;
    this.playIdle();
    const x = node.x;
    const y = node.y - 34;
    this.gathering = { node, t: 0, dur: GATHER_MS };
    this.gatherBg = this.add.rectangle(x - 20, y, 40, 5, 0x000000, 0.8)
      .setOrigin(0).setDepth(50);
    this.gatherFill = this.add.rectangle(x - 19, y + 1, 0, 3, UI.world.herbGold, 1)
      .setOrigin(0).setDepth(51);
    this.gatherLabel = this.add.text(x, y - 4, '采集中', {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.heading,
      backgroundColor: UI.hud.bgSoft, padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 1).setDepth(52);
    node.prompt.setVisible(false);
    this.updateHud();
  }

  updateGather(delta) {
    const g = this.gathering;
    if (!g) return;
    const k = this.keys;
    if (k.left.isDown || k.a.isDown || k.right.isDown || k.d.isDown
      || k.up.isDown || k.w.isDown || k.down.isDown || k.s.isDown) {
      this.cancelGather('移动打断采集');
      return;
    }
    g.t += delta;
    this.gatherFill.width = 38 * Math.min(1, g.t / g.dur);
    if (g.t >= g.dur) this.completeGather();
  }

  /* 战斗中的沙蓬快采：不进入 gathering，Boss / 小怪继续行动。 */
  pickBattleHerb(node) {
    if (!node || !node.active || this.gathering) return;
    node.active = false;
    node.respawnAt = this.time.now + BATTLE_HERB_RESPAWN_MS;
    this.pointerTarget = null;
    node.sprite.setVisible(false);
    node.glow.setVisible(false);
    node.prompt.setVisible(false);
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + (node.heal || 2));
    const healed = this.hp - before;
    const ring = this.add.ellipse(node.x, node.y - 8, 18, 8, UI.world.herb, 0.22)
      .setDepth(33).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring, scaleX: 2.8, scaleY: 1.8, alpha: 0, duration: 360,
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      const mote = this.add.rectangle(node.x + Math.cos(a) * 5, node.y - 8 + Math.sin(a) * 3, 2, 2,
        i % 2 ? UI.world.herb : UI.world.herbGold, 0.9).setDepth(34);
      this.tweens.add({
        targets: mote, x: mote.x + Math.cos(a) * 14, y: mote.y - 12 + Math.sin(a) * 4,
        alpha: 0, duration: 420, onComplete: () => mote.destroy(),
      });
    }
    this.updateHp();
    this.updateHud();
    this.toast(healed > 0 ? '沙蓬入药 · 回 ' + healed + ' 点生命' : '沙蓬 · 生命已满');
  }

  cancelGather(msg) {
    const g = this.gathering;
    this.gathering = null;
    this.destroyGather();
    if (msg) this.toast(msg);
    this.updateHud();
    if (g) this.updatePrompts();
  }

  destroyGather() {
    [this.gatherBg, this.gatherFill, this.gatherLabel].forEach((o) => { if (o) o.destroy(); });
    this.gatherBg = this.gatherFill = this.gatherLabel = null;
  }

  completeGather() {
    const g = this.gathering;
    if (!g) return;
    const node = g.node;
    this.gathering = null;
    this.destroyGather();
    node.active = false;
    node.respawnAt = this.time.now + RESPAWN_MS;
    node.sprite.setVisible(false);
    node.glow.setVisible(false);
    const prof = profileFor(node.biome);
    const q = this.world[prof.questDef];
    const key = prof.herbSave;
    const count = this.save[key] + q.yield;
    this.save = patchWorldSave({ [key]: count });
    this.toast('采到' + prof.item + ' ×' + q.yield);
    this.updateHud();
    if (this.save[prof.questSave] === 'active' && count >= q.need) {
      this.toast(prof.readyHint);
    }
  }

  /* ---------- 村医 / 竹隐 / 沙婆与委托 ---------- */
  questFor(npc) {
    return this.world[profileForNpc(npc).questDef];
  }

  questStateFor(npc) {
    return this.save[profileForNpc(npc).questSave];
  }

  herbCountFor(npc) {
    return this.save[profileForNpc(npc).herbSave];
  }

  herbKeyFor(npc) {
    return profileForNpc(npc).herbSave;
  }

  questKeyFor(npc) {
    return profileForNpc(npc).questSave;
  }

  secondQuestFor(npc) {
    const prof = profileForNpc(npc);
    return prof.quest2Def ? this.world[prof.quest2Def] : null;
  }

  secondStateFor(npc) {
    const prof = profileForNpc(npc);
    return prof.quest2Save ? this.save[prof.quest2Save] : 'none';
  }

  ventCountFor(npc) {
    const prof = profileForNpc(npc);
    return prof.ventSave ? (this.save[prof.ventSave] || []).length : 0;
  }

  npcLines2(npc, state, count) {
    if (npc.quest !== 'volcano') return [];
    const q = this.secondQuestFor(npc);
    if (!q) return [];
    const missing = q.need - count;
    if (state === 'done') return ['三淬归火。铁砧记住了你的手。', '以后在篝火旁按 E，五片地的火会替你引路。'];
    if (state === 'none') return ['火稳了，可铁砧还差三口气。', '去焦原、黑曜坡、灰口各找一处炉眼，按 E 淬火。'];
    return ['炉眼还差 ' + missing + ' 处。', '焦原、黑曜坡、灰口的旧裂口都能淬，走近按 E。'];
  }

  npcLines(npc, state, count) {
    const q = this.questFor(npc);
    const missing = q.need - count;
    if (npc.quest === 'bamboo') {
      if (state === 'done') return ['雾竹的味道，和五十年前一样。', '路还长，别把灯熄了。'];
      if (state === 'none') return ['这片竹林最近起了雾，旧祠的灯也暗了。', '帮我采四株雾竹回来，我要熬一锅汤。'];
      return ['还差 ' + missing + ' 株雾竹。', '旧祠后面的竹丛，采完会重新长出来。'];
    }
    if (npc.quest === 'desert') {
      if (state === 'done') return ['沙枣够甜，井水也活了。', '收下碎片，别在沙暴里回头。'];
      if (state === 'none') return ['风把沙枣吹到旧门那边了。', '帮我拾五颗回来，井里还有一盏灯。'];
      return ['还差 ' + missing + ' 颗沙枣。', '旧门附近的沙丘上还有，采完会重新长出来。'];
    }
    if (npc.quest === 'snow') {
      if (state === 'done') return ['雪灯亮了，破祠里终于有影子。', '往风口走时别回头，雪会替你记路。'];
      if (state === 'none') return ['破祠的灯灭了很久，雪把灯芯压在霜林里。', '帮我拾五盏雪灯回来，我想再点一次。'];
      return ['还差 ' + missing + ' 盏雪灯。', '白原和石灯附近还有，雪化之前它们会重新亮。'];
    }
    if (npc.quest === 'volcano') {
      if (state === 'done') return ['炉子又烧起来了，铁砧响得像心跳。', '收好碎片，别让火山吞了你的影子。'];
      if (state === 'none') return ['炉子冷了三天，火种被灰埋在南边的焦原里。', '帮我拾五枚火种回来，铁砧还没凉透。'];
      return ['还差 ' + missing + ' 枚火种。', '焦原和黑曜坡还有，火种会在灰下重新亮。'];
    }
    if (state === 'done') return ['这些草药救了不少人。', '路上小心，星火会记得你。'];
    if (state === 'none') return ['你来得正好。村东的草药被雨泡坏了不少。', '能帮我采 5 株回来吗？草原上还有三丛。'];
    return ['还差 ' + missing + ' 株。', '草原上那几丛，采完会重新长出来。'];
  }

  interactNpc(npc) {
    if (!npc || this.talking || this.panelOpen || this.bossActive) return;
    const prof = profileForNpc(npc);
    const q = this.questFor(npc);
    const state = this.questStateFor(npc);
    if (state === 'done' && this.secondQuestFor(npc)) {
      const q2 = this.secondQuestFor(npc);
      const s2 = this.secondStateFor(npc);
      if (s2 === 'done') {
        this.say(npc.name, this.npcLines2(npc, 'done', this.ventCountFor(npc)));
        return;
      }
      if (s2 === 'none') {
        this.say(npc.name, this.npcLines2(npc, 'none', 0), () => {
          this.save = patchWorldSave({ [prof.quest2Save]: 'active' });
          this.refreshQuenchVisuals();
          this.updateHud();
          this.toast('新委托 · ' + q2.name);
        });
        return;
      }
      const count2 = this.ventCountFor(npc);
      if (count2 < q2.need) {
        this.say(npc.name, this.npcLines2(npc, 'active', count2));
        return;
      }
      this.showQuestChoice(npc, 2);
      return;
    }
    if (state === 'done') {
      this.say(npc.name, this.npcLines(npc, state, this.herbCountFor(npc)));
      return;
    }
    if (state === 'none') {
      this.say(npc.name, this.npcLines(npc, state, 0), () => {
        this.save = patchWorldSave({ [prof.questSave]: 'active' });
        this.updateHud();
        this.toast('委托已接受 · ' + q.name);
      });
      return;
    }
    const count = this.herbCountFor(npc);
    if (count < q.need) {
      this.say(npc.name, this.npcLines(npc, state, count));
      return;
    }
    this.showQuestChoice(npc);
  }

  showQuestChoice(npc, stage = 1) {
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    const prof = profileForNpc(npc);
    const q = stage === 2 ? this.secondQuestFor(npc) : this.questFor(npc);
    const count = stage === 2 ? this.ventCountFor(npc) : this.herbCountFor(npc);
    const unit = stage === 2 ? (prof.unit2 || '处') : (prof.unit || '株');
    const item = stage === 2 ? (prof.item2 || '炉眼') : prof.item;
    const W = Math.min(390, VIEW_W - 40);
    const H = 154;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    this.panelOpen = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '委托 · ' + q.name, 'h2', { color: UI.text.heading }));
    p.add(makeText(this, 14, 34, npc.name + ' 需要 ' + q.need + ' ' + unit + item + '，当前 ' + count + ' ' + unit + '。', 'body', {
      color: UI.text.body,
    }));
    const rows = [
      ['交付 ' + q.need + ' ' + unit + item, () => this.deliverQuest(npc, stage)],
      ['再等等', () => this.closePanel()],
    ].map(([label, cb], i) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 68 + i * 32, w: W - 32, h: 26,
        accent: i === 0 ? UI.color.gold : UI.color.lineMuted,
        depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: i === 0 ? UI.text.primary : UI.text.muted,
      }));
      return { card };
    });
    this.panel = { dim, panel: p, rows, npc, stage };
    this.updateHud();
  }

  deliverQuest(npc, stage = 1) {
    const prof = profileForNpc(npc);
    if (stage === 2) {
      const q2 = this.secondQuestFor(npc);
      if (!q2) return;
      this.save = patchWorldSave({
        [prof.quest2Save]: 'done',
        tokens: this.save.tokens + q2.rewardTokens,
      });
      this.closePanel();
      this.refreshQuenchVisuals();
      this.updateHud();
      this.toast('委托完成 · 星火碎片 +' + q2.rewardTokens);
      this.banner('篝火 · 已记住五片地');
      this.say(npc.name, this.npcLines2(npc, 'done', this.ventCountFor(npc)));
      return;
    }
    const q = this.questFor(npc);
    const count = this.herbCountFor(npc);
    const herbKey = prof.herbSave;
    const questKey = prof.questSave;
    this.save = patchWorldSave({
      [herbKey]: Math.max(0, count - q.need),
      [questKey]: 'done',
      tokens: this.save.tokens + q.rewardTokens,
    });
    this.closePanel();
    this.updateHud();
    this.toast('委托完成 · 星火碎片 +' + q.rewardTokens);
    this.say(npc.name, npc.quest === 'bamboo'
      ? ['雾竹够了。', '收下这枚星火碎片，旧祠的灯就拜托你了。']
      : (npc.quest === 'desert'
        ? ['沙枣够了。', '收下这枚星火碎片，旧门的灯就拜托你了。']
        : (npc.quest === 'snow'
          ? ['雪灯够了。', '收下这枚星火碎片，破祠的灯就拜托你了。']
          : (npc.quest === 'volcano'
            ? ['火种够了。', '收下这枚星火碎片，铁砧的火就拜托你了。']
            : ['这些草药够了。', '收下这枚星火碎片吧，路上用得上。']))));
  }

  closePanel() {
    if (this.panel) {
      this.panel.rows.forEach((r) => destroyRow(r));
      this.panel.dim.destroy();
      this.panel.panel.container.destroy();
      this.panel = null;
    }
    this.panelOpen = false;
    if (this.hudHint) this.hudHint.setVisible(true);
    this.updatePrompts();
    this.updateHud();
  }

  /* ---------- 对话 ---------- */
  say(name, lines, onDone) {
    if (this.talking) return;
    this.talking = true;
    this.pointerTarget = null;
    if (this.hudHint) this.hudHint.setVisible(false);
    const arr = Array.isArray(lines) ? lines : [String(lines)];
    const W = VIEW_W - 48;
    const H = 96;
    const x = 24;
    const y = VIEW_H - H - 26;
    this.talkHit = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(96).setInteractive();
    this.talkHit.on('pointerdown', () => this.advanceTalk());
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    const nameT = makeText(this, 12, 9, name, 'h2', { color: UI.text.heading });
    const body = makeText(this, 12, 30, '', 'body', {
      color: UI.text.body, wordWrap: { width: W - 24 }, lineSpacing: 4,
    });
    const hint = makeText(this, W - 12, H - 12, 'E / 点击 继续', 'caption', {
      color: UI.text.muted, origin: [1, 1],
    });
    p.add(nameT, body, hint);
    this.talk = { p, name, lines: arr, index: 0, body, onDone, hit: this.talkHit };
    this.showTalkLine();
    this.updatePrompts();
    this.updateHud();
  }

  showTalkLine() {
    if (!this.talk) return;
    this.talk.body.setText(this.talk.lines[this.talk.index] || '');
  }

  advanceTalk() {
    if (!this.talk) return;
    if (this.talk.index < this.talk.lines.length - 1) {
      this.talk.index += 1;
      this.showTalkLine();
      return;
    }
    const cb = this.talk.onDone;
    this.closeTalk();
    if (cb) cb();
  }

  closeTalk() {
    if (!this.talk) return;
    this.talk.p.container.destroy();
    if (this.talk.hit) this.talk.hit.destroy();
    this.talk = null;
    this.talking = false;
    if (this.hudHint) this.hudHint.setVisible(!this.panelOpen);
    this.updatePrompts();
    this.updateHud();
  }

  /* ---------- Boss 场小怪 ---------- */
  clearMobLoot() {
    for (const item of this.loot || []) {
      if (item.spr) item.spr.destroy();
      if (item.glow) item.glow.destroy();
    }
    this.loot = [];
  }

  clearMobs(burst = false) {
    if (!this.mobs) this.mobs = [];
    for (const m of this.mobs) {
      if (!m || !m.spr) continue;
      if (burst) {
        const ring = this.add.ellipse(m.x, m.y - 2, 24, 8, UI.world.desert, 0.22)
          .setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: ring, scaleX: 2.2, scaleY: 1.4, alpha: 0,
          duration: 280, onComplete: () => ring.destroy(),
        });
      }
      if (m.spr) m.spr.destroy();
      if (m.shadow) m.shadow.destroy();
      m.alive = false;
    }
    this.mobs = [];
    this.minionRespawnAt = 0;
    this.clearMobLoot();
  }

  spawnBossMinions() {
    this.clearMobs();
    const B = this.boss;
    if (!B) return;
    const adds = Array.isArray(B.def.minions) ? B.def.minions : [];
    if (!adds.length) { this.minionMax = 0; return; }
    this.minionMax = adds.length;
    this.mobKills = 0;
    this.minionRespawnAt = 0;
    adds.forEach((add, i) => this.spawnMinion(add, i, false));
  }

  spawnMinion(add, slot, respawn = false) {
    const B = this.boss;
    if (!B || !add) return;
    const art = MINION_ART[add.kind] || MINION_ART.sandScarab;
    const screen = this.screens[B.screenIndex];
    if (!art || !screen) return;
    let point = add;
    // 重生点避开玩家脚边；三处沙口轮流使用。
    if (respawn && this.player) {
      for (const p of B.def.minions) {
        const px = screen.x + p.x;
        const py = WORLD_Y + p.y;
        if (Math.hypot(px - this.player.x, py - this.player.y) > 72) { point = p; break; }
      }
    }
    const x = screen.x + point.x;
    const y = WORLD_Y + point.y;
    const shadow = this.add.ellipse(x, y - 2, art.shadow[0], art.shadow[1], 0x000000, 0.24)
      .setDepth(28);
    const spr = this.add.sprite(x, y, art.idle, 0)
      .setOrigin(0.5, art.origin).setScale(respawn ? art.scale * 0.7 : art.scale).setDepth(31);
    if (respawn) {
      spr.setAlpha(0);
      const burrow = this.add.ellipse(x, y - 2, 30, 9, UI.world.desert, 0.28)
        .setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: burrow, scaleX: 1.8, scaleY: 1.2, alpha: 0,
        duration: 420, onComplete: () => burrow.destroy(),
      });
      this.tweens.add({
        targets: spr, alpha: 1, scaleX: art.scale, scaleY: art.scale,
        duration: 420, ease: 'Back.easeOut',
      });
    } else {
      const dust = this.add.ellipse(x, y - 3, 34, 10, UI.world.desert, 0.18)
        .setDepth(29).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: dust, scaleX: 1.6, scaleY: 0.7, alpha: 0, duration: 360, onComplete: () => dust.destroy() });
    }
    this.mobs.push({
      id: B.id + '-add-' + slot + '-' + Math.round(this.time.now),
      slot, kind: add.kind, def: add,
      x, y, spr, shadow, hp: add.hp, maxHp: add.hp, dmg: add.dmg,
      nextAt: this.time.now + (respawn ? 1800 : 2600 + slot * 240),
      phase: slot * 0.37, alive: true,
    });
  }

  updateMinionRespawn(time) {
    const B = this.boss;
    if (!B || !this.bossActive || this.dead || this.victory || !this.minionMax) return;
    if (this.mobs.length >= this.minionMax) { this.minionRespawnAt = 0; return; }
    const delay = B.def.minionRespawnMs || 9000;
    if (!this.minionRespawnAt) { this.minionRespawnAt = time + delay; return; }
    if (time < this.minionRespawnAt) return;
    const used = new Set(this.mobs.map((m) => m.slot));
    const slot = B.def.minions.findIndex((_, i) => !used.has(i));
    if (slot < 0) { this.minionRespawnAt = 0; return; }
    this.spawnMinion(B.def.minions[slot], slot, true);
    // 一次清空后先补一只，随后以更短的间隔把缺口补齐；避免 27 秒后才回到 3 只。
    this.minionRespawnAt = this.mobs.length < this.minionMax ? time + Math.max(1800, Math.floor(delay / 3)) : 0;
  }

  dropMobLoot(m) {
    if (!m) return;
    this.mobKills += 1;
    const B = this.boss;
    const chance = B && Number.isFinite(B.def.minionDropChance) ? B.def.minionDropChance : 0.35;
    if (this.mobKills > 1 && Math.random() >= chance) return;
    const glow = this.add.circle(m.x, m.y - 10, 10, UI.world.herbGold, 0.22)
      .setDepth(32).setBlendMode(Phaser.BlendModes.ADD);
    const spr = this.add.image(m.x, m.y - 10, 'heart').setScale(1.0).setDepth(33);
    this.tweens.add({ targets: spr, y: spr.y - 3, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: glow, alpha: 0.08, scale: 1.25, duration: 680, yoyo: true, repeat: -1 });
    this.loot.push({ x: m.x, y: m.y, spr, glow, heal: MOB_HEAL });
  }

  updateLoot() {
    if (!this.loot || !this.loot.length || this.dead || this.victory) return;
    for (const item of [...this.loot]) {
      if (this.hp >= this.maxHp) continue;
      if (this.distPlayer(item.x, item.y) > 24) continue;
      this.loot = this.loot.filter((x) => x !== item);
      const healed = Math.min(item.heal, this.maxHp - this.hp);
      this.hp += healed;
      this.updateHp();
      this.updateHud();
      const pop = this.add.text(item.x, item.y - 28, '+' + healed, {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.gold,
      }).setDepth(44);
      this.tweens.add({ targets: pop, y: pop.y - 16, alpha: 0, duration: 420, onComplete: () => pop.destroy() });
      if (item.spr) item.spr.destroy();
      if (item.glow) item.glow.destroy();
      this.toast('拾取 心火 · 回 ' + healed + ' 点生命');
    }
  }

  mobDirection(m) {
    const dx = this.player.x - m.x;
    const dy = this.player.y - m.y;
    if (Math.abs(dx) > Math.abs(dy) * 0.9) return dx < 0 ? 1 : 3;
    return dy < 0 ? 2 : 0;
  }

  updateMobs(time, delta) {
    if (!this.bossActive || !this.boss || this.dead || this.victory) return;
    this.updateMinionRespawn(time);
    if (!this.mobs.length) return;
    const arena = this.boss.arena;
    for (const m of this.mobs) {
      if (!m || !m.alive || !m.spr) continue;
      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const dir = this.mobDirection(m);
      if (d > 30 && d < 245) {
        const step = 44 * (delta / 1000);
        m.x = clamp(m.x + (dx / d) * step, arena.x1, arena.x2);
        m.y = clamp(m.y + (dy / d) * step, arena.y1, arena.y2);
      }
      m.spr.setPosition(m.x, m.y);
      m.shadow.setPosition(m.x, m.y - 2);
      const art = MINION_ART[m.kind] || MINION_ART.sandScarab;
      const moving = d > 30 && d < 245;
      const frame = moving && (Math.floor(time / 190) + Math.floor(m.phase * 2)) % 2
        ? art.skitter : art.idle;
      if (m.spr.texture.key !== frame || Number(m.spr.frame.name) !== dir) {
        m.spr.setTexture(frame, dir);
      }
      if (d <= 28 && time >= m.nextAt) {
        m.nextAt = time + 1120;
        this.hurtPlayer(m.x, m.y, m.dmg);
        m.spr.setTintFill(0xffffff);
        this.time.delayedCall(70, () => {
          if (m.alive && m.spr) m.spr.clearTint();
        });
      }
      if (this.dead) break;
    }
  }

  nearestMob(range) {
    let best = null;
    let bestD = range + 1;
    for (const m of this.mobs) {
      if (!m || !m.alive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y - 8, m.x, m.y - 10);
      if (d < bestD) { bestD = d; best = m; }
    }
    return best;
  }

  damageMob(m, dmg) {
    if (!m || !m.alive) return;
    m.hp = Math.max(0, m.hp - dmg);
    m.spr.setTintFill(0xffffff);
    this.cameras.main.shake(50, 0.004);
    const float = this.add.text(m.x + 4, m.y - 30, '-' + dmg, {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
    }).setDepth(44);
    this.tweens.add({ targets: float, y: float.y - 18, alpha: 0, duration: 480, onComplete: () => float.destroy() });
    if (m.hp > 0) {
      this.time.delayedCall(70, () => { if (m.alive && m.spr) m.spr.clearTint(); });
      return;
    }
    m.alive = false;
    this.dropMobLoot(m);
    const alive = this.mobs.filter((x) => x.alive && x !== m).length;
    if (this.bossActive && alive < this.minionMax) {
      const delay = (this.boss.def.minionRespawnMs || 9000);
      if (!this.minionRespawnAt) this.minionRespawnAt = this.time.now + delay;
    }
    const dust = this.add.ellipse(m.x, m.y - 2, 30, 9, UI.world.herbGold, 0.3)
      .setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: dust, scaleX: 2.4, scaleY: 1.3, alpha: 0,
      duration: 340, onComplete: () => dust.destroy(),
    });
    this.tweens.add({
      targets: [m.spr, m.shadow], alpha: 0, scaleX: 0.7, scaleY: 0.7,
      duration: 180, onComplete: () => {
        if (m.spr) m.spr.destroy();
        if (m.shadow) m.shadow.destroy();
      },
    });
    this.mobs = this.mobs.filter((x) => x !== m);
  }

  /* ---------- Boss ---------- */
  spawnBoss(def) {
    const b = def || (this.bossSpawn && this.bossSpawn.def);
    if (!b) return;
    if (this.boss) {
      for (const key of ['spr', 'mirror', 'glow', 'shadow', 'ring', 'label', 'warning']) {
        if (this.boss[key]) this.boss[key].destroy();
      }
      if (this.boss.breath) this.boss.breath.remove();
      this.boss = null;
    }
    this.clearMobs();
    const spawn = this.bossSpawnFor(b);
    if (!spawn) return;
    this.bossSpawn = spawn;
    const art = bossArt(b.art);
    const { x, y } = spawn;
    const glow = this.add.image(x, y - art.glowY, 'aura', 0)
      .setScale(3.6).setAlpha(0.16).setTint(art.tint)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(33).setVisible(false);
    const shadow = this.add.ellipse(x, y - 3, art.shadow[0], art.shadow[1], 0x000000, 0.26).setDepth(30).setVisible(false);
    const ring = this.add.ellipse(x, y - 3, Math.round(art.shadow[0] * 0.86), Math.round(art.shadow[1] * 1.1), art.tint, 0.13).setDepth(32).setVisible(false);
    const spr = this.add.sprite(x, y, art.tex.idle, 0)
      .setOrigin(0.5, art.origin.idle).setScale(art.scale).setDepth(35).setVisible(false);
    if (art.bodyTint) spr.setTint(art.bodyTint);
    // 沙海蜃专属蜃气：身后一层沙金色低透明重影，随呼吸轻微漂移。
    const mirror = art.mirage
      ? this.add.sprite(x, y, art.tex.idle, 0).setOrigin(0.5, art.origin.idle)
        .setScale(art.scale * 1.03).setAlpha(0.12).setTint(art.tint)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(34).setVisible(false)
      : null;
    const label = this.add.text(x, y - art.labelY, b.name, {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
      backgroundColor: UI.hud.bgSoft, padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setDepth(40).setVisible(false);
    this.boss = {
      id: b.id, def: b, art,
      name: b.name, spr, mirror, glow, shadow, ring, label, x, y,
      maxHp: b.hp, hp: b.hp, dmg: b.dmg, rewardTokens: b.rewardTokens,
      scale: art.scale, standoff: art.standoff,
      state: 'idle', stateEnd: 0, nextAt: 0, target: null, warning: null, flash: 0,
      pose: 'idle', dir: 0, faceAt: 0, moteAt: 0, turnAt: 0, turnDir: 0,
      screenIndex: spawn.screenIndex, arena: {
        x1: spawn.screen.x + 44, x2: spawn.screen.x + SCREEN_W - 44,
        y1: WORLD_Y + 104, y2: WORLD_Y + SCREEN_H - 22,
      },
    };
    this.bossActive = false;
    this.bossDead = false;
    this.setBossPose('idle', 0);
  }

  /* 四向帧：0 前 / 1 左 / 2 后 / 3 右（以图集实际画面为准）。
   * 追击时朝玩家；站定等待时每 BOSS_TURN_MS 转 90°，让 3D 件的正面 / 侧面 / 背面都能在场上读到。 */
  bossDirection() {
    if (!this.boss) return 0;
    const dx = this.player.x - this.boss.spr.x;
    const dy = this.player.y - this.boss.spr.y;
    if (Math.abs(dx) > Math.abs(dy) * 0.9) return dx < 0 ? 1 : 3;
    return dy < 0 ? 2 : 0;
  }

  setBossPose(pose, dir) {
    const B = this.boss;
    if (!B) return;
    const nextPose = B.art.tex[pose] ? pose : 'idle';
    const nextDir = Number.isInteger(dir) ? dir : this.bossDirection();
    if (B.pose === nextPose && B.dir === nextDir) return;
    B.pose = nextPose;
    B.dir = nextDir;
    B.spr.setOrigin(0.5, B.art.origin[nextPose]);
    B.spr.setTexture(B.art.tex[nextPose], nextDir);
    if (B.mirror) {
      B.mirror.setOrigin(0.5, B.art.origin[nextPose]);
      B.mirror.setTexture(B.art.tex[nextPose], nextDir);
    }
  }

  bossImpact(x, y, big = false) {
    const tint = this.boss ? this.boss.art.tint : UI.world.fieldLight;
    const ring = this.add.ellipse(x, y - 2, big ? 54 : 30, big ? 16 : 10, tint, 0.22)
      .setDepth(36).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring, scaleX: big ? 3.2 : 2.2, scaleY: big ? 1.7 : 1.3, alpha: 0,
      duration: big ? 520 : 320, ease: 'Quad.easeOut', onComplete: () => ring.destroy(),
    });
    const n = big ? 16 : 8;
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const r = Phaser.Math.Between(4, big ? 16 : 10);
      const mote = this.add.rectangle(x + Math.cos(a) * r, y - 8 + Math.sin(a) * r * 0.45, 2, 2, i % 3 ? tint : UI.world.herb, 0.8)
        .setDepth(37);
      this.tweens.add({
        targets: mote, x: mote.x + Math.cos(a) * (big ? 34 : 20), y: mote.y - (big ? 26 : 14),
        alpha: 0, duration: big ? 620 : 420, ease: 'Quad.easeOut', onComplete: () => mote.destroy(),
      });
    }
  }

  spawnBossMote() {
    const B = this.boss;
    if (!B || !this.bossActive) return;
    const mote = this.add.rectangle(
      B.spr.x + Phaser.Math.Between(-56, 56),
      B.spr.y - Phaser.Math.Between(24, 68),
      Phaser.Math.Between(1, 2), 2, B.art.tint, 0.62,
    ).setDepth(34);
    this.tweens.add({
      targets: mote, y: mote.y - Phaser.Math.Between(12, 24),
      x: mote.x + Phaser.Math.Between(-6, 6), alpha: 0, duration: Phaser.Math.Between(700, 1100),
      onComplete: () => mote.destroy(),
    });
  }

  /* desert-6 右边是雪原；Boss 战把邻屏暂时藏起来，补一段同群系沙海，
     让镜头里的边界仍是沙漠，而不是雪松。打完立刻恢复。 */
  buildBossEdge(screen) {
    this.restoreBossEdge();
    if (!screen) return;
    const idx = this.screens.indexOf(screen);
    const next = this.screens[idx + 1];
    if (!next || next.biome === screen.biome) return;
    const right = screen.x + SCREEN_W;
    this.bossHidden = [];
    this.children.list.forEach((o) => {
      if (!o || !o.visible || !o.setVisible) return;
      if (!Number.isFinite(o.x) || o.x < right + 1 || o.x > right + SCREEN_W) return;
      if (o.depth >= 60 || (o.scrollFactorX === 0 && o.scrollFactorY === 0)) return;
      o.setVisible(false);
      this.bossHidden.push(o);
    });
    const sand = this.add.tileSprite(right, WORLD_Y, SCREEN_W, SCREEN_H, 'desertTile', 0)
      .setOrigin(0).setDepth(0.2).setTint(TINT.desert || 0xffffff);
    this.bossEdge.push(sand);
    // 邻屏补景：沙脊用椭圆（和 desert-6 本屏的沙丘同一画法），再放一块风蚀岩和沙蓬。
    const farDune = this.add.ellipse(right + 132, WORLD_Y + SCREEN_H - 14, 78 * 1.7, 22 * 1.35, 0xb8975e, 0.4)
      .setDepth(17);
    const nearDune = this.add.ellipse(right + 28, WORLD_Y + SCREEN_H - 8, 78 * 1.1, 22 * 0.95, 0xc6a269, 0.32)
      .setDepth(18);
    const rock = this.add.image(right + 150, WORLD_Y + SCREEN_H - 10, 'desertRock')
      .setOrigin(0.5, 1).setScale(1.9).setDepth(18).setTint(0xb79a6b);
    const shrub = this.add.image(right + 78, WORLD_Y + SCREEN_H - 16, 'desertShrub')
      .setOrigin(0.5, 1).setScale(1.25).setDepth(18).setTint(0xa98e61);
    const dead = this.add.image(right + 22, WORLD_Y + SCREEN_H - 18, 'desertDeadTree')
      .setOrigin(0.5, 1).setScale(1.15).setDepth(18).setTint(0xb59a6c);
    this.bossEdge.push(farDune, nearDune, rock, shrub, dead);
    // 一层极淡的风沙，把补景和真沙漠揉在一起。
    const haze = this.add.rectangle(right, WORLD_Y, SCREEN_W, SCREEN_H, 0xd9b77c, 0.12)
      .setOrigin(0).setDepth(19);
    this.bossEdge.push(haze);
  }

  restoreBossEdge() {
    for (const o of this.bossHidden || []) { if (o && o.setVisible) o.setVisible(true); }
    this.bossHidden = [];
    for (const o of this.bossEdge || []) { if (o && o.destroy) o.destroy(); }
    this.bossEdge = [];
  }

  startBossFight() {
    if (!this.boss) return;
    // 避开上一屏跨过来的树冠：把入场站位放到巢心左下空地。
    this.player.setPosition(this.bossSpawn.screen.x + 150, WORLD_Y + 240);
    this.bossActive = true;
    this.bossDead = false;
    this.victory = false;
    this.dead = false;
    this.hp = this.maxHp;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.pointerTarget = null;
    this.boss.hp = this.boss.maxHp;
    this.boss.state = 'intro';
    this.boss.stateEnd = this.time.now + 900;
    this.boss.nextAt = this.time.now + 900;
    this.boss.spr.setPosition(this.bossSpawn.x, this.bossSpawn.y).setVisible(true).setAlpha(1);
    if (this.boss.mirror) this.boss.mirror.setPosition(this.bossSpawn.x, this.bossSpawn.y).setVisible(true).setAlpha(0.1);
    this.boss.spr.setScale(this.boss.scale * 0.92);
    this.boss.turnDir = 0;
    this.boss.turnAt = this.time.now + BOSS_TURN_MS;
    this.tweens.add({
      targets: this.boss.spr, scale: this.boss.scale, duration: 520, ease: 'Back.easeOut',
      onComplete: () => { if (this.bossActive) this.startBossBreath(); },
    });
    this.boss.glow.setVisible(true);
    this.boss.shadow.setVisible(true);
    this.boss.ring.setVisible(true);
    this.boss.label.setVisible(false);
    this.setBossPose('roar', 0);
    this.spawnBossMinions();
    // 不做“八角笼”式红边：Boss 场的边界交给沙尘幕、沙丘和镜头外自然收束。
    if (this.arenaLine) { this.arenaLine.destroy(); this.arenaLine = null; }
    this.buildBossEdge(this.bossSpawn.screen);
    this.updateHud();
    this.updateBossBar();
    this.banner((this.boss.name || '世界 Boss') + ' · ' + (this.boss.def.title || '星火守巢者'));
    this.time.delayedCall(900, () => {
      if (this.bossActive) this.toast((this.touchCtl ? '点按「攻」' : 'SPACE / J 攻击') + ' · 击败' + (this.boss.name || '世界 Boss'));
    });
  }

  startBossBreath() {
    const B = this.boss;
    if (!B || B.breath) return;
    B.breath = this.tweens.add({
      targets: B.spr, scaleX: B.scale * 1.012, scaleY: B.scale * 0.988,
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  distBoss() {
    if (!this.boss) return 999;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y - 14, this.boss.spr.x, this.boss.spr.y - 36);
  }

  updateBoss(time, delta) {
    const B = this.boss;
    if (!B || !this.bossActive || this.dead || this.victory) return;
    B.spr.x = clamp(B.spr.x, B.arena.x1, B.arena.x2);
    B.spr.y = clamp(B.spr.y, B.arena.y1, B.arena.y2);
    B.glow.x = B.spr.x; B.glow.y = B.spr.y - B.art.glowY;
    B.shadow.x = B.spr.x; B.shadow.y = B.spr.y - 3;
    B.ring.x = B.spr.x; B.ring.y = B.spr.y - 3;
    B.label.x = B.spr.x; B.label.y = B.spr.y - B.art.labelY;
    if (B.mirror && B.mirror.visible) {
      B.mirror.x = B.spr.x + 4 + Math.sin(time / 210) * 2.5;
      B.mirror.y = B.spr.y - 1;
      B.mirror.setScale(B.spr.scaleX * 1.03, B.spr.scaleY * 1.03);
      B.mirror.setAlpha(0.09 + 0.045 * (0.5 + 0.5 * Math.sin(time / 280)));
    }
    if (B.flash > 0) {
      B.flash -= delta;
      if (B.flash <= 0) {
        if (B.art.bodyTint) B.spr.setTint(B.art.bodyTint); else B.spr.clearTint();
      }
    }
    const dist = this.distBoss();
    if (B.state === 'intro') {
      if (time >= B.stateEnd) {
        B.state = 'chase';
        B.nextAt = time + 720;
        B.turnDir = 0;
        B.turnAt = time + BOSS_TURN_MS;
        this.setBossPose('idle', 0);
      }
      return;
    }
    if (B.state === 'chase') {
      if (time >= B.faceAt) {
        B.faceAt = time + 90;
        if (dist <= B.standoff + 4) {
          if (time >= B.turnAt) {
            B.turnDir = (B.turnDir + 1) % 4;
            B.turnAt = time + BOSS_TURN_MS;
          }
          this.setBossPose('idle', B.turnDir);
        } else {
          this.setBossPose('idle');
          B.turnDir = B.dir;
          B.turnAt = time + BOSS_TURN_MS;
        }
      }
      if (time >= B.moteAt) { B.moteAt = time + 300; this.spawnBossMote(); }
      if (time >= B.nextAt) {
        // 每只 Boss 的近身阈值不同；没有声明 swipeAt 的沿用旧全局 104。
        if (dist < (B.art.swipeAt || 104)) this.startSwipe();
        else this.startPounce();
        return;
      }
      if (dist > B.standoff) {
        const dx = this.player.x - B.spr.x;
        const dy = this.player.y - B.spr.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = 34 * (delta / 1000);
        B.spr.x = clamp(B.spr.x + (dx / d) * step, B.arena.x1, B.arena.x2);
        B.spr.y = clamp(B.spr.y + (dy / d) * step, B.arena.y1, B.arena.y2);
      }
      return;
    }
    if (B.state === 'pounceWindup' && time >= B.stateEnd) {
      if (B.warning) { B.warning.destroy(); B.warning = null; }
      B.state = 'pounceAir';
      this.setBossPose('charge');
      const tx = clamp(B.target.x, B.arena.x1, B.arena.x2);
      const ty = clamp(B.target.y, B.arena.y1, B.arena.y2);
      this.tweens.add({
        targets: B.spr, x: tx, y: ty, duration: 180, ease: 'Quad.easeOut',
        onComplete: () => {
          if (!this.bossActive) return;
          const hitD = Phaser.Math.Distance.Between(this.player.x, this.player.y, B.target.x, B.target.y);
          if (hitD <= B.art.pounceR) this.hurtPlayer(B.spr.x, B.spr.y, B.dmg);
          this.bossImpact(B.spr.x, B.spr.y);
          this.setBossPose('roar');
          B.state = 'recover';
          B.stateEnd = this.time.now + 520;
        },
      });
      return;
    }
    if (B.state === 'pounceAir') return;
    if (B.state === 'swipeWindup' && time >= B.stateEnd) {
      if (B.warning) { B.warning.destroy(); B.warning = null; }
      this.setBossPose('roar');
      if (this.distBoss() <= B.art.swipeR) this.hurtPlayer(B.spr.x, B.spr.y, B.dmg);
      this.bossImpact(B.spr.x, B.spr.y);
      this.cameras.main.shake(110, 0.008);
      B.state = 'recover';
      B.stateEnd = this.time.now + 460;
      return;
    }
    if (B.state === 'recover') {
      if (time >= B.stateEnd) {
        this.setBossPose('idle');
        B.turnDir = B.dir;
        B.turnAt = time + BOSS_TURN_MS;
        B.state = 'chase';
        B.nextAt = time + 760;
      }
    }
  }

  startSwipe() {
    const B = this.boss;
    if (!B) return;
    B.state = 'swipeWindup';
    B.stateEnd = this.time.now + 320;
    this.setBossPose('charge');
    B.turnDir = B.dir;
    B.turnAt = this.time.now + BOSS_TURN_MS;
    if (B.warning) B.warning.destroy();
    // 只画外圈描边：环在 Boss 身体之上，但不填色，避免把沙海蜃本体洗成红色。
    B.warning = this.add.circle(B.spr.x, B.spr.y - 22, B.art.swipeWarn, 0x000000, 0)
      .setDepth(38).setStrokeStyle(3, 0xff7a6a, 0.9);
    this.tweens.add({ targets: B.warning, scale: 1.03, duration: 160, yoyo: true });
  }

  startPounce() {
    const B = this.boss;
    if (!B) return;
    B.state = 'pounceWindup';
    B.stateEnd = this.time.now + 420;
    // 扑击落在玩家与 Boss 之间的“体宽安全带”上，不再整只压到玩家头顶。
    const gap = B.art.pounceGap;
    const dx = B.spr.x - this.player.x;
    const dy = B.spr.y - this.player.y;
    const d = Math.hypot(dx, dy) || 1;
    B.target = { x: this.player.x + (dx / d) * gap, y: this.player.y + (dy / d) * gap };
    this.setBossPose('charge');
    B.turnDir = B.dir;
    B.turnAt = this.time.now + BOSS_TURN_MS;
    if (B.warning) B.warning.destroy();
    B.warning = this.add.circle(B.target.x, B.target.y - 10, 32, 0x000000, 0)
      .setDepth(38).setStrokeStyle(3, 0xff7a6a, 0.9);
    this.tweens.add({ targets: B.warning, scale: 1.08, duration: 210, yoyo: true });
  }

  attack() {
    if (!this.player || this.dead || this.victory || this.panelOpen || this.talking || this.gathering) return;
    if (this.time.now - this.atkAt < ATTACK_CD) return;
    this.atkAt = this.time.now;
    const v = VEC[this.face] || VEC.down;
    const fx = this.add.sprite(this.player.x + v[0] * 12, this.player.y + v[1] * 9, 'slA')
      .setDepth(36).setRotation((ANGLE[this.face] || 0) + Math.PI / 4).setScale(1.8);
    fx.play('slA-play');
    this.tweens.add({ targets: fx, scale: 2.2, duration: 180, onComplete: () => fx.destroy() });
    this.tweens.add({ targets: this.player, scaleX: 2.25, scaleY: 1.8, duration: 70, yoyo: true });
    try { this.sound.play('sword', { rate: Phaser.Math.FloatBetween(0.95, 1.08), volume: 0.5 }); } catch (e) {}
    if (!this.bossActive) return;
    // 小怪优先；如果 Boss 也在同一刀范围内，一并吃伤害。
    const mob = this.nearestMob(ATTACK_RANGE);
    if (mob) this.damageMob(mob, ATTACK_DMG);
    if (this.boss && this.distBoss() <= ATTACK_RANGE) this.damageBoss(ATTACK_DMG);
  }

  damageBoss(dmg) {
    const B = this.boss;
    if (!B || B.hp <= 0) return;
    B.hp = Math.max(0, B.hp - dmg);
    B.flash = 70;
    B.spr.setTintFill(0xffffff);
    this.updateBossBar();
    this.cameras.main.shake(70, 0.006);
    const float = this.add.text(B.spr.x + 10, B.spr.y - 40, '-' + dmg, {
      fontFamily: UI.font, fontSize: '12px', color: UI.text.danger,
    }).setDepth(44);
    this.tweens.add({ targets: float, y: float.y - 22, alpha: 0, duration: 620, onComplete: () => float.destroy() });
    if (B.hp <= 0) this.finishBoss();
  }

  hurtPlayer(fromX, fromY, dmg) {
    if (this.dead || this.victory) return;
    if (this.time.now - this.lastHurtAt < IFRAME) return;
    this.lastHurtAt = this.time.now;
    this.hp = Math.max(0, this.hp - dmg);
    this.iframe = IFRAME;
    this.cameras.main.shake(90, 0.009);
    this.player.setTintFill(0xff9a8a);
    this.time.delayedCall(90, () => { if (!this.dead) this.player.clearTint(); });
    const dx = this.player.x - fromX;
    const dy = this.player.y - fromY;
    const d = Math.hypot(dx, dy) || 1;
    this.tweens.add({
      targets: this.player,
      x: this.player.x + (dx / d) * 18,
      y: this.player.y + (dy / d) * 12,
      duration: 100, yoyo: true, ease: 'Quad.easeOut',
    });
    try { this.sound.play('hurt', { rate: 1.0, volume: 0.55 }); } catch (e) {}
    this.updateHp();
    if (this.hp <= 0) this.worldDown();
  }

  finishBoss() {
    if (!this.boss || this.bossDead) return;
    this.bossDead = true;
    this.bossActive = false;
    this.boss.state = 'dead';
    this.clearMobs(true);
    if (this.boss.warning) { this.boss.warning.destroy(); this.boss.warning = null; }
    if (this.boss.breath) { this.boss.breath.remove(); this.boss.breath = null; }
    this.setBossPose('roar', 0);
    this.bossImpact(this.boss.spr.x, this.boss.spr.y, true);
    this.cameras.main.shake(200, 0.014);
    this.tweens.add({
      targets: this.boss.spr, alpha: 0, scale: this.boss.scale * 1.08, duration: 620, ease: 'Quad.easeOut',
      onComplete: () => { if (this.boss) { this.boss.spr.setVisible(false).setAlpha(1); if (this.boss.mirror) this.boss.mirror.setVisible(false); } },
    });
    this.boss.glow.setVisible(false);
    this.boss.shadow.setVisible(false);
    this.boss.ring.setVisible(false);
    this.boss.label.setVisible(false);
    if (this.arenaLine) { this.arenaLine.destroy(); this.arenaLine = null; }
    // 沙海补景留到胜利面板关闭后再撤，胜利页背景仍是完整的沙漠。
    this.updateBossBar();
    const reward = this.boss.rewardTokens;
    this.save = patchWorldSave({ bosses: { ...this.save.bosses, [this.boss.id]: 'done' }, tokens: this.save.tokens + reward });
    this.updateHud();
    this.addAuraAtBoss();
    this.showVictory(reward);
  }

  addAuraAtBoss() {
    if (!this.bossSpawn) return;
    const { x, y } = this.bossSpawn;
    const tint = this.boss && this.boss.id === this.bossSpawn.def.id
      ? this.boss.art.tint
      : bossArt(this.bossSpawn.def.art).tint;
    const aura = this.add.image(x, y - 18, 'aura', 0)
      .setScale(2.4).setAlpha(0.5).setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(26);
    this.tweens.add({ targets: aura, alpha: 0.16, scale: 2.8, duration: 900, yoyo: true, repeat: -1 });
    this.memorial = { aura, key: this.bossSpawn.screen.id + ':' + this.bossSpawn.def.id };
  }

  showMemorial(def) {
    if (!this.bossSpawn) return;
    const d = def || this.boss?.def || this.bossSpawn.def;
    const key = this.bossSpawn.screen.id + ':' + d.id;
    if (this.memorial && this.memorial.key !== key) {
      this.memorial.aura.destroy();
      if (this.memorialText) { this.memorialText.destroy(); this.memorialText = null; }
      this.memorial = null;
    }
    if (!this.memorial) this.addAuraAtBoss();
    if (!this.memorialText) {
      this.memorialText = this.add.text(this.bossSpawn.x, this.bossSpawn.y - 66, d.memorialText || '星火已归位', {
        fontFamily: UI.font, fontSize: '12px', color: UI.text.gold,
        backgroundColor: UI.hud.bgSoft, padding: { x: 5, y: 2 },
      }).setOrigin(0.5, 1).setDepth(40);
    }
  }

  worldDown() {
    if (this.dead) return;
    this.dead = true;
    this.bossActive = false;
    this.clearMobs(true);
    this.pointerTarget = null;
    // 死亡面板要独占视线：清掉入场 banner / toast，避免压住“星火熄灭”。
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    if (this.toastT) { this.toastT.destroy(); this.toastT = null; }
    this.player.setAlpha(0.4);
    this.updateHud();
    this.showDownPanel();
  }

  showDownPanel() {
    const W = Math.min(390, VIEW_W - 40);
    const H = 154;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    this.panelOpen = true;
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    if (this.hudHint) this.hudHint.setVisible(false);
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    p.add(makeText(this, 14, 12, '星火熄灭', 'h2', { color: UI.text.danger }));
    p.add(makeText(this, 14, 34, '你被' + (this.boss?.name || '世界 Boss') + '击倒了。', 'body', { color: UI.text.body }));
    const rows = [
      ['重新挑战', () => this.retryBoss()],
      ['回到小屋', () => this.leave()],
    ].map(([label, cb], i) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 68 + i * 32, w: W - 32, h: 26,
        accent: i === 0 ? UI.color.gold : UI.color.lineMuted,
        depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      card.add(makeText(this, 12, 7, label, 'body', {
        color: i === 0 ? UI.text.primary : UI.text.muted,
      }));
      return { card };
    });
    this.modal = { dim, panel: p, rows };
  }

  retryBoss() {
    if (!this.dead || !this.boss) return;
    this.destroyModal();
    this.dead = false;
    this.victory = false;
    this.panelOpen = false;
    this.hp = this.maxHp;
    this.iframe = 0;
    this.lastHurtAt = -9999;
    this.player.setAlpha(1);
    this.player.setPosition(this.bossSpawn.screen.x + 150, WORLD_Y + 240);
    this.clearMobs(true);
    this.spawnBossMinions();
    this.boss.hp = this.boss.maxHp;
    this.boss.spr.setPosition(this.bossSpawn.x, this.bossSpawn.y);
    this.boss.state = 'intro';
    this.boss.stateEnd = this.time.now + 650;
    this.boss.nextAt = this.time.now + 650;
    this.bossActive = true;
    this.buildBossEdge(this.bossSpawn.screen);
    if (this.boss.breath) { this.boss.breath.remove(); this.boss.breath = null; }
    this.boss.spr.setVisible(true).setAlpha(1).setScale(this.boss.scale);
    if (this.boss.mirror) this.boss.mirror.setVisible(true).setAlpha(0.1);
    this.startBossBreath();
    this.boss.turnDir = 0;
    this.boss.turnAt = this.time.now + BOSS_TURN_MS;
    this.setBossPose('roar', 0);
    this.boss.glow.setVisible(true);
    this.boss.shadow.setVisible(true);
    this.boss.ring.setVisible(true);
    this.boss.label.setVisible(false);
    if (this.hudHint) this.hudHint.setVisible(true);
    this.updateHud();
    this.banner((this.boss.name || '世界 Boss') + ' · 再战');
    this.updatePrompts();
    this.updateBossBar();
  }

  showVictory(reward) {
    this.victory = true;
    this.panelOpen = true;
    this.pointerTarget = null;
    // 胜利面板要独占视线：把入场 banner / 攻击提示 toast 清掉。
    if (this.bannerT) { this.bannerT.destroy(); this.bannerT = null; }
    if (this.toastT) { this.toastT.destroy(); this.toastT = null; }
    if (this.hudHint) this.hudHint.setVisible(false);
    const W = Math.min(400, VIEW_W - 40);
    const H = 184;
    const x = VIEW_W / 2 - W / 2;
    const y = VIEW_H / 2 - H / 2;
    const dim = this.add.rectangle(0, 0, VIEW_W, VIEW_H, UI.color.overlay, UI.alpha.disabled)
      .setOrigin(0).setScrollFactor(0).setDepth(90).setInteractive();
    const p = screenPanel(this, { x, y, w: W, h: H, variant: 'raised', depth: 100 });
    // 胜利按钮用一块无描边底板：保留按钮感，又不让卡片顶线贴着“继续探索”。
    const rowFill = this.add.rectangle(x + 16, y + 100, W - 32, 34, UI.color.panelRaised, 0.92)
      .setOrigin(0).setScrollFactor(0).setDepth(103);
    const def = this.boss?.def || {};
    p.add(makeText(this, 14, 12, def.victoryTitle || '星火的碎片 · 已归位', 'h2', { color: UI.text.gold }));
    p.add(makeText(this, 14, 36, (this.boss?.name || '世界 Boss') + '倒下，星火碎片 +' + reward + '。', 'body', { color: UI.text.body }));
    p.add(makeText(this, 14, 58, def.victoryBody || '这片群系的远征，暂时告一段落。', 'caption', { color: UI.text.muted }));
    const rows = [['继续探索', () => this.closeVictory()]].map(([label, cb]) => {
      const card = makeCard(this, {
        x: x + 16, y: y + 100, w: W - 32, h: 34,
        accent: UI.color.gold, depth: 104, onClick: cb,
      });
      card.container.setScrollFactor(0);
      card.hit.setScrollFactor(0);
      // 胜利页只有一个按钮，去掉卡片顶部的横向描边，避免它像一条压在“继续探索”上的分隔线。
      card.bg.setVisible(false);
      card.add(makeText(this, 12, 14, label, 'body', { color: UI.text.primary }));
      return { card };
    });
    this.modal = { dim, panel: p, rows, fill: rowFill };
    this.updateHud();
  }

  closeVictory() {
    if (!this.victory) return;
    this.restoreBossEdge();
    this.destroyModal();
    this.victory = false;
    this.panelOpen = false;
    if (this.hudHint) this.hudHint.setVisible(true);
    this.showMemorial();
    this.updateHud();
    this.updatePrompts();
  }

  destroyModal() {
    if (!this.modal) return;
    this.modal.rows.forEach((r) => destroyRow(r));
    if (this.modal.fill) this.modal.fill.destroy();
    this.modal.dim.destroy();
    this.modal.panel.container.destroy();
    this.modal = null;
  }
}
