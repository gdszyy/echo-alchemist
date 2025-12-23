/**
 * 分裂孢子类
 * 用于敌人分裂技能的投射物
 */

import { Vec2 } from '../core/Vec2.js';

/**
 * 分裂孢子 - 抛物线飞行的孢子投射物
 */
export class CloneSpore {
    /**
     * @param {number} startX - 起始 x 坐标
     * @param {number} startY - 起始 y 坐标
     * @param {number} targetX - 目标 x 坐标
     * @param {number} targetY - 目标 y 坐标
     * @param {Function} onLandCallback - 落地回调函数
     */
    constructor(startX, startY, targetX, targetY, onLandCallback) {
        this.start = new Vec2(startX, startY);
        this.end = new Vec2(targetX, targetY);
        this.pos = new Vec2(startX, startY);
        this.onLand = onLandCallback;
        
        this.progress = 0;
        this.speed = 0.05; // 動畫速度
        this.arcHeight = 100; // 拋物線高度
        this.active = true;
    }

    /**
     * 更新孢子状态
     * @param {number} timeScale - 时间缩放因子
     * @param {Object} game - 游戏实例 (用于创建爆炸效果)
     * @param {Object} audio - 音频管理器
     */
    update(timeScale, game, audio) {
        this.progress += this.speed * timeScale;
        
        if (this.progress >= 1) {
            this.progress = 1;
            this.active = false;
            this.onLand(); // 落地，呼叫回調生成敵人
            if (game && game.createExplosion) {
                game.createExplosion(this.end.x, this.end.y, '#a855f7'); // 落地特效
            }
            if (audio && audio.playPowerup) {
                audio.playPowerup();
            }
        }

        // 線性插值計算水平位置
        const tx = this.start.x + (this.end.x - this.start.x) * this.progress;
        // 線性插值垂直位置
        const tyBase = this.start.y + (this.end.y - this.start.y) * this.progress;
        // 加上拋物線偏移 (sin(0~PI) * height)
        const arc = Math.sin(this.progress * Math.PI) * this.arcHeight;
        
        this.pos.x = tx;
        this.pos.y = tyBase - arc; // 向上拋
    }

    /**
     * 绘制孢子
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.progress * Math.PI * 4); // 旋轉效果
        
        // 繪製孢子
        ctx.fillStyle = '#d8b4fe';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(2, -2, 2, 0, Math.PI * 2); // 高光
        ctx.stroke();
        
        ctx.restore();
    }
}

export default CloneSpore;
