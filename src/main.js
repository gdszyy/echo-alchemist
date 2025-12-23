/**
 * Echo Alchemist - 回聲煉金師
 * 主入口文件
 */

// 导入配置
import { CONFIG } from './config/index.js';

// 导入数据
import { RELIC_DB, SKILL_DB, MarbleDefinition } from './data/index.js';

// 导入核心模块
import { Vec2, showToast, Game } from './core/index.js';

// 导入音频
import { SoundManager } from './audio/SoundManager.js';

// 导入实体
import { Peg, SpecialSlot, DropBall, Enemy } from './entities/index.js';

// 导入效果
import { Particle, ParticleSystem, FloatingText, FloatingTextManager, LightningBolt, LightningManager } from './effects/index.js';

// 全局音频实例
const audio = new SoundManager();

// 导出到全局 (兼容原有代码)
window.CONFIG = CONFIG;
window.RELIC_DB = RELIC_DB;
window.SKILL_DB = SKILL_DB;
window.MarbleDefinition = MarbleDefinition;
window.Vec2 = Vec2;
window.audio = audio;
window.showToast = showToast;

// 导出效果类到全局 (兼容原有代码)
window.Particle = Particle;
window.FloatingText = FloatingText;
window.LightningBolt = LightningBolt;

// 导出实体类到全局 (兼容原有代码)
window.Peg = Peg;
window.SpecialSlot = SpecialSlot;
window.DropBall = DropBall;
window.Enemy = Enemy;

// 注意：以下类尚未迁移，需要从原始 HTML 中加载或后续迁移
// 这些类在 Game 类中被引用，暂时使用占位类或从 window 获取
// - UIManager
// - Projectile
// - CloneSpore
// - Shockwave
// - EnergyOrb
// - FireWave
// - CollectionBeam

// 占位类定义 (用于兼容，待后续迁移)
class UIManager {
    constructor() {
        console.log('UIManager placeholder initialized');
    }
    updateSkillPoints(points) {
        const el = document.getElementById('skill-points-num');
        if (el) el.innerText = points;
    }
}

class Projectile {
    constructor(x, y, config) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, -5);
        this.config = config;
        this.active = true;
        this.chainHistory = [];
    }
    update() {}
    draw(ctx) {}
}

class CloneSpore {
    constructor(sx, sy, tx, ty, callback) {
        this.startX = sx;
        this.startY = sy;
        this.targetX = tx;
        this.targetY = ty;
        this.callback = callback;
        this.active = true;
    }
    update() {}
    draw(ctx) {}
}

class Shockwave {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.alpha = 1;
    }
    update(timeScale) { this.radius += 5 * timeScale; this.alpha -= 0.02 * timeScale; }
    draw(ctx) {}
}

class EnergyOrb {
    constructor(x, y) {
        this.pos = new Vec2(x, y);
        this.active = true;
    }
    update(timeScale) {}
    draw(ctx) {}
}

class FireWave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }
    update(timeScale) {}
    draw(ctx) {}
}

class CollectionBeam {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }
    update() {}
    draw(ctx) {}
}

// 导出占位类到全局
window.UIManager = UIManager;
window.Projectile = Projectile;
window.CloneSpore = CloneSpore;
window.Shockwave = Shockwave;
window.EnergyOrb = EnergyOrb;
window.FireWave = FireWave;
window.CollectionBeam = CollectionBeam;

// 创建游戏实例
// 注意：完整的 Game 类已从原始代码迁移
// 但由于依赖的其他类（如 Projectile 等）尚未完全迁移
// 游戏可能无法完全正常运行，需要后续继续迁移工作
const game = new Game();
window.game = game;

console.log('Echo Alchemist initialized with migrated Game class');

export { game, Game, Enemy, DropBall };
