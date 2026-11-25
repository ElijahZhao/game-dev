# MASTERPLAN v4：六章 · 49 关 · 房间数递增

> 2026-11-21 四次定稿，按"后期单关 10 房、总量 50 关左右"的口径定稿。批 1–8 已完成，本文件是批 9 起的施工图。
> 对标：元气骑士的关卡与大厅、泰拉瑞亚的 Boss 顺序、Minecraft 的进度引导。
> 硬约束：素材优先（包内 → 外部 CC0 → 换表达 → 自绘）。开放世界独立成篇，先 3 屏雏形（`docs/OPENWORLD.md`）。

---

## 1. 规模总表

**六章主线 36 关 + 支线 6 + 隐藏 3 + 条件 4 = 49 关，147★。** 房间数前期少、后期多：第一章单关 5 房，第五章单关 10 房。

| 章 | 主题 | 关数 | 单关房数 | 本章房间数 | 难度系数 | 压力机制 | 地面/墙体素材 | Boss 池 |
|---|---|---|---|---|---|---|---|---|
| 一 · 竹林村 | 草地村舍 | 5 | 5 | 25 | ×1.00 | 教学：追击、弹幕 | `TilesetField`、`TilesetHouse`、`VillageAbandoned` | GiantFrog / GiantRacoon |
| 二 · 旧堡 | 石砖地牢 | 6 | 6 | 36 | ×1.15 | 机关门、精英房 | `TilesetDungeon`、`Interior` 322、`Pipes` | BlueSamurai / RedSamurai |
| 三 · 沙海遗迹 | 沙地残墙 | 7 | 7 | 49 | ×1.30 | 流沙减速、毒雾 | `TilesetDesert`、`TilesetWater` | TenguBlue / TenguRed |
| 四 · 沉水神殿 | 水没石殿 | 8 | 8 | 64 | ×1.45 | 水沟减速、暗流推挤 | `TilesetWater`、`TilesetNature`、`Interior` | GiantSpirit / DemonCyclop |
| 五 · 熔岩地心 | 地底火道 | 9 | 10 | 90 | ×1.60 | 熔岩灼烧、火雨 | `TilesetElement`、`Pipes`、`Particle/Fire` | GiantFlam / DemonCyclop2 |
| 终 · 星火之巅 | 天穹 | 1 | 1（三阶段） | 1 | ×1.80 | 三阶段终战 | `Interior` 暗色 + `Raylight` + 星空 | 影织者（GiantSpirit 调色） |

章内第 N 关再乘 `1 + 0.05 × (N − 1)`；例如第五章第 9 关 = 1.60 × 1.40 = ×2.24。

**总房间数**：主线 265 + 支线 24 + 隐藏 18 + 条件 21 = **328 房**。全表驱动，代码只写通用编排。

---

## 2. 关内结构

| 章 | 单关房型模板（最后一房为 Boss） |
|---|---|
| 一（5 房） | 战斗 ×2、商店、休整 → Boss |
| 二（6 房） | 战斗 ×2、宝箱、精英、机关 → Boss |
| 三（7 房） | 战斗 ×3、精英、事件（石龛/祭坛）、商店 → Boss |
| 四（8 房） | 战斗 ×3、精英 ×2、宝箱、机关 → Boss |
| 五（10 房） | 战斗 ×4、精英 ×2、宝箱、商店、休整 → Boss |
| 终（三阶段） | 阶段一 追击 / 阶段二 召唤+弹幕 / 阶段三 全屏火雨 |

星级三条（全部可落存档字段）：★1 通关、★2 通关时血 ≥70%、★3 未用休整房。147★ 满星；**100★ 开隐藏关「无光回廊」**。

---

## 3. 支线 / 隐藏 / 条件关

### 3.1 支线（6 个，每章 1 个 + 终章后日谈）

| 支线 | 所在章 | 开启条件（存档字段） | 内容 | 奖励 |
|---|---|---|---|---|
| 萤火虫之森 | 一 | 本章 15★ | 夜版竹林，全程低光，敌人带灯 | 宝石 20 + 引路人对话 |
| 旧堡地窖 | 二 | 击败赤武士 且 该关未用休整房 | 3 房连战，无商店 | 宝石 25 + 锻造图纸 |
| 商队遗骸 | 三 | 累计拾取 30 资源 | 沙暴中找 3 个货箱 | 宝石 30 + 商人剧情 |
| 沉船货舱 | 四 | 任意一关无伤通关 | 水下 4 房，氧气计时 | 宝石 35 + 第二技能折扣 |
| 熔炉核心 | 五 | 点燃 3 处火盆 | 4 房高温，持续掉血 | 宝石 40 + 火焰附魔 |
| 灰烬之后 | 终 | 通关终章 | 3 房后日谈，读信 | 宝石 50 + 周目词条 |

### 3.2 隐藏关（3 个）

| 关 | 开启条件 | 设计 |
|---|---|---|
| 无光回廊 | 累计 100★ | 6 房，双 Boss（Spirit + DemonCyclop）同场，×1.5 |
| 镜之屋 | 沙海全三星（21★） | 5 房，双天狗轮换，镜像布局（左右翻转） |
| 灰烬墓 | 通关无光回廊 | 7 房，熔岩 Boss 连战，×1.7 |

### 3.3 条件关（4 个，装备/规则限制）

| 关 | 开启条件 | 限制 | 奖励 |
|---|---|---|---|
| 苦无试炼 | 解锁苦无 | 只允许苦无 | 宝石 15 |
| 赤手空拳 | 通关第二章 | 不带武器（拳 3 伤） | 宝石 20 |
| 贫者之路 | 累计金币 ≥200 | 全程不捡金币 | 称号「贫者」 |
| 商队速递 | 通关第三章 | 5 分钟内通关 | 宝石 25 |

---

## 4. 叙事（六章九节点，批 15 定稿）

> 批 15 已把早期“星火被偷 → 夺回 → 村子回暖”的平线重写为反转闭环：星火不是单纯圣物，而是村庄用“归途者”反复回炉维持的祭品。数据源为 `web/data/story.json`（v3），运行时见 `src/systems/story.js` / `src/scenes/story.js`，验收见 `docs/BATCH15-STORY.md`。

| 节点 | 触发 | 剧情 |
|---|---|---|
| 序 · 火熄 | 首次开始冒险 / 首次进小屋 | 引路人：星火被影织者拿走，村子活不过第七夜；“火里若有声音叫你名字，别答应” |
| 一 · 竹林 | 进第一章前 | 村医指路旧堡，第一块碎片缝在赤武士胸口；他以前是守村人 |
| 二 · 赤武士 | 击败赤武士 | 反转：赤武士守的是门，不是碎片；“影织者没有偷火，它只是把火从祭坛上放了出来”；引路人打断“别听他” |
| 三 · 沙海 | 进第三章前 | 商队唯一活人为了女儿把整支商队卖给“没有脸的影子”；他数死人的钱数得很慢 |
| 四 · 沉水 | 进第四章前 | 古神是第一座被星火灼瞎的村子；“别把它带回去，让它留在这里和我一起烂掉” |
| 五 · 熔岩 | 进第五章前 | 铁匠是造笼人；影织者是第一个拒绝回炉的归途者；每块碎片都是上一个你 |
| 终 · 星火 | 击败影织者 | 影织者是“你第一次说不的那个版本”；引路人要放回祭坛，主角把火举过头顶，火裂成千万点落向每一扇窗；第七夜没来，来了一场很轻的雨 |
| 后日谈 · 灰烬之后 | 通关支线 `epilogue` | 铁匠读信，商人女儿回来，引路人失去火声；“如果你读到这里，说明你终于没有再点那把火” |
| 周目 · 再燃 | 终章 + 后日谈后，二周目回小屋 | 村子第一次下雨，没有火也没有人冻死；引路人退休；五片土地亮起不属于星火的灯（G2 引子） |

载体：9 段对话框（每段 ≤4 行）+ 6 张章节过场卡（tileset 拼贴 + 三行字）+ 1 段终章 coda（三行）。不做配音、不做分支、不做多结局。

NPC 弧光：引路人（守夜人 → 失去火声 / 退休）、铁匠（前朝铸剑师 → 造笼人 → 读信）、商人（灭门幸存者 → 卖商队换女儿 → 女儿不记得他）。

顺序链：`prologue → ch1 → ch2 → ch3 → ch4 → ch5 → final → epilogue → cycle2`；`cycle2.requires=epilogue`，且 `cycle>=2`，确保终章结束先回小屋，再燃留到后日谈之后。

---

## 5. 小屋「归途小屋」

| 区 | 功能 | 依赖 | 批 |
|---|---|---|---|
| 出发台 | 章节地图、星级、支线/隐藏/条件关入口 | `map` | 9 |
| 锻造坊 | 金币升级武器 Lv.1–3，支线图纸开 Lv.4 | `na.save.forge` | 13 |
| 训练场 | 木桩 DPS、试武器 | 复用 `attack()` | 13 |
| 图鉴室 | 三页签 + 新怪/新 Boss 自动补位 | 已有 | 10 |
| NPC 区 | 引路人 / 铁匠 / 商人 | `villager` 立绘 | 13 |

---

## 6. 元进度

- **宝石**：武器/角色解锁（已有）+ 第二技能（忍者 25 / 法师 35 / 骑士 45）+ 部分支线可花宝石提前开。
- **星级**：147★；100★ 开无光回廊；每章满星给一张锻造图纸。
- **成就 20 条**：首通 / 击杀 / 11 种 Boss / 逐章清关 / 星数 / 无伤 / 不眠 / 支线 / 二周目 / 看完终章（实际名单见 `docs/BATCH16-PROGRESSION.md`）。
- **周目**：通关终章后 `cycle + 1`，接现有 `CFG.cycle`，并解锁「周目词条」（敌人随机带 1 词缀）。

---

## 7. 批次表

| 批 | 范围 | 关键文件 | 验收 |
|---|---|---|---|
| **9 · 骨架** | `chapters.json`（六章/49 关/房数/系数/Boss 池/门槛）+ `map` 场景 + 关卡包装（房数按章、结算回地图、星级） | `src/scenes/map.js`、`src/systems/stages.js`、`play.js`、`save.js` v6、`web/data/chapters.json` | M1 六章可翻；M2 末房必 Boss；M3 房数按章生效（第五章 10 房）；M4 星写入并回地图；M5 v5→v6 迁移 |
| **10 · 一、二章内容** | 两章怪物池/Boss 池/房型模板/图鉴补位 | `web/data/enemies.json`、`bosses.json`、`play.js` | N1 两章皮肤可分；N2 Boss 按池抽；N3 精英/宝箱密度符合表 |
| **11 · 三、四章内容** | 沙漠/水素材接入、4 只 Boss、新怪 anchor、流沙/水沟机制 | `tools/build.mjs`、`web/data/*.json` | O1 皮肤可分；O2 流沙/水沟生效；O3 anchor 不飘 |
| **12A · 五章（已完成）** | 熔岩素材、火雨/灼烧、9 关 ×10 房编排 | `tools/build.mjs`、`web/data/*.json`、`play.js` | P1 10 房关可通关；P3 火雨相对不掉帧；见 `docs/BATCH12A-LAVA.md` |
| **12B · 终章（已完成）** | 影织者三阶段、终章编排、结局衔接 | `play.js`、`bosses.json`、`chapters.json` | Q1 终章 1 房可进；Q2 三幕可复现；Q3 结局写周目；见 `docs/BATCH12B-FINAL.md` |
| **G0 · 开放世界雏形（已完成）** | 3 屏、2 气候、采集+1 NPC、`na.world` | `src/scenes/world.js`、`web/data/world.json`、`src/systems/worldSave.js` | W1–W5；见 `docs/G0.md` |
| **G1 · 草原群系（已完成）** | 6 屏草原、台地/洞穴、晴/雨/雾、11 草药 + 委托、世界 Boss、`na.world v2` | `src/scenes/world.js`、`web/data/world.json`、`src/systems/worldSave.js`、`tools/build.mjs` | G1-1～G1-9；见 `docs/G1.md` |
| **13 · 小屋（已完成）** | 出发台/锻造/训练场 + 3 NPC | `hall.js`、`systems/forge.js`、`systems/npc.js`、`save.js` v8 | Q1 锻造落盘生效；Q2 DPS 可读；Q3 对话不挡操作；见 `docs/BATCH13-HOUSE.md` |
| **14 · 支线/隐藏/条件（已完成）** | 13 个额外关的条件判定、入口、奖励；`chapters.json` 的 `side / hidden / conditional` 三组是实际数据源 | `web/data/chapters.json`、`stages.js`、`map.js`、`play.js`、`save.js` v9 | R1 条件未达不可进；R2 达成可进；R3 奖励入档；R4 火盆锁门；见 `docs/BATCH14.md` |
| **15 · 剧情（已完成）** | 9 段对话 + 6 张过场卡 + 终章 coda + 后日谈 / 再燃；`story.json` v3、`save.js` v10 | `web/data/story.json`、`systems/story.js`、`scenes/story.js`、`save.js`、`nav.js` | S1 顺序且只触发一次；S2 跳过可用；S3 结局回小屋；见 `docs/BATCH15-STORY.md` |
| **16 · 元进度（已完成）** | 20 成就 + 第二技能 + 周目词条 | `systems/ach.js`、`chars.json` | T1 成就 toast 与存档；T2 第二技能计费；T3 词条生效；见 `docs/BATCH16-PROGRESSION.md` |
| **17 · 工程化（已完成）** | PWA、移动端、首屏预算、冒烟脚本 | `manifest.json`、`sw.js`、`systems/input.js`、`tools/smoke.mjs` | U1 Play 触控可玩；U2 首屏 1,905,859 B <2 MiB；U3 `npm run smoke` 9 项 / 约 10s；见 `docs/BATCH17-ENGINEERING.md` |
| **18 · G2-1 竹林（已完成）** | 草原 6 + 竹林 6 = 12 屏；竹隐 / 雾竹三味；`na.world v3`；9 件 G2 素材（3 件接入） | `world.js`、`web/data/world.json`、`worldSave.js`、`tools/build.mjs`、`art-src/g2/` | W1–W10：12 屏 / 真实跨群系 / 竹隐委托 / 村医回归 / v2→v3 / 640·960·844 / 单文件 / 冒烟 / PWA / Pages；见 `docs/BATCH18-G2-1.md` |
| **19 · G2-2 沙漠（已完成）** | 草原 6 + 竹林 6 + 沙漠 6 = 18 屏；沙婆 / 沙海拾味 / 14 沙枣丛；`na.world v4`；11 件 3D + 沙棕 / 16px 沙地素材库 | `world.js`、`web/data/world.json`、`worldSave.js`、`tools/build.mjs`、`art-src/g2/`、`tools/crop_desert.py` | W11–W20：18 屏 / 沙漠六屏 / 沙婆委托 / 沙尘 / 沙地 / 草原竹林回归 / v3→v4 / 640·960·844 / 单文件 / 冒烟 / PWA / Pages；见 `docs/BATCH19-G2-2.md` |
| **21 · G2-4 火山与落灰（已完成）** | 30 屏（五群系 6×5）；熔匠 赤砧 / 拾火五枚 / 14 火种；`na.world v6`；熔岩锻炉 / 熔匠 / 火种 / 熔岩池 3D；`PROP_SCALE` + alpha bbox 审计 139/0 | `world.js`、`web/data/world.json`、`worldSave.js`、`tools/build.mjs`、`tools/audit_scale.py`、`art-src/g2/` | W31–W40：30 屏 / 熔匠委托 / 比例审计 / v5→v6 / 640·960·844 / 单文件 / 冒烟 / PWA / Pages；见 `docs/BATCH21-G2-4.md` |
| **23 · G3-1 苔背巨兽 3D 重制（已完成）** | 世界 Boss 仍 1 只；`world.boss.id=mossBeast / hp64 / dmg4`；ink-studio 96×96 四向 × idle/charge/roar；四向朝向 + 姿态 + 苔屑 / 地面 / 触屏 HUD；`na.world v7` 不变；审计 144/0 | `src/scenes/world.js`、`web/data/world.json`、`art-src/g3/`、`tools/build.mjs`、`tools/audit_scale.py` | W51–W61：四向 / 三姿态 / 击杀 / 死亡重试 / 640·844 / 单文件 / PWA / 冒烟 / 比例 / Pages；见 `docs/BATCH23-G3-1.md` |
| **23 · G3-2 雾竹蜃 3D 重制（已完成）** | 世界 Boss 2 只；`world.bosses` 多 Boss；`bambooMirage / hp72 / dmg5 / reward4`；ink-studio 96×96 四向 × idle/charge/roar；扑击落点 / 冲击半径按 Boss 体宽拆分；`na.world v8`；审计 145/0 | `src/scenes/world.js`、`src/systems/worldSave.js`、`web/data/world.json`、`art-src/g3/`、`tools/build.mjs`、`tools/audit_scale.py` | W62–W70：四向 / 三姿态 / 扑击 / 真实击杀 / 失败重试 / 640·844 / 单文件 / PWA / 冒烟 / 比例 / Pages；见 `docs/BATCH23-G3-2.md` |
| **23 · G3-3 沙海蜃 3D 重制 + 沙海战场全量强化（已完成）** | 世界 Boss 3 只；`sandMirage / hp80 / dmg5 / reward4`；ink-studio 96×96 四向 × idle/charge/roar；`desert-6` 改为 12 props / 12 deco / 3 只沙蚋的沙海战场（沙门 / 枯木 / 沙棕 / 五沙蓬 / 沙丘 / 两沙岩堆），不清场；battle 沙蓬 3 节点可采 `+2 HP` / 45s 重生；沙蚋 9s 增援 / 首杀必掉心火 / 45% 掉落 / 拾取 `+3 HP`；右邻雪原在 Boss 战暂隐 30 对象 + 7 项补沙海，关胜利恢复；无红色笼线；蜃气重影 + `bodyTint`；`na.world v9`；审计 161/0 | `src/scenes/world.js`、`src/systems/worldSave.js`、`web/data/world.json`、`art-src/g3/`、`tools/build.mjs`、`tools/audit_scale.py` | W72–W81 + W82–W95：四向 / 三姿态 / 战场 / 沙蓬 / 增援 / 掉落 / 补沙海 / 体色 / 640·844 / 单文件 / PWA / 冒烟 / 比例 / Pages；见 `docs/BATCH23-G3-3.md` 第 8 节 |
| **22 · G2-5 火山第二委托与篝火（已完成）** | 30 屏不变；熔匠第二条「三淬归火」（3 炉眼 / 3 碎片）；5 个篝火主落点 + 已访问传送；world 三键触屏 + 摇杆；`na.world v7`；无新增美术，alpha bbox 审计 141/0 | `world.js`、`web/data/world.json`、`worldSave.js`、`src/systems/input.js`、`tools/audit_scale.py` | W41–W50：委托 / 传送 / v6→v7 / 960·640·844 / 单文件 / 冒烟 / PWA / Pages；见 `docs/BATCH22-G2-5.md` |
| **20 · G2-3 雪原与比例基线（已完成）** | 24 屏（四群系 6×4）；守灯人 / 雪灯五盏 / 14 雪灯草；`na.world v5`；雪松 / 雪祠 96×128、守灯人 / 雪灯草 / 完整沙棕 3D；`PROP_SCALE` + alpha bbox 审计 106/0 | `world.js`、`web/data/world.json`、`worldSave.js`、`tools/build.mjs`、`tools/audit_scale.py`、`art-src/g2/` | W21–W30：24 屏 / 雪灯委托 / 比例审计 / v4→v5 / 640·960·844 / 单文件 / 冒烟 / PWA / Pages；见 `docs/BATCH20-G2-3.md` |

**排期**：9 → 10 → 11 → 12A → 12B → **G0**（素材管线刚热）→ **G1**（提前落地六屏草原）→ **13（已完成）** → **14（已完成）** → **15（已完成）** → **16（已完成）** → **17（已完成）** → **18（已完成）** → **19（已完成）** → **20（已完成）** → **21（已完成）** → **22（已完成）** → **23 / G3-1～G3-3（已完成）** → G3-4～G3-5（雪原 / 火山两只 Boss / 剩余委托收尾）。

---

## 8. 素材账

| 需求 | 包内 | 结论 |
|---|---|---|
| 六章地面/墙体 | Field / Dungeon+Interior / Desert / Water+Nature / Element+Pipes / 暗色 Interior | ✅ 全在包内 |
| 10 只 Boss | Frog、Racoon、Blue/RedSamurai、TenguBlue/Red、Spirit、DemonCyclop、Flam、DemonCyclop2 | ✅ 六章轮换 |
| 各章怪物 | 26 个基础怪（Beast/Cyclope/Eye/Larva/Skull/Spider/Mole/Slime/Owl/Mush/Racoon/Lantern/Reptile/Snake/Fish/Octopus/Kappa/Dragon/Demon/Mouse/Mollusc/Lizard/Axolot/Bamboo/Butterfly/Spirit） | ✅ 每章 4–5 只 |
| 气候/粒子 | Rain、Snow、Grass、Leaf、Fire、Clouds、Rock | ✅ |
| 台地/洞穴 | `TilesetRelief`、`ReliefDetail`、`TilesetHole`、`TilesetFloorB` | ✅ |
| 图标/路标 | `TilesetElement`、`TilesetHouse`、`Animated/Flag` | ✅ |
| 过场卡 | tileset 拼贴 + 引路人立绘 | ✅ 拼贴 |

结论：主线 + 开放世界雏形预期 **0 外部素材、0 自绘**；成本在 anchor 校准、数值与文案。

---

## 9. 风险

| 风险 | 对策 |
|---|---|
| 328 房内容量 | 表驱动；`chapters.json` 已落第一版（六章 49 关） |
| 后期 10 房太冗长 | 10 房关只放第五章；中途必有商店/休整，节奏切成"两段" |
| 六章同质化 | 每章一个压力机制 + 不同怪池 + 不同 Boss，不只换皮 |
| 叙事写崩 | 9 节点固定、每段 ≤4 行；先文案后接线 |
| 条件关不可测 | 条件全落存档字段（星/金币/资源/无伤/时间） |
| 首屏变重 | tileset 按章懒加载；音频已懒加载 |

---

## 10. 明确不做

多人联机、UGC 编辑器、赛季/通行证、全程配音、分支多结局、程序化无限地形、开放世界无缝大地图。

---

## 11. 文档关系

`ROADMAP.md`（批 1–7）→ 本文件（批 9–17 主线）→ `OPENWORLD.md`（G0–G3）→ `BATCH8-SHELL.md`（外壳与渲染坑）→ ADR 0015 / 0016 / 0017。