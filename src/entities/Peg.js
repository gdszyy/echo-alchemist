/**
 * 钉子类
 * 弹珠碰撞的障碍物，可附带特殊效果
 */

import { Vec2 } from '../core/Vec2.js';
import { CONFIG } from '../config/index.js';

export class Peg {
    /**
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {string} type - 钉子类型 ('normal', 'bounce', 'pierce', 'scatter', 'damage', 'cryo', 'pyro', 'lightning', 'pink')
     */
    constructor(x, y, type = 'normal') {
        this.pos = new Vec2(x, y);
        this.radius = 6;
        this.type = type;
        this.lit = false;
        this.litTimer = 0;
        this.cooldown = 0;
        
        // 缩放动画属性
        this.scale = 1.0;
        this.lightIntensity = 0;
        this.lightAngle = 0;
    }

    /**
     * 绘制阴影
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {Vec2} lightPos - 光源位置
     * @param {number} lightRadius - 光源半径
     */
    drawShadow(ctx, lightPos, lightRadius) {
        const dx = this.pos.x - lightPos.x;
        const dy = this.pos.y - lightPos.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq > lightRadius * lightRadius * 4) return;
        
        const dist = Math.sqrt(distSq);
        const shadowLength = Math.min(20, (lightRadius / (dist + 1)) * 15);
        const angle = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.pos.x + Math.cos(angle) * shadowLength * 0.5,
            this.pos.y + Math.sin(angle) * shadowLength * 0.5,
            this.radius * 0.8,
            shadowLength * 0.5,
            angle,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }

    /**
     * 更新钉子状态
     */
    update() {
        if (this.lit) {
            this.litTimer--;
            if (this.litTimer <= 0) {
                this.lit = false;
            }
        }
        
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        
        // 缩放动画恢复
        if (this.scale > 1.0) {
            this.scale = Math.max(1.0, this.scale - 0.05);
        }
        
        // 光照强度衰减
        if (this.lightIntensity > 0) {
            this.lightIntensity = Math.max(0, this.lightIntensity - 0.05);
        }
    }

    /**
     * 绘制钉子
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        ctx.save();
        
        // 获取颜色
        let color = CONFIG.colors.peg;
        if (this.type === 'bounce') color = CONFIG.colors.matBounce;
        else if (this.type === 'pierce') color = CONFIG.colors.matPierce;
        else if (this.type === 'scatter') color = CONFIG.colors.matScatter;
        else if (this.type === 'damage') color = CONFIG.colors.matDamage;
        else if (this.type === 'cryo') color = CONFIG.colors.matCryo;
        else if (this.type === 'pyro') color = CONFIG.colors.matPyro;
        else if (this.type === 'lightning') color = CONFIG.colors.matLightning;
        else if (this.type === 'pink') color = CONFIG.colors.pegPink;
        
        if (this.lit) {
            color = CONFIG.colors.pegActive;
        }
        
        // 光晕效果
        if (this.lit || this.lightIntensity > 0) {
            const glowIntensity = this.lit ? 15 : this.lightIntensity * 15;
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = color;
        }
        
        // 绘制钉子
        const r = this.radius * this.scale;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // 高光
        ctx.beginPath();
        ctx.arc(this.pos.x - r * 0.3, this.pos.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * 触发点亮效果
     * @param {number} duration - 持续帧数
     */
    light(duration = 30) {
        this.lit = true;
        this.litTimer = duration;
        this.scale = 1.3;
        this.lightIntensity = 1.0;
    }

    /**
     * 检测与球的碰撞
     * @param {Vec2} ballPos - 球的位置
     * @param {number} ballRadius - 球的半径
     * @returns {boolean} 是否碰撞
     */
    checkCollision(ballPos, ballRadius) {
        if (this.cooldown > 0) return false;
        const dist = this.pos.dist(ballPos);
        return dist < this.radius + ballRadius;
    }
}

export default Peg;
