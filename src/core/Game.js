/**
 * Game 类 - 游戏主控制器
 * 
 * 负责：
 * - 游戏主循环
 * - 状态管理
 * - 阶段切换 (选卡/收集/战斗/遗物)
 * - 输入处理
 * 
 * @module core/Game
 */

// 导入配置
import { CONFIG } from '../config/index.js';

// 导入数据
import { RELIC_DB, SKILL_DB, MarbleDefinition } from '../data/index.js';

// 导入核心模块
import { Vec2, showToast } from './index.js';

// 导入阶段管理
import { CombatPhase } from '../phases.js';

// 导入音频 (全局实例将在 main.js 中创建)
// import { SoundManager } from '../audio/SoundManager.js';

// 导入实体
import { Peg, SpecialSlot, DropBall, Enemy, Projectile, CloneSpore } from '../entities/index.js';

// 导入效果
import { Particle, FloatingText, LightningBolt, Shockwave, EnergyOrb, FireWave, CollectionBeam } from '../effects/index.js';

// 导入 UI 模块
import { UIManager } from '../ui/index.js';

// 音频实例从全局获取 (在 main.js 中创建并挂载到 window)
const audio = window.audio;


/**
 * 游戏主类
 * 管理整个游戏的生命周期和状态
 */
export class Game {
    /**
     * 构造函数：初始化游戏状态、Canvas 和事件监听器
     */
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d');
        this.resize();
        // 窗口大小变化时重新调整 Canvas 大小并重新初始化弹珠台布局
        window.addEventListener('resize', () => { this.resize(); if (this.phase === 'gathering') this.initPachinko(); });
        this.ui = new UIManager();
        this.boardTilt = {
            current: { x: 0, y: 0 }, // 当前平滑后的倾斜值 (-1 ~ 1)
            target: { x: 0, y: 0 },  // 目标倾斜值 (来自传感器或鼠标)
            enabled: false           // 是否已启用陀螺仪
        };
        // 游戏状态变量
        this.phase = 'selection'; // 当前阶段 ('selection', 'gathering', 'combat', 'gameover')
        this.marblesPool = []; // 弹珠池
        this.selectedMarbles = []; // 已选择的弹珠 (3个)
        this.marbleQueue = []; // 待收集的弹珠队列
        this.ammoQueue = []; // 炼金完成的弹药配置队列
        this.collectionBeams = [];
        this.skillPoints = 0;

        //  特性状态管理
        this.pinkPegCount = 0;      // 粉色钉子数量
        this.hasCombatWall = false; // 是否拥有战斗底墙
        this.unlockedSlots = ['skill_point']; 
        this.slotCount = 1;

        // 游戏实体列表
        this.pegs = []; // 钉子 (收集阶段)
        this.enemies = []; // 敌人 (战斗阶段)
        this.specialSlots = []; // 特殊槽位 (收集阶段)
        this.dropBalls = []; // 正在下落的弹珠 (收集阶段)
        this.projectiles = []; // 正在飞行的弹丸 (战斗阶段)
        this.particles = []; // 粒子特效
        this.shockwaves = []; // 冲击波特效
        this.floatingTexts = []; // 浮动文字 (如 HIT)
        this.rainbowBuffer = []; // 彩虹弹珠分裂的碎片缓存
        this.lightningBolts = []; // 闪电特效
        this.pendingShots = []; // 待发射的弹丸 (用于多重发射)
        this.burstQueue = []; // 散射弹丸队列
        this.ownedRelics = []; // 玩家当前拥有的遗物 ID 列表
        this.spores = []; // 新增：存儲分身孢子
        this.fireWaves = []; // 新增火焰波數組
        this.spores = []; // 新增：存儲分身孢子
        this.fireWaves = []; // 新增火焰波數組
        this.energyOrbs = []; //  存儲能量球
        //  初始化所有細分權重
        this.unlockedWeights = { ...CONFIG.probabilities };
        
        // 下一輪保證出現的彈珠類型列表
        this.guaranteedNextRound = [];

        // 输入状态
        this.isDragging = false; 
        this.dragStart = new Vec2(0,0); 
        this.dragCurrent = new Vec2(0,0); 
        this.lastMousePos = new Vec2(0,0); 
        this.currentSession = null; // 当前收集会话
        this.isTiltingGrip = false;
        this.gripStartPos = new Vec2(0, 0); // 抓取起始点
        // 游戏统计和控制
        this.gameOver = false; 
        this.defeatLineY = 570; // 敌人到达此线游戏失败
        this.timeScale = 1.0; // 时间缩放 (加速/减速)
        this.round = 1; // 当前波数
        this.score = 0; // 分数
        this.scoreMultiplier = 1.0; // 分数乘数
        this.hudExpanded = false; // 战斗 HUD 是否展开
        this.roundDamage = 0; // 本回合造成的伤害
        this.prevRoundDamage = 0; // 上回合造成的伤害

        // --- 新增：敵人回合控制變量 ---
        this.isEnemyTurn = false;      // 是否處於敵人行動階段
        this.enemyTurnTimer = 0;       // 計時器
        //  扫描波相关变量
        this.enemyWaveY = 0;       // 波当前的 Y 坐标
        this.enemyWaveActive = false; // 波是否正在运行
        this.waveSpeed = 4;        // 波的移动速度 (像素/帧)
        this.waveMomentumTimer = 0;
        this.nextRoundHpMultiplier = 1; // 默认为 1 (正常血量)
        // ---------------------------

        
        // 初始化战斗阶段管理器
        this.combatPhase = new CombatPhase(this);
        
        this.setupInputs(); 
        this.initGameStart(); 
        
        // 启动游戏主循环 (修复了原始的 this.loop is not a function 错误
        this.currentRows = CONFIG.gameplay.rows; 
        this.boardBottomY = 0;
        this.loop();
    }

    /**
     * @method loop
     * @description 游戏主循环
     */
    loop() {
        // 1. 清理画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = CONFIG.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const timeScale = this.timeScale; 

        // --- [核心修复 1]：全局倾斜平滑计算 ---
        // 无论在哪个阶段，都要更新当前的倾斜角度，否则战斗阶段陀螺仪会失效
        const smoothSpeed = 0.05 * timeScale;
        this.boardTilt.current.x += (this.boardTilt.target.x - this.boardTilt.current.x) * smoothSpeed;
        this.boardTilt.current.y += (this.boardTilt.target.y - this.boardTilt.current.y) * smoothSpeed;

        // --- [核心修复 2]：背景网格 ---
        // 仅在【非战斗】阶段绘制基础网格。
        // 战斗阶段由 updateCombat 里的 3D 视差网格接管，避免双重网格。
        if (this.phase !== 'combat') {
            this.ctx.save();
            const gridSpacing = 40;
            // 获取当前的倾斜偏移 (主要用于收集阶段的视差)
            const tiltX = -this.boardTilt.current.x * 15; 
            const tiltY = this.boardTilt.current.y * 10;
            
            this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)'; 
            this.ctx.lineWidth = 1;

            // 绘制竖线
            for (let x = (tiltX % gridSpacing); x < this.width; x += gridSpacing) {
                this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
            }
            // 绘制横线
            for (let y = (tiltY % gridSpacing); y < this.height; y += gridSpacing) {
                this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
            }
            this.ctx.restore();
        }

        // 3. 阶段分发
        if (this.phase === 'gathering') {
            this.updateGathering(timeScale);
        } else if (this.phase === 'combat') {
            this.updateCombat(timeScale);
        }

        // 4. 全局浮动文字更新
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(timeScale);
            this.floatingTexts[i].draw(this.ctx);
            if (this.floatingTexts[i].life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        requestAnimationFrame(() => this.loop());
    }

    /**
     * @method resize
     * @description 响应窗口大小变化，调整 Canvas 尺寸和游戏布局参数。
     */
    resize() {
        const container = document.getElementById('game-container'); 
        
        // --- 修改开始：强制 JS 同步窗口高度，解决部分安卓浏览器兼容问题 ---
        // 这一步会覆盖 CSS 的设置，确保 canvas 刚好填满可视区域
        container.style.height = `${window.innerHeight}px`;
        container.style.width = `${window.innerWidth}px`;
        // --- 修改结束 ---

        this.width = this.canvas.width = container.clientWidth; 
        this.height = this.canvas.height = container.clientHeight; 
        
        // 动态调整失败判定线，防止在矮屏幕上太高
        // 建议改为百分比，而不是固定的 -150
        this.defeatLineY = this.height - 120; // 稍微调低一点，给底部 UI 留空间
        
        this.enemyWidth = (this.width / CONFIG.gameplay.enemyCols); 
        this.enemyHeight = this.enemyWidth; 
        this.updateUICache();
        // 如果是在收集阶段，且已经初始化过，可能需要重新计算钉子位置（可选）
        // if (this.phase === 'gathering') this.initPachinko();
    }
    /**
     * @method initGameStart
     * @description 初始化游戏开始状态 (生成初始敌人和进入选择阶段)。
     */
    initGameStart() {
        const startY = 80; 
        // 根据配置生成初始敌人行
        for(let i=0; i<CONFIG.gameplay.startRows; i++) { 
            this.spawnEnemyRowAt(startY + i * this.enemyHeight); 
        }
        // [VOI-63 修复] 游戏开始时直接进入选弹珠阶段，而不是遗物选择
        // this.showRelicSelection();
        this.initSelectionPhase(); // 进入弹珠选择阶段
    }
    resetGame() {
        this.gameOver = false;
        this.round = 1;
        this.score = 0;
        this.scoreMultiplier = 1.0;
        
        // [關鍵] 重置解鎖權重回初始狀態
        this.unlockedWeights = { ...CONFIG.probabilities }; // 回到只有 white 和 bounce 的狀態
        this.guaranteedNextRound = [];
        this.ownedRelics = []; // 清空遺物
        
        // 清空實體
        this.enemies = [];
        this.projectiles = [];
        this.dropBalls = [];
        this.ammoQueue = [];
        this.marbleQueue = [];
        this.energyOrbs = [];
        this.spores = [];
        this.currentRows = CONFIG.gameplay.rows;
        this.skillPoints = 0; // 重置
        this.ui.updateSkillPoints(this.skillPoints);

        // 重新生成初始敌人
        this.spawnEnemyRow(CONFIG.gameplay.startRows);
        
        // [VOI-63 修复] 重置游戏时直接进入选弹珠阶段
        this.initSelectionPhase();
        // this.showRelicSelection();
        // 重置 UI
        document.getElementById('combat-message').innerHTML = '';
        document.getElementById('score-num').innerText = '0';
        document.getElementById('round-num').innerText = '1';
    }
    /**
     * @method setupInputs
     * @description 设置所有输入事件监听器（鼠标/触摸、按钮点击）。
     */
    setupInputs() {
        // 辅助函数：获取鼠标/触摸在 Canvas 上的相对位置
        const handler = (e) => {
            const rect = this.canvas.getBoundingClientRect(); 
            const x = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX; 
            const y = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY; 
            return new Vec2(x - rect.left, y - rect.top);
        };
        // 绑定输入事件到 Canvas 和 Window
        this.canvas.addEventListener('mousedown', e => this.handleInputStart(handler(e))); 
        this.canvas.addEventListener('touchstart', e => this.handleInputStart(handler(e)), {passive: false});
        window.addEventListener('mousemove', e => this.handleInputMove(handler(e), e)); 
        window.addEventListener('touchmove', e => this.handleInputMove(handler(e), e), {passive: false});
        window.addEventListener('mouseup', () => this.handleInputEnd()); 
        window.addEventListener('touchend', () => this.handleInputEnd());
        document.getElementById('confirm-selection-btn').onclick = () => this.confirmSelection(); // 确认选择按钮

        // 速度控制按钮
        const speedBtn = document.getElementById('speed-btn'); 
        speedBtn.onclick = () => { 
            if (this.timeScale === 1.0) this.timeScale = 2.0; 
            else if (this.timeScale === 2.0) this.timeScale = 0.5; 
            else this.timeScale = 1.0; 
            speedBtn.innerText = `⏩ x${this.timeScale}`; // 更新按钮文本
        };
        // 静音按钮
        const muteBtn = document.getElementById('mute-btn'); 
        muteBtn.onclick = () => { 
            window.audio.resume(); // 确保音频上下文已激活
            const isMuted = window.audio.toggleMute(); 
            muteBtn.innerText = isMuted ? '🔇' : '🔊'; 
        };
        //  陀螺仪权限申请与监听
        // 注意：iOS 13+ 需要用户交互（点击）才能申请权限
        const enableGyro = async () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.boardTilt.enabled = true;
                        window.addEventListener('deviceorientation', e => this.handleOrientation(e));
                    }
                } catch (e) { console.log("Gyro permission failed", e); }
            } else if ('ondeviceorientation' in window) {
                // 非 iOS 设备通常直接支持
                this.boardTilt.enabled = true;
                window.addEventListener('deviceorientation', e => this.handleOrientation(e));
            }
        };

        // 将权限申请绑定到第一次点击
        const initialClickHandler = () => {
            enableGyro();
            // 移除监听，避免每次点击都申请
            window.removeEventListener('click', initialClickHandler);
            window.removeEventListener('touchstart', initialClickHandler);
        };
        window.addEventListener('click', initialClickHandler);
        window.addEventListener('touchstart', initialClickHandler);
    }
    // 在 Game 类中添加
    addSkillPoint(amount = 1) {
        this.skillPoints += amount;
        this.ui.updateSkillPoints(this.skillPoints);
    }
    //  处理设备倾斜
    handleOrientation(e) {
        if (!this.boardTilt.enabled) return;
        
        // gamma: 左倾/右倾 (-90 ~ 90)
        // beta:  前倾/后倾 (-180 ~ 180)
        
        // 限制最大倾斜角度 (例如 15度)，并归一化到 -1 ~ 1
        const maxTilt = 2; 
        
        let x = e.gamma || 0;
        let y = e.beta || 0;
        
        // 修正：通常手机竖拿时 beta 约为 45-90度。我们需要相对于“竖直握持”的偏移。
        // 这里简化处理：假设 beta 60度是基准
        y = y - 60; 

        // 钳制范围
        x = Math.max(-maxTilt, Math.min(maxTilt, x));
        y = Math.max(-maxTilt, Math.min(maxTilt, y));
        
        this.boardTilt.target.x = x / maxTilt; 
        this.boardTilt.target.y = y / maxTilt;
    }
    /**
     * @method createFloatingText
     * @description 創建通用浮動文字 (修復報錯的關鍵)
     * @param {number} x - 位置 X
     * @param {number} y - 位置 Y
     * @param {string} text - 文字內容
     * @param {string} [color] - 文字顏色 (可選)
     */
    // --- [新增] 更新連射倍率 UI ---

    // --- [新增] 播放倍率轉移飛行特效 ---
    // --- 敌人生成与词缀系统 ---
    /**
     * 随机生成敌人词缀
     * @returns {string[]} 词缀数组
     */
    /**
     * @method generateAffixes
     * @description 随机生成敌人的词缀列表。
     * @returns {Array<string>} 词缀列表。
     */
    /**
     * @method isAreaOccupied
     * @description 檢查指定區域是否被其他敵人佔用 (修正版：基于逻辑目标位置判断)
     */
    /**
     * @method spawnEnemyRowAt
     * @description 在指定 Y 坐标生成一排敌人 (包含初期机会机制)
     */
    addSkillPoint(amount = 1) {
        this.skillPoints += amount;
        this.ui.updateSkillPoints(this.skillPoints);
        this.ui.updateSkillBar(this.skillPoints); // <--- [新增] 更新技能栏状态
    }

    /**
     * @method startCombatPhase
     * @description 开始战斗阶段，初始化敌人和UI。
     */
    // 在 Game 类中
    /**
     * @method spawnEnemyRow
     * @description 生成指定数量的敌人行。
     * @param {number} [count=1] - **重要参数** 要生成的敌人行数。
     */
    
    /**
     * @method triggerCloneSpawn
     * @description 触发分身生成的通用逻辑
     */

    /**
     * @method damageEnemy
     * @description 对敌人造成伤害并处理元素效果。
     * @param {Enemy} enemy - **重要参数** 目标敌人。
     * @param {Projectile} projectile - **重要参数** 造成伤害的弹丸。
     */

    // ... (Rest of Game Controller Methods: advanceWave, updateCombat, etc. same as before) ...

    /**
     * @method advanceWave
     * @description 推进到下一波敌人。
     */
    /**
     * @method recordDamage
     * @description 记录本回合造成的伤害。
     * @param {number} amount - **重要参数** 伤害量。
     */
    /**
     * @method addScore
     * @description 增加分数并提高分数乘数。
     * @param {number} amount - **重要参数** 基础分数。
     */
    /**
     * @method resetMultiplier
     * @description 重置分数乘数。
     */
    /**
     * @method updateMultiplierUI
     * @description 更新分数乘数 UI。
     */
    

    /**
     * @method updateUI
     * @description 更新 UI 界面显示，强制管理各阶段元素的显隐
     */
    updateUI() {
        // 1. 基础：隐藏所有阶段的主容器 (.ui-overlay)
        document.querySelectorAll('.ui-overlay').forEach(el => { 
            el.style.display = 'none'; 
            el.classList.add('hidden-phase'); 
            el.classList.remove('active-phase'); 
        });

        // 2. 显示当前阶段的主容器
        const activeEl = document.getElementById(`phase-${this.phase}`); 
        if(activeEl) { 
            activeEl.style.display = 'flex'; 
            // 微小延迟以触发 CSS transition (如果有)
            setTimeout(() => { 
                activeEl.classList.remove('hidden-phase'); 
                activeEl.classList.add('active-phase'); 
            }, 10); 
        }

        // 1. 底部面板 (.bottom-panel) 只在收集阶段 (gathering) 显示
        const bottomPanel = document.querySelector('.bottom-panel');
        if (bottomPanel) {
            if (this.phase === 'gathering') {
                bottomPanel.style.display = 'flex';
            } else {
                bottomPanel.style.display = 'none'; // 战斗阶段隐藏底部面板
            }
        }

        // A. 技能栏 (Skill Bar) - 仅在战斗且非敌人回合显示
        const skillBar = document.getElementById('skill-bar');
        if (skillBar) {
            // 只有在 combat 阶段才显示，其他阶段强制隐藏
            skillBar.style.display = (this.phase === 'combat') ? 'flex' : 'none';
        }

        // B. 连击倍率显示 (Multiplier)
        const multiplierEl = document.getElementById('multiplier-display');
        if (multiplierEl) {
            multiplierEl.style.opacity = (this.phase === 'combat') ? '1' : '0';
        }

        // C. 技能点面板 (SP Panel)
        // 逻辑：在 gathering 和 combat 显示，在选择阶段隐藏
        const spPanel = document.getElementById('sp-panel');
        if (spPanel) {
            if (this.phase === 'gathering' || this.phase === 'combat') {
                spPanel.style.opacity = '1';
                spPanel.style.pointerEvents = 'auto'; // 允许交互（查看提示等）
            } else {
                spPanel.style.opacity = '0';
                spPanel.style.pointerEvents = 'none';
            }
        }
        
        // D. 战斗 HUD (右侧小卡片)
        // 再次确保它在非战斗阶段隐藏 (虽然 renderRecipeHUD 也会处理)
        const combatHud = document.getElementById('recipe-hud-container');
        if (combatHud && this.phase !== 'combat') {
            combatHud.classList.add('hidden');
        }

        // E. 确保 HTML 结构中的弹药槽 (.ammo-stage) 不会泄露
        // 如果你的 current/next 弹药槽是独立元素且有 ID，可以在这里加类似的隐藏逻辑
        // 例如：
        /*
        const ammoSlots = document.getElementById('ammo-ui-container');
        if (ammoSlots) ammoSlots.style.display = (this.phase === 'combat') ? 'block' : 'none';
        */
    }
    //  計算波浪的動態速度
    // [修正] 计算波浪的动态速度
    /**
     * @method switchPhase
     * @description 切换游戏阶段。
     * @param {string} newPhase - **重要参数** 新阶段名称 ('selection', 'gathering', 'combat', 'gameover')。
     */
    switchPhase(newPhase) {
        this.phase = newPhase;
        this.updateUI(); // 更新 UI 界面
        const titleContainer = document.getElementById('phase-title-container');
        const titleText = document.getElementById('phase-title');
        const subText = document.getElementById('phase-sub');
        titleContainer.classList.remove('minimized'); // 显示阶段标题

        // 根据阶段设置标题文本
        let text = "命運抉择"; let sub = "選擇你的命運";
        if (newPhase === 'gathering') { text = "研磨階段"; sub = "收集魔力"; }
        else if (newPhase === 'combat') { text = "戰鬥階段"; sub = "抵禦魔像"; }
        titleText.innerText = text; subText.innerText = sub;
        
        // 1.2秒后隐藏阶段标题
        setTimeout(() => { titleContainer.classList.add('minimized'); }, 1200);
    }
    /**
     * 显示遗物选择界面
     */
    /**
     * 显示遗物选择界面 (支持稀有度权重 + 防重复)
     */
    showRelicSelection() {
        // 1. 记录之前的状态 (用于关闭时恢复)
        this.stateBeforeRelic = this.phase; 

        // --- 配置权重 ---
        // 修复拼写错误: relicRarityWright -> relicRarityWeight
        const RARITY_WEIGHTS = CONFIG.balance.relicRarityWeight || {
            'common': 60,
            'rare': 30,
            'legendary': 10,
            'cursed': 5
        };

        // 2. 准备遗物池
        // 过滤掉玩家已经拥有的遗物 (this.ownedRelics)
        // 添加防御性检查，确保 RELIC_DB 存在
        let pool = (RELIC_DB || []).filter(r => r && r.id && !this.ownedRelics.includes(r.id));
        
        // 如果池子空了（全收集了），就给一些保底的或者是空的
        if (pool.length === 0) {
            showToast("已收集所有遗物！");
            if (typeof this.closeRelicSelection === 'function') {
                this.closeRelicSelection();
            }
            return;
        }

        const choices = [];
        
        // 3. 抽取 3 个遗物 (加权随机 & 不放回)
        const choiceNum = CONFIG.gameplay.relicChoiceNum || 3;
        for(let i=0; i<choiceNum; i++) {
            if(pool.length === 0) break;

            // A. 计算当前临时池子的总权重
            let totalWeight = 0;
            pool.forEach(r => {
                if (r && r.rarity) {
                    totalWeight += (RARITY_WEIGHTS[r.rarity] || 10); // 默认权重10
                } else {
                    totalWeight += 10;
                }
            });

            // B. 生成随机数 [0, totalWeight)
            let randomVal = Math.random() * totalWeight;
            let selectedIdx = -1;

            // C. 遍历寻找命中的遗物
            for (let j = 0; j < pool.length; j++) {
                const r = pool[j];
                const weight = (r && r.rarity) ? (RARITY_WEIGHTS[r.rarity] || 10) : 10;
                randomVal -= weight;
                if (randomVal <= 0) {
                    selectedIdx = j;
                    break;
                }
            }

            // D. 兜底 (防止浮点数误差导致没选中，默认选第一个)
            if (selectedIdx === -1) selectedIdx = 0;

            // E. 加入结果 并 从临时池中移除 (防止同一次选卡出现两个一样的)
            choices.push(pool[selectedIdx]);
            pool.splice(selectedIdx, 1);
        }

        // 4. 生成 HTML (保持原有逻辑)
        const container = document.getElementById('relic-container');
        container.innerHTML = '';
        
        choices.forEach(relic => {
            const el = document.createElement('div');
            // 加上 rarity 类名以便 CSS 显示不同边框颜色
            el.className = `relic-card ${relic.rarity || 'common'}`; 
            el.innerHTML = `
                <div class="relic-icon">${relic.icon}</div>
                <div class="relic-name">${relic.name}</div>
                <div class="relic-desc">${relic.desc}</div>
            `;
            el.onclick = (e) => { 
                e.stopPropagation(); 
                this.selectRelic(relic);
            };
            container.appendChild(el);
        });

        // 5. 显示界面
        const overlay = document.getElementById('phase-relic');
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden-phase');
        overlay.classList.add('active-phase');
    }

    /**
     * 玩家选择遗物
     */
    selectRelic(relic) {
        this.ownedRelics.push(relic.id);
        showToast(`獲得遺物: ${relic.name}`);
        //  处理新遗物效果
        if (relic.effect === 'pink_peg_up') {
            this.pinkPegCount += 3; // 叠加增加
        } 
        else if (relic.effect === 'combat_wall') {
            this.hasCombatWall = true;
        }
        else if (relic.effect === 'unlock_slot') {
            if (!this.unlockedSlots.includes(relic.slotType)) {
                this.unlockedSlots.push(relic.slotType);
            }
            // 规则：解锁任意一种，特殊槽出现数量从 0 -> 1
            if (this.slotCount === 0) this.slotCount = 1;
        }
        else if (relic.effect === 'slot_count_up') {
            this.slotCount += 1;
        } else if (relic.effect === 'row_count_up') {
            this.currentRows += 2;
        }
        //  支持單個字串或數組的解鎖邏輯
        if (relic.unlocks) {
            const keys = Array.isArray(relic.unlocks) ? relic.unlocks : [relic.unlocks];
            const boost = relic.boost || 10;
            
            keys.forEach(key => {
                const current = this.unlockedWeights[key] || 0;
                // 如果是第一次解鎖，設為 boost；如果是重複獲取，增加權重
                this.unlockedWeights[key] = current === 0 ? boost : current + Math.floor(boost * 1.5);
                
                // 加入保底列表
                this.guaranteedNextRound.push(key);
            });
            
            showToast(`已解鎖相關屬性!`);
        }

        // [修复] 显示确认按钮，而不是立即关闭
        const confirmBtn = document.getElementById('confirm-relic-btn');
        if (confirmBtn) {
            confirmBtn.style.display = 'block';
        }
        
        // 禁用所有遗物卡片的点击
        const relicCards = document.querySelectorAll('.relic-card');
        relicCards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.6';
        });
    }

    /**
     * 确认遗物选择并继续
     */
    confirmRelicSelection() {
        this.closeRelicSelection();
    }

    /**
     * 跳过选择
     */
    skipRelic() {
        this.addScore(500);
        showToast("獲得 500 分");
        this.closeRelicSelection();
    }

    /**
     * 关闭界面并恢复
     */
    closeRelicSelection() {
        const overlay = document.getElementById('phase-relic');
        overlay.style.display = 'none';
        overlay.classList.remove('active-phase');
        overlay.classList.add('hidden-phase');
        
        // [修复] 重置确认按钮状态
        const confirmBtn = document.getElementById('confirm-relic-btn');
        if (confirmBtn) {
            confirmBtn.style.display = 'none';
        }
        
        // 重置遗物卡片状态
        const relicCards = document.querySelectorAll('.relic-card');
        relicCards.forEach(card => {
            card.style.pointerEvents = 'auto';
            card.style.opacity = '1';
        });
        
        // [核心修复] 根据打开前的状态决定去向
        if (this.stateBeforeRelic === 'gathering') {
            // 情况 A: 在收集阶段(打中遗物槽)打开的
            // 不需要跳转阶段，只需要尝试结算当前回合
            // (因为在 updateGathering 里，球已经被移除并 activeBalls-- 了，这里检查是否需要发射)
            this.attemptCompleteGatheringTurn();
        } else {
            // 情况 B: 在回合结束(打完BOSS/固定回合事件)打开的
            // 正常进入下一轮的选弹珠阶段
            this.initSelectionPhase(); 
        }
    }
    /**
     * 初始化弹珠选择阶段
     */
    initSelectionPhase() {
        this.switchPhase('selection');
        this.generateMarbleOptions(); // 生成弹珠选项
        this.selectedMarbles = []; // 重置已选择弹珠
        document.getElementById('selected-count').innerText = '0'; 
        document.getElementById('confirm-selection-btn').disabled = true; 
        document.getElementById('recipe-hud-container').classList.add('hidden');
    }
    /**
     * @method generateMarbleOptions
     * @description 生成弹珠选项 (5个) 供玩家选择。
     * @returns {Array<MarbleDefinition>} 包含五个随机弹珠定义的数组。
     */
    // 在 Game 類中

    generateMarbleOptions() { 
        const container = document.getElementById('marble-selection-grid'); 
        container.innerHTML = ''; 
        this.marblesPool = []; 
        
        // 定義屬性到彈珠定義的映射
        const typeMapping = {
            laser: () => new MarbleDefinition('laser'),
            white: () => new MarbleDefinition('white'),
            redStripe: () => new MarbleDefinition('redStripe'),
            rainbow: () => new MarbleDefinition('rainbow'),
            matryoshka: () => new MarbleDefinition('matryoshka'),
            // 剩下的都是 colored 類型，但 subtype 不同
            bounce: () => new MarbleDefinition('colored', 'bounce'),
            pierce: () => new MarbleDefinition('colored', 'pierce'),
            scatter: () => new MarbleDefinition('colored', 'scatter'),
            damage: () => new MarbleDefinition('colored', 'damage'),
            cryo: () => new MarbleDefinition('colored', 'cryo'),
            pyro: () => new MarbleDefinition('colored', 'pyro')
        };

        for(let i=0; i < CONFIG.gameplay.selectionCount; i++) {
            let m;
            
            // 1. 保底機制
            if (this.guaranteedNextRound.length > 0) {
                const key = this.guaranteedNextRound.shift();
                if (typeMapping[key]) m = typeMapping[key]();
            } 
            
            // 2. 加權隨機機制
            if (!m) {
                // 計算總權重
                let total = 0;
                const keys = Object.keys(this.unlockedWeights);
                keys.forEach(k => total += this.unlockedWeights[k]);
                
                let r = Math.random() * total;
                for (const key of keys) {
                    r -= this.unlockedWeights[key];
                    if (r <= 0) {
                        if (typeMapping[key]) m = typeMapping[key]();
                        break;
                    }
                }
            }
            
            // 兜底防止出錯
            if (!m) m = new MarbleDefinition('white');
            
            this.marblesPool.push(m); 
            
            // ... (創建 UI 卡片代碼保持不變) ...
            const card = document.createElement('div'); 
            card.className = 'select-card'; 
            card.onclick = () => this.toggleMarbleSelection(i, card); 
            const icon = document.createElement('div'); 
            icon.className = 'select-icon flex-shrink-0'; 
            icon.style.background = m.getColor(); 
            const name = document.createElement('div'); 
            name.className = 'text-xs font-bold text-center text-slate-200 mt-2'; 
            name.innerText = m.getName(); 
            card.append(icon, name); 
            container.appendChild(card); 
        } 
    }
    /**
     * @method toggleMarbleSelection
     * @description 切换指定索引弹珠的选中状态。
     * @param {number} idx - **重要参数** 弹珠在 marblesPool 中的索引。
     * @param {HTMLElement} cardEl - **重要参数** 弹珠对应的 UI 元素。
     */
    toggleMarbleSelection(idx, cardEl) { 
        if (this.selectedMarbles.includes(idx)) {
            // 取消选择
            this.selectedMarbles = this.selectedMarbles.filter(i => i !== idx); 
            cardEl.classList.remove('selected'); 
        } else { 
            // 选择 (最多 3 个)
            if (this.selectedMarbles.length < 3) { 
                this.selectedMarbles.push(idx); 
                cardEl.classList.add('selected'); 
            } 
        } 
        const count = this.selectedMarbles.length; 
        document.getElementById('selected-count').innerText = count; 
        document.getElementById('confirm-selection-btn').disabled = count !== 3; // 只有选满 3 个才能确认
    }
    /**
     * @method confirmSelection
     * @description 确认玩家选择的弹珠，并进入收集阶段。
     */
    confirmSelection() { 
        if (this.selectedMarbles.length !== 3) return; 
        this.marbleQueue = this.selectedMarbles.map(i => this.marblesPool[i]); // 将选中的弹珠放入队列
        this.startGatheringPhase(); 
    }

    /**
     * @method startGatheringPhase
     * @description 开始收集阶段，初始化弹珠台和队列。
     */
    // 在 Game 类中
    startGatheringPhase() {
        this.switchPhase('gathering');
        requestAnimationFrame(() => {
            this.updateUICache();
        });
        if (this.pegs.length === 0) {
            this.initPachinko(); 
        }
        
        // --- 新增：初始化持久阈值变量 ---
        this.persistentThreshold = CONFIG.gameplay.initTriggerThreshold; 
        // -----------------------------
        this.ui.updateSkillPoints(this.skillPoints);
        this.ammoQueue = []; 
        this.dropBalls = []; 
        this.activeMarbleIndex = 0; 
        this.updateHitProgress(0, this.persistentThreshold); 
        this.updateGatheringQueueUI(); 
        this.renderRecipeHUD(); 
        this.updateMulticastDisplay(0);
        this.renderRecipeHUD();
    }
    /**
     * @method initRecipeHUD
     * @description 初始化配方 HUD (隐藏)。
     */
    /**
     * @method toggleHud
     * @description 切换 HUD 展开/折叠状态。
     */
    /**
     * @method renderRecipeHUD
     * @description 渲染配方 HUD (严格单例渲染)
     */
    /**
     * @method renderRecipeCard
     * @description 渲染单个配方/弹珠卡片。
     * @param {HTMLElement} container - **重要参数** 容器元素。
     * @param {object} item - **重要参数** 弹珠定义或配方对象。
     * @param {boolean} isActive - 是否为当前激活项。
     * @param {string} statusClass - 状态 CSS 类名。
     */
    /**
     * 初始化弹珠台 (Pachinko) 的钉子和特殊槽位
     */
    /**
     * @method initPachinko
     * @description 初始化弹珠台（Pachinko）的钉子和特殊槽位。
     */
// 在 Game 類中

    initPachinko() {
        const previousPegs = this.pegs || []; 
        const shouldInherit = previousPegs.length > 0;
        this.pegs = []; 
        this.specialSlots = []; 
        
        const rows = this.currentRows;  
        
        // --- [核心修改开始]：宽高自适应的正方形网格计算 ---
        
        // 1. 计算基准单元格大小
        // 基于屏幕宽度计算，(cols + 1) 是为了左右留出半个格子的边缘缓冲
        // 这样无论屏幕变宽变窄，格子都会等比缩放
        const unitSize = this.width / (CONFIG.gameplay.cols + 1);
        
        // 2. 强制横竖间距一致 (正方形布局基础)
        const spacingX = unitSize;
        const spacingY = unitSize*0.866; 
        // 注：如果你想要帕青哥那种"紧凑的等边三角形"布局，把上面这行改成：
        // const spacingY = unitSize * 0.866; 

        // 3. 动态计算起始 X 偏移量，让整个阵列在屏幕居中
        // 偶数行有 CONFIG.gameplay.cols 个钉子，总宽度是 (cols - 1) * spacingX
        const gridTotalWidth = (CONFIG.gameplay.cols - 1) * spacingX;
        const baseOffsetX = (this.width - gridTotalWidth) / 2;

        // 4. 起始 Y 坐标 (保持固定或按需调整)
        const startY = 120; 
        
        // --- [核心修改结束] ---

        let grid = []; 
        let pegIndex = 0;
        let maxPegY = 120; 
        for (let r = 0; r < rows; r++) { 
            // 奇数行少一个钉子 (错位)
            const isOddRow = r % 2 !== 0;
            const cols = isOddRow ? CONFIG.gameplay.cols - 1 : CONFIG.gameplay.cols; 
            
            // 如果是奇数行，向右偏移半个间距
            const rowShift = isOddRow ? (spacingX * 0.5) : 0;
            
            let rowPegs = []; 
            for (let c = 0; c < cols; c++) { 
                // X = 基础居中偏移 + 列间距 + 错位偏移
                let x = baseOffsetX + (c * spacingX) + rowShift; 
                let y = startY + r * spacingY; 
                if (y > maxPegY) maxPegY = y;
                // --- 以下为继承逻辑 (保持不变) ---
                let type = 'normal'; 
                
                if (shouldInherit && previousPegs[pegIndex]) {
                    const prevType = previousPegs[pegIndex].type;
                    if (prevType !== 'pink') {
                         const weight = this.unlockedWeights[prevType] || 0;
                         if (prevType === 'laser' || prevType === 'bounce' || weight > 0) {
                             if (Math.random() < 0.99) type = prevType;
                             else type = this.getRandomPegType();
                         } else {
                             type = this.getRandomPegType();
                         }
                    } else {
                        type = this.getRandomPegType(); 
                    }
                } else { 
                    type = this.getRandomPegType(); 
                }
                
                let p = new Peg(x, y, type); 
                this.pegs.push(p); 
                rowPegs.push(p); 
                pegIndex++; 
            } 
            grid.push(rowPegs); 
        }
        this.boardBottomY = maxPegY;
        // --- 生成粉色钉子 (保持不变) ---
        const pinkCount = this.pinkPegCount; 
        for(let i=0; i<pinkCount; i++) { 
            if(this.pegs.length > 0) { 
                const idx = Math.floor(Math.random() * this.pegs.length); 
                this.pegs[idx].type = 'pink'; 
            } 
        }

        // --- 生成特殊槽位 (保持不变) ---
        if (this.unlockedSlots.length > 0 && this.slotCount > 0) {
            const slotTypes = this.unlockedSlots;
            
            // 安全机制：防止运气极差时死循环
            let attempts = 0;
            const maxAttempts = 100; 

            // 核心修复：只要数量不够，就继续尝试生成
            while (this.specialSlots.length < this.slotCount && attempts < maxAttempts) {
                attempts++;

                // 1. 随机选择行
                let r = Math.floor(Math.random() * (CONFIG.gameplay.spSlotsEndRow - CONFIG.gameplay.spSlotsStartRow + 1)) + CONFIG.gameplay.spSlotsStartRow;
                let rowPegs = grid[r];
                
                // 行无效则重试
                if (!rowPegs || rowPegs.length < 2) continue; 
                
                // 2. 随机选择列
                let c = Math.floor(Math.random() * (rowPegs.length - 1)); 
                let p1 = rowPegs[c]; 
                let p2 = rowPegs[c+1]; 
                
                let cx = (p1.pos.x + p2.pos.x) / 2; 
                let cy = p1.pos.y; 
                
                // 使用之前计算好的 spacingX，如果作用域访问不到，可用 this.width / (CONFIG.gameplay.cols + 1) 代替
                // 这里假设你应用了上一条回答的代码，spacingX 是可用的
                let w = spacingX * 0.8; 
                
                // 3. 检查重叠
                const isOverlapping = this.specialSlots.some(s => Math.abs(s.x - cx) < 20 && Math.abs(s.y - cy) < 20);

                if (!isOverlapping) { 
                    // 确定类型
                    let slotType = slotTypes[Math.floor(Math.random() * slotTypes.length)]; 
                    
                    // 遗物槽独立判定 (每局最多一个)
                    if (Math.random() < CONFIG.gameplay.relicChance && !this.specialSlots.some(s => s.type === 'relic')) {
                        slotType = 'relic';
                    }
                    
                    // 成功加入
                    this.specialSlots.push(new SpecialSlot(cx, cy, w, slotType)); 
                } 
                // 如果 isOverlapping 为 true，while 循环会继续下一次尝试，不会直接放弃
            }
        }
    }

    getRandomPegType() { 
    // 定义所有可能的钉子类型（包含普通钉子）
    const pegTypes = ['bounce', 'pierce', 'scatter', 'damage', 'cryo', 'pyro', 'lightning'];
    
    // 1. 获取 normal 的基础权重
    // 我们手动从 unlockedWeights 中取 white 作为普通钉子的权重基准（默认 100）
    const normalWeight = this.unlockedWeights['white'] || 100; 

    // 2. 计算当前所有“已解锁”类型的总权重
    let totalWeight = normalWeight;
    pegTypes.forEach(t => {
        totalWeight += (this.unlockedWeights[t] || 0);
    });
    
    // 3. 生成 0 到 totalWeight 之间的随机数
    let r = Math.random() * totalWeight;
    
    // 4. 区间判定：首先判定是否落在 normal 区间
    if (r < normalWeight) return 'normal';
    r -= normalWeight;
    
    // 5. 依次判定落在哪个特殊属性区间
    for (const t of pegTypes) {
        const w = this.unlockedWeights[t] || 0;
        if (w > 0) {
            if (r < w) return t; // 落在当前属性的权重区间内
            r -= w;
        }
    }
    
    return 'normal'; // 兜底返回
}


    /**
     * 开始战斗阶段
     */
    /**
     * @method startCombatPhase
     * @description 开始战斗阶段，初始化敌人和UI。
     */
    startCombatPhase() { 
        console.log("进入战斗阶段...");
        
        this.energyOrbs = [];
        this.switchPhase('combat'); 
        
        // --- [核心修复 1]：修复属性访问错误 ---
        if (this.marbleQueue && this.marbleQueue.length > 0) {
            this.ammoQueue = this.marbleQueue.map(item => {
                const hasMulticast = item.collected.includes('multicast'); 
                // [修复点]：这里原来写的是 item.def，改为 item
                // 因为 marbleQueue 里的元素本身就是 MarbleDefinition 定义对象
                return this.compileCollectionToRecipe(item, item.collected, hasMulticast);
            });
        } else {
            this.ammoQueue = [];
        }

        // --- [核心修复 2]：UI 渲染 ---
        // 修复后，上面的代码不再报错，这一行将被正确执行，HUD 会在进入战斗时立即出现
        this.renderRecipeHUD(); 

        this.resetMultiplier(); 
        this.burstQueue = []; 
        this.pendingShots = []; 
        
        if (this.ui) {
            this.ui.updateSkillPoints(this.skillPoints);
            this.ui.updateSkillBar(this.skillPoints);
        }
    }
    /**
     * 清除所有弹丸和爆发队列
     */
    /**
     * @method clearProjectiles
     * @description 清除所有现存的投射物。
     */
    /**
     * 获取当前的视觉偏移量
     */
        /**
     * @method getTiltOffset
     * @description 获取当前的视觉偏移量 (用于修正鼠标点击坐标)
     */
    getTiltOffset() {
        if (this.phase === 'combat') {
            const tilt = this.boardTilt.current;
            // [修正]：这里必须与 updateCombat 中"实体层"的系数 (-25, -20) 保持一致
            // 这样点击才会准确落在视觉上偏移了的敌人身上
            return new Vec2(tilt.x * -25, tilt.y * -20); 
        }
        return new Vec2(0, 0);
    }

        /**
     * @method handleInputStart
     * @description 处理输入开始 (鼠标按下/触摸开始) - [修改版：直射模式]
     */
    handleInputStart(pos) {
        audio.resume();
        const offset = this.getTiltOffset();
        const logicPos = pos.sub(offset); 
        
        this.lastMousePos = logicPos;

        if (this.phase === 'combat') {
             const hitEnemy = this.checkEnemyHover(pos);
             if (hitEnemy) return; 
             if (this.ui.isOpen) {
                 this.ui.closeDrawer();
                 return;
             }
             if (this.ammoQueue.length > 0 && this.projectiles.length === 0 && this.burstQueue.length === 0) {
                this.isDragging = true; 
                this.dragStart = new Vec2(this.width / 2, this.height - 80); 
                this.dragCurrent = logicPos; 
                this.ui.closeDrawer();
            }
        }
        else if (this.phase === 'gathering') {
            if (this.dropBalls.length > 0 || this.energyOrbs.length > 0) {
                showToast("充能中...");
                return;
            }
            
            // ---  判断点击区域 ---
            if (pos.y < this.height * 0.4) {
                // 上方区域：发射弹珠
                if (this.activeMarbleIndex >= this.marbleQueue.length) return;
                const marbleDef = this.marbleQueue[this.activeMarbleIndex];
                
                // 使用之前修复过的持久化阈值逻辑
                this.currentSession = {
                    collected: [], multicast: 0, activeBalls: 1, currentHits: 0,
                    nextTriggerThreshold: this.persistentThreshold, // 确保这里用了 persistentThreshold
                    totalHits: 0, multicastAdded: [], isFinished: false
                };
                if (marbleDef.type === 'laser') {
                    this.currentSession.collected.push('laser');
                } else if (marbleDef.type === 'colored' && marbleDef.subtype) {
                    this.currentSession.collected.push(marbleDef.subtype);
                }
                this.updateHitProgress(0, this.persistentThreshold);
                this.dropBalls.push(new DropBall(pos.x, 30, marbleDef, this.currentSession));
                this.updateGatheringQueueUI();
                audio.playShoot();
                this.updateMulticastDisplay(0);
            } else {
                // ---  下方区域：进入“抓取倾斜”模式，暂不报错 ---
                this.isTiltingGrip = true;
                this.gripStartPos = pos;
                // 这里不显示 toast，等到松开时如果没动才显示
            }
        } 
    }
    //  检测是否有敌人被悬浮/点击
    /**
     * @method handleInputEnd
     * @description 处理输入结束 (松手发射) - [修改版：直射模式]
     */
    // --- Game 类 ---
    handleInputEnd() {
    if (this.isDragging) {
        // ... (战斗发射逻辑保持不变) ...
        this.isDragging = false;
        const cannonPos = new Vec2(this.width / 2, this.height - 80);
        const targetPos = this.lastMousePos;
        const aimVector = targetPos.sub(cannonPos);
        if (aimVector.y < -20) { 
            this.resetMultiplier();
            this.fireNextShot(aimVector.norm().mult(12)); 
        }
    }
    
    // ---  收集阶段抓取结束逻辑 ---
    if (this.isTiltingGrip) {
        // 计算由于抓取产生的位移距离
        const dist = this.lastMousePos.dist(this.gripStartPos);
        
        // 如果移动距离很短 (< 10px)，说明是一次点击，而不是拖拽
        if (dist < 10) {
            showToast("請在上方區域點擊");
        }
        
        // 结束抓取
        this.isTiltingGrip = false;
        
        // 可选：松手后让板子回正
        if (!this.boardTilt.enabled) {
            this.boardTilt.target = {x: 0, y: 0};
        }
    }
}

    /**
     * 处理输入移动 (鼠标移动/触摸移动)
     * @param {Vec2} pos - **重要参数** 当前输入位置
     * @param {Event} e - 事件对象
     */
    /**
     * @method handleInputMove
     * @description 处理输入移动 (鼠标移动/触摸移动)。
     * @param {Vec2} pos - **重要参数** 当前输入位置。
     * @param {Event} e - 事件对象。
     */

    handleInputMove(pos, e) {
        const offset = this.getTiltOffset();
        const logicPos = pos.sub(offset);
        this.lastMousePos = logicPos;
        
        // 战斗拖拽瞄准
        if (this.isDragging) { 
            this.dragCurrent = logicPos; 
            e.preventDefault(); 
            return;
        } 
        
        //  收集阶段 - 手动拖拽倾斜
        if (this.phase === 'gathering' && this.isTiltingGrip && !this.boardTilt.enabled) {
            e.preventDefault();
            // 计算拖拽偏移量，模拟倾斜
            const deltaX = pos.x - this.gripStartPos.x;
            const deltaY = pos.y - this.gripStartPos.y;
            
            // 灵敏度系数
            const sensitivity = 0.005; 
            
            // 将偏移量叠加到目标倾斜值上
            this.boardTilt.target.x = Math.max(-1, Math.min(1, deltaX * sensitivity));
            this.boardTilt.target.y = Math.max(-1, Math.min(1, deltaY * sensitivity));
            return;
        }

        // [保留] 收集阶段 - 鼠标悬停倾斜 (PC端体验优化)
        // 如果没有在抓取，且没有陀螺仪，鼠标位置也会产生轻微倾斜
        if ((this.phase === 'gathering' || this.phase === 'combat') && !this.isTiltingGrip && !this.boardTilt.enabled) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            // 悬停的幅度要小一点，防止太晕
            this.boardTilt.target.x = ((pos.x - centerX) / centerX) * 0.3;
            this.boardTilt.target.y = ((pos.y - centerY) / centerY) * 0.3;
        }

        // 战斗阶段悬浮检测
        if (this.phase === 'combat' && !this.ui.isOpen) {
             this.checkEnemyHover(logicPos);
        }
    }
    
    /**
     * @method triggerLightningChain
     * @description 触发连锁闪电效果 (修复单体报错版)
     * @returns {boolean} 是否成功触发了闪电链
     */

    /**
    /**
     * @method fireNextShot
     * @description 发射下一发弹丸 (处理多重射击)。
     * @param {Vec2} vel - **重要参数** 初始速度向量。
     */
    /**
    /**
     * @method spawnBullet
     * @description 生成弹丸 (处理散射)。
     * @param {number} x - **重要参数** 初始位置 X。
     * @param {number} y - **重要参数** 初始位置 Y。
     * @param {Vec2} vel - **重要参数** 初始速度向量。
     * @param {object} recipe - **重要参数** 弹药配方。
     */

// 在 Game 类中更新此方法

    // 辅助：寻找最近的反射面（墙壁或带盾敌人）

    // 辅助：处理线段上的普通穿透

    // 辅助：射线与矩形相交 (Slab Method) 返回距离 t
    /**
     * @method createExplosion
     * @description 创建爆炸特效 (粒子群)。
     * @param {number} x - **重要参数** 位置 X。
     * @param {number} y - **重要参数** 位置 Y。
     * @param {string} color - 颜色。
     */

    /**
     * @method createShockwave
     * @description 创建冲击波特效。
     * @param {number} x - **重要参数** 位置 X。
     * @param {number} y - **重要参数** 位置 Y。
     */

    // ---  createHitFeedback ---


    // 在 Game 类中
    /**
    /**
     * @method updateGatheringQueueUI
     * @description 更新收集阶段的弹珠队列UI。
     */
    updateGatheringQueueUI() { 
        const q = document.getElementById('gathering-queue'); 
        q.innerHTML = ''; 
        for(let i = this.activeMarbleIndex; i < this.marbleQueue.length; i++) { 
            const m = this.marbleQueue[i]; 
            const d = document.createElement('div'); 
            d.className = 'queue-dot flex-shrink-0'; 
            d.style.background = m.type === 'rainbow' ? CONFIG.colors.marbleRainbow : m.getColor(); 
            q.appendChild(d); 
        } 
    }
    /**
    /**
     * @method updateHitProgress
     * @description 更新命中进度条UI。
     * @param {number} val - **重要参数** 当前命中次数。
     * @param {number} target - **重要参数** 目标命中次数。
     */
    updateHitProgress(val, target) { 
        // 更新数字
        document.getElementById('hit-text').innerText = `${val}/${target}`; 
        
        // 计算百分比
        const pct = target > 0 ? Math.min(100, (val/target)*100) : 0; 
        const bar = document.getElementById('hit-bar');
        
        if(bar) {
            // 更新宽度
            bar.style.width = `${pct}%`;
            
            // 状态切换：满能量 vs 普通
            if (pct >= 99) {
                bar.classList.add('bar-full');
            } else {
                bar.classList.remove('bar-full');
            }
        }
    }
    /**
     * @method updateAmmoUI
     * @description 更新战斗阶段的双槽位弹药UI (Current & Next)
     */

    /**
     * 辅助方法：在UI中绘制一个纯CSS的子弹图标
     */
    //  处理单个敌人的回合逻辑 (当波扫到它时调用)
    /**
     * @method startEnemyTurnLogic
     * @description 启动敌人回合：锁定状态、显示UI提示、并计算所有敌人的移动与技能
     */


      /**
     * @method finalizeRound
     * @description [修改版] 回合结算，包含劣势补偿机制(自动极速)
     */

    /**
     * @method checkDefeat
     * @description 检查是否失败 (是否有敌人越过失败线)。
     * @returns {boolean} 是否失败。
     */
        /**
     * @method checkDefeat
     * @description 检查是否失败 (包含视差偏移计算)。
     * @returns {boolean} 是否失败。
     */
        /**
     * @method checkDefeat
     * @description 检查是否失败 (包含视差偏移计算)。
     */

 /**
     * 更新战斗阶段的逻辑和绘制
     */
    /**
     * @method updateCombat
     * @description 战斗阶段的游戏逻辑更新。
     * @param {number} timeScale - **重要参数** 时间缩放因子。
     */
        /**
     * @method updateCombat
     * @description 战斗阶段的游戏逻辑更新 (修复视差与防线显示)。
     * @param {number} timeScale - **重要参数** 时间缩放因子。
     */
        /**
     * @method updateCombat
     * @description 战斗阶段的游戏逻辑更新 (分层视差版)。
     */
        /**
     * @method updateCombat
     * @description 战斗阶段的游戏逻辑更新 (含可视化墙壁与分层视差)。
     */


    /**
     * @method attemptCompleteGatheringTurn
     * @description 尝试完成收集回合。修复了最后一个能量球导致无法结算的BUG。
     */
    attemptCompleteGatheringTurn() {
        // 解决方法：只计算 active 为 true 的能量球。
        const activeOrbsCount = this.energyOrbs.filter(orb => orb.active).length;

        // 1. 基础检查：如果还有东西在动，绝对不能结算
        if (this.dropBalls.length > 0 || activeOrbsCount > 0 || this.currentSession.activeBalls > 0) {
            return;
        }

        // 2. 状态检查：防止重复结算
        // 如果当前 session 已经被标记为“已结算”或不存在，则直接返回
        if (!this.currentSession || this.currentSession.isFinished) return;

        // 3. 执行结算
        this.currentSession.isFinished = true; // 立即上锁

        const marbleDef = this.marbleQueue[this.activeMarbleIndex];
        // 兜底检查：如果此时 marbleDef 不存在（防止数组越界），直接停止
        if (!marbleDef) {
            this.currentSession = null;
            return;
        }
        // --- [新增] 觸發倍率轉移特效 ---
        // 計算當前倍率 (1 + 額外)
        const totalMulticast = 1 + this.currentSession.multicast;
        // 只有倍率大於 1 時才播放特效，或者你想每次都播也可以
        if (totalMulticast > 0) {
            this.playMulticastTransferEffect(totalMulticast);
        }
        const recipe = this.compileCollectionToRecipe(marbleDef, this.currentSession.collected, this.currentSession.multicast > 0);
        recipe.finalHits = this.currentSession.totalHits;
        recipe.multicast = this.currentSession.multicast;
        this.ammoQueue.push(recipe);
        
        marbleDef.multicast = this.currentSession.multicast;
        marbleDef.finalHits = this.currentSession.totalHits;

        this.activeMarbleIndex++;
        this.updateGatheringQueueUI();
        
        // 4. 状态流转
        if (this.activeMarbleIndex >= this.marbleQueue.length) {
            // 所有弹珠都扔完了，进入战斗
            setTimeout(() => this.startCombatPhase(), 500);
        } else {
             // 准备下一回合，清空当前 session，允许玩家再次点击
             this.currentSession = null; 
        }
    }

    /**
     * @method drawLauncherOrbitals
     * @description 绘制发射器周围的属性轨道 (方案2：透明能量球环绕)
     */
    // Gathering Phase Update
    /**
     * @method updateGathering
     * @description 收集階段的遊戲邏輯更新。
     * @param {number} [timeScale=1] - **重要參數** 時間縮放因子。
     */
    updateGathering(timeScale = 1) {
        if (document.getElementById('phase-relic').style.display !== 'none') return;

        const tilt = this.boardTilt.current;


        const container = document.getElementById('game-container');
        if (container) {
            // 1. 设置透视距离，值越小 3D 感越强
            container.style.perspective = "1200px"; 
            
            // 2. 根据倾斜值旋转容器
            // rotateX 对应上下倾斜 (tilt.y)，rotateY 对应左右倾斜 (tilt.x)
            // 乘以 5 或 8 增加旋转角度的体感
            const rotateX = tilt.y * -8; 
            const rotateY = tilt.x * 8;
            const translateZ = -20; // 稍微向后退一点，防止边缘穿模

            container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
            container.style.transition = "transform 0.1s ease-out"; // 平滑动画
        }
        // 模拟板子边缘受光不均
        const grad = this.ctx.createRadialGradient(
            this.width / 2 + (tilt.x * 100), // 光心随倾斜移动
            this.height / 2 + (tilt.y * 100),
            this.width * 0.2,
            this.width / 2,
            this.height / 2,
            this.width * 0.8
        );
        grad.addColorStop(0, 'rgba(30, 41, 59, 0)');
        grad.addColorStop(1, `rgba(2, 6, 23, ${0.3 + Math.abs(tilt.x) * 0.2})`); // 倾斜越大边缘越暗

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2.  计算动态光源位置
        // 假设光源在屏幕上方很远的地方。当板子向左倾斜 (tilt.x < 0) 时，
        // 阴影应该向左移动，或者说光源看起来像是在右边。
        // 这里的逻辑是：板子动，光不动 -> 相对运动
        const lightSourcePos = new Vec2(
            this.width / 2 - (tilt.x * 300), // X轴偏移：倾斜越大，光源相对位移越大
            -200 - (tilt.y * 100)            // Y轴偏移
        );
        const LIGHT_RADIUS = 150;
        const LIGHT_RADIUS_SQ = LIGHT_RADIUS * LIGHT_RADIUS;// 预计算平方，避免开根号
        // --- 绘制阴影 (传入动态光源) ---
        // DropBalls 发出的光
        this.dropBalls.forEach(ball => {
            if (!ball.active) return;
            this.pegs.forEach(p => {
                 // 这里是原有的小球光照阴影
                p.drawShadow(this.ctx, ball.pos, LIGHT_RADIUS);
            });
        });

        //  全局环境光阴影 (基于倾斜)
        // 让所有钉子都有一个基于板子倾斜的微弱基础阴影，增加立体感
        this.pegs.forEach(p => {
            // 我们利用 drawShadow 的逻辑，制造一个伪造的“太阳”
            p.drawShadow(this.ctx, lightSourcePos, 9999); // 半径很大，覆盖全屏
        });
        const lightSources = [...this.dropBalls];

        // --- 优化开始：只对范围内的钉子画阴影 ---
        lightSources.forEach(ball => {
            if (!ball.active) return;
            
            // 遍历所有钉子
            for (let i = 0; i < this.pegs.length; i++) {
                const p = this.pegs[i];
                // 简单的 AABB 预判或距离平方判断
                const dx = ball.pos.x - p.pos.x;
                const dy = ball.pos.y - p.pos.y;
                
                // 只有距离小于 LIGHT_RADIUS 时才绘制阴影
                // Math.abs 检查比乘法快，先做粗略筛选
                if (Math.abs(dx) < LIGHT_RADIUS && Math.abs(dy) < LIGHT_RADIUS) {
                    if ((dx*dx + dy*dy) < LIGHT_RADIUS_SQ) {
                        p.drawShadow(this.ctx, ball.pos, LIGHT_RADIUS);
                        p.calculateLight(ball.pos, LIGHT_RADIUS); // 光照计算也放这里
                    }
                }
            }
        });
        // 繪製釘子
        const pegRadius = Math.min(8, this.width / 60);
        this.pegs.forEach(p => { p.update(); p.draw(this.ctx, pegRadius); p.resetLight();});

        
        lightSources.forEach(ball => {
            // 优化：只检查垂直距离接近的行，或者直接遍历所有 (钉子数量不多，直接遍历性能没问题)
            this.pegs.forEach(p => {
                // 简单的性能优化：如果Y轴距离太远就不用算平方根了
                if (Math.abs(ball.pos.y - p.pos.y) < LIGHT_RADIUS) {
                    p.calculateLight(ball.pos, LIGHT_RADIUS);
                }
            });
        });
        this.specialSlots = this.specialSlots.filter(s => !s.hit);
        // 繪製特殊槽位
        this.specialSlots.forEach(s => s.draw(this.ctx));
        // --- 更新和绘制光柱 ---
        for (let i = this.collectionBeams.length - 1; i >= 0; i--) {
            const beam = this.collectionBeams[i];
            beam.update(timeScale);
            beam.draw(this.ctx);
            if (beam.life <= 0) this.collectionBeams.splice(i, 1);
        }
        // 更新和繪製下落的彈珠
        for (let i = this.dropBalls.length - 1; i >= 0; i--) {
            const ball = this.dropBalls[i];
            // **重要參數** result: 'finished' (落出屏幕), {type: 'collected', ...}, {type: 'slot', ...}, {action: 'split', ...}
            const result = ball.update(this.pegs, this.specialSlots, this.width, this.height, this.timeScale, tilt);
                
            //  绘制时也可以传入 tilt 做球体高光偏移 (可选)
            ball.draw(this.ctx, tilt);
            
            if (result) {
                // 處理彈珠落出屏幕
                if (result === 'finished') {
                    // 1. 生成光柱 (在球掉落的X轴位置，屏幕底部升起)
                    this.collectionBeams.push(new CollectionBeam(ball.pos.x, this.height));
                    
                    // 2. 触发 UI 卡片高亮
                    // 获取当前正在进行的配方卡片 DOM 元素
                    // 注意：nth-child 是从 1 开始的，activeMarbleIndex 是从 0 开始
                    const activeCardIdx = this.activeMarbleIndex + 1;
                    const activeCard = document.querySelector(`#gathering-hud-mount .recipe-card:nth-child(${activeCardIdx})`);
                    
                    if (activeCard) {
                        // 先移除可能存在的类（以防万一），强制重绘，再添加
                        activeCard.classList.remove('locked-anim');
                        void activeCard.offsetWidth; // 触发 Reflow
                        activeCard.classList.add('locked-anim');
                    }

                    // 3. 播放一个确认音效 (比如 reload 或 magic)
                    audio.playCollect(); // 或者 audio.playTone(800, 'sine', 0.2)
                    // 彈珠落出屏幕
                    this.dropBalls.splice(i, 1);
                    this.currentSession.activeBalls--;
                    
                    // --- ：不再直接結算，而是嘗試結算 ---
                    // 處理“能量球先落地，彈珠後死”的情況
                    this.attemptCompleteGatheringTurn();

                } else if (result.type === 'collected') {
                    // 彈珠收集到材料
                    this.currentSession.collected.push(result.material);
                    // 这样 UI (renderRecipeCard) 才能读取到变化
                    if (this.marbleQueue[this.activeMarbleIndex]) {
                        this.marbleQueue[this.activeMarbleIndex].collected.push(result.material);
                    }
                    this.createHitFeedback(ball.pos.x, ball.pos.y, ball.vel, result.material); // 這裡也許要傳入屬性類型作為顏色依據
                    audio.playCollect();
                    this.renderRecipeHUD();
                    
                } else if (result.type === 'slot') {
                    // 彈珠擊中特殊槽位
                    if (result.slotType === 'recall') {
                        // 回溯槽位：將彈珠傳送回頂部
                        ball.pos.y = 50;
                        ball.vel = new Vec2(0, 2);
                        showToast("回溯!");
                    } else if (result.slotType === 'multicast') {
                        // 多重發射槽位：增加多重發射次數
                        if (!this.currentSession.multicastAdded.includes(i)) {
                            this.currentSession.multicast++;
                            this.currentSession.multicastAdded.push(i);
                            showToast("+連射!");
                        }
                    } else if (result.slotType === 'split' && ball.canTriggerSplitSlot) {
                        // 分裂槽位：分裂彈珠
                        ball.canTriggerSplitSlot = false;
                        const newBall = new DropBall(ball.pos.x, ball.pos.y, ball.def, this.currentSession);
                        newBall.vel = new Vec2(-ball.vel.x, ball.vel.y);
                        newBall.canTriggerSplitSlot = false;
                        this.dropBalls.push(newBall);
                        this.currentSession.activeBalls++;
                        showToast("分裂!");
                    } else if (result.slotType === 'relic') {
                        // 調用遺物選擇
                        this.showRelicSelection(); 
                        
                        // 將彈珠移除
                        this.dropBalls.splice(i, 1);
                        this.currentSession.activeBalls--;
                    }
                } else if (result.action === 'split') {
                    // 處理 DropBall 內部觸發的分裂
                    const newBall1 = new DropBall(result.pos.x - 10, result.pos.y, result.def, this.currentSession);
                    const newBall2 = new DropBall(result.pos.x + 10, result.pos.y, result.def, this.currentSession);
                    newBall1.vel = new Vec2(-Math.abs(result.vel.x) - 2, result.vel.y);
                    newBall2.vel = new Vec2(Math.abs(result.vel.x) + 2, result.vel.y);
                    newBall1.canTriggerSplitSlot = false;
                    newBall2.canTriggerSplitSlot = false;
                    this.dropBalls.push(newBall1, newBall2);
                    this.currentSession.activeBalls += 1; 
                    this.dropBalls.splice(i, 1);
                    showToast("分裂!");
                } else if (result.action === 'rainbow_split') {
                    // 處理彩虹彈珠分裂
                    const colors = ['bounce', 'pierce', 'scatter'];
                    if (this.marbleQueue[this.activeMarbleIndex]) {
                        colors.forEach(c => {
                            this.marbleQueue[this.activeMarbleIndex].collected.push(c);
                        });
                    }
                    colors.forEach((c, idx) => {
                        const shardDef = new MarbleDefinition('colored', c);
                        const shard = new DropBall(result.pos.x + (idx - 1) * 20, result.pos.y, shardDef, this.currentSession);
                        shard.vel = new Vec2((idx - 1) * 3, result.vel.y);
                        shard.isRainbowShard = true;
                        this.dropBalls.push(shard);

                        // --- [新增修复]：分裂时直接将对应的材料加入收集列表 ---
                        this.currentSession.collected.push(c);
                    });
                    
                    this.currentSession.activeBalls += 2; // -1 (本体) + 3 (碎片) = +2
                    this.dropBalls.splice(i, 1);
                    
                    // --- [新增修复]：刷新 UI 以显示新收集到的材料 ---
                    this.renderRecipeHUD();
                    
                    showToast("彩虹分裂!");
                }
            }
        } 
        
        // --- 更新和繪製能量球 ---
        for (let i = this.energyOrbs.length - 1; i >= 0; i--) {
            const orb = this.energyOrbs[i];
            orb.update(timeScale);
            orb.draw(this.ctx);
            if (!orb.active) this.energyOrbs.splice(i, 1);
        }
        // 繪製粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(this.timeScale);
            p.draw(this.ctx);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        // 更新和繪製 Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            let s = this.shockwaves[i];
            if (s) {
                s.update(timeScale);
                s.draw(this.ctx);
                if (s.alpha <= 0) this.shockwaves.splice(i, 1);
            }
        }
        // 在 updateGathering 的末尾添加对 DOM 的操作
        //const container = document.getElementById('game-container');
        const tx = this.boardTilt.current.x * -10; // 负值产生视差
        const ty = this.boardTilt.current.y * -5;

        // 这里的 transform 会让整个 UI 产生微弱的悬浮感
        container.style.perspective = "1000px";
        // 甚至可以增加旋转感 (谨慎使用，可能会晕)
        container.style.transform = `rotateY(${tx * 0.2}deg) rotateX(${-ty * 0.2}deg)`;

    }
    // ==================== 战斗阶段代理方法 ====================
    // 这些方法将调用委托给CombatPhase实例
    
    damageEnemy(enemy, projectile) { return this.combatPhase.damageEnemy(enemy, projectile); }
    spawnEnemyRowAt(yPos) { return this.combatPhase.spawnEnemyRowAt(yPos); }
    spawnBullet(x, y, vel, recipe) { return this.combatPhase.spawnBullet(x, y, vel, recipe); }
    fireLaser(startX, startY, vel, recipe) { return this.combatPhase.fireLaser(startX, startY, vel, recipe); }
    castRayToReflectors(start, dir, maxDist) { return this.combatPhase.castRayToReflectors(start, dir, maxDist); }
    processLaserPenetration(p1, p2, recipe) { return this.combatPhase.processLaserPenetration(p1, p2, recipe); }
    getLineRectIntersection(start, dir, rx, ry, rw, rh) { return this.combatPhase.getLineRectIntersection(start, dir, rx, ry, rw, rh); }
    triggerLightningChain(sourceEnemy, dmg, history) { return this.combatPhase.triggerLightningChain(sourceEnemy, dmg, history); }
    startCombatPhase() { return this.combatPhase.startCombatPhase(); }
    advanceWave() { return this.combatPhase.advanceWave(); }
    spawnEnemyRow(count) { return this.combatPhase.spawnEnemyRow(count); }
    recordDamage(amount) { return this.combatPhase.recordDamage(amount); }
    addScore(amount) { return this.combatPhase.addScore(amount); }
    resetMultiplier() { return this.combatPhase.resetMultiplier(); }
    updateMultiplierUI() { return this.combatPhase.updateMultiplierUI(); }
    calculateWaveSpeed() { return this.combatPhase.calculateWaveSpeed(); }
    clearProjectiles() { return this.combatPhase.clearProjectiles(); }
    checkEnemyHover(pos) { return this.combatPhase.checkEnemyHover(pos); }
    fireNextShot(vel) { return this.combatPhase.fireNextShot(vel); }
    createHitFeedback(x, y, velocity, type) { return this.combatPhase.createHitFeedback(x, y, velocity, type); }
    triggerLevelUpEvent(uiX, uiY) { return this.combatPhase.triggerLevelUpEvent(uiX, uiY); }
    processSingleEnemyTurn(e) { return this.combatPhase.processSingleEnemyTurn(e); }
    startEnemyTurnLogic() { return this.combatPhase.startEnemyTurnLogic(); }
    finalizeRound() { return this.combatPhase.finalizeRound(); }
    checkDefeat() { return this.combatPhase.checkDefeat(); }
    isAreaOccupied(x, y, w, h, excludeEnemy) { return this.combatPhase.isAreaOccupied(x, y, w, h, excludeEnemy); }
    triggerCloneSpawn(sourceEnemy) { return this.combatPhase.triggerCloneSpawn(sourceEnemy); }
    generateAffixes() { return this.combatPhase.generateAffixes(); }
    activateSkill(skill) { return this.combatPhase.activateSkill(skill); }
    createExplosion(x, y, color) { return this.combatPhase.createExplosion(x, y, color); }
    createShockwave(x, y, color) { return this.combatPhase.createShockwave(x, y, color); }
    createParticle(x, y, color, mode) { return this.combatPhase.createParticle(x, y, color, mode); }
    createFloatingText(x, y, text, color) { return this.combatPhase.createFloatingText(x, y, text, color); }
    updateMulticastDisplay(bonusAmount) { return this.combatPhase.updateMulticastDisplay(bonusAmount); }
    playMulticastTransferEffect(multicastValue) { return this.combatPhase.playMulticastTransferEffect(multicastValue); }
    compileCollectionToRecipe(marbleDef, collectedTypes, hasMulticast) { return this.combatPhase.compileCollectionToRecipe(marbleDef, collectedTypes, hasMulticast); }
    updateUICache() { return this.combatPhase.updateUICache(); }
    initRecipeHUD() { return this.combatPhase.initRecipeHUD(); }
    toggleHud() { return this.combatPhase.toggleHud(); }
    renderRecipeHUD() { return this.combatPhase.renderRecipeHUD(); }
    renderRecipeCard(container, item, isActive, statusClass) { return this.combatPhase.renderRecipeCard(container, item, isActive, statusClass); }
    renderAmmoIcon(container, recipe, isCurrent) { return this.combatPhase.renderAmmoIcon(container, recipe, isCurrent); }
    updateAmmoUI() { return this.combatPhase.updateAmmoUI(); }
    drawLauncherOrbitals(ctx, centerX, centerY, recipe) { return this.combatPhase.drawLauncherOrbitals(ctx, centerX, centerY, recipe); }
    updateCombat(timeScale) { return this.combatPhase.updateCombat(timeScale); }

}

// 默认导出
export default Game;
