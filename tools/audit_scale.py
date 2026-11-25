"""开放世界素材比例审计：以玩家 32px 可见高度为 1.0。

目标：
- 门 / 祠堂 / 树 / 尖柱：>= 2.2 个玩家；祠堂 / 门优先 >= 2.8。
- 灌木 / 采集物：<= 1.15 个玩家。
- NPC：0.9–1.35 个玩家。
- 篝火：0.7–1.3 个玩家。
输出每个实例的最终可见高度（alpha bbox × world.js PROP_SCALE × p.scale），
任何低于下限的实例会标 FAIL；运行 tools/crop_* 或改 world.js 后重跑。
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PLAYER_H = 32

# 与 src/scenes/world.js 的 PROP_SCALE 保持同步
BASE = {
    'tree': 1.8, 'bush': 0.9, 'bamboo': 1.1, 'bambooGate': 1.0,
    'desertArch': 1.0, 'desertDeadTree': 1.35, 'desertPalm': 1.5,
    'desertRock': 2.5, 'desertScrub': 1.3, 'desertDune': 1.0,
    'campfire': 1.3, 'snowPine': 1.0, 'snowShrine': 1.1,
    'volcanoSpire': 1.2, 'volcanoVent': 2.0, 'volcanoForge': 1.0,
    'volcanoLava': 3.0,
}
# 群系资源点缩放，与 buildHerbs 同步
HERB = {
    'field': ('assets/01-primary/NinjaAdventure/Items/Food/TeaLeaf.png', 1.0),
    'bamboo': ('assets/01-primary/NinjaAdventure/Items/Food/TeaLeaf.png', 1.0),
    'desert': ('assets/01-primary/world/desert-shrub.png', 1.7),
    'snow': ('assets/01-primary/world/snow-lantern.png', 1.3),
    'volcano': ('assets/01-primary/world/volcano-ember.png', 1.3),
}
# NPC 正面帧与缩放，与 QUEST_PROFILE 同步
NPC = {
    'field': ('assets/00-raw/NinjaAdventure/Actor/Characters/Villager2/SeparateAnim/Walk.png', 2.0, (0, 0, 16, 16)),
    'bamboo': ('assets/01-primary/world/bamboo-hermit.png', 0.9, (0, 0, 64, 64)),
    'desert': ('assets/01-primary/world/desert-nomad.png', 0.95, (0, 0, 64, 64)),
    'snow': ('assets/01-primary/world/snow-keeper.png', 0.9, (0, 0, 64, 64)),
    'volcano': ('assets/01-primary/world/volcano-smith.png', 0.95, (0, 0, 64, 64)),
}
BOSS_ART = {
    'mossBeast': {
        'name': '苔背巨兽', 'scale': 2.2,
        'poses': {
            'idle': 'assets/01-primary/world/moss-beast-idle.png',
            'charge': 'assets/01-primary/world/moss-beast-charge.png',
            'roar': 'assets/01-primary/world/moss-beast-roar.png',
        },
    },
    'bambooMirage': {
        'name': '雾竹蜃', 'scale': 1.8,
        'poses': {
            'idle': 'assets/01-primary/world/bamboo-mirage-idle.png',
            'charge': 'assets/01-primary/world/bamboo-mirage-charge.png',
            'roar': 'assets/01-primary/world/bamboo-mirage-roar.png',
        },
    },
    'sandMirage': {
        'name': '沙海蜃', 'scale': 2.4,
        'poses': {
            'idle': 'assets/01-primary/world/sand-mirage-idle.png',
            'charge': 'assets/01-primary/world/sand-mirage-charge.png',
            'roar': 'assets/01-primary/world/sand-mirage-roar.png',
        },
    },
}

MINION_ART = {
    'sandScarab': {
        'name': '沙蚋', 'scale': 1.35, 'fw': 64, 'fh': 64,
        'poses': {
            'idle': 'assets/01-primary/world/sand-scarab-idle.png',
            'skitter': 'assets/01-primary/world/sand-scarab-skitter.png',
        },
    },
}

ASSET = {
    'tree': 'assets/01-primary/world/tree-green.png',
    'bush': 'assets/01-primary/world/bush-green.png',
    'bamboo': 'assets/01-primary/world/bamboo-grove.png',
    'bambooGate': 'assets/01-primary/world/bamboo-gate.png',
    'desertArch': 'assets/01-primary/world/desert-arch.png',
    'desertDeadTree': 'assets/01-primary/world/desert-dead-tree.png',
    'desertPalm': 'assets/01-primary/world/desert-palm.png',
    'desertRock': 'assets/01-primary/world/sand-rock.png',
    'desertScrub': 'assets/01-primary/world/desert-shrub.png',
    'campfire': 'assets/01-primary/external/campfire-16x16.png',
    'snowPine': 'assets/01-primary/world/snow-pine.png',
    'snowShrine': 'assets/01-primary/world/snow-shrine.png',
    'volcanoSpire': 'assets/01-primary/world/volcano-spire.png',
    'volcanoVent': 'assets/01-primary/world/volcano-vent.png',
    'volcanoForge': 'assets/01-primary/world/volcano-forge.png',
    'volcanoLava': 'assets/01-primary/world/volcano-lava.png',
}

def bbox_h(path, crop=None):
    im = Image.open(ROOT / path).convert('RGBA')
    if crop:
        im = im.crop(crop)
    box = im.getbbox()
    return 0 if not box else box[3] - box[1]

def get_prop(kind):
    if kind not in ASSET:
        return None
    return bbox_h(ASSET[kind]) * BASE.get(kind, 1)

def main():
    data = json.loads((ROOT / 'web/data/world.json').read_text())
    fails = []
    rows = []
    for s in data['screens']:
        for prop in s.get('props', []):
            kind, pscale = prop[0], float(prop[3] if len(prop) > 3 else 1)
            h0 = get_prop(kind)
            if h0 is None:
                continue
            h = h0 * pscale
            ratio = h / PLAYER_H
            low = 2.2 if kind in ('tree', 'bamboo', 'bambooGate', 'desertArch', 'desertDeadTree', 'desertPalm', 'snowPine', 'volcanoSpire') else (2.8 if kind in ('snowShrine', 'volcanoForge') else 0)
            high = 1.15 if kind in ('desertScrub',) else (1.3 if kind in ('campfire', 'volcanoLava', 'volcanoVent') else 0)
            if kind == 'desertRock' and ratio < 2.0:
                fails.append(f'{s["id"]} desertRock {ratio:.2f}x < 2.0x')
            if kind == 'campfire' and ratio < 0.7:
                fails.append(f'{s["id"]} campfire {ratio:.2f}x < 0.7x')
            if low and ratio < low:
                fails.append(f'{s["id"]} {kind} {ratio:.2f}x < {low}x')
            if high and ratio > high:
                fails.append(f'{s["id"]} {kind} {ratio:.2f}x > {high}x')
            rows.append((s['id'], kind, round(h, 1), round(ratio, 2)))
        if s.get('npc'):
            biome = s.get('biome', 'field')
            path, scale, crop = NPC[biome]
            h = bbox_h(path, crop) * scale
            ratio = h / PLAYER_H
            if not 0.9 <= ratio <= 1.35:
                fails.append(f'{s["id"]} npc {ratio:.2f}x outside 0.9–1.35')
            rows.append((s['id'], 'npc:' + s['npc']['name'], round(h, 1), round(ratio, 2)))
        if s.get('herbs'):
            biome = s.get('biome', 'field')
            path, scale = HERB[biome]
            h = bbox_h(path) * scale
            ratio = h / PLAYER_H
            if ratio > 1.15:
                fails.append(f'{s["id"]} herb {ratio:.2f}x > 1.15')
            rows.append((s['id'], 'herb:' + biome, round(h, 1), round(ratio, 2)))
    for b in data.get('bosses', []):
        cfg = BOSS_ART.get(b.get('art'))
        if not cfg:
            continue
        for pose, path in cfg['poses'].items():
            im = Image.open(ROOT / path).convert('RGBA')
            widths = []
            heights = []
            for i in range(4):
                box = im.crop((i * 96, 0, (i + 1) * 96, 96)).getbbox()
                if box:
                    heights.append(box[3] - box[1])
                    widths.append(box[2] - box[0])
            h = max(heights) * cfg['scale']
            ratio = h / PLAYER_H
            if not 2.2 <= ratio <= 3.3:
                fails.append(f'{b["screen"]} {cfg["name"]} {pose} {ratio:.2f}x outside 2.2–3.3 (h={h:.1f}, w={max(widths)})')
            rows.append((b['screen'], 'boss:' + cfg['name'] + ':' + pose, round(h, 1), round(ratio, 2)))
    for b in data.get('bosses', []):
        for m in b.get('minions', []):
            cfg = MINION_ART.get(m.get('kind'))
            if not cfg:
                continue
            for pose, path in cfg['poses'].items():
                im = Image.open(ROOT / path).convert('RGBA')
                heights = []
                for i in range(4):
                    box = im.crop((i * cfg['fw'], 0, (i + 1) * cfg['fw'], cfg['fh'])).getbbox()
                    if box:
                        heights.append(box[3] - box[1])
                h = max(heights) * cfg['scale']
                ratio = h / PLAYER_H
                if not 0.65 <= ratio <= 1.15:
                    fails.append(f'{b["screen"]} {cfg["name"]} {pose} {ratio:.2f}x outside 0.65–1.15')
                rows.append((b['screen'], 'minion:' + cfg['name'] + ':' + pose, round(h, 1), round(ratio, 2)))
    print('screen | kind | visible_px | ratio_to_player')
    for row in rows:
        print(' | '.join(map(str, row)))
    print(f'INSTANCES {len(rows)} FAILS {len(fails)}')
    for f in fails:
        print('FAIL', f)
    raise SystemExit(1 if fails else 0)

if __name__ == '__main__':
    main()
