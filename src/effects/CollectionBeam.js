/**
 * 收集光束效果类
 * 用于材料收集时的视觉反馈
 */

import { lerp } from '../core/utils.js';

/**
 * 收集光束 - 向上延伸的光柱效果
 */
export class CollectionBeam {
    /**
     * @param {number} x - 光束 x 坐标
     * @param {number} bottomY - 光束底部 y 坐标
     */
    constructor(x, bottomY) {
        this.x = x;
        this.bottomY = bottomY;
        this.width = 60; // 光柱宽度
        this.life = 1.0;
        this.decay = 0.04;
        this.height = 0;
        this.maxHeight = bottomY + 100; // 向上延伸的高度
    }

    /**
     * 更新光束状态
     * @param {number} timeScale - 时间缩放因子
     */
    update(timeScale) {
        this.life -= this.decay * timeScale;
        // 光柱快速冲高
        this.height = lerp(this.height, this.maxHeight, 0.2 * timeScale);
    }

    /**
     * 绘制光束
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // 1. 核心光柱 (向上渐变消失)
        const grad = ctx.createLinearGradient(this.x, this.bottomY, this.x, this.bottomY - this.height);
        grad.addColorStop(0, `rgba(255, 255, 255, ${this.life})`);
        grad.addColorStop(0.4, `rgba(14, 165, 233, ${this.life * 0.5})`); // Sky Blue
        grad.addColorStop(1, `rgba(14, 165, 233, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        // 梯形光柱 (底部窄，上部宽)
        const wBottom = this.width * 0.4;
        const wTop = this.width;
        
        ctx.moveTo(this.x - wBottom, this.bottomY);
        ctx.lineTo(this.x + wBottom, this.bottomY);
        ctx.lineTo(this.x + wTop, this.bottomY - this.height);
        ctx.lineTo(this.x - wTop, this.bottomY - this.height);
        ctx.fill();

        // 2. 底部爆发光晕
        const glowSize = 40 * this.life;
        const radial = ctx.createRadialGradient(this.x, this.bottomY, 0, this.x, this.bottomY, glowSize);
        radial.addColorStop(0, `rgba(255, 255, 255, ${this.life})`);
        radial.addColorStop(1, `rgba(14, 165, 233, 0)`);
        
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(this.x, this.bottomY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export default CollectionBeam;
