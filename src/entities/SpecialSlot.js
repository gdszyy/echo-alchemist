/**
 * 特殊槽位类
 * 底部收集槽，触发特殊效果
 */

import { CONFIG } from '../config/index.js';

export class SpecialSlot {
    /**
     * @param {number} x - 中心 x 坐标
     * @param {number} y - 中心 y 坐标
     * @param {number} width - 槽位宽度
     * @param {string} type - 槽位类型 ('recall', 'multicast', 'split', 'giant', 'skill_point', 'relic')
     */
    constructor(x, y, width, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 12;
        this.type = type;
        this.animTimer = 0;
        this.hit = false;
    }

    /**
     * 绘制槽位
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (this.hit) return;
        
        this.animTimer += 0.05;
        ctx.save();
        
        let color = '#fff';
        let text = '';
        
        switch (this.type) {
            case 'recall':
                color = CONFIG.colors.slotRecall;
                text = "↺";
                break;
            case 'multicast':
                color = CONFIG.colors.slotMulticast;
                text = "+2";
                break;
            case 'split':
                color = CONFIG.colors.slotSplit;
                text = "⑂";
                break;
            case 'relic':
                color = '#facc15';
                text = '🏆';
                break;
            case 'giant':
                color = CONFIG.colors.slotGiant;
                text = "⬆️";
                break;
            case 'skill_point':
                color = CONFIG.colors.slotSkill;
                text = "★";
                break;
        }
        
        const glow = Math.sin(this.animTimer) * 5 + 10;
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(text, this.x, this.y);
        
        ctx.restore();
    }

    /**
     * 检测碰撞
     * @param {number} ballX - 球的 x 坐标
     * @param {number} ballY - 球的 y 坐标
     * @param {number} ballRadius - 球的半径
     * @returns {boolean} 是否碰撞
     */
    checkCollision(ballX, ballY, ballRadius) {
        if (this.hit) return false;
        
        return (
            ballX + ballRadius > this.x - this.width / 2 &&
            ballX - ballRadius < this.x + this.width / 2 &&
            ballY + ballRadius > this.y - this.height / 2 &&
            ballY - ballRadius < this.y + this.height / 2
        );
    }
}

export default SpecialSlot;
