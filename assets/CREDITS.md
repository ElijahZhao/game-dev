# 素材登记表

字段：`名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径`

规则：
- 每件素材入库时必须新增一行，"原始 LICENSE 路径" 指向 `assets/00-raw/<包名>/` 内的协议原文。
- 只写核验过的值；未核验写 `[待核]`。
- 既有行不改不删，更正另起一行并标注 `更正 #行号`。

## 当前状态

主美术 Ninja Adventure 素材包**已落地**：原始包 `assets/00-raw/NinjaAdventure/`（不入 git），美术子集 `assets/01-primary/NinjaAdventure/`（入 git）。清点见 `docs/ASSET-INVENTORY.md`。

| 名称 | 作者 | 协议 | 来源 URL | 是否需署名 | 署名模板 | 原始 LICENSE 路径 |
|---|---|---|---|---|---|---|
| Ninja Adventure - Asset Pack | Pixel-Boy / AAA | CC0 1.0（已核对全文） | https://github.com/MarioLDD/Kuroshiro-adventure （转存，原始页 https://pixel-boy.itch.io/ninja-adventure-asset-pack ） | 否（作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | `assets/00-raw/NinjaAdventure/LICENSE.txt` |

| 16x16 Animated Campfire（篝火 4 帧） | krial | CC0 1.0（站点许可页核验） | https://opengameart.org/content/16x16-animated-campfire | 否（CC0） | `Campfire by krial — https://opengameart.org/content/16x16-animated-campfire` | `assets/01-primary/external/`（站点许可页，无随包 LICENSE 文件） |

| Fusion Pixel 12px Mono zh-Hans（子集改名 NinjaPixel） | TakWolf | OFL 1.1（已随文件入库） | https://github.com/TakWolf/fusion-pixel-font （release 2026.11.10） | 是（OFL 要求保留协议；已改名，未使用保留字体名） | `Font: Fusion Pixel Font by TakWolf — https://github.com/TakWolf/fusion-pixel-font (SIL OFL 1.1)` | `assets/01-primary/fonts/OFL.txt` |

| 归途小屋 3D 像素件（引路人 / 铁匠 / 商人 / 铁砧 / 木桩） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/hub/ink-studio-LICENSE.txt` |
| 归途 G2-1 竹林 / G2 后备群系 3D 像素摆件（竹丛 / 石门 / 竹隐 / 沙海旧门 / 枯沙木 / 雪松 / 雪中小祠 / 黑曜尖柱 / 熔岩裂口） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G2-2 沙漠 3D 像素（沙婆 / 沙枣丛） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| NinjaAdventure - TilesetDesert 沙棕切片 / TilesetField 16px 沙地改色 | Pixel-Boy / AAA | CC0 1.0（原包 LICENSE 全文） | https://github.com/MarioLDD/Kuroshiro-adventure （转存；原始页 https://pixel-boy.itch.io/ninja-adventure-asset-pack ） | 否（CC0；作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | `assets/00-raw/NinjaAdventure/LICENSE.txt` |

| 归途 G2-3 雪原 / 完整沙棕 3D 像素（雪松 / 雪中小祠 / 守灯人 阿霁 / 雪灯草 / 完整沙棕） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G2-3 雪地 16px 调色（snow-tile） | Pixel-Boy / AAA | CC0 1.0（原包 LICENSE 全文） | https://github.com/MarioLDD/Kuroshiro-adventure （转存；原始页 https://pixel-boy.itch.io/ninja-adventure-asset-pack ） | 否（CC0；作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | `assets/00-raw/NinjaAdventure/LICENSE.txt` |
| 归途 G3-1 世界 Boss 苔背巨兽 3D 像素（96×96 四向 × 待机 / 蓄力 / 咆哮） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G3-2 世界 Boss 雾竹蜃 3D 像素（96×96 四向 × 待机 / 蓄力 / 咆哮） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G3-3 沙海战场小怪 / 石景 3D 像素（沙蚋 64×64 四向 × idle/skitter；沙岩堆 64×64） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G3-3 世界 Boss 沙海蜃 3D 像素（96×96 四向 × 待机 / 蓄力 / 咆哮） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G2-4 火山 3D 像素（熔岩锻炉 / 熔匠 赤砧 / 火种 / 熔岩池；黑曜尖柱 / 熔岩裂口重导） | Elijah-Lin-Dancer（本项目）；生成工具 siliconjungle | 成品自制；工具 MIT（已随包保留） | https://github.com/siliconjungle/shapeshift-labs-ink-studio | 否（工具 MIT；成品版权归本项目） | `3D pixel assets generated with siliconjungle/shapeshift-labs-ink-studio (MIT)` | `assets/01-primary/world/ink-studio-LICENSE.txt` |
| 归途 G2-4 火山地 16px 调色（volcano-tile） | Pixel-Boy / AAA | CC0 1.0（原包 LICENSE 全文） | https://github.com/MarioLDD/Kuroshiro-adventure （转存；原始页 https://pixel-boy.itch.io/ninja-adventure-asset-pack ） | 否（CC0；作者希望保留主页链接） | `Assets by Pixel-Boy — https://pixel-boy.itch.io/ninja-adventure-asset-pack` | `assets/00-raw/NinjaAdventure/LICENSE.txt` |

更正（G2-3）：`desert-palm.png` 已从 G2-2 的 `TilesetDesert` 48×48 树冠切片替换为 ink-studio 生成的 64×96 完整树；上表 `TilesetDesert 沙棕切片` 行仅保留为 G2-2 历史记录。雪松 / 雪中小祠的源文件未变，正式尺寸由 64×96 / 64×80 改为 96×128；运行时与来源仍为 ink-studio 生成。

更正（G2-5）：本轮 **0 新增美术件**。`field-1` / `bamboo-4` 新增的两个篝火落点复用既有 **krial CC0** `16x16 Animated Campfire`；三处炉眼复用 G2-4 的 `volcanoVent`，火种复用 `volcanoEmber`，均为 **ink-studio 生成 / G2 后备件重导**。16px 地形仍为 NinjaAdventure CC0 调色。未新增源文件，未改变授权。

## 鸣谢页生成

把「是否需署名」为「是」的行，取「署名模板」列拼成一段文本，直接用于游戏的关于页。

已知模板：

- game-icons.net：`Icons made by {作者}. Available on https://game-icons.net`
- Incompetech：`"{曲名}" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0`
