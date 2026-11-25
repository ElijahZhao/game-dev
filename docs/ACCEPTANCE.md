# 验收标准

状态：**草案，未冻结**。段 2 目标冻结前不可作为验收依据。

## M 条（必过，未过不得判「可交付」）

| # | 判据 | 验证方式 | 不通过的样子 |
|---|---|---|---|
| M1 | 每件入库素材在 `CREDITS.md` 有完整登记：名称 / 作者 / 协议 / 来源 URL / 是否需署名 / 署名模板 / 原始 LICENSE 路径 | `bash tools/check-credits.sh`，并人工核对是否有素材文件未登记 | 存在素材文件但 `CREDITS.md` 无对应行 |
| M2 | 所有进包素材为绿档；黄档仅图标，且能自动拼出鸣谢页 | 按协议字段筛一遍，生成鸣谢文本人工核对 | 出现 CC-BY-SA / GPL / NC / ND 素材 |
| M3 | 仓库无环境信息残留：无绝对路径、无本机用户名、无环境标识 | 全仓文本检索绝对路径模式（详见 `AGENTS.md` 提交要求） | 任一文件命中 |
| M4 | 构建与测试命令可从 README 直接复现（进入开发段后生效） | 干净目录按 README 执行一次 | 命令缺失或执行失败 |

## S 条（应过）

| # | 判据 |
|---|---|
| S1 | 主美术选定结论写入 ADR，含候选对比与否掉理由 |
| S2 | `assets/` 五个子目录职责清晰，无跨目录重复文件 |
| S3 | 单文件二进制不超过 20 MB |

## N 条（可过）

| # | 判据 |
|---|---|
| N1 | 鸣谢页支持中英双语 |
| N2 | 素材带 provenance 清单，便于换包时批量替换 |

## P2 条（房间结构分段验收）

| # | 判据 | 验证方式 | 证据 |
|---|---|---|---|
| P2-1 | 未清房的房门不可通过（物理阻挡，不是判定拦截） | 撞门后读 `__state` 的 `room` 与 `px` | PLAYTEST-2 §1 |
| P2-2 | 清房后门可通行，落点在对侧门口、朝向正确 | 走门后核对 `room`/`roomIdx`/`entry`/`px` | PLAYTEST-2 §2 |
| P2-3 | 一局 3–6 间，终点为 Boss 房 | 多次新建统计 `total` 与 `isBoss` | PLAYTEST-2 §3 |
| P2-4 | 掉落可拾取、回血不超上限、换房后未拾取物仍在 | 走到掉落物上读 `coins`/`hp`/`drops` | PLAYTEST-2 §4 |
| P2-5 | Boss 有独立血量与血条，受击节奏受无敌帧约束 | 连续接触测命中间隔；观察血条收缩 | PLAYTEST-2 §5 |
| P2-6 | 血量归零与击破 Boss 都有遮罩，且能重开生成新地牢 | 触发两种结局后点击/按 R | PLAYTEST-2 §6 |
| P2-7 | 三种视口无报错、不留黑边错位 | 640×360 / 390×844 / 844×390 | PLAYTEST-2 §7 |

## B 条（手感分段验收）

| # | 判据 | 验证方式 | 证据 |
|---|---|---|---|
| B-1 | Boss 出手前有可见预警，蓄力期接触不造成伤害 | 贴到 Boss 旁逐帧读 `bossPhase`/`hp` | PLAYTEST-3 §1–§2 |
| B-2 | Boss 冲撞单次只结算一次伤害，且方向锁定后不再转向 | 连续两轮冲撞读 `hp` 差值 | PLAYTEST-3 §2 |
| B-3 | 小怪追击命中间隔不小于无敌帧，不出现同帧连击 | 站桩 8 秒逐帧采样 `hp` | PLAYTEST-3 §3 |
| B-4 | 小怪撞墙不原地抖动，会自行绕开 | 把怪置于 U 形墙后观察位移 | PLAYTEST-3 §3（未验） |
| B-5 | 镜头随朝向轻微前瞻，转身平滑不跳 | 按方向键后读 `px - camX`、`py - camY` | PLAYTEST-3 §4 |
| B-6 | HUD 提示在窄屏不被裁切 | 640×360 与 360×800 截图 | PLAYTEST-3 §5 |

## F 条（表现力验收）

| # | 判据 | 验证方式 | 证据 |
|---|---|---|---|
| F-1 | 游戏内中文全部由像素字体渲染，不出现系统等宽字体混排 | `document.fonts.check('12px "NinjaPixel"')` + 2× 截图放大看字形 | ADR 0012 §实测 |
| F-2 | 字体为构建期子集，体积可控且不缺运行时用字 | `tools/subset_font.py` 报告字数/字节；扫文案比对 cmap | 3911 字 / 129.8 KB，缺字 0 |
| F-3 | 字体加载失败或超时不阻塞开局 | 断网/改名加载 1.5s 兜底 | ADR 0012（兜底逻辑） |
| F-4 | 命中、击杀、挨打、砸地、变身各自有可区分的表现，不是同一套 tween | 逐档抓帧对照 `ACTS` 表 | `docs/screens/f4-hit-fx.png`、`f5-slam-fx.png` |
| F-5 | 顿帧分档且到期必然恢复，不会卡死世界 | 逐 30ms 采样 `__state.freeze/freezePaused` | 42/78/95/130/190 五档，回落 0 |
| F-6 | 顿帧期间特效继续播（画面不是静帧） | 慢放 0.1 抓帧 | ADR 0012 §3 坑与结论 |
| F-7 | 小怪受击白闪后回位、Boss 不被白闪盖掉阶段染色 | 连续命中同一目标后取色/截图 | ADR 0012 §4 |
| F-8 | 1280×720（2×）下字形干净；1.5× 允许 1px 粗细不均（已知） | 两档截图对比 | `f1-font-hud.png`（2×）vs 1.5× 截图 |

## W. 武器（2026-11-20 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-1 | 6 把武器都能通过掉落拿到、能换、旧武器留地可取回 | `__dbg.dropW(id)` + 走过去拾取 | katana→wand→拾回 katana，`swapKeepOld` 生效 |
| W-2 | 每种武器挥击/射击播**对应的**斩击帧或弹体，不是同一特效换色 | 逐把抓帧对比 `docs/screens/w2–w4` | 刀 Slash / 剑 SlashDoubleCurved / 锤 CircularSlash / 弓箭 / 杖火球 / 苦无 |
| W-3 | 三系手感可区分（刀快、剑重、锤慢且震屏、弓杖远程、苦无穿透） | `__dbg.stats()` 读 cd/dmg + 实战 | 3/280ms、6/480、8/720+重震、箭 300px/s、火球 210、苦无 pierce 2（实测一穿二） |
| W-4 | HUD 显示当前武器图标 + 名称，切武器立刻更新 | 截图 `docs/screens/w1-weapon-hud.png` | 图标 2× + 名称，`equipWeapon` 即时刷新 |
| W-5 | 图集切片与体积在预算内，首屏仍只加载 1 张 PNG | 构建日志 | 18→36 切片、26→30 KB |

## J. 音频（2026-11-20 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| J-1 | 不同场景情绪可切换，且切换后确实在响 | `__dbg.playMood(m)` 后读 `musicState()` | 6/6 mood `playing` + `readyState=4` |
| J-2 | 一次性曲（通关）播完即止，不循环 | `playMood('victory', true)` 读 `loop:false` | 43.6s，`loop:false` |
| J-3 | 结算界面上战斗曲不残留 | `__dbg.die()` 后读 `musicState()` | `playing: null` |
| J-4 | 各动作有可区分的音效，不是同一个音 | `__dbg.sfxTest(k)` 逐个触发 | 10/10 `ok` |
| J-5 | 首屏不被音频拖慢 | 首进只拉 `dungeon.mp3`，其余按情绪懒加载 | 初始 `loaded=[[dungeon,4]]` |

## R. 房间编排（2026-11-20 追加，批 2）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| R-1 | 10 局 `room.type`：首间 battle、末间 boss、每局 ≥1 非战斗房、精英不在首间、精英每局 ≤1 | 连续 10 次 `?debug` 载入后 `__dbg.roomTypes()` | 10/10 通过，序列见 `docs/BATCH2-ASSETS.md §5` |
| R-2 | 非战斗房（treasure/shop/shrine/rest）合计权重 ≤35% | 同上，统计 54 间 | 20.4% |
| R-3 | 宝箱必须持钥匙；精英必掉钥匙；商店可买钥匙；有宝箱但无精英无商店时自动补精英 | `__dbg.keys(0)` 开箱 / `clear()` 杀精英后读 `dropList` / 商店买钥匙 | 0 钥匙只弹提示不扣物；精英掉落含 `key`；6 金币买 5 金币钥匙后 `keys=1, coins=1`；断供保护见 `assignTypes()` |
| R-4 | 商店三件货明码标价；金币不足有提示且不扣钱 | `__dbg.shopStock()` + 1 金币买 10 金币武器 | 三件 10/4/5；不足时金币与前值一致 |
| R-5 | 篝火付 2 金币回 6 血，一房一次 | 6 血进房 → 选"付 2 金币" → 再按 E | 6→12 血、10→8 金币；第二次只剩"火快灭了"且不再扣钱 |
| R-6 | 小地图 3×3 反映已走/当前/未走，进门即更新 | `__dbg.jump(i)` 连走 4 间后截右上角 | 已走按房型上色、当前白框、未走暗格，见 `docs/screens/b2-7-minimap.png` |
| R-7 | 全流程可走通：按路径清房 → 出门 → 到 Boss → 通关 | `__dbg.clear()` + `__dbg.exit(dir)` 按 path 走完 5 间 | 4 步走完全程，`won=true`，无 pageerror |
| R-8 | 一次性交互不会骗玩家继续按 E（开过的箱子/烤过的火改提示） | 用过再靠近读 `promptT` | 显示"E 空箱子" / "火快灭了" |

## T. 层间天赋（2026-11-20 追加，批 3）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| T-1 | 每 2 间弹一次、3 张互不重复、Boss 房不弹 | 走房时读 `__dbg.panel()` | 2/4 间各弹一次，Boss 房无卡 |
| T-2 | 选"狂战"后上限 20→17、`dmg()` 3→5 | `__dbg.pick` 后读 `talents()` | `maxHp 17 / dmg 5`，HUD 同步 |
| T-3 | 同局不重复出现同一张 | 连续两次报价对比 | `重击/贪婪/疾风` → `稳手/轻步/快手` |
| T-4 | 重开清零 | 重新载入后读 `talents()` | `ids=[]`、`maxHp=20` |
| T-5 | 与 upg 分乘区 | 叠"重击+稳手"后读 `stats` | `cd 300→360`、`spd 96→86`、`dmg 3→4` |
| T-6 | 稀有度随深度上移 | 深度 1 / 5 各 60 抽统计 | 91/75/14 → 73/58/49 |
| T-7 | 键盘 1–3 与点卡等价 | `keyboard.press("2")` | 选中"铁胃"并关闭面板 |
| T-8 | 全程可通关 | 5 间带 2 天赋打到 Boss | `won=true`、无 pageerror |
| T-9 | 上限变化时心数与上限一致 | `__dbg.addTalent('tough')` 后截 HUD | 24/24 显示 6 颗心 |

## U. 敌人与 Boss 扩展（2026-11-20 追加，批 4）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| U-1 | 6 只新怪可生成、四向动画可播 | `__dbg.tex` + 同屏截图 | 16 帧全在，六只同框（`b4-0-foes.png`） |
| U-2 | 蜘蛛网命中减速可采样 | 命中后读 `__dbg.slowNow()` / `__state.slowUntil` | 1483ms，hp −2 |
| U-3 | 毒雾是持续区域 | `__dbg.zonesList()` + 圈内 hp | 半径 54、3s 自毁、圈内掉血 |
| U-4 | 鼹鼠钻地无敌、冒头可打 | 读 `foes()[].ph/inv` | `dive(inv) → emerge → walk → dive`；钻地接触不掉血 |
| U-5 | 骷髅弹转向、撞墙自毁 | 观察 `__state.shots` + 命中 | 命中 −2；`isWall` 时销毁 |
| U-6 | 分裂不无限 | 打死史莱姆读 `foes()` | 1 裂 2，小号不再裂；到 8 停止 |
| U-7 | 四词缀数值正确且可读 | 12 次随机 + `enemyList` | `13/64/5`、`11+盾`、`11`、`11/51/0.7` |
| U-8 | 护盾先破盾 | 连打两次读 `sh/hp` | 首击 hp 不变，次击 −3 |
| U-9 | 蓝武士三招 + 二阶段；青蛙不退化 | 读 `foes()[].ph` | `slashHit` / `summon` / `roar`；青蛙 `windup→lunge→recover` |
| U-10 | 两只 Boss 可打死通关 | `bossHp=None`、`won=true` | 通过 |
| U-11 | 同屏上限 8 | 连刷 12 只 | `enemies=8`，后续 `'cap'` |
| U-12 | 无 pageerror | 全用例监听 | `errs=[]` |

## V. 多角色与主动技能（2026-11-20 追加，批 5）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| V-1 | 三张卡、键盘与鼠标可选 | 选人界面 ←/→、Enter、点卡 | 均生效，高亮跟随 |
| V-2 | 起始属性/武器正确 | `__dbg.char()` | ninja 20/3/96 刀、mage 16/3/90 杖、knight 26/4/84 巨剑 |
| V-3 | 冲刺位移 + 无敌 | `skillState().invuln`、坐标差 | 384→497，invuln 67ms |
| V-4 | 火球穿透 + 爆炸 | 三只排线一发 | 死 2 只，第 3 只受伤 |
| V-5 | 壁垒减伤 + 击退 | 接触前后 hp、敌人坐标 | 320→344；每下 3→2 |
| V-6 | 8s 冷却、冷却中不空放 | 连按 Q 读 `skillState().left` | 只浮"冷却 7s" |
| V-7 | 记住上次角色 | 选骑士后重开 | 默认骑士 |
| V-8 | 三职业清房开门、无报错 | 各杀 1 只 | `enemies=0`、门开、`errs=[]` |

## W. 场景、光照与转场（2026-11-21 追加，批 6）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-1 | 两套皮肤按位置切换 | `jump(0..4)` 读 `__dbg.theme()` | `field×3 → dungeon×2`，Boss 房强制 dungeon |
| W-2 | 地板贴花存在且不挡读图 | 截图 `b6-0/b6-1` | 草地草簇 α0.4、石砖裂纹 α0.55，均压在地面（depth 0.4） |
| W-3 | 暗度过不了 0.35、玩家周围留亮区 | 读 `_vigCfg` + 截图 | dungeon `[0.62,0.2]`、field `[0.72,0.12]` |
| W-4 | HUD/天赋面板仍可读 | `b6-1/b6-4/b6-5` 截图 | 文字可读，四角略暗（已知限制，见 BATCH6 §5） |
| W-5 | 火把/光柱只在石砖房出现且不刺眼 | `fxChild` 计数 + 截图 | 火把 2、光柱 1（仅 dungeon），ADD 混合无高光溢出 |
| W-6 | 灰尘粒子稳定 | `dustCount()` 等 2s 采样 | 5–8（上限 14），关灯 `light(0)` 后停止 |
| W-7 | 过门 120ms 黑场 + 房名横幅 | `b6-4-banner.png` | 黑场淡入中截图，横幅"通道"居中显示、1100ms 后淡出 |
| W-8 | 帧率不降 | 同房间开/关光照各 5s rAF 平均 | 23 / 23，差值 0 |
| W-9 | 无 pageerror | 五间房逐间进入 + 通关 | `errs=[]` |

## X. 大厅、宝石与图鉴（2026-11-21 追加，批 7）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| X-1 | 启动进大厅，三页签可切 | `?reset` 进页面 + 1/2/3 | 武器/角色/图鉴均渲染 |
| X-2 | 宝石来自 Boss 与通关 | `boss('frog')` 击杀读 `__state.gems` | Boss 1–3 + 通关 5 = 6 |
| X-3 | 结算写档 | 通关后读 `na.save` | `gem 55→61` |
| X-4 | 解锁扣费并生效 | 80 宝石买弓、再买法师 | `gem 80→65→35`，两表追加 |
| X-5 | 未解锁武器不进掉落池 | `__dbg.weapons()` | 只有 4 把基础武器 |
| X-6 | 未解锁角色不能出发 | 选人界面选中骑士按 Enter | 浮提示，不切场景 |
| X-7 | 图鉴首次点亮 | 打怪/换武器/进房后读 `seen` | 四类键均出现，未见的显示 `???` |
| X-8 | 无 pageerror | 全流程监听 | `errs=[]` |

## Z. 章节骨架（2026-11-21 追加，批 9）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| Z-1 | 标题 → 大厅 → 世界地图 | `?reset` 后 Enter ×2 | `title→hall→map` |
| Z-2 | 地图键鼠可用 | ↑↓ 换章、←→ 选关、Enter 进、ESC 回小屋、点节点 | 均生效 |
| Z-3 | 章/关解锁按星级拦截 | 一章 5 关未达标时点二章 | 浮提示，不放行 |
| Z-4 | 房数按章、末房 Boss | 一章/熔岩/终章各进一关 | 5 / 10 / 1，末位 boss |
| Z-5 | 章难度乘到怪与 Boss | 读 `__state.stageDiff` | 1.00 / 1.60 / 1.80，熔岩 9 关 2.24 |
| Z-6 | 三星判据与历史最高 | 满血无休整通关、再低分重打 | 首次 3★，重打不回退 |
| Z-7 | v5→v6 迁移不丢字段 | 写入 v5 档后读 `__dbg.save()` | 字段全保留，stars 补空 |
| Z-8 | 结算回地图定位本章本关 | 熔岩 1 关通关后 Enter | 回地图仍选中五章 1 关 |
| Z-9 | 地图信息完整 | 截图与面板文案 | 星数/通关/章面板/中文敌名/隐藏条件数量 |
| Z-10 | 单文件版可走通、无报错 | `web/game.html` 全流程 | `errs=[]` |

## N. 一、二章内容（2026-11-21 追加，批 10）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| N-1 | 两章皮肤肉眼可分 | 同分辨率实机截图对比 | 通过；竹林草地 vs 旧堡暖褐石砖（`docs/screens/b10-1-skins.png`） |
| N-2 | Boss 按章/关从池中抽 | 四个关卡各跳 Boss 房，读 `__state.bossId` | 通过；frog / racoon / samBlue / samRed（`docs/screens/b10-2-bosses.png`） |
| N-3 | 精英/宝箱/机关密度符合章节模板 | `__dbg.plan()` + 逐房 `__dbg.foes()` | 通过；竹林 5 房、旧堡 6 房，房型与数量均与 `MASTERPLAN` 表一致 |
| N-4 | 机关房清怪后仍锁，拉机关才开门 | 清怪 → 查 `doorLocks` → `__dbg.pull()` → 再查 | 通过；锁 `true→false`，`gateOpen/cleared` 同步 |
| N-5 | 两章怪池不串池 | 逐房收集 `kinds` 与本章 `monsters` 比对 | 通过；竹林 4 种、旧堡 5 种，无越池 |
| N-6 | 单文件版数据完整、可走通 | `web/game.html?debug` 起二章、机关房、Boss | 通过；三份数据均在，`errs=[]` |

## 冻结前需补

- 技术栈、内部渲染分辨率、像素风三项确认后，M4 才可写成可执行命令。
- 玩法方向确定后，M2 的「图标」例外范围可能需要放宽到 UI 套件。

## O. 三、四章内容（2026-11-21 追加，批 11）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| O-1 | 两章皮肤肉眼可分 | 同分辨率实机截图对比 | 通过；沙海暖砂褐 + 沙尘 vs 水殿深青蓝 + 冷雾/蓝光柱（`docs/screens/b11-1-desert.png`、`b11-2-water.png`） |
| O-2 | 流沙/水沟压力生效 | `__dbg.pressure()` + 圈内速度乘区 + 位移采样 | 通过；沙漠 2 个流沙圈、圈内 `envSpeed=0.62`、向心吸附；水殿 `waterSlow=0.85`、2 条反向水流 `±34px/s` |
| O-3 | 新怪 anchor 不飘 | 9 张新怪逐只生成、读帧尺寸/缩放、截图检查四向 | 通过；全部 64×64 / 4×4 / 16px 帧、scale 2，四向同一行高；Boss 单尺寸 82×82 / 50×50 |
| O-4 | 四 Boss 按章/关从池中抽 | 三、四章第 1/2 关跳 Boss 房读 `bossId` | 通过；tenguBlue / tenguRed / spirit / demonCyclop |
| O-5 | 两章怪池不串池 | 逐房收集 `__dbg.foes()` 与 `chapters.monsters` 比对 | 通过；沙漠只出 snake/reptile/lizard/mollusc/mouse；水殿只出 fish/octopus/kappa/mollusc/axolot |
| O-6 | 旧区域跨房不残留 | 沙漠战斗房→Boss 房读 `zones`/`waterSlow` | 通过；`zones 2→0`、`waterSlow 0` |
| O-7 | 单文件版数据完整、可走通 | `web/game.html?debug` 起三章，读三份数据与流沙 | 通过；`__chaptersData/__enemiesData/__bossesData` 均在，`zones=2`，`errs=[]` |

## P. 五章熔岩地心（2026-11-21 追加，批 12A）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| P-1 | 10 房关可推进到通关 | 开 GOD，逐房 `clear + next`，读房型/结算 | 通过；battle×4 → elite×2 → treasure → shop → rest → boss，`won=true`、`hp=20`；GOD 只验流程，不代表真实难度 |
| P-2 | 9 关编排一致、难度递进 | 逐关起 `lava`，读 `plan/diff/template` 与首间怪 | 通过；9 关均 10 房、模板一致，diff 1.6→2.24，首间 flam/demon 交替 |
| P-3 | 两只 Boss 可打、按池轮换 | 逐关 `jump('boss')` 读 `bossId`；强制两只读状态机 | 通过；奇数关 flam、偶数关 demonCyclop2；flam `castWindup`、demon2 召唤 2 只 flam |
| P-4 | 5 只新怪有独立行为 | 逐只 `__dbg.newFoe()`，3s 内采样 `shots/phase` | 通过；flam 1 / dragon 3 / lantern 1 / spirit 5 弹；demon 进入 `charge/windup`，无远程弹 |
| P-5 | 灼烧/火雨生效且不残留 | `__dbg.pressure()` + 站圈扣血 + 跳 Boss 房 | 通过；`burn=3, fireRain=2`；圈内 HP 20→18；Boss 房 `burn=0, fireRain=0` |
| P-6 | HUD 不被暗角压、图鉴 25/10 | 熔岩截图 + Hall 全量 `markSeen` 后截图 | 通过；HUD 完整；怪物 25/25、Boss 10/10；Boss 第二行不压武器栏 |
| P-7 | 单文件版数据/字体/图集完整 | `web/game.html` 起熔岩，读 `plan/tex/font` | 通过；1807 KB；5 小怪 frames=16，flamIdle=5，字体 `NinjaPixel` 可用，`errs=[]` |
| P-8 | 火雨相对不掉帧 | 同房间开/关火雨各采样 2.6s | 通过（相对）；`24.3 vs 25.1 fps`，约 −3%，worst 60.6ms vs 47.8ms；绝对 60fps 未在真实 GPU 验证 |

## Q. 终章星火之巅（2026-11-21 追加，批 12B）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| Q-1 | 终章入口正确 | 起 `final` 第 1 关读 `chapter/rooms/plan/theme/boss/pips` | 通过；`final / 1 房 / ['0:boss'] / sky / weaver / 3 幕` |
| Q-2 | 第一幕影袭可复现 | 冻结在 `dashWindup` 截图 | 通过；`fp=1`，Boss/玩家完整入镜（`docs/screens/b12b-1-phase1.png`） |
| Q-3 | 第二幕转场、召唤、环弹 | `bosshp(0.65*max)`，轮询 `fp=2`、`n>=3`、`shots>0` | 通过；约 2.0s `shift` → `hover`；约 2.8s 召 2 影仆；约 3.4s 12 发环弹（`b12b-2-phase2.png`） |
| Q-4 | 第三幕火雨与密集弹 | `bosshp(0.32*max)`，轮询 `fireRain>0` | 通过；`fp=3 / storm`、`fireRain=4`、`shots=17`、`n=5`；4 圈紫粉火雨都在镜头内（`b12b-3-phase3.png`） |
| Q-5 | 真实武器链路不跨幕 | `upg.power=80` 测试配装，近身按实际 `attack()` 挥刀，每幕等 `shift` 结束 | 通过；`hp 194→128→64→0`、`fp 1→2→3→won`；3 刀落在 66%/33% 门槛。高力量只用于缩短验收，不代表平衡 |
| Q-6 | 结局/周目写盘 | 清场后读 `won/save` | 通过；`won=true`、`cycle 1→2`、`wins 0→1`、`gem 8`（`b12b-4-ending.png`） |
| Q-7 | 图鉴 25 怪 / 11 Boss | `markSeen` 全量后 Hall 截图 | 通过；`enemies 25/25`、`bosses 11/11`、`bossRows=11`（`b12b-5-hall.png`） |
| Q-8 | 单文件版可起终章 | `web/game.html?debug` 起 `final`，读数据/字体/Boss | 通过；1817 KB；`__bossesData` 11 条、`NinjaPixel` 可用、`weaver` 三幕；`errs=[]`（`b12b-6-single.png`） |
| Q-9 | 12A 火雨回归 | 起 `lava` 战斗房，强制 `rainOn/fireRainT=0` 调 `updateFireRain` | 通过；`burn=3`，火雨 2 圈，落点均在玩家 ±132 内；`errs=[]` |

## S. 九段剧情 / 六张章节卡 / 终章（2026-11-23 追加，批 15）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| S-1 | 首次开始冒险播序章，结束回 Map | Title `choose()` → `story`，读 `id/next`，跳过 / 读完 | 通过；`prologue / {scene:'map'}`，`seen.prologue=1`，Map `mode=chapters` |
| S-2 | 顺序且只触发一次 | 竹林 / 沙海 / 沉水 / 熔岩逐章打开；同章再开；Hall / Title 二次进入 | 通过；`ch1→ch2→ch3→ch4→ch5` 按 requires；重复不触发 |
| S-3 | 赤武士战后 `ch2` | `play.win()` 读 `overlayBack`，Enter 回 Map | 通过；`{chapterId:'fort',stage:3,story:'ch2'}`，播 `ch2` 后回 Map |
| S-4 | 终章 coda 与结局回小屋 | final `win()` → Enter → Story；读完 4 行 + 3 行 coda | 通过；`next={scene:'hall'}`，结束 active `['hall']`，`ended=true / cycle=2`，无自动 cycle2 |
| S-5 | 后日谈与再燃 | `special:'epilogue'` 结算；Hall `cycle=2 + final + epilogue` | 通过；`epilogue` 播完回 Map；Hall 再进触发 `cycle2`，同次再进不触发 |
| S-6 | 跳过 | `ESC` 序章、`S` ch1 | 通过；都直接回 Map，`seen` 已写，二次进入不重播 |
| S-7 | v9→v10 迁移 | 删除 `story` 的 v9 种子，reload | 通过；`v=10`、`story={seen:{},ended:false}` 立即落盘；序章后 `seen.prologue=1` |
| S-8 | 单文件 | `web/game.html` 1,992,758 B，序章卡 | 通过；9 节点 / 6 卡，`errs=[]` |
| S-9 | 960 / 640 | 6 卡 + 对话框 + coda + Hall + cycle2 | 通过；内部 640×360，960 为 CSS 1.5×；无溢出 |
| S-10 | 返回栈 | 章节卡回 Map 后 `back` 到 Title；final 回 Hall | 通过；`replace()` 同场景不重复压栈 |

| S-11 | Pages 线上入口与剧情 | 线上 Playwright 960×540；`storyData` 9 / 6；序章卡 → 跳过 → Map；final 种子 → `win()` → final 卡 / coda / Hall | 通过；入口 `game.6c0b3f26.js` + `assets.dbc51cb0.js`；`prologue` 跳过写 `seen=1`；final 后 `active=['hall'] / ended=true / cycle=2`；`errs=[]`（`b15-online-*.png`） |

## T. 批 16 元进度：成就 / 第二技能 / 周目词条（2026-11-23 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| T-1 | 20 成就与 v11 | 35 个主线关星级键 / 11 Boss / 220 杀 / noHit / noRest / `sp_` 星 / cycle2 / story ended；Hall 成就页读 `ach` | 通过；20 键全部为 1，标题「成就 20/20」；`save.v=11` |
| T-2 | 成就 toast 与落盘 | 无成就档、cycle2；Play 内 `kills=1` 后 `gameOver()` | 通过；`newAch=['first_blood','cycle2']`，顶部 2 条 toast，`ach` 入档 |
| T-3 | 第二技能计费 | 全角色档 Hall 角色页；`buy('skill2','ninja',25)`；折扣档读价 | 通过；`gem 120→95`、`skills2=['ninja']`；`skillDiscount` 下 25→20 / 35→28 / 45→36 |
| T-4 | X 与三套效果 | `ninja` 按 `X`；`mage` 霜环；`knight` 盾冲路径 | 通过；3 枚苦无；霜环 `hp6→2 / stunT=1200`；盾冲前移 110、路径 `hp7→3 / kb120`；`X 影返 9s` |
| T-5 | 周目词条 | `cycle=2` 起 Play，读 `__state.enemyList` | 通过；首房 4 只中 2 只 `cycleAffix=true`，首个必带；`cycle=1` 为 0 |
| T-6 | 分裂不与词缀串联 | 手工 `split/cycleAffix` 普通怪 `damageFoe(99)` | 通过；裂 2 只，`mini=true / affix=null / cycleAffix=false` |
| T-7 | 960 / 640 | Hall 角色 / 成就、Play X、toast、详情 | 通过；640×360 内部逻辑，底栏与按钮不溢出；960 为 CSS 1.5× |
| T-8 | 单文件 | `web/game.html` 2,006,522 B | 通过；9 剧情节点 / 3 角色 `skill2` / 成就页，`errs=[]` |
| T-9 | v10→v11 | 删除 `ach/skills2` 的 v10 种子，reload + Hall | 通过；`v=11`、字段补齐并立即落盘 |
| T-10 | Pages 线上 20/20 / 购买 / X / toast | 线上 Playwright 960×540，`--no-proxy-server`；预置 20 成就档 → Hall；购买忍者第二技能；`cycle=2` 开 Play 按 `X`；无成就档 `kills=1` 结算 | 通过；`ach` 20 键全部 `1`、标题「成就 20/20」；`gem 120→95 / skills2=['ninja']`；`cycle=2` 首房 3 只带词缀、`X 影返 9s`；`newAch=['first_blood','cycle2']`；`errs=[]`（`b16-online-*.png`） |

证据：`docs/revamp/b16/` 15 张（本地 11 + 线上 4）；详见 `docs/BATCH16-PROGRESSION.md`。

## V. 批 17 工程化：PWA / 移动端 / 首屏预算 / 冒烟（2026-11-23 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| V-1 | PWA manifest 与图标 | 本地 HTTP 请求 `manifest.json`；解析字段 / 图标 | 通过；200 application/json，3 图标，standalone，`Page.getAppManifest` 无 error |
| V-2 | SW 安装与离线 | 首次加载 → `serviceWorker.ready` → 在线 reload → `setOffline(true)` 再 reload | 通过；active / controller、12 条缓存；离线 Title / story 9 / chars 3，`errs=[]` |
| V-3 | 首屏预算 | `npm run build` 求和 + 2 MiB 断言 | 通过；1,905,859 B（1,861 KB / 1.82 MiB），gzip 751 KB |
| V-4 | 触屏动作键 | 844×390 hasTouch；点攻 / Q / X / E / II | 通过；5 键可见，攻触发 `atkAt`，`press=null / stick=false`，Q 冷却 8s，X 未掌握、E 无报错，II 打开暂停 |
| V-5 | 竖屏窄屏 | 390×844 hasTouch；HUD 信息条与按钮 | 通过；内部 360×779，`fitInfo()` 缩放不裁切，5 键在右下可达 |
| V-6 | 桌面回归 | 960×540 / 640×360 无 `hasTouch` | 通过；`touchCtl=false`，键盘 HUD 与批 16 一致，`errs=[]` |
| V-7 | 单文件 | `file:///.../web/game.html?debug=1` | 通过；story 9、chars 3、`touchCtl=false`，`errs=[]` |
| V-8 | 冒烟脚本 | `npm run smoke` | 通过；9 项 PASS，`SMOKE OK` |

| V-9 | Pages 线上 PWA / 移动端 | 线上 Playwright 960×540；manifest、SW scope / 缓存、断网 reload；844×390 hasTouch 点攻 / II | 通过；manifest 200 / 3 图标 / standalone；SW scope `.../game-dev/`、active、controller、`na-b17-af1d3b6e` / 12 条；断网 Title / story 9 / chars 3；`touchCtl=true`、攻 `atkAt`、`press=null / stick=false`、暂停面板；`errs=[]`（`b17-online-*.png`） |

证据：`docs/revamp/b17/` 10 张（本地 7 + 线上 3）；详见 `docs/BATCH17-ENGINEERING.md`。

## W. 批 18 / G2-1 竹林群系与多群系底座（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-1 | 12 屏、6 竹林、2 NPC | 进 world 读 `screens / ids / npcs` | 通过；`field-1..6 + bamboo-1..6`，NPC 村医 / 竹隐，`errs=[]` |
| W-2 | Boss 后真实进竹林 | `boss=done` 种子；站 field-6 右边界按 D | 通过；`screen=bamboo-1 / x=2902.32 / bossActive=false / layer=surface`，HUD `雾 · 第 7/12 屏` |
| W-3 | 竹林摆件 / 地表 | 640 / 960 实机截图 | 通过；石拱门 96×160、两柱可走，竹丛 / 雾竹 / 地表色可读；接缝无黑缝 |
| W-4 | 竹隐委托 | 接 → 采 2 丛 → 交付 | 通过；`active/0 → active/4 → done/0 / tokens 2`，面板与交付对话均出 |
| W-5 | 草原委托回归 | 村医接 → 采 3 丛 → 交付 | 通过；`active/0 → active/6 → done/1 / tokens 1` |
| W-6 | v2→v3 迁移 | v2 种子 reload | 通过；`v=3`，旧屏映射，`bambooHerbs=0 / bambooQuest=none` 即时落盘 |
| W-7 | 窄屏 / 单文件 | 640×360、960×540、844×390 hasTouch、`web/game.html` | 通过；逻辑 640×360、960 CSS 1.5×、844 逻辑 779×360；单文件 12 屏，`errs=[]` |
| W-8 | 构建 / 冒烟 | `npm run build`、`build:single`、`npm run smoke` | 通过；首屏报告 1,882 KB / gzip 767 KB <2 MiB；9 项 PASS |
| W-9 | PWA 缓存 | 本地 SW ready / controller、cache 列表；断网 reload | 通过；`na-b18-fdbd810a` / 12 条；离线 world 可进，`errs=[]` |
| W-10 | Pages 线上 | `https://elijah-lin-dancer.github.io/game-dev/` 线上 Playwright；960×540 / 844×390 | 通过；入口 `game.d2e34f5f.js` + `assets.87a5fab8.js`；12 屏 / 2 NPC；竹林 1 / 4、委托 / 交付、mobile 均通过，`errs=[]`（`g2-online-*.png`） |

证据：`docs/revamp/g2/` 9 张本地截图 + 5 张线上截图 + `docs/revamp/g2-3d/` 9 组源图集 / 对照板；详见 `docs/BATCH18-G2-1.md`。

## W-11～W-20. 批 19 / G2-2 沙漠群系（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-11 | 18 屏、6 沙漠、3 NPC | 进 world 读 `screens / ids / npcs` | 通过；`field-1..6 + bamboo-1..6 + desert-1..6`，NPC 村医 / 竹隐 / 沙婆，`errs=[]` |
| W-12 | 沙漠 6 屏与沙尘 / 晴切换 | 逐屏 `applyScreen` + `weather / dustVeil.alpha` + 960 截图 | 通过；`沙口/枯井/旧门/无旗` dust veil 0.13，`风蚀/流沙` clear veil 0；`g2-desert-1..6-960.png` |
| W-13 | 沙婆委托全流程 | 对话接取 → 采 1 丛 → 5 颗面板 → 交付 | 通过；`active/0 → active/2 → active/5 → done/0 / tokens 2`；面板「沙海拾味 / 5 颗」；`errs=[]` |
| W-14 | 摆件 / 地表 / 素材库 | 960 / 640 实机截图 + 图集尺寸 | 通过；旧门 96×128、枯木、沙棕 48×48、沙枣丛、篝火、16px 沙地；两柱可走 |
| W-15 | 草原 / 竹林委托回归 | 村医 5 株面板 + 竹隐 4 株面板 | 通过；`草药五株 / 5 株`、`雾竹三味 / 4 株`，`errs=[]` |
| W-16 | v3→v4 迁移 | v3 种子 reload，读 `save` 与 `localStorage` | 通过；`v=4`，保留 `herbs=3 / quest=active / bambooHerbs=2 / bambooQuest=active / boss=done / tokens=4`，补 `desertHerbs=0 / desertQuest=none` 并即时落盘 |
| W-17 | 窄屏 / 单文件 | 640×360、960×540、844×390 hasTouch、`web/game.html` | 通过；18 屏 / 3 NPC；单文件 `?world` 可进，`errs=[]`（`g2-desert-single-960.png`、`g2-desert-mobile-844x390.png`） |
| W-18 | 构建 / 冒烟 | `npm run build`、`build:single`、`npm run smoke` | 通过；140 切片 / 198,729 B，首屏 1,891 KB / gzip 772 KB，9 项 PASS；`build:single` 自测 1,998 KB |
| W-19 | PWA 缓存 / 断网 | SW ready / controller；cache 列表；`setOffline(true)` reload | 通过；`na-b18-b0baeb7b` / 12 条；断网仍 18 屏 / 3 NPC，`errs=[]`（`g2-desert-pwa-offline-960.png`） |
| W-20 | Pages 线上 | `https://elijah-lin-dancer.github.io/game-dev/` 线上 Playwright；960×540 / 844×390 | 通过；入口 `game.c6eead2a.js` + `assets.fc823a9d.js`；18 屏 / 3 NPC；`desert-1` / `desert-4` 取景正常；沙婆面板「需要 5 颗沙枣，当前 5 颗」→ 交付 `done/0 / tokens 2`；844×390 布局 18/3，线上 `touchCtl=false`（world 触屏未接，已知限制）；`errs=[]`（`g2-online-desert-*.png`） |

证据：本地 960 六屏 `g2-desert-1..6-960.png`、`g2-desert-dust-960.png`、`g2-desert-quest-960.png`、`g2-desert-done-960.png`、640 两张、移动一张、单文件一张、PWA 一张；线上 `g2-online-desert-1-960.png`、`g2-online-desert-4-960.png`、`g2-online-desert-quest-960.png`、`g2-online-desert-done-960.png`、`g2-online-desert-mobile-844x390.png`；详见 `docs/BATCH19-G2-2.md`。

## W-21～W-30. 批 20 / G2-3 雪原群系与比例基线（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-21 | 24 屏、6 雪原、4 NPC | 进 world 读 `screens / ids / npcs / herbs` | 通过；`field-1..6 + bamboo-1..6 + desert-1..6 + snow-1..6`，NPC 村医 / 竹隐 / 沙婆 / 守灯人；24 屏 / 4 NPC / 51 采集点，`errs=[]` |
| W-22 | 雪原 6 屏与雪 / 晴切换 | 逐屏 `applyScreen` + `weather / snowVeil / snowFall` + 960 截图 | 通过；`雪坳/霜林/破祠/石灯/风口/白原`；`snow-1/2/3/5/6=snow`、`snow-4=clear`；`snowVeil α0.08`、`snowFall=true` |
| W-23 | 守灯人委托全流程 | 对话接取 → 采 1 丛 → 5 盏面板 → 交付 | 通过；`active/0 → active/2 → active/5 → done/0 / tokens 2`；面板「需要 5 盏雪灯，当前 5 盏」；交付对白「雪灯够了。」 |
| W-24 | 比例基线（硬约束） | `python3 tools/audit_scale.py`；树 / 门 / 祠 / NPC / 草药实例 | 通过；106 实例 / 0 FAIL；草原树 2.29–2.97×、竹丛 2.27–3.03×、竹林门 3.38×、沙海门 3.41–3.75×、沙棕约 3.3×、雪松 2.47–3.53×、雪祠 3.37×、NPC 0.94–1.22×、草药 ≤0.8× |
| W-25 | v4→v5 迁移 | v4 18 屏种子 reload，读 `save` 与 `localStorage` | 通过；`v=5 / screens=24 / visited=18`，保留旧字段，补 `snowHerbs=0 / snowQuest=none` 并即时写回 |
| W-26 | 960 / 640 / 844×390 | 三档 Playwright；读 canvas / 布局 | 通过；960×540、640×360、844×390 逻辑 779×360；HUD / 面板无溢出；world 场景仍无触屏（已知限制） |
| W-27 | 单文件 | `web/game.html?world` + `file://` 双击 | 通过；24 屏 / 4 NPC；`__SINGLE__` 守卫不再注册 `./sw.js`，`errs=[]` |
| W-28 | 构建 / 冒烟 | `npm run build`、`npm run build:single`、`npm run smoke` | 通过；143 切片 / 202,244 B；首屏 1901 KB / gzip 778 KB；9 项 PASS；单文件 2,057,162 B |
| W-29 | PWA 缓存 / 断网 | SW ready / controller；cache 列表；`setOffline(true)` reload | 通过；`na-b18-1ff21147` / 12 条；断网仍 24 屏 / 4 NPC，`errs=[]`（`g2-snow-pwa-offline-960.png`） |
| W-30 | Pages 线上 | `https://elijah-lin-dancer.github.io/game-dev/` 线上 Playwright；960×540 / 844×390 | 通过；入口 `game.016492e8.js` + `assets.4021e544.js`；24 屏 / 4 NPC / 雪原 6；`snow-3` 取景正常；守灯人 `active/0 → active/2 → active/5 → done/0 / tokens 2`；PWA `na-b18-1ff21147` / 12 条，断网 24 屏；844×390 逻辑 779×360；`errs=[]`（`g2-online-snow-*.png`） |

证据：雪原六屏 `g2-snow-1..6-960.png`、`g2-snow-3-final-960.png`、640 / 844 / 单文件 / PWA 各一张、`g2-snow-quest-960.png`、`g2-snow-done-960.png`、比例板 `scale-baseline-board.png`、三张群系比例图 `g2-scale-*.png`；源图集 / 15 件总览在 `docs/revamp/g2-3d/`；详见 `docs/BATCH20-G2-3.md`。

## W-31～W-40. 批 21 / G2-4 火山群系与 v6 存档（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-31 | 30 屏、6 火山、5 NPC | 进 world 读 `screens / ids / npcs / herbs` | 通过；`field / bamboo / desert / snow / volcano` 各 6，NPC 村医 / 竹隐 / 沙婆 / 守灯人 / 熔匠；30 屏 / 5 NPC / 65 采集点，`errs=[]` |
| W-32 | 火山 6 屏与落灰 / 晴切换 | 逐屏 `applyScreen` + `weather / ashVeil / ashFall` + 960 截图 | 通过；`焦原/熔河/铁砧/黑曜坡/灰口/火心`；`volcano-3=clear`，其余 `ash`；`ashVeil α0.10`、`ashFall=true` |
| W-33 | 熔匠委托全流程 | 对话接取 → 5 个节点 → 10 枚面板 → 交付 | 通过；`active/0 → 10 枚 → done / 剩余 5 / tokens 2`；面板「需要 5 枚火种，当前 10 枚」；交付对白「火种够了。」 |
| W-34 | 比例基线（硬约束） | `python3 tools/audit_scale.py`；锻炉 / 熔匠 / 火种 / 熔岩 / 尖柱 / 篝火 | 通过；**139 实例 / 0 FAIL**；锻炉 3.59×、熔匠 1.28×、火种 0.73×、熔岩池 0.75–1.20×、尖柱 2.46–3.36×、裂口 0.75–1.22×、篝火 1.04× |
| W-35 | v5→v6 迁移 | v5 24 屏种子 reload，读 `save` 与 `localStorage` | 通过；`v=6 / screens=30 / visited` 保留，`snowQuest=active / tokens=7` 保留，补 `volcanoHerbs=0 / volcanoQuest=none` 并即时落盘 |
| W-36 | 960 / 640 / 844×390 | 三档 Playwright；读 canvas / 布局 | 通过；960×540、640×360、844×390 逻辑 779×360；30 屏 / 5 NPC；HUD / 面板无溢出；world 仍无触屏（已知限制） |
| W-37 | 单文件 | `web/game.html?world` + `file://` 双击 | 通过；30 屏 / 5 NPC / 65 点；`__SINGLE__` 守卫不注册 `./sw.js`，`errs=[]` |
| W-38 | 构建 / 冒烟 | `npm run build`、`npm run build:single`、`npm run smoke` | 通过；148 切片 / 203 KB；首屏 1914 KB / gzip 785 KB；9 项 PASS；单文件 2,072,254 B；`assets.db63aacd.js` + `game.19501372.js` |
| W-39 | PWA 缓存 / 断网 | SW ready / controller；cache 列表；`setOffline(true)` reload | 通过；`na-b18-64a58679` / 12 条；断网仍 30 屏 / 5 NPC，`errs=[]`（`g2-volcano-pwa-960.png`） |
| W-40 | Pages 线上 | `https://elijah-lin-dancer.github.io/game-dev/` 线上 Playwright；960×540 / 844×390 | 通过；入口 `game.19501372.js` + `assets.db63aacd.js`；30 屏 / 5 NPC / 火山 6；`volcano-3` 取景正常；熔匠 `active/0 → 10 枚 → done / 剩余 5 / tokens 2`；PWA `na-b18-64a58679` / 12 条；844×390 布局正常；`errs=[]`（`g2-online-volcano-*.png`） |

证据：火山六屏 `g2-volcano-1..6-960.png`、`g2-volcano-3-final-960.png`、`g2-volcano-npc-960.png`、`g2-volcano-quest-960.png`、`g2-volcano-done-960.png`、640 / 844 / 单文件 / PWA 各一张、`volcano-props-board.png`；详见 `docs/BATCH21-G2-4.md`。

## W-41～W-50. 批 22 / G2-5 火山第二委托、篝火传送与 world 触屏（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-41 | 30 屏 / 5 NPC / 65 采集点 / 5 篝火 / 3 炉眼 | 进 world 读 `screens / npcs / herbs / campfires / quenches` 与 `save.v` | 通过；`save.v=7`，五群系各 6 屏，3 处炉眼为 `vent-jiao / vent-hei / vent-hui`，`errs=[]` |
| W-42 | 第二委托接取 | 种子 `volcanoQuest=done`；熔匠对话 → 接取 | 通过；对白「火稳了，可铁砧还差三口气。」；`volcanoQuest2=none→active`，三处炉眼 `glow.visible=true` |
| W-43 | 三处炉眼淬火 | 焦原 / 黑曜坡 / 灰口逐处按 E | 通过；`volcanoVents=1→2→3`；HUD `炉眼 3 · 可交付 3/3`；提示「三处炉眼已淬 · 回铁砧找赤砧」 |
| W-44 | 第二委托交付 | 回铁砧，面板 stage 2，点击「交付 3 处炉眼」 | 通过；`volcanoQuest2=done`、`tokens 5`、`travelUnlocked=true`；对白「三淬归火。铁砧记住了你的手。」 |
| W-45 | 篝火传送面板 | `volcano-3` 篝火旁按 E；读 `panel.type / rows`；点第一行 | 通过；`type=travel / rows=6`（5 篝火 + 留在原地）；「村口 · 草原」可点；`volcano-3 x=12900 y=288 → field-1 x=344 y=288`，`visited` 保留；未访问行「未点亮」不可点 |
| W-46 | v6→v7 迁移 | v6 种子 reload，读 `save` 与 `localStorage` | 通过；`v=7 / screens=30`，保留 `visited=3 / snowQuest=active / volcanoQuest=done / tokens=7`，补 `volcanoQuest2=none / volcanoVents=[]` 并即时落盘 |
| W-47 | 960 / 640 | 两档 Playwright；960 第二委托 / 淬火 / 面板 / 传送，640 传送面板 | 通过；960×540 与 640×360；HUD / 面板无溢出；640 面板 6 行；banner 已关闭，标签「村口 · 草原」等无重复 |
| W-48 | 844×390 触屏 | `hasTouch=true`；读 `touchCtl.items`、点 E、CDP 拖拽摇杆 | 通过；`touch=true / touchItems=3`；点 E `gathering=true`；拖拽摇杆 `x 240→268 / stick.dx=1`；HUD 触屏文案「摇杆移动 · E 采集 / 交谈 · 攻 攻击 · 返 回小屋」 |
| W-49 | 构建 / 比例 / 冒烟 | `npm run build`、`npm run build:single`、`python3 tools/audit_scale.py`、`npm run smoke` | 通过；**141 实例 / 0 FAIL**；首屏 1927 KB / gzip 788 KB；`game.cdb847c9.js` 323,713 B + `assets.5c5b7a63.js` 123,658 B；单文件 2,085,666 B；9 项 PASS |
| W-50 | 单文件 / PWA / Pages | `file://` 单文件；SW ready → 断网 reload；Pages 线上 960×540 / 844×390 | 通过；单文件 `__SINGLE__=true / 30 屏 / panel=travel`；PWA `na-b18-7a92b9e9` / 12 条断网仍 30 屏 / 5 篝火；Pages 入口 `game.cdb847c9.js` + `assets.5c5b7a63.js`，30/5/65/5/3，q2 `none→active→1/2/3→done / tokens 5`，`volcano-3→field-1`，844 `touchItems=3` 且 E 开传送，PWA 断网 30 屏，`errs=[]` |

证据：本地 `docs/revamp/g2/g2-volcano-quest2-accept-960.png`、`g2-volcano-quench-glow-960.png`、`g2-volcano-quench-960.png`、`g2-volcano-quest2-960.png`、`g2-volcano-quest2-done-960.png`、`g2-travel-960.png`、`g2-travel-field-960.png`、`g2-volcano-3-640.png`、`g2-volcano-touch-844x390.png`、`g2-volcano-touch-joystick-844x390.png`、`g2-volcano-single-960.png`、`g2-volcano-pwa-960.png`；线上 `g2-online-volcano-quest2-accept-960.png`、`g2-online-volcano-quench-960.png`、`g2-online-volcano-quest2-960.png`、`g2-online-volcano-quest2-done-960.png`、`g2-online-travel-960.png`、`g2-online-travel-field-960.png`、`g2-online-touch-844x390.png`、`g2-online-pwa-960.png`；详见 `docs/BATCH22-G2-5.md`。

## W-51～W-61. 批 23 / G3-1 苔背巨兽 3D 重制（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-51 | 专属 Boss 资产 | 读 `assets/01-primary/world/moss-beast-*.png`、`docs/revamp/g3-3d/*.json` | 通过；3 张 384×96 RGBA atlas；源 `art-src/g3/moss-beast.cjs` seed 301；非 Ninja Adventure 二次改色 |
| W-52 | 四向帧序 | 图集逐帧 bbox + 运行时 `bossDirection()`：below / above / left / right | 通过；0 前 / 1 左 / 2 后 / 3 右；实测 `below=0 / above=2 / left=1 / right=3`；左→1 / 右→3 与图集一致 |
| W-53 | 三姿态 | 进入 Boss 屏读 `pose / texture / frame`；截 intro / idle / fight | 通过；`intro=roar (mossBeastRoar) → chase=idle (mossBeastIdle)`；蓄力 `charge`，落地 / 死亡 `roar`；`g3-boss-intro-960.png`、`g3-boss-idle-960.png`、`g3-boss-fight-960.png` |
| W-54 | 入场与 HUD | 960×540 进入 `field-6`；读 banner / world label / boss bar | 通过；banner「苔背巨兽 · 星火守巢者」；Boss 战隐藏世界名标签，顶部不再压 HUD；底栏 `苔背巨兽 64/64` 可读；`x300 / y170`，脚底 origin 锚定，战位 `screen.x+150 / WORLD_Y+240`，阴影贴地 |
| W-55 | 击杀与存档 | 近身 22 × 3 伤；读 `victory / bossDead / save` | 通过；`bossDead=true / save.boss=done / tokens 3 / victory=true`；胜利面板「草原的星火 · 已归位」 |
| W-56 | 失败与重试 | HP 归零 → 失败面板；`retryBoss()` | 通过；`dead=true / panelOpen=true / hp=0`；重试后 `hp=20 / bossHp=64 / state=intro→chase / pose=idle` |
| W-57 | 960 / 640 | 960×540、640×360 截图；读 label / HUD | 通过；640 逻辑 640×360，底栏 Boss 名可见，玩家 / 巨兽分离可读，HUD 血条 / 攻击块无溢出；`g3-boss-640.png` |
| W-58 | 844×390 触屏 | `hasTouch=true`；读 `touchCtl / attackBtn / hudHint` | 通过；`touchItems=3`；桌面攻击块 `visible=false`，只保留右下「攻」；提示「点按「攻」击败苔背巨兽 · 点按「返」回小屋」；`g3-boss-touch-844x390.png` |
| W-59 | 单文件 / PWA | `file://` 单文件；SW controller → `setOffline(true)` reload | 通过；单文件 `field-6 / boss hp64 / mossBeastIdle=true / sw=false`；PWA 断网同屏同 Boss，`errs=[]`；`g3-boss-single-960.png`、`g3-boss-pwa-offline-960.png` |
| W-60 | 构建 / 冒烟 / 比例 | `npm run build`、`npm run build:single`、`npm run smoke`、`python3 tools/audit_scale.py` | 通过；首屏 1943 KB / gzip 801 KB；151 切片 / 216 KB；`game.09389bb4.js` 327,151 B + `assets.5d1e6b5b.js` 123,728 B；单文件 2,106,726 B；9 项 PASS；**144 实例 / 0 FAIL**（Boss idle 2.61× / charge 3.03× / roar 2.54×） |

| W-61 | Pages 线上 | 推送后读入口 hash / 线上截图 | 通过；入口 `game.09389bb4.js` + `assets.5d1e6b5b.js`；Boss `x300 / y170`、`deco=0`、脚底 origin、左向 1；960 / 640 / 844 七张线上截图；击杀 / 失败 / 触屏均通过，`errs=[]`（`g3-online-boss-*.png`） |

证据：`docs/revamp/g3/` 9 张本地 / 单文件 / PWA 截图 + 7 张线上截图，`docs/revamp/g3-3d/moss-beast-board.png`、三套 atlas + json；详见 `docs/BATCH23-G3-1.md`。G3 世界 Boss 仍 1/5，剩余 4 只未做。

## W-62～W-71. 批 23 / G3-2 雾竹蜃 3D 重制与多 Boss 存档（2026-11-24 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-62 | 竹林专属 Boss 资产 | 读 `assets/01-primary/world/bamboo-mirage-*.png`、`docs/revamp/g3-3d/*.json` | 通过；3 张 384×96 RGBA atlas；源 `art-src/g3/bamboo-mirage.cjs` seed 302；正式资产非 Ninja Adventure 改色 |
| W-63 | 四向 / 三姿态 / 脚底 | 图集逐帧 bbox；运行时 `bossDirection()`；读 `pose / dir / originY` | 通过；0 前 / 1 左 / 2 后 / 3 右；`idle / charge / roar` 三姿态脚底均 73/96；玩家在左时 `dir=1`；bbox idle 26×51 / charge 25×45 / roar 26×56（前向） |
| W-64 | 多 Boss 数据 | 读 `world.bosses`、`bossByScreen`、`applyScreen(11)` | 通过；`bosses=[mossBeast,bambooMirage]`；`bossByScreen` 含 `field-6 / bamboo-6`；`bamboo-6` 生成 `bambooMirage / hp72 / dmg5 / reward4 / tex=bambooMirageIdle / scale=1.8` |
| W-65 | `na.world v8` 迁移 | v7 旧档 `{boss:'done',tokens:9}` reload；读 `save / localStorage` | 通过；`v=8`，`boss=done`，`bosses={mossBeast:done,bambooMirage:none}`，`tokens=9`，即时落盘；`field-6` 已击杀档不再生成 Boss，只留纪念光环 |
| W-66 | 扑击 / 真实击杀 | 触发 `startPounce()`；站桩读 HP；24 次真实攻击 | 通过；雾竹蜃 `HP20→15`（落点 48 / 冲击 58）；苔背巨兽回归 `HP20→16`（落点 118 / 冲击 126）；24 次 3 伤 → `bossDead=true / bosses.bambooMirage=done / tokens4 / victory=true` |
| W-67 | 失败 / 重试 / 960 / 640 | HP 归零 → 失败面板；`retryBoss()`；960×540 / 640×360 | 通过；`dead=true / panelOpen=true / hp=0`；重试 `hp20 / bossHp72 / active=true`；两档 HUD / 底栏 Boss 名无溢出；`g3-bamboo-down-960.png`、`g3-bamboo-640.png` |
| W-68 | 844×390 触屏 | `hasTouch=true / isMobile=true`；读 `touchCtl.items / hudHint` | 通过；`touch=true / touchItems=3`；桌面攻击块隐藏；顶部「点按「攻」· 击败雾竹蜃」，底部「点按「攻」击败雾竹蜃 · 点按「返」回小屋」；`g3-bamboo-touch-844x390.png` |
| W-69 | 单文件 / PWA / 构建 / 审计 / 冒烟 | `file://` 单文件；SW controller → `setOffline(true)` reload；`npm run build:single`；`audit_scale.py`；`npm run smoke` | 通过；单文件 `bambooMirage / hp72 / tex=bambooMirageIdle / sw=false`；PWA `na-b18-ba98e423` / 12 条断网仍 `bambooMirage`；首屏 1958 KB / gzip814 KB；154 切片 / 233,083 B；`game.f3072417.js` 330,145 B + `assets.cf099f61.js` 124,157 B；单文件 2,126,381 B；**145 实例 / 0 FAIL**（雾竹蜃 idle 2.98× / charge 2.70× / roar 3.26×）；9 项 PASS |
| W-70 | Pages 线上 | 推送后读入口 hash / 线上截图 | 通过；入口 `game.f3072417.js` + `assets.cf099f61.js`，PWA `na-b18-ba98e423` / 12 条；线上 `applyScreen(11)` 为 `bambooMirage / hp72 / active / scale1.8084 / originY0.7604 / tex=bambooMirageIdle / standoff104 / pounceGap48 / pounceR58`；扑击 `HP20→15`；24 次 3 伤击杀 `hp72→0 / tokens4 / bosses.bambooMirage=done / victory`；640 `scrollWidth=640`；844 `touchCtl=true / touchItems=3`；PWA 断网 `online=false / 30 屏 / bambooMirage / cache 12 条`；`errs=[]`；7 张 `g3-online-bamboo-*` |
| W-71 | 四向转身 / 站定扫视 | 线上 960：`applyScreen(11)` → `startBossFight` 正面；玩家靠近站定，连续读 `dir` / `pose` / `HP` | 通过；`intro` 为 `pose=roar / dir=0 / tex=bambooMirageRoar`；站定 `dir` 序列 `1→2→3→0→1`（`60034 / 61651 / 63284 / 64901`，1.6s/步），HP 保持 20，`errs=[]`；正面 / 左侧 / 背面 / 右侧四向板 + GIF 见 `g3-online-bamboo-turn-board.png` / `.gif`，本地同版见 `g3-bamboo-turn-board.png` / `.gif` |

证据：本地 `docs/revamp/g3/g3-bamboo-intro-960.png`、`g3-bamboo-idle-960.png`、`g3-bamboo-pounce-960.png`、`g3-bamboo-victory-960.png`、`g3-bamboo-down-960.png`、`g3-bamboo-640.png`、`g3-bamboo-touch-844x390.png`、`g3-bamboo-single-960.png`、`g3-bamboo-pwa-offline-960.png`、`g3-bamboo-turn-board.png` / `.gif`；线上 `g3-online-bamboo-intro-960.png`、`g3-online-bamboo-idle-960.png`、`g3-online-bamboo-pounce-960.png`、`g3-online-bamboo-victory-960.png`、`g3-online-bamboo-640.png`、`g3-online-bamboo-touch-844x390.png`、`g3-online-bamboo-pwa-offline-960.png`、`g3-online-bamboo-turn-board.png` / `.gif`；`docs/revamp/g3-3d/bamboo-mirage-board.png`、三套 atlas + json。W-69 / W-70 是 `game.f3072417.js` 基线，W-71 是 `game.4aaa2e55.js` 的四向转身增量；详见 `docs/BATCH23-G3-2.md`。G3 世界 Boss 2/5，沙漠 / 雪原 / 火山三只未做。

## W-72～W-87. 批 23 / G3-3 沙海蜃 3D 重制 + 沙海战场（2026-11-25 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-72 | 沙漠专属 Boss 资产 | 读 `assets/01-primary/world/sand-mirage-*.png`、`docs/revamp/g3-3d/*.json` | 通过；idle / charge / roar 三张 384×96 RGBA atlas（4 帧 96×96）；源 `art-src/g3/sand-mirage.cjs` seed 303；不是 Ninja Adventure 改色，也不是沙神龛 |
| W-73 | 四向 / 三姿态 / 比例 | 图集逐帧 bbox；运行时读 `pose / dir / originY / scale` | 通过；0 前 / 1 左 / 2 后 / 3 右；三姿态脚底均 65/96，`originY=0.6771`；可见高度 idle 79.2px / 2.48×、charge 72.0px / 2.25×、roar 91.2px / 2.85× 玩家 |
| W-74 | 数据 / 沙海战场 | 读 `world.bosses`、`bossByScreen`、`applyScreen(17)`；读 `desert-6` 的 `props / deco / herbs` | 通过；`bosses=[mossBeast,bambooMirage,sandMirage]`；`sandMirage / desert-6 / x300 / y170 / hp80 / dmg5 / reward4 / title=蜃楼守沙者`；`desert-6` `props=12 / deco=12 / battleHerbs=3`（常规委托采集仍 0），沙门 / 枯木 / 沙棕 / 沙蓬 / 沙丘 / 沙岩堆齐全；沙漠常规采集点保持 12，委托 5 颗仍可完成；3 个 battle 沙蓬不计委托 |
| W-75 | `na.world v9` 迁移 | v8 旧档 `{boss:'done',bosses:{mossBeast:done,bambooMirage:none},tokens:9}` reload；读 `save / localStorage` | 通过；读档即 `v=9`，补 `sandMirage:'none'`，`bosses={mossBeast:done,bambooMirage:none,sandMirage:none}`，`tokens=9`；`boss` 兼容别名仍为 done；进入 `desert-6` 后 `visited` 追加 |
| W-76 | 多 Boss 运行时 / 参数 | 读 `BOSS_ART.sandMirage`、`swipeAt` 分派、`mirror`；960 实测 | 通过；`scale2.4 / standoff132 / swipeAt104 / pounceGap92 / pounceR100 / swipeR112 / swipeWarn104`；`updateBoss` 命中改 `dist < (B.art.swipeAt || 104)`；沙海蜃 `mirror=true`，同姿态同朝向、`x+4±2.5`、α0.09–0.135；苔背 / 雾竹仍走 104 回退 |
| W-77 | 站定四向转身 | 960：`applyScreen(17)` → 固定 `nextAt` / 玩家站桩；连续读 `dir / pose / HP` | 通过；`dir 3→0→1→2→3→0→1`，步长约 1.48–1.78s，HP 保持 20，姿态 `idle`；四向板 / GIF `g3-sand-turn-board.png` / `.gif` |
| W-78 | 扑击 / 横扫 / 击杀 / 失败重试 | 站桩触发 `startPounce/startSwipe`；真实 3 伤击杀；HP 归零 → `retryBoss()` | 通过；扑击 `pounceWindup / charge / HP20→15`，回 `chase / idle`；横扫 `swipeWindup / charge / HP20→15`；击杀 `victory=true / bossDead=true / bosses.sandMirage=done / tokens4 / 本体与 mirror 均隐藏`；失败 `dead=true / panelOpen=true`，重试 `hp20 / bossHp80 / active=true` |
| W-79 | 640 / 844 触屏 | 640×360；844×390 `hasTouch=true / isMobile=true`；读 `scrollWidth / canvas / touchCtl` | 通过；640 逻辑 640×360，`scrollWidth=640 / clientWidth=640`；844 逻辑 779×360，`scrollWidth=844`，`touchCtl=true / touchItems=3`，提示「点按「攻」· 击败沙海蜃」；两档 `errs=[]` |
| W-80 | 单文件 / PWA / 构建 / 审计 / 冒烟（新战场） | `file://` 单文件；SW controller → `setOffline(true)` reload；`npm run build` / `build:single` / `smoke` / `audit_scale.py` | 通过；单文件 `__SINGLE__ / desert-6 / sandMirage / mobs3 / props12`；PWA 断网 `online=false / 30 屏 / desert-6 / sandMirage / mobs3 / props12 / controller=true`，`na-b18-798a1cf8` / 12 条；首屏 **1979 KB / gzip 829 KB**；160 切片 / 242 KB；`game.fd249ebf.js` **336,003 B** + `assets.2e6f8f16.js` **125,301 B**；单文件 **2,153,067 B**；9 项 PASS；**160 实例 / 0 FAIL** |
| W-81 | Pages 线上 | 推送后读入口 hash / 线上截图 | 通过；入口 `game.1697e515.js` + `assets.edb3c810.js`，PWA `na-b18-5ce6f0a6` / 12 条；线上 `applyScreen(17)` 为 `sandMirage / hp80 / scale2.4109（呼吸峰值，基准2.4） / originY0.6771 / mirror=true`；站定 `dir 2→3→0→1→2→3→0`（1.50–1.75s/步，HP20）；扑击 `HP20→15`；横扫 `HP20→15`；真实 3 伤击杀 `bossDead=true / bosses.sandMirage=done / tokens4 / 本体与 mirror 隐藏`；640 `scrollWidth=640`；844 `touchCtl=true / touchItems=3`；PWA 断网 `online=false / 30 屏 / desert-6 / sandMirage / hp80 / controller=true`；四组 `errs=[]` |

| W-82 | 沙海战场构成 | 读 `desert-6` props / deco / mobs；960 截图与图集群 | 通过；`props=12`（两沙丘、沙门、枯木、两沙岩堆、沙棕、五沙蓬）、`deco=12`、`mobs=3`；沙海蜃位于其中，不再清场；`g3-field-intro-960.png` / `g3-field-idle-960.png` |
| W-83 | 沙蚋小怪运行 | 960：进入 `desert-6` 读 `mobs`；站桩观察追击 / 咬击；三伤击杀一只；击杀 Boss / 阵亡后读 `mobs` | 通过；3 只 `sandScarab`（`84,214 hp6 / 350,212 hp6 / 210,92 hp7`）；44px/s 追击、近身 `dmg2`；三伤击杀后 `mobs2`；Boss 击杀 / 阵亡后 `mobs0`；小怪不写 `na.world` |
| W-84 | 沙蚋 / 沙岩堆资产 | 读 `assets/01-primary/world/sand-scarab-{idle,skitter}.png`、`sand-rock.png` 与 `docs/revamp/g3-3d/*.json`；图集群逐帧 bbox | 通过；`sand-scarab-idle` / `-skitter` 256×64 四向 4 帧，`sand-rock` 64×64；源 seed 304 / 305；idle 29.7px / 0.93×、skitter 28.4px / 0.89× 玩家；沙岩堆 2.07–2.19×；对照板 `sand-battle-board.png` |
| W-85 | 预警圈可读性 | 960：`startPounce/startSwipe`；读 `warning.depth / fillAlpha / strokeAlpha / r` 并截图 | 通过；扑击 r32、横扫 r104；`depth=38 / fillAlpha=0 / strokeAlpha=0.9`；只描边不填色，压在 Boss 本体之上但 Boss 身体不被红色洗掉；`g3-field-swipe-warning-960.png` / `g3-field-pounce-960.png` |
| W-86 | 新战场回归 | 960 / 640 / 844 / 单文件 / PWA / `smoke` | 通过；960 `props12 / mobs3 / battleHerbs3 / errs=[]`；640 `scrollWidth=640 / canvas640×360`；844 `scrollWidth=844 / canvas779×360 / touchCtl=true / touchItems=3`；单文件 / PWA `mobs3 / props12`；`npm run smoke` 9 项 PASS；`audit_scale.py` 160/0 |
| W-87 | Pages 旧基线 | 推送前读入口 hash；线上 `applyScreen(17)` 读 `props / mobs` | 历史基线；线上仍为旧清场版 `game.1697e515.js` + `assets.edb3c810.js` / PWA `na-b18-5ce6f0a6`；最终新战场部署见 W-95 |

证据：本地 `docs/revamp/g3/g3-sand-turn-d0..d3.png`、`g3-sand-turn-board.png` / `.gif`、`g3-sand-pounce-960.png`、`g3-sand-swipe-960.png`、`g3-sand-victory-960.png`、`g3-sand-down-960.png`、`g3-sand-640.png`、`g3-sand-touch-844x390.png`、`g3-sand-single-960.png`、`g3-sand-pwa-offline-960.png`；`docs/revamp/g3-3d/sand-mirage-board.png`、三套 atlas + json；新战场证据：本地 `docs/revamp/g3/g3-field-board.png`、`docs/revamp/g3/g3-field-intro-960.png`、`g3-field-idle-960.png`、`g3-field-melee-960.png`、`g3-field-pounce-960.png`、`g3-field-swipe-960.png`、`g3-field-swipe-warning-960.png`、`g3-field-victory-960.png`、`g3-field-640.png`、`g3-field-844.png`、`g3-field-single-960.png`、`g3-field-pwa-offline-960.png`；`docs/revamp/g3-3d/sand-battle-board.png`、`sand-scarab-{idle,skitter}.png`、`sand-rock.png` + json。详见 `docs/BATCH23-G3-3.md`。G3 世界 Boss 3/5，雪原 / 火山两只未做。


## W-88～W-95. 批 23 / G3-3 三项全改（2026-11-25 追加）

| 编号 | 判据 | 验证方式 | 结果 |
|---|---|---|---|
| W-88 | battle 沙蓬可采 / 回血 / 重生 | 960 进入 `desert-6`；读 `herbs / battleHerbs`；低血量按 E 采最近节点；强制 `respawnAt` 到期再读 | 通过；3 个 battle 节点 `[132,246,1] / [40,120,1] / [440,280,1]`，均避开 Boss 230px 身体与沙蚋出生点；`hp10→12`、`gathering=false`、`active=false`、`respawnAt≈45000`、Boss 仍 `active`；到期 `active=true / sprite visible / prompt=E 采沙蓬` |
| W-89 | 沙蚋增援 / 首杀心火 / 自动拾取 | 960：首杀一只读 `mobs / loot / mobKills / respawnAt`；HP 未满靠近心火；清空后计时回填 | 通过；首杀 `mobs2 / loot1 / mobKills1 / respawn≈9000`；拾取 `hp10→13 / loot0`；一次清空后 13s `mobs2`、约 15s `mobs3`；3 只重生 `slots [0,1,2]`；Boss 击杀后 `mobs0 / loot0`；首杀必掉 BOSS 战心火，后续 `minionDropChance=0.45` |
| W-90 | Boss 场补沙海 / 去笼线 / 体色 | 960：进入胜利面板读 `edgeHidden / edgeProps`；关闭 `closeVictory` 后读 `edgeHidden / snowVisible`；读 `arenaLine` 不存在；读 `bodyTint` | 通过；胜利阶段 `edgeHidden=30 / edgeProps=7`，右缘无雪原；关闭后 `edgeHidden=0 / snowVisible=25`；`arenaLine` 已删；Boss `bodyTint=0xa68f73`，受击白闪后恢复；玩家 x 夹在 `screen.x+24..+456` |
| W-91 | 960 / 640 / 844 最终回归 | 960×540；640×360；844×390 hasTouch；读 `props / battleHerbs / mobs / scrollWidth / touch` | 通过；960 `props12 / battleHerbs3 / mobs3 / boss=sandMirage / edgeHidden30 / edgeProps7`；640 `scrollWidth=640 / clientWidth=640 / touch=false / mobs3`；844 `scrollWidth=844 / canvas779×360 / touchCtl=true / touchItems=3 / mobs3`；三档 `errs=[]` |
| W-92 | 单文件 / PWA / 最终构建 / 审计 / 冒烟 | `file://` 单文件；SW controller → `setOffline(true)` reload；`npm run build:single`；`audit_scale.py`；`npm run smoke` | 通过；单文件 `__SINGLE__ / desert-6 / sandMirage / props12 / mobs3 / battleHerbs3 / edge30`；PWA `na-b18-b4d4197c` / 12 条，断网 `online=false / 30 屏 / desert-6 / sandMirage / controller=true`；首屏 **1985 KB / gzip830 KB**；**161 切片 / 242 KB**；`game.6d2e3c21.js` **341,765 B** + `assets.815d84ee.js` **125,382 B**；单文件 **2,158,842 B**；9 项 PASS；**161 实例 / 0 FAIL** |
| W-93 | 胜利面板 / 关闭 / 重试路径 | 击杀 Boss 打开胜利面板；`closeVictory` 恢复右邻屏；`retryBoss` 重建补沙海 | 通过；胜利面板阶段 `edgeHidden30 / edgeProps7`，关闭 `hidden0 / snowVisible25`；`retryBoss` 后 `hp20 / bossHp80 / mobs3 / active=true / edgeHidden30`；无残留 `arenaLine` |
| W-94 | 文档 / 截图回填 | 读 `BATCH23-G3-3.md` 第 8 节、`ACCEPTANCE` W88–W95、`CURRENT`、`LEDGER`、`MASTERPLAN`、`OPENWORLD`、`ART_PIPELINE`、`CREDITS` | 通过（提交前回填）；新证据 `docs/revamp/g3/g3-field-board.png`、`g3-field-{intro,herb,loot,respawn,victory,640,844,single,pwa-offline}.png`；3D 对照板 `sand-battle-board.png` 与沙蚋 / 沙岩堆 atlas/json 保持；无旧 `herbs0` 作为最终口径 |
| W-95 | Pages 新战场线上 | 推送后读入口 hash；线上 `applyScreen(17)` 读 `props / battleHerbs / mobs / edge`；线上截图 | 待执行（推送后回填） |

证据：`docs/revamp/g3/g3-field-board.png`、`g3-field-intro-960.png`、`g3-field-herb-960.png`、`g3-field-loot-960.png`、`g3-field-respawn-960.png`、`g3-field-victory-960.png`、`g3-field-640.png`、`g3-field-844.png`、`g3-field-single-960.png`、`g3-field-pwa-offline-960.png`；`docs/revamp/g3-3d/sand-battle-board.png`、`sand-scarab-{idle,skitter}.png/.json`、`sand-rock.png/.json`；详见 `docs/BATCH23-G3-3.md` 第 8 节。
