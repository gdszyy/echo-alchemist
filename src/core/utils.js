/**
 * 通用工具函数
 */

/**
 * 显示短暂的提示信息
 * @param {string} msg - 提示信息内容
 */
export function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerText = msg;
    el.classList.add('toast-visible');
    setTimeout(() => el.classList.remove('toast-visible'), 1500);
}

/**
 * 调整颜色亮度
 * @param {string} hex - 十六进制颜色值
 * @param {number} factor - 亮度因子 (>1 变亮, <1 变暗)
 * @returns {string} 调整后的颜色
 */
export function adjustColorBrightness(hex, factor) {
    // 移除 # 前缀
    hex = hex.replace(/^#/, '');
    
    // 解析 RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // 调整亮度
    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));
    
    // 返回新颜色
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 颜色插值
 * @param {string} a - 起始颜色 (hex)
 * @param {string} b - 结束颜色 (hex)
 * @param {number} amount - 插值量 (0-1)
 * @returns {string} 插值后的颜色
 */
export function lerpColor(a, b, amount) {
    const ah = parseInt(a.replace(/#/g, ''), 16);
    const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
    
    const bh = parseInt(b.replace(/#/g, ''), 16);
    const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
    
    const rr = ar + amount * (br - ar);
    const rg = ag + amount * (bg - ag);
    const rb = ab + amount * (bb - ab);
    
    return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb))
        .toString(16).slice(1);
}

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} t - 插值量 (0-1)
 * @returns {number} 插值结果
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 限制数值在范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 生成随机整数
 * @param {number} min - 最小值 (包含)
 * @param {number} max - 最大值 (包含)
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 从数组中随机选择一个元素
 * @param {Array} arr - 数组
 * @returns {*} 随机元素
 */
export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 洗牌算法 (Fisher-Yates)
 * @param {Array} arr - 数组
 * @returns {Array} 打乱后的数组
 */
export function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}
