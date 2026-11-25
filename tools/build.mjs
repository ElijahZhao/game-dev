/* 构建：源码分模块 + 引擎单独成文件（可缓存），输出 Pages 入口与单文件自测版
 *
 * 用法：
 *   node tools/build.mjs            产出 index.html + dist/game.<hash>.js + dist/assets.<hash>.js
 *   node tools/build.mjs --single   额外产出 web/game.html（全内联，双击即玩）
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET = join(ROOT, 'assets/01-primary/NinjaAdventure');
const single = process.argv.includes('--single');

/* ---------- 素材清单（新增素材只改这里） ---------- */
const img = {
  walk: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Walk.png'),
  idle: join(ASSET, 'Actor/Characters/BlueNinja/SeparateAnim/Idle.png'),
  field: join(ASSET, 'Backgrounds/Tilesets/TilesetField.png'),
  beast: join(ASSET, 'Actor/Monsters/Beast/Beast.png'),
  slash: join(ASSET, 'FX/SlashFx/SlashCurved/SpriteSheet.png'),
  heart: join(ASSET, 'Ui/LifeReceptacle/heart.png'),
  /* P1-C：Theme1 的 20 张 UI 切片（16×8 按钮、16×16 面板、滑条等） */
  uiBtnNormal: join(ASSET, 'Ui/Theme/Theme1/button_normal.png'),
  uiBtnHover: join(ASSET, 'Ui/Theme/Theme1/button_hover.png'),
  uiBtnPressed: join(ASSET, 'Ui/Theme/Theme1/button_pressed.png'),
  uiBtnDisabled: join(ASSET, 'Ui/Theme/Theme1/button_disabled.png'),
  uiBg: join(ASSET, 'Ui/Theme/Theme1/nine_path_bg.png'),
  uiBg2: join(ASSET, 'Ui/Theme/Theme1/nine_path_bg_2.png'),
  uiPanel: join(ASSET, 'Ui/Theme/Theme1/nine_path_panel.png'),
  uiFocus: join(ASSET, 'Ui/Theme/Theme1/nine_path_focus.png'),
  uiCheck: join(ASSET, 'Ui/Theme/Theme1/checked.png'),
  uiCheckDisabled: join(ASSET, 'Ui/Theme/Theme1/checked_disabled.png'),
  uiUncheck: join(ASSET, 'Ui/Theme/Theme1/unchecked.png'),
  uiUncheckDisabled: join(ASSET, 'Ui/Theme/Theme1/unchecked_disabled.png'),
  uiHSlider: join(ASSET, 'Ui/Theme/Theme1/h_slidder_grabber.png'),
  uiHSliderHover: join(ASSET, 'Ui/Theme/Theme1/h_slidder_grabber_hover.png'),
  uiHSliderDisabled: join(ASSET, 'Ui/Theme/Theme1/h_slidder_grabber_disabled.png'),
  uiVSlider: join(ASSET, 'Ui/Theme/Theme1/v_slidder_grabber.png'),
  uiVSliderHover: join(ASSET, 'Ui/Theme/Theme1/v_slidder_grabber_hover.png'),
  uiVSliderDisabled: join(ASSET, 'Ui/Theme/Theme1/v_slidder_grabber_disabled.png'),
  uiSliderProgress: join(ASSET, 'Ui/Theme/Theme1/slider_progress.png'),
  uiSliderProgressHover: join(ASSET, 'Ui/Theme/Theme1/slider_progress_hover.png'),
  coin: join(ASSET, 'Items/Treasure/Coin2.png'),
  boss: join(ASSET, 'Actor/Boss/GiantFrog/Idle40x40.png'),
  cyclope: join(ASSET, 'Actor/Monsters/Cyclope/SpriteSheet.png'),
  eye: join(ASSET, 'Actor/Monsters/Eye/Eye.png'),
  larva: join(ASSET, 'Actor/Monsters/Larva/Larva.png'),
  ball: join(ASSET, 'FX/Projectile/EnergyBall.png'),
  upgPower: join(ASSET, 'Items/Scroll/ScrollFire.png'),
  upgSpeed: join(ASSET, 'Items/Scroll/ScrollPlant.png'),
  upgAtk: join(ASSET, 'Items/Scroll/ScrollIce.png'),
  villager: join(ASSET, 'Actor/Characters/Villager/SeparateAnim/Walk.png'),
  villager2: join(ASSET, 'Actor/Characters/Villager2/SeparateAnim/Walk.png'),
  statue: join(ASSET, 'Actor/Characters/Statue/SeparateAnim/Idle.png'),
  /* 批 1 武器：6 张图标 + 5 张手持（弓没有手持帧，用图标顶）+ 4 套斩击 + 3 种弹体 */
  wKatana: join(ASSET, 'Items/Weapons/Katana/Sprite.png'),
  gem: join(ASSET, 'Backgrounds/Tilesets/TilesetDungeon.png'),
  wBigSword: join(ASSET, 'Items/Weapons/BigSword/Sprite.png'),
  wHammer: join(ASSET, 'Items/Weapons/Hammer/Sprite.png'),
  wBow: join(ASSET, 'Items/Weapons/Bow/Sprite.png'),
  wWand: join(ASSET, 'Items/Weapons/MagicWand/Sprite.png'),
  wKunai: join(ASSET, 'Items/Weapons/Ninjaku/Sprite.png'),
  hKatana: join(ASSET, 'Items/Weapons/Katana/SpriteInHand.png'),
  hBigSword: join(ASSET, 'Items/Weapons/BigSword/SpriteInHand.png'),
  hHammer: join(ASSET, 'Items/Weapons/Hammer/SpriteInHand.png'),
  hWand: join(ASSET, 'Items/Weapons/MagicWand/SpriteInHand.png'),
  hKunai: join(ASSET, 'Items/Weapons/Ninjaku/SpriteInHand.png'),
  slA: join(ASSET, 'FX/SlashFx/Slash/SpriteSheet.png'),
  slB: join(ASSET, 'FX/SlashFx/SlashDoubleCurved/SpriteSheet.png'),
  slC: join(ASSET, 'FX/SlashFx/CircularSlash/SpriteSheet.png'),
  slD: join(ASSET, 'FX/SlashFx/Cut/SpriteSheet.png'),
  arrow: join(ASSET, 'FX/Projectile/Arrow.png'),
  kunaiProj: join(ASSET, 'FX/Projectile/Kunai.png'),
  fireball: join(ASSET, 'FX/Projectile/Fireball.png'),
  /* 批 2 房间：宝箱两帧 / 钥匙 / 精英光环 / 篝火（外部 CC0，见 assets/CREDITS.md） */
  /* 批 4：六种新怪 + 第二只 Boss（蓝武士）*/
  slime: join(ASSET, 'Actor/Monsters/Slime.png'),
  spider: join(ASSET, 'Actor/Monsters/SpiderRed/SpriteSheet.png'),
  owl: join(ASSET, 'Actor/Monsters/Owl.png'),
  mush: join(ASSET, 'Actor/Monsters/Mushroom/mushroom.png'),
  mole: join(ASSET, 'Actor/Monsters/Mole.png'),
  skull: join(ASSET, 'Actor/Monsters/SkullBlue/SpriteSheet.png'),
  samIdle: join(ASSET, 'Actor/Boss/GiantBlueSamurai/Idle.png'),
  samWalk: join(ASSET, 'Actor/Boss/GiantBlueSamurai/Walk.png'),
  samAtkL: join(ASSET, 'Actor/Boss/GiantBlueSamurai/AttackLeft.png'),
  samAtkR: join(ASSET, 'Actor/Boss/GiantBlueSamurai/AttackRight.png'),
  samChgL: join(ASSET, 'Actor/Boss/GiantBlueSamurai/ChargeLeft.png'),
  samChgR: join(ASSET, 'Actor/Boss/GiantBlueSamurai/ChargeRight.png'),
  /* 批 10：竹林 Boss 巨浣熊 + 赤武士 + 小浣熊 */
  racoon: join(ASSET, 'Actor/Monsters/Racoon/SpriteSheet.png'),
  /* 批 11：三、四章十只小怪 + 四只 Boss */
  snake: join(ASSET, 'Actor/Monsters/Snake/Snake.png'),
  reptile: join(ASSET, 'Actor/Monsters/Reptile/Reptile.png'),
  lizard: join(ASSET, 'Actor/Monsters/Lizard/Lizard.png'),
  mollusc: join(ASSET, 'Actor/Monsters/Mollusc/Mollusc.png'),
  mouse: join(ASSET, 'Actor/Monsters/Mouse/SpriteSheet.png'),
  fish: join(ASSET, 'Actor/Monsters/Fish/SpriteSheet.png'),
  octopus: join(ASSET, 'Actor/Monsters/Octopus/SpriteSheet.png'),
  kappa: join(ASSET, 'Actor/Monsters/KappaGreen/SpriteSheet.png'),
  axolot: join(ASSET, 'Actor/Monsters/Axolot/SpriteSheet.png'),
  tenguBlueWalk: join(ASSET, 'Actor/Boss/TenguBlue/Walk.png'),
  tenguRedWalk: join(ASSET, 'Actor/Boss/TenguRed/Walk.png'),
  spiritIdle: join(ASSET, 'Actor/Boss/GiantSpirit/Idle.png'),
  demonIdle: join(ASSET, 'Actor/Boss/DemonCyclop/Idle.png'),
  demonWalk: join(ASSET, 'Actor/Boss/DemonCyclop/Walk.png'),
  /* 批 12A：熔岩五怪 + 炎狱巨灵 + 熔火独眼 */
  flam: join(ASSET, 'Actor/Monsters/Flam2/SpriteSheet.png'),
  dragon: join(ASSET, 'Actor/Monsters/Dragon/SpriteSheet.png'),
  demon: join(ASSET, 'Actor/Characters/DemonGreen/SeparateAnim/Walk.png'),
  lantern: join(ASSET, 'Actor/Monsters/LanternRed/SpriteSheet.png'),
  spirit: join(ASSET, 'Actor/Monsters/Spirit2/SpriteSheet.png'),
  flamIdle: join(ASSET, 'Actor/Boss/GiantFlam/Idle.png'),
  demon2Idle: join(ASSET, 'Actor/Boss/DemonCyclop2/Idle.png'),
  demon2Walk: join(ASSET, 'Actor/Boss/DemonCyclop2/Walk.png'),
  racoonIdle: join(ASSET, 'Actor/Boss/GiantRacoon/Idle.png'),
  racoonAtk: join(ASSET, 'Actor/Boss/GiantRacoon/Attack.png'),
  racoonJump: join(ASSET, 'Actor/Boss/GiantRacoon/Jump.png'),
  racoonChg: join(ASSET, 'Actor/Boss/GiantRacoon/charge.png'),
  rsamIdle: join(ASSET, 'Actor/Boss/GiantRedSamurai/Idle.png'),
  rsamWalk: join(ASSET, 'Actor/Boss/GiantRedSamurai/Walk.png'),
  rsamAtkL: join(ASSET, 'Actor/Boss/GiantRedSamurai/AttackLeft.png'),
  rsamAtkR: join(ASSET, 'Actor/Boss/GiantRedSamurai/AttackRight.png'),
  rsamChgL: join(ASSET, 'Actor/Boss/GiantRedSamurai/ChargeLeft.png'),
  rsamChgR: join(ASSET, 'Actor/Boss/GiantRedSamurai/ChargeRight.png'),
  chest: join(ASSET, 'Items/Treasure/BigTreasureChest.png'),
  key: join(ASSET, 'Items/Treasure/GoldKey.png'),
  aura: join(ASSET, 'FX/Magic/Circle/SpriteSheetOrange.png'),
  campfire: join(ROOT, 'assets/01-primary/external/campfire-16x16.png'),
  /* 批 5 角色：三张皮肤 + 三张立绘 */
  walkMage: join(ASSET, 'Actor/Characters/SorcererBlack/SeparateAnim/Walk.png'),
  idleMage: join(ASSET, 'Actor/Characters/SorcererBlack/SeparateAnim/Idle.png'),
  walkKnight: join(ASSET, 'Actor/Characters/Knight/SeparateAnim/Walk.png'),
  idleKnight: join(ASSET, 'Actor/Characters/Knight/SeparateAnim/Idle.png'),
  faceNinja: join(ASSET, 'Actor/Characters/BlueNinja/Faceset.png'),
  faceNinjaClear: join(ROOT, 'assets/01-primary/hub/face-ninja-clear.png'),
  faceMage: join(ASSET, 'Actor/Characters/SorcererBlack/Faceset.png'),
  faceKnight: join(ASSET, 'Actor/Characters/Knight/Faceset.png'),
  /* 批 6 场景：石砖地面、地板贴花、光柱、灰尘粒子 */
  floorDungeon: join(ASSET, 'Backgrounds/Tilesets/Interior/TilesetInteriorFloor.png'),
  floorDetail: join(ASSET, 'Backgrounds/Tilesets/TilesetFloorDetail.png'),
  ray: join(ASSET, 'FX/Environment/Raylight.png'),
  dust: join(ASSET, 'FX/Particle/Snow.png'),
  /* G0 开放世界：一丛草药，16×16 单帧 */
  herb: join(ASSET, 'Items/Food/TeaLeaf.png'),
  /* G1 草原：从 NinjaAdventure / CC0 tileset 裁出的独立摆件 */
  worldTree: join(ROOT, 'assets/01-primary/world/tree-green.png'),
  worldBush: join(ROOT, 'assets/01-primary/world/bush-green.png'),
  caveMouth: join(ROOT, 'assets/01-primary/world/cave-mouth.png'),
  /* G2-1 竹林 / G2 后备群系：ink-studio 离线生成，见 docs/ART_PIPELINE.md */
  bambooGrove: join(ROOT, 'assets/01-primary/world/bamboo-grove.png'),
  bambooGate: join(ROOT, 'assets/01-primary/world/bamboo-gate.png'),
  bambooHermit: join(ROOT, 'assets/01-primary/world/bamboo-hermit.png'),
  desertArch: join(ROOT, 'assets/01-primary/world/desert-arch.png'),
  desertDeadTree: join(ROOT, 'assets/01-primary/world/desert-dead-tree.png'),
  /* G2-2 沙漠：ink-studio 沙婆 / 沙枣丛 / 完整沙棕，TilesetField 改色沙地 */
  desertNomad: join(ROOT, 'assets/01-primary/world/desert-nomad.png'),
  desertShrub: join(ROOT, 'assets/01-primary/world/desert-shrub.png'),
  desertPalm: join(ROOT, 'assets/01-primary/world/desert-palm.png'),
  desertTile: join(ROOT, 'assets/01-primary/world/desert-tile.png'),
  /* G2-3 雪原：ink-studio 雪松 / 雪祠 / 守灯人 / 雪灯草，TilesetField 改色雪地 */
  snowPine: join(ROOT, 'assets/01-primary/world/snow-pine.png'),
  snowShrine: join(ROOT, 'assets/01-primary/world/snow-shrine.png'),
  snowKeeper: join(ROOT, 'assets/01-primary/world/snow-keeper.png'),
  snowLantern: join(ROOT, 'assets/01-primary/world/snow-lantern.png'),
  snowTile: join(ROOT, 'assets/01-primary/world/snow-tile.png'),
  volcanoSpire: join(ROOT, 'assets/01-primary/world/volcano-spire.png'),
  volcanoVent: join(ROOT, 'assets/01-primary/world/volcano-vent.png'),
  volcanoForge: join(ROOT, 'assets/01-primary/world/volcano-forge.png'),
  volcanoSmith: join(ROOT, 'assets/01-primary/world/volcano-smith.png'),
  volcanoEmber: join(ROOT, 'assets/01-primary/world/volcano-ember.png'),
  volcanoLava: join(ROOT, 'assets/01-primary/world/volcano-lava.png'),
  volcanoTile: join(ROOT, 'assets/01-primary/world/volcano-tile.png'),
  /* G3-1 世界 Boss：ink-studio 苔背巨兽 96×96 四向 idle / charge / roar */
  mossBeastIdle: join(ROOT, 'assets/01-primary/world/moss-beast-idle.png'),
  mossBeastCharge: join(ROOT, 'assets/01-primary/world/moss-beast-charge.png'),
  mossBeastRoar: join(ROOT, 'assets/01-primary/world/moss-beast-roar.png'),
  /* G3-2 世界 Boss：ink-studio 雾竹蜃 96×96 四向 idle / charge / roar */
  bambooMirageIdle: join(ROOT, 'assets/01-primary/world/bamboo-mirage-idle.png'),
  bambooMirageCharge: join(ROOT, 'assets/01-primary/world/bamboo-mirage-charge.png'),
  bambooMirageRoar: join(ROOT, 'assets/01-primary/world/bamboo-mirage-roar.png'),
  /* G3-3 世界 Boss：ink-studio 沙海蜃 96×96 四向 idle / charge / roar */
  sandMirageIdle: join(ROOT, 'assets/01-primary/world/sand-mirage-idle.png'),
  sandMirageCharge: join(ROOT, 'assets/01-primary/world/sand-mirage-charge.png'),
  sandMirageRoar: join(ROOT, 'assets/01-primary/world/sand-mirage-roar.png'),
  sandScarabIdle: join(ROOT, 'assets/01-primary/world/sand-scarab-idle.png'),
  sandScarabSkitter: join(ROOT, 'assets/01-primary/world/sand-scarab-skitter.png'),
  desertRock: join(ROOT, 'assets/01-primary/world/sand-rock.png'),
  /* 批 13 小屋：ink-studio 3D 像素离线件，见 docs/ART_PIPELINE.md */
  faceGuide: join(ROOT, 'assets/01-primary/hub/npc-guide.png'),
  faceSmith: join(ROOT, 'assets/01-primary/hub/npc-smith.png'),
  faceMerchant: join(ROOT, 'assets/01-primary/hub/npc-merchant.png'),
  forgeAnvil: join(ROOT, 'assets/01-primary/hub/forge-anvil.png'),
  trainDummy: join(ROOT, 'assets/01-primary/hub/train-dummy.png'),
};
/* 每张切片的帧尺寸（拆帧语义不变，只换打包方式） */
const FRAME = {
  walk: [16, 16], idle: [16, 16], field: [16, 16], beast: [16, 16],
  slash: [32, 32], heart: [16, 16], boss: [40, 40], coin: [10, 10],
  uiBtnNormal: [16, 8], uiBtnHover: [16, 8], uiBtnPressed: [16, 8], uiBtnDisabled: [16, 8],
  uiBg: [16, 16], uiBg2: [16, 16], uiPanel: [16, 16], uiFocus: [8, 8],
  uiCheck: [16, 16], uiCheckDisabled: [16, 16], uiUncheck: [16, 16], uiUncheckDisabled: [16, 16],
  uiHSlider: [13, 11], uiHSliderHover: [13, 11], uiHSliderDisabled: [13, 11],
  uiVSlider: [11, 13], uiVSliderHover: [11, 13], uiVSliderDisabled: [11, 13],
  uiSliderProgress: [16, 16], uiSliderProgressHover: [16, 16],
  cyclope: [16, 16], eye: [16, 16], larva: [16, 16], ball: [16, 16],
  upgPower: [16, 16], upgSpeed: [16, 16], upgAtk: [16, 16],
  villager: [16, 16], villager2: [16, 16], statue: [16, 16],
  gem: [16, 16],
  wKatana: [6, 14], wBigSword: [7, 16], wHammer: [9, 16], wBow: [15, 7], wWand: [5, 18], wKunai: [7, 12],
  hKatana: [6, 10], hBigSword: [7, 12], hHammer: [9, 9], hWand: [5, 10], hKunai: [3, 12],
  slA: [32, 32], slB: [32, 32], slC: [32, 32], slD: [32, 32],
  arrow: [13, 5], kunaiProj: [14, 5], fireball: [16, 16],
  chest: [16, 14], key: [12, 8], aura: [32, 32], campfire: [16, 16],
  slime: [16, 16], spider: [16, 16], owl: [16, 16], mush: [16, 16], mole: [16, 16], skull: [16, 16],
  samIdle: [96, 48], samWalk: [96, 48], samAtkL: [96, 96], samAtkR: [96, 96],
  samChgL: [96, 96], samChgR: [96, 96],
  racoon: [16, 16],
  snake: [16, 16], reptile: [16, 16], lizard: [16, 16], mollusc: [16, 16], mouse: [16, 16],
  fish: [16, 16], octopus: [16, 16], kappa: [16, 16], axolot: [16, 16],
  tenguBlueWalk: [82, 82], tenguRedWalk: [82, 82],
  spiritIdle: [50, 50], demonIdle: [50, 50], demonWalk: [50, 50],
  flam: [16, 16], dragon: [16, 16], demon: [16, 16], lantern: [16, 16], spirit: [16, 16],
  flamIdle: [50, 50], demon2Idle: [50, 50], demon2Walk: [50, 50],
  racoonIdle: [60, 60], racoonAtk: [60, 60], racoonJump: [60, 60], racoonChg: [60, 60],
  rsamIdle: [96, 48], rsamWalk: [96, 48], rsamAtkL: [96, 96], rsamAtkR: [96, 96],
  rsamChgL: [96, 96], rsamChgR: [96, 96],
  walkMage: [16, 16], idleMage: [16, 16], walkKnight: [16, 16], idleKnight: [16, 16],
  faceNinja: [38, 38], faceNinjaClear: [38, 38], faceMage: [38, 38], faceKnight: [38, 38],
  floorDungeon: [16, 16], floorDetail: [16, 16], ray: [72, 102], dust: [8, 8],
  herb: [16, 16],
  worldTree: [64, 48], worldBush: [32, 48], caveMouth: [48, 40],
  bambooGrove: [64, 96], bambooGate: [96, 160], bambooHermit: [64, 64],
  desertArch: [96, 128], desertDeadTree: [64, 80],
  desertNomad: [64, 64], desertShrub: [32, 48], desertPalm: [64, 96], desertTile: [16, 16],
  snowPine: [96, 128], snowShrine: [96, 128], snowKeeper: [64, 64], snowLantern: [32, 48], snowTile: [16, 16],
  volcanoSpire: [64, 96], volcanoVent: [64, 48],
  volcanoForge: [96, 128], volcanoSmith: [64, 64], volcanoEmber: [32, 48],
  volcanoLava: [64, 48], volcanoTile: [16, 16],
  mossBeastIdle: [96, 96], mossBeastCharge: [96, 96], mossBeastRoar: [96, 96],
  bambooMirageIdle: [96, 96], bambooMirageCharge: [96, 96], bambooMirageRoar: [96, 96],
  sandMirageIdle: [96, 96], sandMirageCharge: [96, 96], sandMirageRoar: [96, 96],
  sandScarabIdle: [64, 64], sandScarabSkitter: [64, 64], desertRock: [64, 64],
  faceGuide: [64, 64], faceSmith: [64, 64], faceMerchant: [64, 64],
  forgeAnvil: [64, 64], trainDummy: [64, 64],
};
const SFX_DIR = join(ROOT, 'web/audio/sfx');
/* 音乐按情绪懒加载（不进 assets.js，走 HTMLAudio 流式），key 即 mood */
const MUSIC = {
  dungeon: './web/audio/music/dungeon.mp3',
  fight: './web/audio/music/fight.mp3',
  lobby: './web/audio/music/lobby.mp3',
  shop: './web/audio/music/shop.mp3',
  victory: './web/audio/music/victory.mp3',
  cave: './web/audio/music/cave.mp3',
};
/* 音效 base64 内联：单个 2–20 KB，换来"开口即响"没有额外请求 */
const sfx = {
  sword: join(SFX_DIR, 'sword.mp3'),
  hit: join(SFX_DIR, 'hit.mp3'),
  hurt: join(SFX_DIR, 'hurt.mp3'),
  kill: join(SFX_DIR, 'kill.mp3'),
  gameover: join(SFX_DIR, 'gameover.mp3'),
  coin: join(SFX_DIR, 'coin.mp3'),
  ui: join(SFX_DIR, 'ui.mp3'),
  bonus: join(SFX_DIR, 'bonus.mp3'),
  boom: join(SFX_DIR, 'boom.mp3'),
  alarm: join(SFX_DIR, 'alarm.mp3'),
  magic: join(SFX_DIR, 'magic.mp3'),
};

const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;

/* ---------- 图集打包：多张切片 → 一张 PNG + 区域清单 ---------- */
mkdirSync(join(ROOT, 'build'), { recursive: true });
mkdirSync(join(ROOT, 'web/atlas'), { recursive: true });
const manifest = { atlasWidth: 1024, sheets: {} };
for (const [k, p] of Object.entries(img)) manifest.sheets[k] = { path: p, fw: FRAME[k][0], fh: FRAME[k][1] };
writeFileSync(join(ROOT, 'build/atlas-input.json'), JSON.stringify(manifest));
const packed = spawnSync('python3', [
  join(ROOT, 'tools/pack_atlas.py'),
  join(ROOT, 'build/atlas-input.json'),
  join(ROOT, 'web/atlas/core.png'),
  join(ROOT, 'web/atlas/core.json'),
], { encoding: 'utf8' });
if (packed.status !== 0) {
  console.error('图集打包失败：\n' + (packed.stderr || packed.error));
  process.exit(1);
}
const PACK_META = JSON.parse(readFileSync(join(ROOT, 'web/atlas/core.json'), 'utf8'));

/* ---------- 字体：构建期子集化（900 KB 全字库 → 游戏实际用到的字符） ---------- */
const FONT_SRC = join(ROOT, 'assets/01-primary/fonts/fusion-pixel-12px-monospaced-zh_hans.ttf.woff2');
const FONT_OUT = join(ROOT, 'web/fonts/game.woff2');
const subset = spawnSync('python3', [join(ROOT, 'tools/subset_font.py'), FONT_SRC, FONT_OUT], { encoding: 'utf8' });
if (subset.status !== 0) {
  console.error('字体子集化失败：\n' + (subset.stderr || subset.error));
  process.exit(1);
}
const FONT_SIZE = statSync(FONT_OUT).size;

const BALANCE_FILE = join(ROOT, 'web/data/balance.json');
const BALANCE = JSON.parse(readFileSync(BALANCE_FILE, 'utf8'));
const STORY = JSON.parse(readFileSync(join(ROOT, 'web/data/story.json'), 'utf8'));
const WEAPONS = JSON.parse(readFileSync(join(ROOT, 'web/data/weapons.json'), 'utf8'));
const TALENTS = JSON.parse(readFileSync(join(ROOT, 'web/data/talents.json'), 'utf8'));
const CHARS = JSON.parse(readFileSync(join(ROOT, 'web/data/chars.json'), 'utf8'));
const CHAPTERS = JSON.parse(readFileSync(join(ROOT, 'web/data/chapters.json'), 'utf8'));
const ENEMIES = JSON.parse(readFileSync(join(ROOT, 'web/data/enemies.json'), 'utf8'));
const BOSSES = JSON.parse(readFileSync(join(ROOT, 'web/data/bosses.json'), 'utf8'));
const WORLD = JSON.parse(readFileSync(join(ROOT, 'web/data/world.json'), 'utf8'));

function assetsJs(packUrl, dataUrl) {
  const out = { pack: packUrl, packMeta: PACK_META, music: MUSIC,
    balanceUrl: dataUrl, gameData: BALANCE, storyData: STORY, storyUrl: dataUrl.replace('balance', 'story'),
    weaponsUrl: dataUrl.replace('balance', 'weapons'), weaponsData: WEAPONS,
    talentsUrl: dataUrl.replace('balance', 'talents'), talentsData: TALENTS,
    charsUrl: dataUrl.replace('balance', 'chars'), charsData: CHARS,
    chaptersData: CHAPTERS, enemiesData: ENEMIES, bossesData: BOSSES, worldData: WORLD };
  out.sfx = {};
  for (const [k, p] of Object.entries(sfx)) out.sfx[k] = b64(p, 'audio/mpeg');
  return `window.ASSET_DATA = ${JSON.stringify(out)};\n`;
}

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/* ---------- 清掉上一轮的带 hash 产物 ---------- */
mkdirSync(join(ROOT, 'dist'), { recursive: true });
for (const f of readdirSync(join(ROOT, 'dist'))) {
  if (/^game\.\w+\.js$|^assets\.\w+\.js$/.test(f)) unlinkSync(join(ROOT, 'dist', f));
}

/* ---------- 打游戏逻辑 ---------- */
const bundled = await build({
  entryPoints: [join(ROOT, 'src/main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  write: false,
  logLevel: 'warning',
});
const code = bundled.outputFiles[0].text;
const assetsCode = assetsJs('./web/atlas/core.png', './web/data/balance.json');

const gameName = `game.${sha(code)}.js`;
const assetsName = `assets.${sha(assetsCode)}.js`;
writeFileSync(join(ROOT, 'dist', gameName), code);
writeFileSync(join(ROOT, 'dist', assetsName), assetsCode);

/* ---------- PWA：service worker 预缓存首屏；index.html 走网络优先 ---------- */
const coreSha = sha(readFileSync(join(ROOT, 'web/atlas/core.png')));
const swVersion = `na-b18-${sha(assetsName + gameName + coreSha)}`;
const swCode = `/* 自动生成：批 18 PWA 首屏缓存。改 tools/build.mjs 后重新构建。 */
const CACHE = '${swVersion}';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './web/vendor/phaser.min.js',
  './web/fonts/game.woff2',
  './web/atlas/core.png',
  './web/icons/icon-180.png',
  './web/icons/icon-192.png',
  './web/icons/icon-512.png',
  './web/icons/icon-maskable-512.png',
  './dist/${assetsName}',
  './dist/${gameName}',
];
const isAsset = (path) => path.endsWith('/manifest.json') || path.includes('/dist/') || path.includes('/web/');
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => (key.indexOf('na-b17-') === 0 || key.indexOf('na-b18-') === 0) && key !== CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/web/audio/') >= 0) return; // 音乐/音效懒加载，不占离线首屏缓存
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) caches.open(CACHE).then((cache) => cache.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (!isAsset(url.pathname)) return;
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
    return res;
  })));
});
`;
writeFileSync(join(ROOT, 'sw.js'), swCode);

const phaser = readFileSync(join(ROOT, 'web/vendor/phaser.min.js'), 'utf8');

const head = (title, fontUrl, pwa = true) => `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#2f3b2a">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
${pwa ? '<link rel="manifest" href="./manifest.json">\n<link rel="apple-touch-icon" href="./web/icons/icon-180.png">\n<link rel="icon" type="image/png" href="./web/icons/icon-192.png">' : '<link rel="icon" href="data:,">'}
<title>${title}</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d1017; overflow: hidden; }
  #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
  .fallback { color: #fff; font: 14px ui-monospace, monospace; padding: 16px; }
  @font-face { font-family: "NinjaPixel"; src: url("${fontUrl}") format("woff2"); font-display: block; }
</style>
</head>
<body>
<div id="game"></div>
`;

/* ---------- Pages 入口：引擎与资源分开，可被缓存 ---------- */
const pagesHtml = `${head('归途：星火之章 · 开发中', './web/fonts/game.woff2')}<script src="./web/vendor/phaser.min.js"></script>
<script src="./dist/${assetsName}"></script>
<script src="./dist/${gameName}"></script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'index.html'), pagesHtml);

let singleSize = 0;
if (single) {
  const singleAssets = { pack: b64(join(ROOT, 'web/atlas/core.png'), 'image/png'), packMeta: PACK_META,
    balanceUrl: './data/balance.json', gameData: BALANCE, storyData: STORY, storyUrl: './data/story.json',
    weaponsData: WEAPONS, weaponsUrl: './data/weapons.json',
    talentsUrl: './data/talents.json', talentsData: TALENTS,
    charsUrl: './data/chars.json', charsData: CHARS, chaptersData: CHAPTERS,
    enemiesData: ENEMIES, bossesData: BOSSES, worldData: WORLD,
    music: { dungeon: './audio/music/dungeon.mp3', fight: './audio/music/fight.mp3',
      lobby: './audio/music/lobby.mp3', shop: './audio/music/shop.mp3',
      victory: './audio/music/victory.mp3', cave: './audio/music/cave.mp3' }, sfx: {} };
  for (const [k, p] of Object.entries(sfx)) singleAssets.sfx[k] = b64(p, 'audio/mpeg');
  const singleHtml = `${head('归途：星火之章 · 单文件版', b64(FONT_OUT, 'font/woff2'), false)}<script>window.__SINGLE__ = true;</script><script>window.ASSET_DATA = ${JSON.stringify(singleAssets)};</script>
<script>${phaser}</script>
<script>${code}</script>
</body>
</html>
`;
  writeFileSync(join(ROOT, 'web/game.html'), singleHtml);
  singleSize = statSync(join(ROOT, 'web/game.html')).size;
}

const indexBytes = statSync(join(ROOT, 'index.html')).size;
const manifestBytes = statSync(join(ROOT, 'manifest.json')).size;
const firstBytes = indexBytes + manifestBytes
  + statSync(join(ROOT, 'web/vendor/phaser.min.js')).size
  + FONT_SIZE + statSync(join(ROOT, 'web/atlas/core.png')).size
  + statSync(join(ROOT, 'dist', assetsName)).size + statSync(join(ROOT, 'dist', gameName)).size;
const firstGzip = gzipSync(readFileSync(join(ROOT, 'index.html'))).length
  + gzipSync(readFileSync(join(ROOT, 'manifest.json'))).length
  + gzipSync(readFileSync(join(ROOT, 'web/vendor/phaser.min.js'))).length
  + gzipSync(readFileSync(join(ROOT, 'web/fonts/game.woff2'))).length
  + gzipSync(readFileSync(join(ROOT, 'web/atlas/core.png'))).length
  + gzipSync(readFileSync(join(ROOT, 'dist', assetsName))).length
  + gzipSync(readFileSync(join(ROOT, 'dist', gameName))).length;
console.log(`首屏预算       ${kb(firstBytes)} / 2.00 MB（gzip ${kb(firstGzip)}）`);
if (firstBytes > 2 * 1024 * 1024) {
  console.error('首屏预算超限：关键文件合计超过 2 MB');
  process.exitCode = 1;
}
console.log(`已生成 index.html`);
console.log(`  引擎(单独缓存) ${kb(statSync(join(ROOT, 'web/vendor/phaser.min.js')).size)}  → web/vendor/phaser.min.js`);
console.log(`  字体           ${kb(FONT_SIZE)}  → web/fonts/game.woff2（NinjaPixel，子集）`);
console.log(`  图集           ${kb(statSync(join(ROOT, 'web/atlas/core.png')).size)}  → web/atlas/core.png（${Object.keys(PACK_META.sheets).length} 张切片）`);
console.log(`  素材数据       ${kb(statSync(join(ROOT, 'dist', assetsName)).size)}  → dist/${assetsName}`);
console.log(`  游戏逻辑       ${kb(statSync(join(ROOT, 'dist', gameName)).size)}  → dist/${gameName}`);
const audioSize = Object.keys(MUSIC).reduce((n, k) => n + statSync(join(ROOT, MUSIC[k].replace('./', ''))).size, 0);
console.log(`  音乐(懒加载)   ${(audioSize / 1048576).toFixed(2)} MB  → ${Object.keys(MUSIC).length} 首 mood（不进 assets.js）`);
if (single) console.log(`  PWA            sw.js（${swVersion}）+ manifest.json`);
if (single) console.log(`  单文件自测     ${kb(singleSize)}  → web/game.html`);
