/**
 * 物理引擎配置
 * 包含重力、弹性、摩擦力等物理参数
 */

export const PHYSICS_CONFIG = {
    gravity: 0.30,           // 重力加速度
    friction: 0.99,          // 空气阻力
    elasticity: 0.82,        // 墙壁/钉子反弹系数
    marbleRadius: 7.7,       // 【收集阶段】弹珠半径
    bulletRadius: 11,        // 【战斗阶段】弹丸半径
    bulletCopyRadius: 8,     // 【战斗阶段】复制/散射弹丸半径
    pinkpegElasticityMuti: 2.2  // 粉色钉子弹性倍率
};
