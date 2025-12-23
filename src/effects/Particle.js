/**
 * 粒子效果类
 * 用于各种视觉特效
 */

import { Vec2 } from '../core/Vec2.js';

export class Particle {
    /**
     * @param {number} x - 起始 x 坐标
     * @param {number} y - 起始 y 坐标
     * @param {string} color - 颜色
     * @param {Object} options - 可选参数
     */
    constructor(x, y, color, options = {}) {
        this.pos = new Vec2(x, y);
        this.color = color;
        
        // 速度 (带随机性)
        const speed = options.speed || 3;
        const angle = options.angle !== undefined 
            ? options.angle 
            : Math.random() * Math.PI * 2;
        const speedVar = options.speedVariance || 0.5;
        const actualSpeed = speed * (1 - speedVar + Math.random() * speedVar * 2);
        
        this.vel = new Vec2(
            Math.cos(angle) * actualSpeed,
            Math.sin(angle) * actualSpeed
        );
        
        // 生命周期
        this.life = options.life || 30;
        this.maxLife = this.life;
        
        // 尺寸
        this.size = options.size || 3;
        this.sizeDecay = options.sizeDecay !== false;
        
        // 重力
        this.gravity = options.gravity || 0.1;
        
        // 摩擦力
        this.friction = options.friction || 0.98;
        
        // 形状
        this.shape = options.shape || 'circle'; // 'circle', 'square', 'star'
        
        // 透明度
        this.alpha = 1;
        this.alphaDecay = options.alphaDecay !== false;
        
        // 旋转 (用于非圆形粒子)
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        
        // 是否存活
        this.alive = true;
    }

    /**
     * 更新粒子状态
     */
    update() {
        if (!this.alive) return;
        
        // 应用速度
        this.pos = this.pos.add(this.vel);
        
        // 应用重力
        this.vel.y += this.gravity;
        
        // 应用摩擦力
        this.vel = this.vel.mult(this.friction);
        
        // 更新旋转
        this.rotation += this.rotationSpeed;
        
        // 更新生命周期
        this.life--;
        
        // 更新透明度
        if (this.alphaDecay) {
            this.alpha = this.life / this.maxLife;
        }
        
        // 更新尺寸
        if (this.sizeDecay) {
            this.size = this.size * (this.life / this.maxLife);
        }
        
        // 检查是否死亡
        if (this.life <= 0 || this.size < 0.1) {
            this.alive = false;
        }
    }

    /**
     * 绘制粒子
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        
        switch (this.shape) {
            case 'square':
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
            case 'star':
                this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
                break;
            case 'circle':
            default:
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }

    /**
     * 绘制星形
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * 粒子系统管理器
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * 添加粒子
     * @param {Particle} particle - 粒子实例
     */
    add(particle) {
        this.particles.push(particle);
    }

    /**
     * 创建爆炸效果
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {string} color - 颜色
     * @param {number} count - 粒子数量
     */
    explode(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.add(new Particle(x, y, color, {
                speed: 2 + Math.random() * 3,
                life: 20 + Math.random() * 20,
                size: 2 + Math.random() * 3
            }));
        }
    }

    /**
     * 更新所有粒子
     */
    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return p.alive;
        });
    }

    /**
     * 绘制所有粒子
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    /**
     * 清空所有粒子
     */
    clear() {
        this.particles = [];
    }
}

export default Particle;
