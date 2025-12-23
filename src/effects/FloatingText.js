/**
 * 浮动文字效果类
 * 用于显示伤害数字、状态提示等
 */

export class FloatingText {
    /**
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {string} text - 显示文字
     * @param {string} color - 颜色
     * @param {Object} options - 可选参数
     */
    constructor(x, y, text, color, options = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        
        // 运动参数
        this.vx = options.vx || (Math.random() - 0.5) * 2;
        this.vy = options.vy || -2;
        this.gravity = options.gravity || 0.05;
        
        // 生命周期
        this.life = options.life || 60;
        this.maxLife = this.life;
        
        // 样式
        this.fontSize = options.fontSize || 16;
        this.fontFamily = options.fontFamily || 'Cinzel, serif';
        this.fontWeight = options.fontWeight || 'bold';
        this.outline = options.outline !== false;
        this.outlineColor = options.outlineColor || '#000';
        this.outlineWidth = options.outlineWidth || 2;
        
        // 缩放动画
        this.scale = options.startScale || 1.5;
        this.targetScale = options.targetScale || 1.0;
        this.scaleSpeed = options.scaleSpeed || 0.1;
        
        // 透明度
        this.alpha = 1;
        
        // 是否存活
        this.alive = true;
    }

    /**
     * 更新状态
     */
    update() {
        if (!this.alive) return;
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // 更新缩放
        if (this.scale > this.targetScale) {
            this.scale = Math.max(this.targetScale, this.scale - this.scaleSpeed);
        }
        
        // 更新生命周期
        this.life--;
        
        // 更新透明度 (后半段开始淡出)
        if (this.life < this.maxLife / 2) {
            this.alpha = this.life / (this.maxLife / 2);
        }
        
        // 检查是否死亡
        if (this.life <= 0) {
            this.alive = false;
        }
    }

    /**
     * 绘制文字
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = `${this.fontWeight} ${this.fontSize * this.scale}px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制描边
        if (this.outline) {
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = this.outlineWidth;
            ctx.strokeText(this.text, this.x, this.y);
        }
        
        // 绘制文字
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        
        ctx.restore();
    }
}

/**
 * 浮动文字管理器
 */
export class FloatingTextManager {
    constructor() {
        this.texts = [];
    }

    /**
     * 添加浮动文字
     * @param {FloatingText} text - 浮动文字实例
     */
    add(text) {
        this.texts.push(text);
    }

    /**
     * 创建伤害数字
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {number} damage - 伤害值
     * @param {boolean} isCrit - 是否暴击
     */
    showDamage(x, y, damage, isCrit = false) {
        const color = isCrit ? '#ff4444' : '#ffffff';
        const fontSize = isCrit ? 24 : 16;
        
        this.add(new FloatingText(x, y, `-${damage}`, color, {
            fontSize,
            startScale: isCrit ? 2.0 : 1.5
        }));
    }

    /**
     * 创建状态提示
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {string} text - 提示文字
     * @param {string} color - 颜色
     */
    showStatus(x, y, text, color = '#facc15') {
        this.add(new FloatingText(x, y, text, color, {
            fontSize: 14,
            life: 45
        }));
    }

    /**
     * 更新所有浮动文字
     */
    update() {
        this.texts = this.texts.filter(t => {
            t.update();
            return t.alive;
        });
    }

    /**
     * 绘制所有浮动文字
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        this.texts.forEach(t => t.draw(ctx));
    }

    /**
     * 清空所有浮动文字
     */
    clear() {
        this.texts = [];
    }
}

export default FloatingText;
