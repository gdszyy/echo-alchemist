/**
 * 配置模块入口
 * 统一导出所有配置
 */

import { BALANCE_CONFIG, GAMEPLAY_CONFIG, PROBABILITIES_CONFIG } from './game.config.js';
import { PHYSICS_CONFIG } from './physics.config.js';
import { COLORS, VISUALS_CONFIG } from './visual.config.js';

// 组合成完整的 CONFIG 对象（兼容原有代码）
export const CONFIG = {
    colors: COLORS,
    physics: PHYSICS_CONFIG,
    balance: BALANCE_CONFIG,
    gameplay: GAMEPLAY_CONFIG,
    probabilities: PROBABILITIES_CONFIG,
    visuals: VISUALS_CONFIG
};

// 单独导出各配置模块
export {
    BALANCE_CONFIG,
    GAMEPLAY_CONFIG,
    PROBABILITIES_CONFIG,
    PHYSICS_CONFIG,
    COLORS,
    VISUALS_CONFIG
};

export default CONFIG;
