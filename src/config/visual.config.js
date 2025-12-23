/**
 * 视觉效果配置
 * 包含颜色、尺寸、光效等视觉参数
 */

export const COLORS = {
    laser: '#0ea5e9',      // 天蓝色
    bg: '#0f172a',
    peg: '#475569',
    pegActive: '#cbd5e1',
    pegPink: '#f472b6',
    matBase: '#3b82f6',
    matBounce: '#22c55e',
    matPierce: '#ef4444',
    matScatter: '#facc15',
    matDamage: '#a855f7',
    matCryo: '#06b6d4',
    matPyro: '#f97316',
    matLightning: '#c084fc',
    marbleWhite: '#f8fafc',
    matMatryoshka: '#d946ef',
    marbleRedStripe: '#fca5a5',
    marbleRainbow: 'linear-gradient(135deg, #fca5a5, #facc15, #4ade80, #60a5fa)',
    enemy: '#eeeeee',
    enemyHit: '#d8b4fe',
    enemyFrozen: '#06b6d4',
    enemyOverheat: '#f97316',
    enemyShield: '#3b82f6',
    slotRecall: '#a855f7',
    slotMulticast: '#f97316',
    slotSplit: '#3b82f6',
    slotGiant: '#ef4444',    // 红色 (变大)
    slotSkill: '#10b981'     // 绿色 (技能点)
};

export const VISUALS_CONFIG = {
    baseRadius: 7,           // 基础半径

    // 尺寸动态影响
    damageGrowth: 0.4,       // 每 1 点伤害增加多少半径像素
    maxSizeBonus: 5,         // 伤害导致的半径增加上限

    // 类型缩放倍率
    copyScale: 0.6,          // 复制/散射子弹的缩放比例
    explosiveScale: 1.15,    // 爆炸子弹的放大倍率
    arrowScale: 0.9,         // 穿透(箭头)形状的视觉修正

    // 特效强度
    glowBase: 10,            // 基础光晕模糊度
    glowPerDamage: 1.5,      // 每点伤害增加的光晕
    maxGlow: 30              // 最大光晕限制
};
