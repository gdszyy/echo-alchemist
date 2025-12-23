/**
 * 激光光束效果类
 * 用于激光技能的视觉效果
 */

/**
 * 激光光束 - 多段折线的发光效果
 */
export class LaserBeam {
    /**
     * @param {Array} segments - 路径点数组 (Vec2 对象数组)
     * @param {number} width - 光束宽度
     * @param {string} color - 光束颜色
     */
    constructor(segments, width, color) {
        this.segments = segments; // Array of Vec2 points [start, p1, p2, end]
        this.width = width;
        this.initialWidth = width;
        this.color = color;
        this.life = 1.0; 
        this.decay = 0.04; // 消失速度
    }

    /**
     * 更新光束状态
     * @param {number} timeScale - 时间缩放因子
     */
    update(timeScale) {
        this.life -= this.decay * timeScale;
    }

    /**
     * 绘制光束
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // 使用 lighter 让叠加部分更亮
        ctx.globalCompositeOperation = 'lighter';
        
        const currentWidth = this.initialWidth * this.life;
        const opacity = Math.pow(this.life, 0.5); // 非线性透明度

        // 1. 外发光 (宽且淡)
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = currentWidth * 2.5;
        ctx.globalAlpha = opacity * 0.3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // 2. 核心光束 (窄且亮)
        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);
        for (let i = 1; i < this.segments.length; i++) {
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }
        ctx.strokeStyle = '#ffffff'; // 核心总是白色
        ctx.lineWidth = currentWidth;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
    }
}

export default LaserBeam;
