/**
 * Echo Alchemist - 回聲煉金師
 * 主入口文件
 */

// 导入配置
import { CONFIG } from './config/index.js';

// 导入数据
import { RELIC_DB, SKILL_DB, MarbleDefinition } from './data/index.js';

// 导入核心模块
import { Vec2, showToast } from './core/index.js';

// 导入音频
import { SoundManager } from './audio/SoundManager.js';

// 导入实体
import { Peg, SpecialSlot } from './entities/index.js';

// 导入效果
import { ParticleSystem, FloatingTextManager, LightningManager } from './effects/index.js';

// 全局音频实例
const audio = new SoundManager();

// 导出到全局 (兼容原有代码)
window.CONFIG = CONFIG;
window.RELIC_DB = RELIC_DB;
window.SKILL_DB = SKILL_DB;
window.Vec2 = Vec2;
window.audio = audio;
window.showToast = showToast;

/**
 * 游戏主类
 * TODO: 从原始代码迁移 Game 类
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化效果系统
        this.particles = new ParticleSystem();
        this.floatingTexts = new FloatingTextManager();
        this.lightnings = new LightningManager();
        
        // 游戏状态
        this.phase = 'title';
        this.round = 1;
        this.score = 0;
        
        // 绑定事件
        this.bindEvents();
        
        // 调整画布大小
        this.resize();
        
        console.log('Echo Alchemist initialized');
    }

    /**
     * 绑定事件监听
     */
    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('click', (e) => {
            audio.resume();
            this.handleClick(e);
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            audio.resume();
        });
    }

    /**
     * 调整画布大小
     */
    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    /**
     * 处理点击事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log(`Click at (${x}, ${y})`);
        
        // TODO: 实现点击逻辑
    }

    /**
     * 游戏主循环
     */
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    /**
     * 更新游戏状态
     */
    update() {
        this.particles.update();
        this.floatingTexts.update();
        this.lightnings.update();
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        const ctx = this.ctx;
        
        // 清空画布
        ctx.fillStyle = CONFIG.colors.bg;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制效果
        this.particles.draw(ctx);
        this.floatingTexts.draw(ctx);
        this.lightnings.draw(ctx);
    }

    /**
     * 开始游戏
     */
    start() {
        this.loop();
    }
}

// 创建游戏实例
const game = new Game();
window.game = game;

// 启动游戏
game.start();

export { game, Game };
