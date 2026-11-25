/* G3 沙漠 Boss 场小怪：沙蚋 / Sand Scarab
 * 3D 像素离线源。沙海蜃脚边的低阶沙虫，四向 × idle / skitter。
 * 设计：低伏沙壳、玻璃质背脊、青焰眼、两枚短颚钳、六只细腿；
 * 不作 Boss 换色，也不抢沙海蜃的宽帆轮廓。
 */
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'g3-sand-scarab', name: '沙蚋', seed: 304,
  build(seed, pose = 'idle') {
    const P = [
      0x050505, 0x0c0b08, 0x15130d, 0x1e1b12, 0x2a2517, 0x39321f,
      0x4a4028, 0x5e5032, 0x776540, 0x917d51, 0xb09a69, 0xd1bb86,
      0xe8d6a7, 0x2a2016, 0x5a3d25,
      0x17534f, 0x2a8177, 0x4cc3a5, 0x92ffd0,
      0x9a6b35, 0xc99348, 0xf1c56b,
      0x742b26, 0xa94233,
    ];
    const B = makeBuilder(seed, P);
    const S = K.sculpt(makeSculpt(B));
    const sandDark = { r: [3, 4] };
    const sandMid = { r: [5, 6] };
    const sandLight = { r: [8, 9] };
    const sandPale = { r: [10, 11] };
    const bone = { r: [11, 12] };
    const glass = { r: [13, 14] };
    const glassLight = { r: [15, 16] };
    const tealDark = { r: [17, 18] };
    const teal = { r: [18, 19], em: true };
    const gold = { r: [20, 21] };
    const goldLight = { r: [22] };
    const dark = { r: [0, 1] };
    const skitter = pose === 'skitter';

    const bodyY = skitter ? 0.55 : 0.60;
    const bodyZ = 0;
    const stride = skitter ? 0.16 : 0;

    // 低伏的沙壳主躯干：扁、宽、短，侧面像一枚砂石甲片。
    S.ball([0, bodyY, bodyZ], [0.62, 0.26, 0.78], sandMid, { res: 0.030, rd: 0.06 });
    S.ball([0, bodyY + 0.13, bodyZ - 0.10], [0.54, 0.16, 0.62], sandLight, { res: 0.022, rd: 0.04 });
    S.ball([0, bodyY - 0.13, bodyZ + 0.04], [0.54, 0.12, 0.64], sandDark, { res: 0.020, rd: 0.04 });

    // 沙玻璃背脊 + 三段覆瓦：远看是一条亮线，近看有节。
    for (let i = 0; i < 3; i += 1) {
      const z = -0.24 + i * 0.24;
      S.box([0, bodyY + 0.26, bodyZ + z], [0.12 + i * 0.015, 0.055, 0.20], i === 1 ? glassLight : glass, { res: 0.006, rd: 0.01 });
      S.box([0, bodyY + 0.30, bodyZ + z], [0.055, 0.025, 0.12], teal, { res: 0.004 });
    }

    // 头：短楔形沙壳，两枚青焰眼窝；头部略低于背脊，显得贴地。
    const headY = bodyY - 0.02;
    const headZ = bodyZ + 0.58;
    S.ball([0, headY, headZ], [0.32, 0.20, 0.28], sandLight, { res: 0.020, rd: 0.04 });
    S.box([0, headY - 0.08, headZ + 0.16], [0.28, 0.10, 0.16], sandDark, { res: 0.008, rd: 0.02 });
    for (const sx of [-1, 1]) {
      S.ball([sx * 0.16, headY + 0.06, headZ + 0.20], [0.10, 0.10, 0.08], tealDark, { res: 0.008 });
      S.box([sx * 0.16, headY + 0.10, headZ + 0.24], [0.055, 0.045, 0.035], teal, { res: 0.004 });
      S.box([sx * 0.16, headY + 0.14, headZ + 0.24], [0.020, 0.016, 0.015], { r: [12], em: true }, { res: 0.002 });
      // 短颚钳：从颊侧向前，给正 / 侧面一个虫口剪影。
      S.tube([
        [sx * 0.24, headY - 0.06, headZ + 0.18],
        [sx * 0.38, headY - 0.10, headZ + 0.36],
        [sx * 0.30, headY - 0.16, headZ + 0.52],
      ], 0.050, 0.014, bone, { res: 0.006 });
      // 触角：极细，避免小体积下变成一团噪点。
      S.tube([[sx * 0.10, headY + 0.16, headZ + 0.24], [sx * 0.22, headY + 0.28, headZ + 0.44]], 0.022, 0.006, sandPale, { res: 0.004 });
    }

    // 六只细腿：三对，腿节外翻；skitter 时前后错开，形成“爬”的帧差。
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i += 1) {
        const z0 = -0.42 + i * 0.36;
        const phase = skitter ? (i % 2 ? stride : -stride) : 0;
        const hip = [sx * 0.42, bodyY - 0.02, bodyZ + z0];
        const knee = [sx * 0.62, bodyY - 0.24, bodyZ + z0 + phase * 0.6];
        const foot = [sx * 0.66, 0.12, bodyZ + z0 + 0.10 + phase];
        S.tube([hip, knee, foot], 0.055, 0.018, sandDark, { res: 0.006 });
        S.box([foot[0] + sx * 0.02, 0.055, foot[2]], [0.12, 0.035, 0.08], glassLight, { res: 0.004 });
      }
    }

    // 腹部与沙尘：只在脚踝高度，避免与地面投影混在一起。
    S.box([0, 0.10, bodyZ + 0.18], [0.44, 0.018, 0.48], tealDark, { res: 0.006 });
    S.box([0, 0.12, bodyZ + 0.18], [0.22, 0.012, 0.30], teal, { res: 0.004 });

    // 沙壳上的金色沙尘点：两三颗，给 1x 一个亮点。
    for (const [x, y, z] of [[-0.40, bodyY + 0.12, 0.12], [0.36, bodyY + 0.08, -0.20], [0.10, bodyY + 0.24, 0.34]]) {
      S.ball([x, y, z], [0.028, 0.018, 0.026], goldLight, { res: 0.003 });
    }

    S.bake();
    return B.finish({
      cam: { target: [0, 0.52, 0], dist: 4.6, pitch: 0.12, yaw: 0.04 },
      detail: 20, dither: 0.14, radius: 3,
    });
  },
});
