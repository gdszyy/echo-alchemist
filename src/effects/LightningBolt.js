/**
 * 闪电效果类
 * 用于闪电链攻击视觉效果
 */

export class LightningBolt {
    /**
     * @param {number} x1 - 起点 x 坐标
     * @param {number} y1 - 起点 y 坐标
     * @param {number} x2 - 终点 x 坐标
     * @param {number} y2 - 终点 y 坐标
     * @param {Object} options - 可选参数
     */
    constructor(x1, y1, x2, y2, options = {}) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        
        // 颜色
        this.color = options.color || '#c084fc';
        this.glowColor = options.glowColor || this.color;
        
        // 生命周期
        this.life = options.life || 15;
        this.maxLife = this.life;
        
        // 闪电分支数
        this.segments = options.segments || 8;
        
        // 抖动幅度
        this.jitter = options.jitter || 15;
        
        // 线宽
        this.lineWidth = options.lineWidth || 3;
        
        // 生成闪电路径
        this.points = this.generatePath();
        
        // 是否存活
        this.alive = true;
    }

    /**
     * 生成闪电路径
     * @returns {Array} 路径点数组
     */
    generatePath() {
        const points = [];
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            let x = this.x1 + dx * t;
            let y = this.y1 + dy * t;
            
            // 添加随机偏移 (首尾不偏移)
            if (i > 0 && i < this.segments) {
                const perpX = -dy;
                const perpY = dx;
                const len = Math.sqrt(perpX * perpX + perpY * perpY);
                const offset = (Math.random() - 0.5) * this.jitter;
                x += (perpX / len) * offset;
                y += (perpY / len) * offset;
            }
            
            points.push({ x, y });
        }
        
        return points;
    }

    /**
     * 更新状态
     */
    update() {
        if (!this.alive) return;
        
        this.life--;
        
        // 每帧重新生成路径 (闪烁效果)
        if (this.life > 0 && Math.random() > 0.5) {
            this.points = this.generatePath();
        }
        
        if (this.life <= 0) {
            this.alive = false;
        }
    }

    /**
     * 绘制闪电
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.alive || this.points.length < 2) return;
        
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 绘制光晕
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = this.lineWidth * 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.glowColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        
        // 绘制核心
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.lineWidth;
        ctx.shadowBlur = 0;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 闪电效果管理器
 */
export class LightningManager {
    constructor() {
        this.bolts = [];
    }

    /**
     * 添加闪电
     * @param {LightningBolt} bolt - 闪电实例
     */
    add(bolt) {
        this.bolts.push(bolt);
    }

    /**
     * 创建闪电链
     * @param {Array} targets - 目标点数组 [{x, y}, ...]
     * @param {Object} options - 可选参数
     */
    chain(targets, options = {}) {
        for (let i = 0; i < targets.length - 1; i++) {
            this.add(new LightningBolt(
                targets[i].x, targets[i].y,
                targets[i + 1].x, targets[i + 1].y,
                options
            ));
        }
    }

    /**
     * 更新所有闪电
     */
    update() {
        this.bolts = this.bolts.filter(b => {
            b.update();
            return b.alive;
        });
    }

    /**
     * 绘制所有闪电
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        this.bolts.forEach(b => b.draw(ctx));
    }

    /**
     * 清空所有闪电
     */
    clear() {
        this.bolts = [];
    }
}

export default LightningBolt;
