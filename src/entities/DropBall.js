/**
 * 收集阶段弹珠类
 * 负责弹珠物理模拟、碰撞检测、材料收集和特殊槽位触发
 */

import { Vec2 } from '../core/Vec2.js';
import { CONFIG } from '../config/index.js';
import { Particle } from '../effects/Particle.js';

/**
 * DropBall 类 - 收集阶段的弹珠
 * @class
 */
export class DropBall {
    /**
     * 收集阶段的弹珠类
     * @param {number} x - 初始 x 坐标
     * @param {number} y - 初始 y 坐标
     * @param {MarbleDefinition} marbleDef - 弹珠定义
     * @param {object} session - 当前收集会话数据 (包含 collected, multicast, currentHits 等)
     */
    constructor(x, y, marbleDef, session) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2((Math.random() - 0.5) * 2, 2);
        this.radius = CONFIG.physics.marbleRadius;
        this.active = true;
        this.def = marbleDef;
        this.session = session;
        this.isRainbowShard = false; // 是否为彩虹弹珠分裂出的碎片
        this.portalCooldown = 0; // 槽位冷却时间
        this.hitCount = 0; // 撞击次数
        this.canTriggerSplitSlot = true; // 是否可以触发分裂槽位
        this.rollingSound = window.audio ? window.audio.createRollingSound() : null;
        
        // --- Visual State ---
        this.lifeTime = 0; // 用于驱动动画
        this.visualSeed = Math.random() * 1000; // 随机种子，用于闪电/噪点的不规则跳动
    }

    /**
     * [核心方法] 获取当前所有属性的层数
     * 结合了"弹珠自带属性"和"收集到的属性"
     * @returns {object} 属性状态对象
     */
    getBuffState() {
        const stats = {
            cryo: 0,
            pyro: 0,
            lightning: 0,
            laser: 0,
            intensity: 0 // 总强度，用于控制通用光晕
        };

        // 1. 统计弹珠自带属性
        

        // 2. 统计收集到的属性
        if (this.session && this.session.collected) {
            this.session.collected.forEach(type => {
                if (stats.hasOwnProperty(type)) {
                    stats[type]++;
                }
            });
        }
        
        // 限制最大层数以免特效太夸张
        stats.cryo = Math.min(12, stats.cryo);
        stats.pyro = Math.min(12, stats.pyro);
        stats.lightning = Math.min(12, stats.lightning);
        stats.laser = Math.min(12, stats.laser);
        
        // 计算总强度
        stats.intensity = stats.cryo + stats.pyro + stats.lightning + stats.laser;

        return stats;
    }

    /**
     * 更新弹珠位置和处理碰撞
     * @param {Peg[]} pegs - 所有钉子
     * @param {SpecialSlot[]} slots - 所有特殊槽位
     * @param {number} width - 游戏区域宽度
     * @param {number} height - 游戏区域高度
     * @param {number} timeScale - 时间缩放因子
     * @param {object} tilt - 倾斜参数 {x, y}
     * @returns {string|object|null} 碰撞结果 ('finished' 或 {action: 'split', ...} 或 null)
     */
    update(pegs, slots, width, height, timeScale, tilt = { x: 0, y: 0 }) {
        if (!this.active) {
            this.stopSound(); // 确保非活跃时停止声音
            return null;
        }

        this.lifeTime += timeScale;
        const buffs = this.getBuffState(); // 获取实时属性

        // --- 粒子生成逻辑 (基于当前拥有的属性) ---
        // 只要带有某种属性，就会掉落对应粒子
        if (Math.random() < 0.4 * timeScale) { 
            const r = this.radius;

            // --- 🔥 Pyro (过热): 上升的余烬 (Rising Embers) ---
            if (buffs.pyro > 0) {
                // 层数越高，余烬越密集
                const burnChance = 0.3 + (buffs.pyro * 0.42); 
                
                if (Math.random() < burnChance) {
                    // 1. 生成位置：在球体上半部分随机生成 (模拟热气)
                    const spawnX = this.pos.x + (Math.random() - 0.5) * r * 1.5;
                    const spawnY = this.pos.y - (Math.random() * r * 0.8); 

                    // 2. 调用新的 ember 模式
                    const ember = new Particle(spawnX, spawnY, '#fbbf24', { mode: 'ember' });
                    
                    // [微调] 根据层数，让火焰升腾得更快
                    ember.vel.y -= (buffs.pyro * 0.2);  
                    ember.size *= (0.42 + Math.random() * 4.2); // 大小随机
                    
                    if (window.game && window.game.particles) {
                        window.game.particles.add(ember);
                    }
                    
                    // 3. 偶尔生成黑烟 (增加对比度，让亮色更亮)
                    if (Math.random() < 0.15) {
                        const smoke = new Particle(spawnX, spawnY, 'rgba(0,0,0,0.3)', { mode: 'smoke' });
                        smoke.size = r * 0.6; // 较小的烟
                        smoke.vel.y *= 0.5;   // 慢速飘
                        if (window.game && window.game.particles) {
                            window.game.particles.add(smoke);
                        }
                    }
                }
            }

            // --- ❄️ Cryo (过冷): 下沉的冷气 - [优化版：模糊寒雾] ---
            if (buffs.cryo > 0) {
                // 层数越高，冷气越浓，生成频率越高
                const mistChance = 0.25 + (buffs.cryo * 0.15);

                if (Math.random() < mistChance) {
                    // 1. 生成位置：球体下半部分 (冷气下沉)
                    const spawnX = this.pos.x + (Math.random() - 0.5) * r * 1.2;
                    const spawnY = this.pos.y + (Math.random() * r * 0.6); 
                    
                    // 2. 使用 'mist' 模式
                    const mist = new Particle(spawnX, spawnY, null, { mode: 'mist' });
                    
                    // 微调：根据 Cryo 层数，雾气可以更大一点
                    mist.size *= (1 + buffs.cryo * 0.1);

                    if (window.game && window.game.particles) {
                        window.game.particles.add(mist);
                    }
                    
                    // 3. 偶尔生成一点点晶莹的冰渣 (增加对比度)
                    if (Math.random() < 0.05) {
                        const shard = new Particle(spawnX, spawnY, '#a5f3fc', { mode: 'shard' });
                        shard.size = 2; // 很小的冰晶
                        if (window.game && window.game.particles) {
                            window.game.particles.add(shard);
                        }
                    }
                }
            }
            
            // --- ⚡ Lightning (闪电): 偶尔残留电弧 ---
            if (buffs.lightning > 0 && Math.random() < 0.02 * buffs.lightning) {
                if (window.game && window.game.createParticle) {
                    window.game.createParticle(this.pos.x, this.pos.y, '#d8b4fe', 'spark');
                }
            }
        }

        if (this.portalCooldown > 0) this.portalCooldown -= timeScale;

        // 重力计算
        // 基础重力
        let gx = 0;
        let gy = CONFIG.physics.gravity;

        // 叠加倾斜影响
        // x轴倾斜直接产生横向重力
        gx += tilt.x * 0.05; // 0.25 是倾斜重力系数，可调整手感
        
        // y轴倾斜微调垂直重力 (前倾加速，后倾减速)
        // gy += tilt.y * 0.1;

        let gravityStep = new Vec2(gx * timeScale, gy * timeScale);
        
        this.vel = this.vel.add(gravityStep);
        this.pos = this.pos.add(this.vel.mult(timeScale));
        this.vel = this.vel.mult(Math.pow(CONFIG.physics.friction, timeScale));

        // 更新滚动音效
        // 计算当前速度的大小 (Magnitude)
        const currentSpeed = this.vel.mag();
        // 只有当球在向下滚动或者速度较快时才有声音 (防止卡在某处时还有声音)
        if (this.rollingSound) {
            this.rollingSound.update(currentSpeed);
        }

        // 边界碰撞
        if (this.pos.x < this.radius) { 
            this.pos.x = this.radius; 
            this.vel.x *= -0.6; 
        }
        if (this.pos.x > width - this.radius) { 
            this.pos.x = width - this.radius; 
            this.vel.x *= -0.6; 
        }
        
        // 底部退出
        if (this.pos.y > height + 150) { 
            this.active = false; 
            this.stopSound(); 
            return 'finished'; 
        }

        // 特殊槽位检测逻辑
        for (let slot of slots) {
            if (slot.hit) continue;
            if (this.portalCooldown <= 0) {
                let dx = Math.abs(this.pos.x - slot.x);
                let dy = Math.abs(this.pos.y - slot.y);
                if (dy < 12 && dx < slot.width / 2) {
                    slot.hit = true;
                    this.portalCooldown = 40; 
                    
                    if (slot.type === 'recall') {
                        this.pos.y = 80; 
                        this.vel.y = 2; 
                        this.portalCooldown = 60; 
                        if (window.audio) window.audio.playPowerup(); 
                        if (window.game) window.game.createExplosion(slot.x, slot.y, CONFIG.colors.slotRecall); 
                        if (window.showToast) window.showToast("時空回溯！");
                    } else if (slot.type === 'multicast') {
                        if (this.session.multicastAdded.indexOf(slot) === -1) { 
                            this.session.multicast += 2; 
                            if (window.audio) window.audio.playPowerup(); 
                            if (window.game) window.game.createExplosion(slot.x, slot.y, CONFIG.colors.slotMulticast); 
                            if (window.showToast) window.showToast("連續發射+2！");
                            if (window.game) window.game.updateMulticastDisplay(2);
                        }
                    } else if (slot.type === 'split') {
                        if (this.canTriggerSplitSlot) {
                            this.active = false; 
                            this.stopSound();
                            if (window.audio) window.audio.playPowerup(); 
                            if (window.game) window.game.createExplosion(slot.x, slot.y, CONFIG.colors.slotSplit); 
                            return { action: 'split', pos: this.pos, vel: this.vel, def: this.def };
                        }
                    } else if (slot.type === 'relic') {
                        this.active = false; 
                        this.stopSound();
                        if (window.audio) window.audio.playPowerup(); 
                        if (window.game) window.game.createExplosion(slot.x, slot.y, '#facc15'); 
                        return { type: 'slot', slotType: 'relic', pos: this.pos };
                    } else if (slot.type === 'giant') {
                        // 視覺與物理變大 (默認是 9.2，這裡設為 14 讓效果更明顯)
                        this.radius = 14.0; 
                        if (window.audio) window.audio.playPowerup(); 
                        if (window.game) window.game.createExplosion(slot.x, slot.y, CONFIG.colors.slotGiant); 
                        if (window.showToast) window.showToast("巨大化!");
                    } else if (slot.type === 'skill_point') {
                        // [新增] 技能點槽邏輯
                        // 1. 標記槽位被擊中 (立即消失)
                        slot.hit = true;

                        // 2. 播放原地音效與爆炸 (立即反饋)
                        if (window.audio) window.audio.playPowerup();
                        if (window.game) window.game.createExplosion(slot.x, slot.y, CONFIG.colors.slotSkill); 
                        if (window.showToast) window.showToast("技能點獲取!");

                        // --- [新增] 引導動畫邏輯 ---
                        
                        // A. 計算 UI 目標位置 (下一個空的技能槽)
                        // 獲取所有槽位 DOM
                        const uiSlots = document.querySelectorAll('.sp-slot');
                        // 當前點數即為下一個空槽的索引 (例如有0點，下一個是第0個)
                        const targetIndex = window.game ? window.game.skillPoints : 0; 
                        
                        let targetX = width / 2; // 默認兜底位置
                        let targetY = 80;

                        // 如果能找到對應的 DOM 元素，計算其中心坐標
                        if (uiSlots && uiSlots[targetIndex]) {
                            const rect = uiSlots[targetIndex].getBoundingClientRect();
                            targetX = rect.left + rect.width / 2;
                            targetY = rect.top + rect.height / 2;
                        }

                        // B. 創建飛行能量球
                        // 注意：EnergyOrb 类需要从其他模块导入或在 Game 类中处理
                        if (window.EnergyOrb && window.game) {
                            const orb = new window.EnergyOrb(
                                slot.x, slot.y,   // 起點：槽位位置
                                targetX, targetY, // 終點：UI 位置
                                CONFIG.colors.slotSkill, // 顏色：綠色
                                new Vec2(0, -8),  // 初速度：向上噴出
                                () => {
                                    // --- C. 到達回調 (On Arrive) ---
                                    // 只有當球飛到時，才真正增加點數
                                    if (window.game) window.game.addSkillPoint(1);

                                    // 觸發 UI 閃光特效
                                    const updatedSlots = document.querySelectorAll('.sp-slot');
                                    const filledSlot = updatedSlots[window.game ? window.game.skillPoints - 1 : 0];
                                    
                                    if (filledSlot) {
                                        filledSlot.classList.remove('flash');
                                        void filledSlot.offsetWidth; // 強制重繪
                                        filledSlot.classList.add('flash');
                                    }
                                    
                                    // 播放到達音效 (可選)
                                    if (window.audio) window.audio.playCollect();
                                }
                            );

                            // 將光球加入遊戲循環
                            window.game.energyOrbs.push(orb);
                        }
                    }
                }
            }
        }

        // 钉子碰撞检测逻辑
        for (let peg of pegs) {
            let dist = this.pos.dist(peg.pos); 
            let minDist = this.radius + peg.radius;
            if (dist < minDist) {
                // 反弹逻辑
                let n = this.pos.sub(peg.pos).norm();
                this.pos = peg.pos.add(n.mult(minDist + 0.1));
                const impactVel = new Vec2(this.vel.x, this.vel.y);

                let d = this.vel.dot(n);
                if (d < 0) {
                    let elasticity = CONFIG.physics.elasticity; 
                    if (peg.type === 'pink') elasticity *= CONFIG.physics.pinkpegElasticityMuti; 
                    this.vel = this.vel.sub(n.mult(2 * d)).mult(elasticity);
                    this.vel.x += (Math.random() - 0.5) * 0.5;
                }

                if (peg.cooldown <= 0) {
                    // --- [关键修改：传递速度参数] ---
                    const impactSpeedVal = impactVel.mag(); 
                    peg.hit(impactSpeedVal);
                    this.hitCount++; 
                    this.session.currentHits++; 
                    if (window.game) window.game.createHitFeedback(this.pos.x, this.pos.y, impactVel);
                    
                    if (this.session.currentHits >= this.session.nextTriggerThreshold) {
                        this.session.currentHits = 0;
                        this.session.multicast++;
                        // 增加阈值
                        this.session.nextTriggerThreshold = this.session.nextTriggerThreshold + CONFIG.gameplay.nextTriggerThresholdIncrease;
                        // 同步更新 Game 类的持久变量，确保下一颗球能继承这个数值
                        if (window.game) window.game.persistentThreshold = this.session.nextTriggerThreshold;
                        if (window.showToast) window.showToast(`充能！下一次: ${this.session.nextTriggerThreshold}`); 
                        if (window.audio) window.audio.playPowerup();
                    }
                    
                    if (peg.type !== 'normal' && peg.type !== 'pink') { 
                        // --- [新增/修改] 实时合成逻辑 ---
                        let finalType = peg.type;
                        let isSynthesized = false;
                        const collectedList = this.session.collected;

                        // 1. 捡到火，找冰
                        if (peg.type === 'pyro') {
                            const iceIdx = collectedList.indexOf('cryo');
                            if (iceIdx !== -1) {
                                collectedList.splice(iceIdx, 1); // 移除一个冰
                                finalType = 'lightning';         // 变成雷
                                isSynthesized = true;
                            }
                        }
                        // 2. 捡到冰，找火
                        else if (peg.type === 'cryo') {
                            const fireIdx = collectedList.indexOf('pyro');
                            if (fireIdx !== -1) {
                                collectedList.splice(fireIdx, 1); // 移除一个火
                                finalType = 'lightning';          // 变成雷
                                isSynthesized = true;
                            }
                        }
                        // 将最终结果加入收集列表
                        this.session.collected.push(finalType); 
                        this.def.collected.push(finalType); 

                        // --- 合成反馈 ---
                        if (isSynthesized) {
                            if (window.game) window.game.createFloatingText(this.pos.x, this.pos.y, "⚡ SYNTHESIS!", "#c084fc");
                            if (window.audio) window.audio.playLightning(); // 播放闪电音效
                        }

                        return { type: 'collected', material: finalType };
                    }
                    
                    let assimilationType = null;
                    if (this.def.type === 'colored' && this.def.subtype) {
                        assimilationType = this.def.subtype;
                    } else if (this.def.type === 'laser') {
                        assimilationType = 'laser';
                    }

                    if (assimilationType) { 
                        // 同化概率 (如果是激光，概率也可以单独设，这里沿用 colored 的概率)
                        const chance = CONFIG.gameplay.assimilationChance[assimilationType] || 0.3;
                        
                        if (peg.type !== 'pink' && peg.type !== assimilationType && Math.random() < chance) {
                            peg.type = assimilationType; // 变成对应类型
                            if (window.audio) window.audio.playMagic();
                            // 粒子特效
                            const pColor = assimilationType === 'laser' ? CONFIG.colors.laser : this.def.getColor();
                            if (window.game) {
                                window.game.createParticle(peg.pos.x, peg.pos.y, pColor);
                                window.game.createShockwave(peg.pos.x, peg.pos.y, pColor);
                            }
                        }
                    }
                    
                    if (this.def.type === 'rainbow' && !this.isRainbowShard) { 
                        this.active = false; 
                        this.stopSound();
                        return { action: 'rainbow_split', pos: this.pos, vel: this.vel }; 
                    }
                }
            }
        }
        return null;
    }

    /**
     * 停止滚动音效
     */
    stopSound() {
        if (this.rollingSound) {
            this.rollingSound.stop();
            this.rollingSound = null;
        }
    }

    /**
     * 分层绘制弹珠 (优化：火焰混沌闪烁)
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.active) return;
        
        const x = this.pos.x;
        const y = this.pos.y;
        const r = this.radius;
        const buffs = this.getBuffState();
        
        ctx.save();
        ctx.translate(x, y);

        // ==========================================
        //  🔥 混沌闪烁计算 (通用火焰与爆破)
        // ==========================================
        let fireFlicker = 0;
        if (buffs.pyro > 0 || this.def.type === 'redStripe') {
            const slow = Math.sin(this.lifeTime * 0.1); 
            const fast = Math.sin(this.lifeTime * 0.8);
            const noise = Math.random() * 0.3;
            fireFlicker = 0.6 + (slow * 0.1) + (fast * 0.1) + noise;
        }

        // ==========================================
        //  LAYER 0: 🔦 Ambient Spotlight (环境光)
        // ==========================================
        let glowColor = '255, 255, 255'; 
        let maxStack = 0;

        if (buffs.pyro > maxStack) { maxStack = buffs.pyro; glowColor = '251, 146, 60'; } // Orange
        if (buffs.cryo > maxStack) { maxStack = buffs.cryo; glowColor = '103, 232, 249'; } // Cyan
        if (buffs.lightning > maxStack) { maxStack = buffs.lightning; glowColor = '216, 180, 254'; } // Purple
        if (buffs.laser > maxStack) { maxStack = buffs.laser; glowColor = '56, 189, 248'; } // Sky
        
        // [修改]：爆破弹珠的专属环境光 (危险的红色)
        if (this.def.type === 'redStripe') {
            glowColor = '239, 68, 68'; // Red-500
            maxStack = 5; // 强制最大光晕
        } else if (maxStack === 0 && this.def.type === 'rainbow') {
            glowColor = '244, 114, 182'; 
        }

        let baseAlpha = 0.042 + (maxStack * 0.03); 
        let currentAlpha = baseAlpha;
        
        // [修改]：爆破弹珠的光晕会剧烈闪烁
        if (this.def.type === 'redStripe') {
            const strobe = (Math.sin(Date.now() / 50) + 1) / 2; // 高频闪烁
            currentAlpha = baseAlpha * (0.5 + strobe); // 0.5 ~ 1.5 倍强度
        } else if (buffs.pyro > 0 && maxStack === buffs.pyro) {
            currentAlpha = baseAlpha * fireFlicker;
        } else {
            const breathSpeed = 0.05 + (maxStack * 0.05);
            const breath = (Math.sin(this.lifeTime * breathSpeed) + 1) / 2; 
            currentAlpha = baseAlpha + (breath * 0.04);
        }

        const spotR = r * 30; 
        const spot = ctx.createRadialGradient(0, 0, r, 0, 0, spotR);
        spot.addColorStop(0, `rgba(${glowColor}, ${currentAlpha})`);
        spot.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.fillStyle = spot;
        ctx.beginPath(); 
        ctx.arc(0, 0, spotR, 0, Math.PI * 2); 
        ctx.fill();

        // ==========================================
        //  LAYER 1: 🔦 Laser Back Aura (激光背光)
        // ==========================================
        if (buffs.laser > 0) {
            const laserColor = CONFIG.colors.laser || '#0ea5e9';
            const pulse = (Math.sin(this.lifeTime * 5) + 1) / 1; 
            const sizeMod = 1 + (buffs.laser * 0.15); 
            ctx.save();
            ctx.globalCompositeOperation = 'lighter'; 
            ctx.shadowBlur = (15 + pulse * 10) * sizeMod;
            ctx.shadowColor = laserColor;
            ctx.fillStyle = laserColor;
            ctx.globalAlpha = 0.5 + (pulse * 0.2); 
            ctx.beginPath(); 
            ctx.arc(0, 0, r * (1.1 + pulse * 0.1) * sizeMod, 0, Math.PI * 2); 
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9;
            ctx.beginPath(); 
            ctx.arc(0, 0, 2, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();
        }

        // ==========================================
        //  LAYER 2: Base Ball (球体本体)
        // ==========================================
        
        // [新增/修改]：爆破弹珠专属绘制逻辑 (RedStripe)
        if (this.def.type === 'redStripe') {
            // 1. 物理抖动 (Visual Jitter)
            const shake = 1.2;
            ctx.save();
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

            // 2. 警报脉冲 (Strobe)
            const time = Date.now();
            const pulse = (Math.sin(time / 60) + 1) / 2; // 极快
            
            // 颜色循环：暗红 -> 鲜红 -> 纯白 (临界状态)
            let coreColor = '#b91c1c'; // base red
            let shellColor = '#7f1d1d'; // dark shell
            let glowIntensity = 10;
            
            if (pulse > 0.8) {
                coreColor = '#ffffff'; // Flash White
                shellColor = '#ef4444'; // Bright Red Shell
                glowIntensity = 30;
            } else {
                coreColor = '#ef4444';
                glowIntensity = 15;
            }

            // 3. 绘制外壳 (Dark Containment)
            const shellGrad = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, 0, 0, r);
            shellGrad.addColorStop(0, shellColor);
            shellGrad.addColorStop(1, '#450a0a'); // Almost black red
            ctx.fillStyle = shellGrad;
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
            ctx.fill();

            // 4. 绘制不稳定核心 (Unstable Core)
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = '#ef4444';
            ctx.fillStyle = coreColor;
            
            // 核心是一个在呼吸的小圆
            const coreSize = r * (0.4 + pulse * 0.2);
            ctx.beginPath(); 
            ctx.arc(0, 0, coreSize, 0, Math.PI * 2); 
            ctx.fill();

            // 5. 绘制表面的能量裂纹 (Cracks)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.6})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // 画一个简单的十字裂纹或者 X 形
            ctx.moveTo(-r * 0.6, 0); 
            ctx.lineTo(r * 0.6, 0);
            ctx.moveTo(0, -r * 0.6); 
            ctx.lineTo(0, r * 0.6);
            ctx.stroke();

            ctx.restore(); // 结束抖动

        } 
        // [原有逻辑]：Pyro 火焰属性 (保持流体感)
        else if (buffs.pyro > 0) {
            const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
            bodyGrad.addColorStop(0, '#f97316'); 
            bodyGrad.addColorStop(1, '#9a3412'); 
            ctx.fillStyle = bodyGrad;
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
            ctx.fill();

            // 内部流动的能量 (Internal Plasma)
            ctx.save();
            ctx.globalCompositeOperation = 'lighter'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
            ctx.clip();
            const time = this.lifeTime;
            for (let i = 0; i < 2; i++) {
                ctx.save();
                const dir = i === 0 ? 1 : -1;
                const speed = i === 0 ? 1.0 : 0.6;
                ctx.rotate(time * speed * dir);
                const plasmaGrad = ctx.createRadialGradient(r * 0.4, 0, 0, r * 0.4, 0, r * 0.8);
                if (i === 0) {
                    plasmaGrad.addColorStop(0, 'rgba(253, 224, 71, 0.5)'); 
                    plasmaGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
                } else {
                    plasmaGrad.addColorStop(0, 'rgba(251, 146, 60, 0.4)'); 
                    plasmaGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
                }
                ctx.fillStyle = plasmaGrad;
                ctx.beginPath();
                ctx.ellipse(r * 0.2, 0, r * 0.9, r * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            
            // 热浪边缘
            const pulse = (Math.sin(this.lifeTime * 3) + 1) / 2;
            const heatSize = 1.05 + (buffs.pyro * 0.05) + (pulse * 0.05);
            const heatGrad = ctx.createRadialGradient(0, 0, r, 0, 0, r * heatSize);
            heatGrad.addColorStop(0, 'rgba(249, 115, 22, 0.5)');
            heatGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = heatGrad;
            ctx.beginPath(); 
            ctx.arc(0, 0, r * heatSize, 0, Math.PI * 2); 
            ctx.fill();

        } else {
            // 其他普通/彩虹/套娃弹珠逻辑
            let baseLight = '#f8fafc';
            let baseDark = '#334155';
            
            if (this.def.type === 'rainbow') {
                const grad = ctx.createLinearGradient(-r, -r, r, r);
                grad.addColorStop(0, '#fca5a5'); 
                grad.addColorStop(0.5, '#facc15'); 
                grad.addColorStop(1, '#60a5fa');
                ctx.fillStyle = grad; 
                ctx.beginPath(); 
                ctx.arc(0, 0, r, 0, Math.PI * 2); 
                ctx.fill();
            } 
            else if (this.def.type === 'matryoshka') {
                baseLight = '#f5d0fe'; 
                baseDark = '#86198f';
                this._drawBaseBall(ctx, r, baseLight, baseDark);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; 
                ctx.lineWidth = 1;
                ctx.beginPath(); 
                ctx.arc(0, 0, r - 2, 0, Math.PI * 2); 
                ctx.stroke();
            } 
            else {
                const map = {
                    'bounce': ['#dcfce7', '#15803d'],
                    'pierce': ['#fee2e2', '#b91c1c'],
                    'scatter': ['#fef9c3', '#a16207'],
                    'damage': ['#f3e8ff', '#7e22ce'],
                    'laser':  ['#e0f2fe', '#0369a1'],
                };
                if (this.def.subtype && map[this.def.subtype]) {
                    baseLight = map[this.def.subtype][0]; 
                    baseDark = map[this.def.subtype][1];
                } else if (this.def.type && map[this.def.type]) {
                    baseLight = map[this.def.type][0];
                    baseDark = map[this.def.type][1];
                }
                this._drawBaseBall(ctx, r, baseLight, baseDark);
            }
        }
        
        // 绘制顶部高光 (除了爆破弹，因为爆破弹已经有核心高光了)
        if (this.def.type !== 'redStripe') {
            this._drawHighlight(ctx, r);
        }

        // ==========================================
        //  LAYER 3: ❄️ Cryo (Overlay)
        // ==========================================
        if (buffs.cryo > 0) {
            const alpha = 0.2 + (buffs.cryo * 0.12);
            const iceGrad = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
            iceGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            iceGrad.addColorStop(1, `rgba(165, 243, 252, ${alpha * 1.2})`);
            ctx.fillStyle = iceGrad;
            ctx.beginPath(); 
            ctx.arc(0, 0, r, 0, Math.PI * 2); 
            ctx.fill();
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.6, alpha)})`;
            for (let i = 0; i < 3; i++) {
                const angle = (this.visualSeed + i * 2.5 + this.lifeTime * 0.02) % (Math.PI * 2);
                const dist = r * 0.6;
                ctx.beginPath(); 
                ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, r * 0.25, 0, Math.PI * 2); 
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // ==========================================
        //  LAYER 4: ⚡ Lightning (Top Effect)
        // ==========================================
        if (buffs.lightning > 0) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'lighter'; 
            const triggerChance = 0.2 + (buffs.lightning * 0.15);
            if (Math.random() < triggerChance) {
                const arcCount = 1 + Math.floor(Math.random() * (buffs.lightning * 0.6));
                ctx.shadowBlur = 10 + buffs.lightning * 3; 
                ctx.shadowColor = '#a855f7'; 
                ctx.strokeStyle = '#e9d5ff'; 
                for (let k = 0; k < arcCount; k++) {
                    const startAngle = Math.random() * Math.PI * 2;
                    const arcLen = 0.8 + Math.random() * 0.8; 
                    ctx.beginPath();
                    const segments = 4 + Math.floor(Math.random() * 3);
                    for (let i = 0; i <= segments; i++) {
                        const t = i / segments;
                        const currentAngle = startAngle + t * arcLen;
                        const jitter = (Math.random() - 0.5) * (r * 0.4); 
                        const dist = r * 1.25 + jitter; 
                        const px = Math.cos(currentAngle) * dist;
                        const py = Math.sin(currentAngle) * dist;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.lineWidth = 1.0 + Math.random() * 1.5;
                    ctx.stroke();
                }
                if (Math.random() < 0.3) {
                    ctx.fillStyle = 'rgba(216, 180, 254, 0.4)'; 
                    ctx.beginPath(); 
                    ctx.arc(0, 0, r, 0, Math.PI * 2); 
                    ctx.fill();
                }
            }
            ctx.restore();
        }
        
        ctx.restore();
    }

    /**
     * 绘制基础球体
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} r - 半径
     * @param {string} cLight - 亮色
     * @param {string} cDark - 暗色
     * @private
     */
    _drawBaseBall(ctx, r, cLight, cDark) {
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, cLight);
        grad.addColorStop(1, cDark);
        ctx.fillStyle = grad;
        ctx.beginPath(); 
        ctx.arc(0, 0, r, 0, Math.PI * 2); 
        ctx.fill();
    }

    /**
     * 绘制高光
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} r - 半径
     * @private
     */
    _drawHighlight(ctx, r) {
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
    }
}

export default DropBall;
