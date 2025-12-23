/**
 * 游戏平衡性配置
 * 包含敌人数值、概率、词缀等核心游戏参数
 */

export const BALANCE_CONFIG = {
    // 敌人血量 = baseHp + (当前回合数 * hpPerRound)
    enemyBaseHp: 2,
    enemyHpPerRound: 7,

    // 特殊敌人血量倍率
    eliteHpMult: 12,     // 精英怪是普通怪的多少倍
    bossHpMult: 42,      // Boss是普通怪的多少倍

    // 敌人生成概率
    spawnProb: 0.6,      // 普通格子生成敌人的概率
    eliteChance: 0.15,   // (回合>2时) 尝试生成精英的概率
    bossChance: 0.05,    // (回合>5且触发精英时) 升级为Boss的概率
    advanceWaveMuti: 2,

    // 词缀概率
    affixBaseChance: 0.05,    // 基础词缀概率
    affixRoundGrowth: 0.05,   // 每回合增加的词缀概率

    // 伤害系数
    cloneSpawnRate: 0.2,          // "分身"词缀触发概率
    shieldDmgReduct: 0.5,         // "护盾"词缀受到的伤害倍率
    unusedAmmoScoreMult: 1.5,     // 剩余每颗子弹让分数乘多少
    nextRoundDifficultyMult: 12,  // 触发此机制后，下一轮敌人血量乘多少
    cryoAmount: 1,
    pyroAmount: 1,
    lightningTempIncrease: 3,

    // 遗物稀有度权重
    relicRarityWeight: {
        'common': 60,
        'rare': 30,
        'legendary': 10,
        'cursed': 5
    },

    // 词缀详细参数
    affixes: {
        shieldReduction: 0.5,   // 护盾减伤 50%
        hasteActions: 2,        // 极速行动次数
        regenPercent: 0.1,      // 再生回血百分比
        cloneChanceHit: 0.2,    // 受击分身概率
        cloneChanceTurn: 0.2,   // 回合开始分身概率
        berserkChanceMult: 0.5, // 狂暴概率系数
        healerPercent: 0.1,     // 治疗百分比
        healerRange: 1.5,       // 治疗范围
        devourChance: 0.5,      // 吞噬触发概率
        devourRange: 1.2,       // 吞噬范围
        jumpRows: 2             // 跳跃距离
    }
};

export const GAMEPLAY_CONFIG = {
    enemyShowTimeFrames: 72,
    relicChoiceNum: 4,
    enemyCols: 6,
    cols: 10,            // 网格列数
    rows: 6,             // 钉子行数
    startRows: 4,        // 初始生成的敌人行数
    spawnMin: 3,         // 每波最少生成的敌人数量
    selectionCount: 6,   // 选卡阶段提供多少张卡
    selectionReq: 3,     // 需要选择多少张卡
    hitCooldowns: 42,
    relicChance: 0.1,
    initTriggerThreshold: 12,
    nextTriggerThresholdIncrease: 5,
    spSlotsStartRow: 3,
    spSlotsEndRow: 8,
    fireSpreadDamagePercent: 0.25,
    fireSpreadTempIncrease: 50,
    fireSpreadRadius: 100,
    relicRoundInterval: 3,  // 固定回合遗物事件

    // 同化概率
    assimilationChance: {
        bounce: 0.25,
        pierce: 0.1,
        scatter: 0.05,
        damage: 0.2,
        cryo: 0.2,
        pyro: 0.2
    }
};

export const PROBABILITIES_CONFIG = {
    white: 150,       // 基础
    bounce: 25,       // 初始解锁
    laser: 0,
    // 物理系 (初始锁定)
    pierce: 1,
    scatter: 1,
    damage: 2,
    // 元素系 (初始锁定)
    cryo: 0,
    pyro: 0,
    // 特殊系 (初始锁定)
    redStripe: 1,
    rainbow: 0,
    matryoshka: 0
};
