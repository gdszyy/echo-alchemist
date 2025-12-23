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
import { Peg, SpecialSlot, DropBall, Enemy, Projectile, CloneSpore } from './entities/index.js';

// 导入效果
import { 
    Particle, 
    ParticleSystem, 
    FloatingText, 
    FloatingTextManager, 
    LightningBolt, 
    LightningManager,
    Shockwave,
    EnergyOrb,
    FireWave,
    CollectionBeam
} from './effects/index.js';

// 导入 UI 模块
import { UIManager } from './ui/index.js';

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
window.Shockwave = Shockwave;
window.EnergyOrb = EnergyOrb;
window.FireWave = FireWave;
window.CollectionBeam = CollectionBeam;

// 导出实体类到全局 (兼容原有代码)
window.Peg = Peg;
window.SpecialSlot = SpecialSlot;
window.DropBall = DropBall;
window.Enemy = Enemy;
window.Projectile = Projectile;
window.CloneSpore = CloneSpore;

// 导出 UIManager 到全局 (兼容原有代码)
window.UIManager = UIManager;

// 创建游戏实例
const game = new Game();
window.game = game;

console.log('Echo Alchemist initialized with all core modules integrated');

export { game, Game, Enemy, DropBall, Projectile, UIManager, CloneSpore, Shockwave, EnergyOrb, FireWave, CollectionBeam };
