/**
 * 火焰波效果类
 * 用于火焰技能的视觉效果
 */

/**
 * 火焰波 - 扩散的火焰环效果
 */
export class FireWave {
    /**
     * @param {number} x - 火焰波中心 x 坐标
     * @param {number} y - 火焰波中心 y 坐标
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 80; // 擴散範圍
        this.life = 1.0;
    }

    /**
     * 更新火焰波状态
     * @param {number} timeScale - 时间缩放因子
     */
    update(timeScale) {
        this.radius += 5 * timeScale; // 擴散速度
        this.life -= 0.05 * timeScale;
    }

    /**
     * 绘制火焰波
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        // 使用 lighter 混合模式讓火焰看起來更亮
        ctx.globalCompositeOperation = 'lighter'; 
        
        const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.6, this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(255, 200, 0, 0)`); // 中心透明
        grad.addColorStop(0.5, `rgba(249, 115, 22, ${this.life * 0.8})`); // 橙色火焰
        grad.addColorStop(1, `rgba(255, 0, 0, 0)`); // 邊緣透明

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export default FireWave;
