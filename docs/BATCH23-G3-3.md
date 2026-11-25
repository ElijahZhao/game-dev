# 批 23 / G3-3：沙海蜃 3D 重制 + 沙海战场（世界 Boss 第三只）

> 2026-11-25。G3 五只世界 Boss 的 **第 3 只**——沙漠 `desert-6` 的沙海蜃——从“有沙门 / 有采集点、但没有 Boss”的空屏，接成 ink-studio 生成的 96×96 四向 × 待机 / 蓄力 / 咆哮专属活体 Boss；`desert-6` 同时重做为有沙蚋小怪、沙岩堆、沙丘、枯木 / 沙棕 / 沙蓬的沙海战场，不再清场。
> G3 世界 Boss 完成度 **3/5**；雪原 / 火山两只仍未做，不在本轮冒充。

---

## 1. 结论先行

- `desert-6` 原先只有沙门、枯木、沙棕与 2 个沙枣点；本轮新增 **沙海蜃 / Sandsea Mirage**，`hp 80 / dmg 5 / rewardTokens 4`。
- 造型不是“沙神龛”，也不是苔背巨兽换色：它是一只贴地游走的沙海活体——宽薄沙帆翼、玻璃质沙壳、四只短桨足、长鞭尾；不驮龛、不背苔，低伏轮廓与苔背巨兽“小丘”、雾竹蜃“高龛”明确区分。
- 三张 atlas 均为 **384×96（4 帧 96×96）**，透明 RGBA；`idle / charge / roar` 三姿态 × 前 / 左 / 后 / 右四向；源 `art-src/g3/sand-mirage.cjs` seed 303。
- 可见高度：待机 **2.48×**、蓄力 **2.25×**、咆哮 **2.85×** 玩家（32px 可见高度）；脚底统一落在 **65/96**，`originY=0.6771`，`scale=2.4`。
- 运行时新增第三只 Boss 的 `BOSS_ART.sandMirage`，并把近身攻击阈值从全局 `dist<104` 拆为每只 Boss 的 `swipeAt`；沙海蜃 `standoff 132 / swipeAt 104 / pounceGap 92 / pounceR 100 / swipeR 112 / swipeWarn 104`。
- 沙海蜃专属 **蜃气重影**：身后一层沙金色 ADD 重影，4px 漂移、α 0.09–0.135，随本体姿态 / 朝向 / 缩放同步；不改变碰撞与伤害。
- `na.world` 升 **v9**：`bosses={mossBeast,bambooMirage,sandMirage}`；v8 旧档补 `sandMirage:'none'`，不丢 `mossBeast / bambooMirage` 进度。
- `desert-6` 不再清场：保留 12 项战场 `props`（沙丘 / 沙门 / 枯木 / 沙棕 / 沙岩堆 / 沙蓬）、12 项 deco、3 只可战斗沙蚋；采集点仍为 12，「沙海拾味」5 颗可在前五屏完成。
- 小怪 `sandScarab`：ink-studio 64×64 四向 × `idle / skitter` 两姿态，低伏沙壳 + 玻璃背脊 + 青焰眼 + 六足；运行时 `this.mobs` 追击 / 近身伤害 / 三伤击杀 / 死亡尘化；Boss 快照重试同步重生，Boss 击杀 / 玩家阵亡 / 离场清理。
- G3 世界 Boss **3/5**；剩余雪原 / 火山两只、远征结局与 3 条成就未做。

---

## 2. 素材：从“沙门空场”到“贴地活体”

### 2.1 造型与可读性

沙海蜃按“低伏、宽薄、会游走的沙海活体”设计，避免做成第三座神龛：

- **翼**：两片后掠沙帆翼，正面展开约 110px，侧面收成薄翼缘；翼缘保留沙玻璃刺，但不使用高亮青色，避免背面读成“第三只眼”；
- **身**：低而宽的主躯干，沙壳米黄 / 深褐腹甲，背部三块覆瓦状沙甲，裂缝透青；
- **背帆**：一道后掠的新月形沙玻璃帆，`idle` 半张、`charge` 压低、`roar` 张开；正 / 背面有前后向骨架，不再是一根光桅杆；
- **头**：宽楔形沙壳，两只深眼窝 + 青焰瞳 + 金色高光，横裂口 + 两颗小獠牙，颊侧沙玻璃短角；侧视靠颊甲 / 短吻 / 角读轮廓；
- **足**：四只短桨足，脚底三枚沙玻璃爪，`charge` 前足前探、`roar` 后足撑起；
- **尾**：三节沙壳长鞭尾 + 玻璃倒刺 + 尾端金色沙晶，背面能看到一条高出体表的尾线；
- **活体感**：不是静态摆件；运行时叠加蜃气重影，站定会四向转身，攻击时进入蓄力 / 咆哮。

首轮正面偏“沙色小飞机 / 甲虫”，眼窝被长吻板遮住，背帆正面像桅杆；后续放大眼窝 / 青焰瞳、收紧长吻板、加颊甲与獠牙、给背帆加前后向骨架、把蓄力背帆抬高到 2.25× 下限，并补背面尾线。最终在 960 / 640 / 844 实机上以 2.4 倍显示，前 / 左 / 后 / 右四面都能读。

### 2.2 输出与来源

| 姿态 | 源 | 源图集 | 正式 PNG | 可见高度 |
|---|---|---|---|---|
| 待机 `idle` | `art-src/g3/sand-mirage.cjs`（seed 303） | 384×96，4 向 | `assets/01-primary/world/sand-mirage-idle.png` 384×96 | 79.2px；2.48× 玩家 |
| 蓄力 `charge` | 同上，`pose='charge'` | 384×96，4 向 | `assets/01-primary/world/sand-mirage-charge.png` 384×96 | 72.0px；2.25× 玩家 |
| 咆哮 `roar` | 同上，`pose='roar'` | 384×96，4 向 | `assets/01-primary/world/sand-mirage-roar.png` 384×96 | 91.2px；2.85× 玩家 |

- 渲染入口：`art-src/g3/render-g3.cjs`；固定 `INK_STUDIO` 指向 `toolchains/ink-studio`，`spriteAtlas({width:96,height:96,directions:4,times:[0],columns:4})`。
- 源元数据：`docs/revamp/g3-3d/sand-mirage-{idle,charge,roar}.json`；对照板：`docs/revamp/g3-3d/sand-mirage-board.png`。
- 图集尺寸：每张 384×96；运行时帧序 0 前 / 1 左 / 2 后 / 3 右；三姿态脚底均为 **65/96**，`originY=0.6771`。
- 来源口径：ink-studio 生成（工具 MIT，成品本项目自制）；**不是 Ninja Adventure 二次改色，也不是 image-to-image**。

### 2.3 复现

```bash
cd /home/user/Doubao/chats/38454996042111490/game-repo
INK_STUDIO=/home/user/Doubao/chats/38454996042111490/toolchains/ink-studio \
node art-src/g3/render-g3.cjs
```

---

## 3. 数据与运行时

### 3.1 数据

`web/data/world.json` 的 `bosses` 数组新增第三项：

```json
{
  "id": "sandMirage",
  "name": "沙海蜃",
  "screen": "desert-6",
  "x": 300,
  "y": 170,
  "hp": 80,
  "dmg": 5,
  "rewardTokens": 4,
  "art": "sandMirage",
  "title": "蜃楼守沙者",
  "victoryTitle": "沙海的星火 · 已归位",
  "victoryBody": "无旗的沙海，终于散去了蜃楼。",
  "memorialText": "沙海星火 · 已归位"
}
```

- `desert-6` 改为 **沙海战场**：`props` 12 项、`deco` 12 项，Boss 与玩家之间留出可读的攻击走廊；沙门在左上、沙岩堆在中央上方 / 右下，枯木 / 沙棕 / 沙蓬分散，避免盖住 Boss 脚底与预警圈。
- 新增 `bosses.sandMirage.minions` 3 只 `sandScarab`（`84,214 / 350,212 / 210,92`，`hp 6 / 6 / 7，dmg 2`），Boss 开战时生成。
- 沙漠采集点仍为 12；「沙海拾味」需求 5、每丛 2，仍可完成。
- Boss 站位 `x300 / y170`，玩家入场 `screen.x+150 / WORLD_Y+240`；沙海蜃 `scale 2.4`，侧向可见宽约 154px，横向不再和玩家叠在一起。

### 3.2 存档 v9

`src/systems/worldSave.js` 升 **v9**：

- `BOSS_IDS` 增加 `sandMirage`，`bosses` 默认变为 `{mossBeast,bambooMirage,sandMirage}`，值仍 `none | done`；
- v8 旧档没有 `sandMirage` 时自动补 `none`，已有两只 Boss 进度保持不变；
- 旧 v7 的 `boss:'done'` 仍迁到 `bosses.mossBeast`，`boss` 继续作为草原兼容别名；
- `patchWorldSave` 合并 `bosses`，不改其它群系计数 / 委托 / 篝火字段。

实测 v8 种子（`boss:'done' / bosses.mossBeast=done / bambooMirage=none / tokens=9`）载入即升 v9，并补 `sandMirage:none`；`desert-6` 进入后 `sandMirage` 可战、`mossBeast` 仍为 done。

### 3.3 运行时

`src/scenes/world.js` 新增：

- `BOSS_ART.sandMirage`：
  - `tex: sandMirageIdle / Charge / Roar`；
  - `origin 65/96` 三姿态；
  - `scale 2.4 / standoff 132 / swipeAt 104`；
  - `pounceGap 92 / pounceR 100 / swipeR 112 / swipeWarn 104`；
  - `shadow [142,18] / glowY 28 / labelY 100 / tint UI.world.desert / mirage true`。
- `updateBoss` 的近身分支由硬编码 `dist < 104` 改为 `dist < (B.art.swipeAt || 104)`；苔背巨兽 / 雾竹蜃不声明 `swipeAt`，保持旧行为。
- 沙海蜃专属 `mirror` 重影：
  - 与本体共用三姿态四向纹理；
  - 位置 `spr.x + 4 + sin(time/210)*2.5`、`spr.y - 1`；
  - 缩放跟随本体 ×1.03，ADD 混合，α `0.09–0.135` 缓慢呼吸；
  - `spawnBoss / setBossPose / updateBoss / retryBoss` 同步，`finishBoss` 立即隐藏。
- `finishBoss` / `showMemorial` / `retryBoss` 全部走通用多 Boss 路径，奖励 / 胜利文案读 `sandMirage` 数据。

### 3.4 战斗参数

| 参数 | 沙海蜃 | 设计理由 |
|---|---|---|
| `standoff` | 132 | 侧向体宽约 154px，站定留出玩家可见空间 |
| `swipeAt` | 104 | 玩家贴近到翼内侧时横扫，避免大体型一直扑击 |
| `pounceGap` | 92 | 落点放在玩家外侧，不整只压住玩家 |
| `pounceR` | 100 | 玩家不移动时会吃扑击；可移动躲开 |
| `swipeR / swipeWarn` | 112 / 104 | 预警圈与近身伤害半径按本 Boss 体宽拆开 |
| `shadow` | 142×18 | 与侧向体宽匹配，不出现“脚底悬空” |

实测：站桩扑击 `HP 20 → 15`；站桩横扫 `HP 20 → 15`；两种攻击都能在预警后移动躲开。

---

## 4. 本地验收

> 4.1–4.2 保留旧清场版的验收记录；最终构建与新战场验收见 4.3–4.4 与第 7 节，旧清场图不再作为新战场证据。

### 4.1 功能

| 项 | 结果 |
|---|---|
| 入口 | `?world=1&debug` → `applyScreen(17)`；`desert-6` 生成 `sandMirage / hp80 / dmg5 / reward4 / scale2.4 / originY0.6771` |
| 图集 | `sandMirageIdle / Charge / Roar` 均存在；idle 默认帧 `sandMirageIdle`；`mirror=true` |
| 四向 | 图集 0 前 / 1 左 / 2 后 / 3 右；站定每 1.6s 转 90°；实测 `3→0→1→2→3→0→1`，步长约 1.48–1.78s，HP 保持 20 |
| 姿态 | `intro=roar 0`；蓄力 `charge`；落地 / 死亡 `roar`；重试 `roar 0 → idle` |
| 扑击 | `pounceWindup / charge`，落点后 `HP20→15`，随后 `chase / idle` |
| 横扫 | 近距离 `swipeWindup / charge`，结算后 `HP20→15` |
| 击杀 | 真实攻击 3 伤 → `victory=true / bossDead=true / bosses.sandMirage=done / tokens=4`；本体与 mirror 均隐藏 |
| 失败 / 重试 | `HP` 归零 → `dead=true / panelOpen=true`；`retryBoss()` → `dead=false / active=true / hp20 / bossHp80` |
| 苔背 / 雾竹回归 | 960 fresh page：`field-6` 生成 `mossBeast / hp64 / pose roar / dir0`、`bamboo-6` 生成 `bambooMirage / hp72 / dir0`；两只均触发原有扑击，`errs=[]` |

### 4.2 三档与离线

- **960×540**：`docs/revamp/g3/g3-sand-turn-d0.png` ～ `d3.png`、`g3-sand-turn-board.png`、`g3-sand-turn.gif`、`g3-sand-pounce-960.png`、`g3-sand-swipe-960.png`、`g3-sand-victory-960.png`、`g3-sand-down-960.png`；`errs=[]`。
- **640×360**：`g3-sand-640.png`；逻辑 640×360，`scrollWidth=640 / clientWidth=640`；HUD 与底栏 Boss 名无溢出；`errs=[]`。
- **844×390 hasTouch**：`g3-sand-touch-844x390.png`；逻辑 779×360，`scrollWidth=844`；`touchCtl=true / touchItems=3`；提示「点按「攻」· 击败沙海蜃」；`errs=[]`。
- **单文件**：`web/game.html?world=1&debug`（`file://`）→ `__SINGLE__=true / sandMirage / hp80 / tex=sandMirageIdle / mirror=true / sw=false`；`errs=[]`。
- **PWA 断网**：SW controller → `setOffline(true)` → reload → 30 屏；再进 `desert-6` 仍 `sandMirage / hp80 / idle`；`na-b18-5ce6f0a6` / 12 条；`errs=[]`。
- **比例审计**：`python3 tools/audit_scale.py` 扩第三只 Boss + 沙蚋 + 沙岩堆 + 沙蓬 → **160 实例 / 0 FAIL**；沙海蜃 idle 2.48× / charge 2.25× / roar 2.85×，沙蚋 idle 0.93× / skitter 0.89×，沙岩堆 2.07–2.19×。
- **存档迁移**：v8 种子载入即 `v=9`，`bosses={mossBeast:done,bambooMirage:none,sandMirage:none}`，`tokens=9`，进入 `desert-6` 后可战。

### 4.3 构建

| 项 | 值 |
|---|---|
| 首屏预算 | **1979 KB / gzip 829 KB**（<2 MiB） |
| 图集 | **160 切片 / 242 KB**（新增沙蚋 2 张 256×64、沙岩堆 64×64） |
| 游戏逻辑 | `dist/game.fd249ebf.js` **336,003 B** |
| 素材数据 | `dist/assets.2e6f8f16.js` **125,301 B** |
| 单文件 | `web/game.html` **2,153,067 B** |
| PWA | `na-b18-798a1cf8` / 12 条 |
| 冒烟 | 9 项 PASS |

### 4.4 Pages 线上（新战场未部署）

- 线上仍是旧清场版：入口 `game.1697e515.js` + `assets.edb3c810.js`，PWA `na-b18-5ce6f0a6` / 12 条；新战场未推送，以下旧线上数据只作历史基线，不能当作沙海战场验收。
- 旧线上 960×540 `?world=1&debug=1`：`applyScreen(17)` 为 `sandMirage / hp80 / scale2.4109（呼吸峰值，基准 2.4） / originY0.6771 / mirror=true`；站定 `dir 2→3→0→1→2→3→0`（1.50–1.75s/步，HP20）；扑击 `HP20→15`；横扫 `HP20→15`；真实 3 伤击杀 `bossDead=true / bosses.sandMirage=done / tokens4 / 本体与 mirror 隐藏`；640 `scrollWidth=640`；844 `touchCtl=true / touchItems=3`；PWA 断网 `online=false / 30 屏 / desert-6 / sandMirage / hp80 / controller=true`；四组 `errs=[]`。
- 截图：`g3-online-sand-intro-960.png`、`g3-online-sand-idle-960.png`、`g3-online-sand-turn-d0..d3.png`、`g3-online-sand-pounce-960.png`、`g3-online-sand-swipe-960.png`、`g3-online-sand-victory-960.png`、`g3-online-sand-640.png`、`g3-online-sand-touch-844x390.png`、`g3-online-sand-pwa-offline-960.png`、`g3-online-sand-turn-board.png` / `.gif`。

---

## 5. 已知边界 / 下一步

- G3 世界 Boss 仍 **3/5**：草原苔背巨兽、竹林雾竹蜃、沙漠沙海蜃已重制；雪原 / 火山两只未做。
- `desert-6` 不再清场：`props=12 / deco=12 / battleHerbs=3`，保留 3 只沙蚋与心火掉落；`herbs=0` 只指“常规委托采集”，battle 沙蓬不计入 `desertHerbs`，沙漠委托采集点仍为 12，G2 总量口径不变。
- 四向仍是姿态切帧，不是逐帧行走；但站定每 1.6s 主动转 90°，追击 / 攻击朝玩家，满足 3D 件在场上的四向可读。
- 战斗仍是“追击 + 近身横扫 + 扑击 + 回气”；沙海蜃的差异在体型、近身阈值、蜃气重影与沙帆轮廓，没有独立多阶段 / 地形破坏。
- 沙海蜃场景已有沙门 / 枯木 / 沙棕 / 沙蓬 / 沙丘 / 沙岩堆 / 3 只沙蚋与蜃气重影；仍缺专属蜃楼建筑、地形破坏或分阶段机制，下一轮可加一处不挡判定的远景蜃楼残影。

---

## 6. 改动文件

- 新增：`art-src/g3/sand-mirage.cjs`、`docs/revamp/g3-3d/sand-mirage-{idle,charge,roar}.png/.json`、`docs/revamp/g3-3d/sand-mirage-board.png`、`assets/01-primary/world/sand-mirage-{idle,charge,roar}.png`、`docs/revamp/g3/g3-sand-*`（本地 960 / 640 / 844 / 单文件 / PWA / 失败 / 转身板 / GIF）。
- 修改：`art-src/g3/render-g3.cjs`、`web/data/world.json`、`src/systems/worldSave.js`、`src/scenes/world.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/ACCEPTANCE.md`、`docs/MASTERPLAN.md`、`CURRENT.md`、`LEDGER.md`、`index.html`、`sw.js`。
- 沙海战场新增：`art-src/g3/sand-scarab.cjs`、`art-src/g3/sand-rock.cjs`、`assets/01-primary/world/sand-scarab-{idle,skitter}.png`、`assets/01-primary/world/sand-rock.png`、`docs/revamp/g3-3d/sand-scarab-{idle,skitter}.png/.json`、`docs/revamp/g3-3d/sand-rock.png/.json`、`docs/revamp/g3-3d/sand-battle-board.png`、`docs/revamp/g3/g3-field-*.png`。


---

## 7. 沙海战场重做（2026-11-25 追加）

用户明确否决“Boss 场只有 Boss”的清场版本。`desert-6` 恢复为 **有层次的沙海战场**，但不把摆件堆到 Boss 脚底：

### 7.1 新素材

| 素材 | 源 | 尺寸 / 方向 | 运行时 |
|---|---|---|---|
| 沙蚋 `sandScarab` | `art-src/g3/sand-scarab.cjs`（seed 304） | 64×64，4 向 × `idle / skitter`；两张 256×64 RGBA atlas | `MINION_ART.sandScarab`，`scale1.35 / origin44/64`，可见高 29.7px / 0.93× 玩家 |
| 沙岩堆 `desertRock` | `art-src/g3/sand-rock.cjs`（seed 305） | 64×64，单帧；三块沙岩 + 斜插断片 + 风蚀孔 + 冷青裂纹 | `PROP_SCALE.desertRock=2.5`，alpha bbox 66–70px / 2.07–2.19× 玩家；只挡柱脚 |
| 沙丘 / 沙蓬 | 复用现有沙地 tile、`desertShrub` | — | `desertDune` 低透明度沙脊，不挡走位；`desertScrub` 0.55–0.61×，做小植物层 |

- 渲染入口仍为 `art-src/g3/render-g3.cjs`；新增 `sand-scarab-idle / sand-scarab-skitter / sand-rock` 三个 specs。
- `tools/build.mjs` 登记 `sandScarabIdle / sandScarabSkitter / desertRock`，`FRAME` 均 64×64。
- `tools/audit_scale.py` 新增小怪 / 沙岩堆 / 沙蓬审计；本轮 **160 实例 / 0 FAIL**（沙蚋 idle 0.93× / skitter 0.89×；沙岩堆 2.07–2.19×）。

### 7.2 小怪运行时

`src/scenes/world.js` 新增 `this.mobs`：

- `spawnBossMinions()` 按 `boss.def.minions` 生成沙蚋；每只带阴影、尘化入场、`hp / dmg / nextAt`；
- `updateMobs()` 在 Boss 战内追击玩家（44px/s，30–245px 感知），四向切换 `idle / skitter`；近身 28px 每 1.12s 咬击 `dmg2`；
- `attack()` 先取最近小怪，`ATTACK_DMG` 三伤击杀；若 Boss 也在同一刀范围，一并吃伤害；
- `damageMob()` 白闪、轻微震屏、伤害飘字、死亡尘化并从 `this.mobs` 移除；
- `startBossFight / retryBoss` 生成小怪；`finishBoss / worldDown / spawnBoss` 清理；小怪不写 `na.world`，不跨屏、不重生到其它 Boss。

### 7.3 战场读法

- **保留 Boss 读区**：Boss `x300 / y170` 与玩家入场 `x150 / y240` 之间留空；沙岩堆在 `x248 / y88` 与 `x434 / y244`，均避开 Boss 脚底；沙丘用低透明度、不碰撞。
- **小怪分布**：左侧 `84,214`、右侧 `350,212`、上方 `210,92`，三只从三个方向进入，避免全挤在玩家脚下。
- **预警圈**：扑击 / 横扫改为 depth 38 的**只描边圆环**（`fillAlpha 0` / `stroke 3px #ff7a6a`），压在沙蚋、摆件与 Boss 本体之上但不填色，Boss 本体与脚底不会被红色洗掉；Boss 本体、脚底、重影仍 depth 35 / 30。
- **植物 / 石头 / 地形**：沙门、枯木、沙棕、沙蓬、沙丘、沙岩堆都在画面内，但不形成连续遮挡墙。

### 7.4 实测

- 960：`desert-6` 的 `props=12 / mobs=3 / battleHerbs=3（quest herbs=0）`；Boss `sandMirage / hp80`，沙蚋 `sandScarab` 三只；三伤击杀一只后 `mobs=2`；Boss 真实击杀后 `mobs=0 / bosses.sandMirage=done / tokens4 / victory`；`errs=[]`。
- 640 / 844：`scrollWidth=640 / 844`；844 `touchCtl=true / touchItems=3`；两档 `errs=[]`。
- 单文件：`__SINGLE__ / desert-6 / sandMirage / mobs3 / props12`；PWA 断网：`online=false / 30 屏 / desert-6 / sandMirage / mobs3 / controller=true`。
- 场次证据：`docs/revamp/g3/g3-field-board.png`、`docs/revamp/g3/g3-field-intro-960.png`、`g3-field-idle-960.png`、`g3-field-melee-960.png`、`g3-field-pounce-960.png`、`g3-field-swipe-960.png`、`g3-field-victory-960.png`、`g3-field-640.png`、`g3-field-844.png`、`g3-field-single-960.png`、`g3-field-pwa-offline-960.png`。


---

## 8. 三项全改：沙蓬可采 / 沙蚋增援掉落 / 线上沙海（2026-11-25 追加）

用户引用上一轮“沙蓬不可采、沙蚋不重生不掉落、Pages 未部署”三项，并明确说“全都改啊，肯定是要让整个游戏更加精美、全面，牛哄哄那种”。本节按三项全执行，并补了两个会直接影响观感的问题：Boss 场右缘漏雪原、Boss 与沙底融色。

### 8.1 沙蓬从纯布景改为战斗快采

`web/data/world.json` 的 `desert-6.herbs` 写入 3 个带第三位 `battle` 标记的节点：

- `[132,246,1]`：玩家入场左侧，低血量时第一眼可见；
- `[40,120,1]`：沙门内侧，作为绕行路线奖励；
- `[440,280,1]`：右缘沙岩堆附近，靠近补沙海但不越屏。

三个点都经过实测避开 Boss 230px 身体范围与沙蚋出生点；先前放在 `[300,246]` 会被 Boss 身体遮住，已撤掉。

运行时：

- `buildHerbs()` 识别 `h[2]`，battle 节点复用 `desertShrub`，但换成 `UI.world.herb` 绿色光晕，提示「E 采沙蓬」，节点带 `battle / heal:2`；
- 新增 `BATTLE_HERB_RESPAWN_MS = 45000`、`MOB_HEAL = 3`；
- 新增 `pickBattleHerb(node)`：不读条、不冻结 Boss，立即消耗节点、`+2 HP`、绿色爆发 + 5 粒草屑、`respawnAt = now + 45000`；
- `nearestHerb(battleOnly)` 只找 battle 节点；Boss 战 `onAction` 优先采附近沙蓬，否则攻击；`startGather` 与 sprite `pointerdown` 也分流到快采；
- `updatePrompts()` 在 Boss 战只显示附近 battle 沙蓬；普通草药仍不允许在 Boss 战采集；
- `updateRespawns` 对 battle 节点使用「沙蓬重新抽叶」toast。

实测：`hp10 → hp12`，`gathering=false / active=false`，`respawnAt≈45000`，Boss 仍 `active`；强制到期后节点 `active=true / sprite visible / prompt=E 采沙蓬`。

边界：battle 沙蓬只回血，不计入 `desertHerbs` 采集数量、不写委托进度；这是刻意的“战场补给”，不是新的采集点。

### 8.2 沙蚋持续增援与“心火”掉落

`src/scenes/world.js` 新增 `this.loot / minionMax / minionRespawnAt / mobKills`：

- `spawnBossMinions()` 重置 `minionMax / mobKills / timer`，按 `boss.def.minions` 逐只生成；`spawnMinion(add, slot, respawn)` 负责单只生成 / 重生，重生点避开玩家 72px，带 420ms 破沙淡入；
- `updateMinionRespawn()` 先于 `updateMobs` 的“无小怪 early return”执行；BOSS 战、未死亡 / 胜利、`mobs.length < minionMax` 时按 `minionRespawnMs` 计时；第一只死亡后 **9s** 回场，补满缺口时改为约 **3s 一只**，避免清空后 27s 才回满；
- `damageMob()` 死亡调用 `dropMobLoot()`，并用“排除当前这只后的存活数”判断是否排重生；第一只击杀 **必掉 1 枚心火**，之后按 `minionDropChance`（数据 `0.45`）掉落；
- 心火为 `heart` 贴图 + 金绿光晕，24px 内且 HP 未满时自动拾取 `+3 HP`，飘 `+3` 与 toast；
- `update()` 每帧调用 `updateLoot()`；`finishBoss / worldDown / retry / spawnBoss` 清理全部掉落；
- `normalizeWorld` 读取 `minionRespawnMs`、`minionDropChance`；`world.json` 的 `sandMirage` 写入 `minionRespawnMs:9000 / minionDropChance:0.45`。

实测：首杀 `mobs2 / loot1 / mobKills1 / respawn≈9000`；拾取 `hp10→13 / loot0`；一次清空后 13s 回 `mobs2`、约 15s 回 `mobs3`；三只强制重生截图 `slots [0,1,2]`；Boss 击杀后 `mobs0 / loot0`。

### 8.3 补沙海：右邻雪原不再穿帮

`desert-6` 是 30 屏中最后一屏沙漠；`SCREEN_W=480`、镜头视口 640，玩家靠近 Boss 时右侧会漏出下一屏雪原雪松。未新增世界屏，改为 Boss 战“补沙海”：

- `buildBossEdge(screen)` 在邻屏群系不同时，暂存并隐藏右邻屏 **30 个对象**，铺同色调 `desertTile`、两条沙脊椭圆、沙岩堆、沙蓬、枯木、极淡风沙；
- `restoreBossEdge()` 在 `closeVictory` 恢复；胜利面板阶段保留补景，关闭后恢复；`retryBoss` 重新 `buildBossEdge`；
- 实测胜利面板 `edgeHidden 30 / edgeProps 7`，关闭后 `edgeHidden 0 / snowVisible 25`。

同时修观感：

- 删除原先 `arenaLine` 红色竖线，不再有“八角笼”笼线；
- Boss 战玩家 x 夹到 `screen.x+24 .. screen.x+456`，左右都不越屏；
- 沙海蜃原 3D 件在沙底上偏亮，新增 `BOSS_ART.sandMirage.bodyTint=0xa68f73`，受击白闪结束后恢复 tint；试过 `0xc9b191 / 0xb09a7d / 0x8f7b62`，最终取中间偏暖褐，Boss 轮廓比原色清楚；
- 右邻屏补景从一开始的纯色沙带改为带枯木 / 沙岩 / 沙蓬的沙海延伸，避免一条“墙”的感觉。

### 8.4 最终实测（2026-11-25）

- 960×540：`props12 / battleHerbs3 / mobs3 / boss=sandMirage / edgeHidden30 / edgeProps7`；沙蓬 `hp10→12`；首杀 `loot1`；拾取 `hp10→13`；清空后 13s `mobs2`、约 15s `mobs3`；Boss 真实击杀 `victory=true / mobs0 / loot0 / bosses.sandMirage=done / tokens4`；`errs=[]`。
- 640×360：`scrollWidth=640 / clientWidth=640 / touch=false / mobs3`。
- 844×390（hasTouch）：`scrollWidth=844 / touchCtl=true / touchItems=3 / canvas779×360 / mobs3`。
- 单文件：`__SINGLE__ / desert-6 / sandMirage / props12 / mobs3 / battleHerbs3 / edge30`。
- PWA：`na-b18-b4d4197c` / 12 条；断网 `online=false / 30 屏 / desert-6 / sandMirage / controller=true`。
- 构建：首屏 **1985 KB / gzip 830 KB**；**161 切片 / 242 KB**；`dist/game.6d2e3c21.js` **341,765 B** + `dist/assets.815d84ee.js` **125,382 B**；单文件 `web/game.html` **2,158,842 B**。
- `npm run smoke` 9 项 PASS；`tools/audit_scale.py` **161 实例 / 0 FAIL**（沙蚋 idle 0.93× / skitter 0.89×）。
- 截图：`docs/revamp/g3/g3-field-board.png`、`g3-field-intro-960.png`、`g3-field-herb-960.png`、`g3-field-loot-960.png`、`g3-field-respawn-960.png`、`g3-field-victory-960.png`、`g3-field-640.png`、`g3-field-844.png`、`g3-field-single-960.png`、`g3-field-pwa-offline-960.png`。

### 8.5 改动文件

- 修改：`web/data/world.json`、`src/scenes/world.js`、`tools/build.mjs`、`tools/audit_scale.py`、`assets/CREDITS.md`、`docs/ART_PIPELINE.md`、`docs/OPENWORLD.md`、`docs/MASTERPLAN.md`、`docs/ACCEPTANCE.md`、`CURRENT.md`、`LEDGER.md`、`index.html`、`sw.js`。
- 新增：`art-src/g3/sand-scarab.cjs`、`art-src/g3/sand-rock.cjs`、`assets/01-primary/world/sand-scarab-{idle,skitter}.png`、`assets/01-primary/world/sand-rock.png`、`docs/revamp/g3-3d/sand-scarab-*`、`docs/revamp/g3-3d/sand-rock.*`、`docs/revamp/g3-3d/sand-battle-board.png`、`docs/revamp/g3/g3-field-*`。
- 构建：`dist/game.6d2e3c21.js`、`dist/assets.815d84ee.js`、`web/game.html`、`sw.js`（`na-b18-b4d4197c`）、`index.html`。

### 8.6 已知边界

- battle 沙蓬不计入采集数量 / 委托，只作为 Boss 战回血补给；
- 小怪 9s / 首杀必掉 / 45% 是设计平衡值，尚未由用户给具体数值；
- 补沙海是“Boss 战视口遮罩”方案，不是新增沙漠缓冲屏；若之后做真正的第 31 屏沙海，应替换该遮罩；
- Pages 需要本轮提交推送后才会上线，当前线上仍是旧清场版；W-95 记录线上结果。
