/**
 * 能量球效果类
 * 用于材料收集时飞向UI的视觉效果
 */

import { Vec2 } from '../core/Vec2.js';

/**
 * 能量球 - 带拖尾的飞行能量球
 */
export class EnergyOrb {
    /**
     * @param {number} x - 起始 x 坐标
     * @param {number} y - 起始 y 坐标
     * @param {number} targetX - 目标 UI x 坐标
     * @param {number} targetY - 目标 UI y 坐标
     * @param {string} color - 颜色
     * @param {Vec2} initialVel - 弹珠碰撞时的初速度
     * @param {Function} onArrive - 到达回调
     */
    constructor(x, y, targetX, targetY, color, initialVel, onArrive) {
        this.pos = new Vec2(x, y);
        this.target = new Vec2(targetX, targetY);
        this.onArrive = onArrive;
        this.color = color || '#fbbf24';

        // 物理参数
        let burstVel = new Vec2(initialVel.x * 4.2, initialVel.y * 0.72);
        const spreadAngle = (Math.random() - 0.5) * 0.6;
        this.vel = burstVel.rotate(spreadAngle);
        
        if (this.vel.mag() < 3) {
            this.vel = this.vel.norm().mult(3);
        }

        this.active = true;
        
        // --- 优化：减少拖尾长度 ---
        this.trail = []; 
        this.maxTrailLen = 8; // 原来是12，减少到8，降低绘制循环次数

        this.baseSize = 2.5; 
        this.timer = 0;
        this.seed = Math.random() * 100;

        this.hoverTime = 20;     
        this.friction = 0.88;    
        this.floatForce = 0.21;  
        this.suctionAcc = 0.07;  
        this.currentSuction = 0; 
    }

    /**
     * 更新能量球状态
     * @param {number} timeScale - 时间缩放因子
     */
    update(timeScale) {
        if (!this.active) return;
        this.timer += timeScale;

        // 1. 滞空阻力
        this.vel = this.vel.mult(Math.pow(this.friction, timeScale));
        // 2. 上浮力
        this.vel.y -= this.floatForce * timeScale;

        // 3. 吸附逻辑
        if (this.timer > this.hoverTime) {
            let dir = this.target.sub(this.pos);
            const dist = dir.mag();

            if (dist < 20) { 
                this.active = false;
                if (this.onArrive) this.onArrive();
                return;
            }

            dir = dir.norm();
            this.currentSuction += this.suctionAcc * timeScale;
            this.vel = this.vel.add(dir.mult(this.currentSuction * timeScale));
        }

        this.pos = this.pos.add(this.vel.mult(timeScale));

        // 更新拖尾 (只存简单的 x,y 对象，减少 Vec2 开销)
        this.trail.push({x: this.pos.x, y: this.pos.y});
        if (this.trail.length > this.maxTrailLen) this.trail.shift(); 
    }

    /**
     * 绘制能量球
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        
        // 关键优化：使用 lighter 混合模式代替阴影来实现发光
        // 这比 shadowBlur 快得多
        ctx.globalCompositeOperation = 'lighter'; 

        // ------------------------------------
        // 1. 绘制极简拖尾
        // ------------------------------------
        if (this.trail.length > 2) {
            // 优化：不再分段绘制不同宽度，而是画一条连贯的线
            ctx.beginPath();
            const len = this.trail.length;
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            
            // 使用二次贝塞尔曲线让拖尾更平滑（可选，这里用直线够快了）
            for (let i = 1; i < len; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }

            ctx.lineCap = 'round';
            ctx.lineWidth = this.baseSize; 
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.3; // 低透明度
            
            // 彻底移除循环内的 shadow 设置
            ctx.shadowBlur = 0; 
            ctx.stroke();
        }

        // ------------------------------------
        // 2. 绘制核心 (无渐变优化版)
        // ------------------------------------
        
        // 计算闪烁
        const flicker = 0.8 + Math.sin(this.timer * 0.5 + this.seed) * 0.2;
        
        // 绘制外发光 (用半透明实心圆代替渐变)
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4; // 降低透明度模拟光晕
        // 大小随闪烁变化
        ctx.arc(this.pos.x, this.pos.y, this.baseSize * 2.5 * flicker, 0, Math.PI * 2);
        ctx.fill();

        // 绘制核心亮点
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.arc(this.pos.x, this.pos.y, this.baseSize * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export default EnergyOrb;
