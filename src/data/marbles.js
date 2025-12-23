/**
 * 弹珠定义类
 * 定义弹珠类型、属性和收集状态
 */

import { CONFIG } from '../config/index.js';

export class MarbleDefinition {
    /**
     * @param {string} type - 弹珠类型 ('white', 'colored', 'redStripe', 'rainbow', 'matryoshka', 'laser')
     * @param {string} subtype - 子类型 (仅 colored 类型使用)
     */
    constructor(type, subtype) {
        this.type = type;
        this.subtype = subtype;
        this.collected = [];      // 收集到的材料
        this.compiled = false;    // 是否已编译
        this.recipe = null;       // 编译后的配方
        this.session = null;      // 会话数据
    }

    /**
     * 获取弹珠显示名称
     * @returns {string} 名称
     */
    getName() {
        if (this.type === 'white') return '純淨彈珠';
        if (this.type === 'redStripe') return '爆破彈珠';
        if (this.type === 'laser') return '光球';
        if (this.type === 'rainbow') return '七彩稜鏡';
        if (this.type === 'matryoshka') return '套娃彈珠';
        if (this.type === 'colored') {
            const map = {
                'bounce': '彈性',
                'pierce': '穿透',
                'scatter': '散射',
                'damage': '增幅',
                'cryo': '冰霜',
                'pyro': '火焰',
                'lightning': '閃電'
            };
            return `${map[this.subtype]}彈珠`;
        }
        return '未知彈珠';
    }

    /**
     * 获取弹珠颜色
     * @returns {string} 颜色值
     */
    getColor() {
        if (this.type === 'white') return CONFIG.colors.marbleWhite;
        if (this.type === 'redStripe') return CONFIG.colors.marbleRedStripe;
        if (this.type === 'rainbow') return CONFIG.colors.marbleRainbow;
        if (this.type === 'matryoshka') return CONFIG.colors.matMatryoshka;
        if (this.type === 'laser') return CONFIG.colors.laser;
        if (this.type === 'colored') {
            const map = {
                'bounce': CONFIG.colors.matBounce,
                'pierce': CONFIG.colors.matPierce,
                'scatter': CONFIG.colors.matScatter,
                'damage': CONFIG.colors.matDamage,
                'cryo': CONFIG.colors.matCryo,
                'pyro': CONFIG.colors.matPyro,
                'lightning': CONFIG.colors.matLightning
            };
            return map[this.subtype] || CONFIG.colors.marbleWhite;
        }
        return CONFIG.colors.marbleWhite;
    }

    /**
     * 克隆弹珠定义
     * @returns {MarbleDefinition} 新实例
     */
    clone() {
        const copy = new MarbleDefinition(this.type, this.subtype);
        copy.collected = [...this.collected];
        copy.compiled = this.compiled;
        copy.recipe = this.recipe ? { ...this.recipe } : null;
        return copy;
    }
}

/**
 * 弹珠类型映射
 */
export const MARBLE_TYPES = {
    WHITE: 'white',
    COLORED: 'colored',
    RED_STRIPE: 'redStripe',
    RAINBOW: 'rainbow',
    MATRYOSHKA: 'matryoshka',
    LASER: 'laser'
};

/**
 * 弹珠子类型映射
 */
export const MARBLE_SUBTYPES = {
    BOUNCE: 'bounce',
    PIERCE: 'pierce',
    SCATTER: 'scatter',
    DAMAGE: 'damage',
    CRYO: 'cryo',
    PYRO: 'pyro',
    LIGHTNING: 'lightning'
};

export default MarbleDefinition;
