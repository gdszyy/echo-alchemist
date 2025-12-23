/**
 * 遗物数据库
 * 定义所有可获取的遗物及其效果
 */

export const RELIC_DB = [
    {
        id: 'dimension_shard',
        name: '維度碎片',
        icon: '🌌',
        desc: '收集階段：釘板高度延伸，額外增加 2 行釘子。',
        rarity: 'rare',
        effect: 'row_count_up',
        maxStacks: 1
    },
    {
        id: 'unlock_giant',
        name: '巨人藥劑',
        icon: '💪',
        desc: '收集階段：解鎖 [變大槽]，彈珠巨大化並增加碰撞體積。',
        rarity: 'common',
        effect: 'unlock_slot',
        slotType: 'giant',
        maxStacks: 1
    },
    {
        id: 'optical_lens',
        name: '聚焦透鏡',
        icon: '🔭',
        desc: '解鎖 [光球]：發射瞬間穿透的折射光束。',
        rarity: 'legendary',
        unlocks: 'laser',
        boost: 10,
        maxStacks: 1
    },
    {
        id: 'pink_slime',
        name: '粉紅凝膠',
        icon: '💗',
        desc: '收集階段：出現 3 個高彈性粉色釘子 (可疊加)。',
        rarity: 'common',
        effect: 'pink_peg_up',
        maxStacks: 1
    },
    {
        id: 'energy_shield',
        name: '力場護盾',
        icon: '🛡️',
        desc: '戰鬥階段：底部邊界可消耗彈性/穿透次數來反彈子彈。',
        rarity: 'rare',
        effect: 'combat_wall',
        maxStacks: 1
    },
    {
        id: 'unlock_recall',
        name: '時光沙漏',
        icon: '⏳',
        desc: '收集階段：解鎖 [回溯槽] 的出現 (若無槽位則+1)。',
        rarity: 'rare',
        effect: 'unlock_slot',
        slotType: 'recall',
        maxStacks: 1
    },
    {
        id: 'unlock_multicast',
        name: '雙子魔鏡',
        icon: '♊',
        desc: '收集階段：解鎖 [連射槽] 的出現 (若無槽位則+1)。',
        rarity: 'rare',
        effect: 'unlock_slot',
        slotType: 'multicast',
        maxStacks: 1
    },
    {
        id: 'unlock_split',
        name: '裂變核心',
        icon: '☢️',
        desc: '收集階段：解鎖 [分裂槽] 的出現 (若無槽位則+1)。',
        rarity: 'rare',
        effect: 'unlock_slot',
        slotType: 'split',
        maxStacks: 1
    },
    {
        id: 'slot_expander',
        name: '空間鑿子',
        icon: '🔨',
        desc: '收集階段：特殊槽出現數量 +1。',
        rarity: 'common',
        effect: 'slot_count_up',
        maxStacks: 1
    },
    {
        id: 'cryo_stone',
        name: '永恆凍土',
        icon: '❄️',
        desc: '解鎖 [冰霜] 屬性 (彈珠與釘子)。',
        rarity: 'rare',
        unlocks: 'cryo',
        boost: 15,
        maxStacks: 1
    },
    {
        id: 'pyro_stone',
        name: '不滅火種',
        icon: '🔥',
        desc: '解鎖 [火焰] 屬性 (彈珠與釘子)。',
        rarity: 'rare',
        unlocks: 'pyro',
        boost: 15,
        maxStacks: 1
    },
    {
        id: 'tactical_kit_pierce',
        name: '穿透補給',
        icon: '↗',
        desc: '解鎖 [穿透] 屬性。',
        rarity: 'common',
        unlocks: ['pierce'],
        boost: 5,
        maxStacks: 1
    },
    {
        id: 'tactical_kit_scatter',
        name: '散射補給',
        icon: '🔱',
        desc: '解鎖 [散射] 屬性。',
        rarity: 'common',
        unlocks: ['scatter'],
        boost: 5,
        maxStacks: 1
    },
    {
        id: 'tactical_kit_damage',
        name: '增幅補給',
        icon: '⚔️',
        desc: '解鎖 [增幅] 屬性。',
        rarity: 'common',
        unlocks: ['damage'],
        boost: 5,
        maxStacks: 1
    },
    {
        id: 'explosive_ammo',
        name: '高爆火藥',
        icon: '🧨',
        desc: '解鎖 [爆破彈珠] 出現，且獲得一顆。',
        rarity: 'rare',
        unlocks: 'redStripe',
        boost: 10,
        maxStacks: 1
    },
    {
        id: 'prism_shard',
        name: '七彩稜鏡',
        icon: '🌈',
        desc: '解鎖 [彩虹彈珠] 出現，且獲得一顆。',
        rarity: 'legendary',
        unlocks: 'rainbow',
        boost: 5,
        maxStacks: 1
    },
    {
        id: 'russian_doll',
        name: '俄羅斯套娃',
        icon: '🪆',
        desc: '解鎖 [套娃彈珠]，子彈消失時會發射下一顆子彈。',
        rarity: 'legendary',
        unlocks: 'matryoshka',
        boost: 5,
        maxStacks: 1
    }
];

export default RELIC_DB;
