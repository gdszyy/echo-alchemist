/**
 * 技能数据库
 * 定义所有可用技能及其参数
 */

export const SKILL_DB = [
    {
        id: 'repulsion',
        methodId: 'repulsion',
        name: '重力反轉',
        icon: '🌬️',
        cost: 2,
        color: '#60a5fa',
        desc: '將所有敵人強制向上推回 2 行。',
        params: {
            pushRows: 2,
            visualShake: -20,
            particleColor: '#60a5fa',
            shockwaveColor: '#60a5fa'
        }
    },
    {
        id: 'storm',
        methodId: 'chain_lightning_all',
        name: '以太風暴',
        icon: '⚡',
        cost: 3,
        color: '#c084fc',
        desc: '召喚雷擊命中所有敵人，並觸發連鎖閃電。',
        params: {
            baseDmg: 10,
            roundMult: 5,
            boltColor: '#c084fc',
            flashColor: 'rgba(192, 132, 252, 0.2)'
        }
    },
    {
        id: 'enhance_normal',
        methodId: 'enhance_ammo',
        name: '賢者充能',
        icon: '💎',
        cost: 2,
        color: '#facc15',
        desc: '下一發子彈強化：散射、連射與全屬性提升。',
        params: {
            buffs: {
                damage: 5,
                bounce: 3,
                pierce: 2,
                multicast: 1,
                scatter: 4
            },
            forceExplosive: true,
            forceLaser: false,
            explosionColor: '#facc15',
            floatText: "ENHANCED!"
        }
    },
    {
        id: 'enhance_laser',
        methodId: 'enhance_ammo',
        name: '光之充能',
        icon: '🔦',
        cost: 1,
        color: '#0ea5e9',
        desc: '下一發子彈轉化為高能激光。',
        params: {
            buffs: {
                damage: 5,
                pierce: 8,
                multicast: 2,
                laser: 5
            },
            forceLaser: true,
            forceExplosive: false,
            explosionColor: '#0ea5e9',
            floatText: "LASER READY!"
        }
    }
];

export default SKILL_DB;
