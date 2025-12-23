/**
 * 冲击波效果类
 * 用于爆炸和碰撞时的视觉反馈
 */

/**
 * 冲击波 - 扩散的圆形波纹效果
 */
export class Shockwave {
    /**
     * @param {number} x - 冲击波中心 x 坐标
     * @param {number} y - 冲击波中心 y 坐标
     * @param {string} color - 颜色 (默认白色)
     */
    constructor(x, y, color) { 
        this.x = x; 
        this.y = y; 
        this.radius = 1; 
        this.alpha = 1.0; 
        this.color = color || '#ffffff'; 
        this.maxRadius = 120; // 稍微加大一点爆炸范围视觉
    }

    /**
     * 更新冲击波状态
     * @param {number} timeScale - 时间缩放因子
     */
    update(timeScale) { 
        this.radius += 4 * timeScale; // 扩散速度
        this.alpha -= 0.04 * timeScale; // 消失速度
    }

    /**
     * 绘制冲击波
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) { 
        if (this.alpha <= 0) return; 
        ctx.save(); 
        
        // --- 核心修改：让波纹发光 ---
        ctx.globalCompositeOperation = 'lighter'; 
        ctx.globalAlpha = this.alpha;
        
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        
        // 1. 填充部 (很淡)
        ctx.fillStyle = this.color; 
        ctx.globalAlpha = this.alpha * 0.2; 
        ctx.fill();

        // 2. 高亮边缘 (冲击波本体)
        ctx.globalAlpha = this.alpha; 
        ctx.strokeStyle = this.color; 
        ctx.lineWidth = 4; // 稍微加粗
        ctx.stroke(); 
        
        // 3. 内部的一圈细线 (增加层次感)
        if (this.radius > 10) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.lineWidth = 1;
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.stroke();
        }
        
        ctx.restore(); 
    }
}

export default Shockwave;
