/**
 * 敌人类
 * 包含敌人基础属性、词缀系统、温度系统、状态效果和AI行为
 */

import { Vec2 } from '../core/Vec2.js';
import { lerp, lerpColor } from '../core/utils.js';
import { Particle } from '../effects/Particle.js';
import { CONFIG } from '../config/index.js';

/**
 * Enemy 类
 * 游戏中的敌人实体，包含血量、词缀、温度等属性
 */
export class Enemy {
    /**
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} hp - 当前血量
     * @param {number} maxHp - 最大血量
     * @param {string} type - 敌人类型 ('normal', 'elite', 'boss')
     * @param {Array} affixes - 词缀数组
     */
    constructor(x, y, width, height, hp, maxHp = hp, type = 'normal', affixes = []) {
        this.pos = new Vec2(x, y);
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHp = maxHp;

        // --- 血条动画相关 ---
        this.displayHp = this.hp;      // 真实血条的显示值 (平滑过渡)
        this.delayedHp = this.hp;      // 白色延迟血条的值
        this.whiteBarTimer = 0;        // 延迟缓冲计时器

        this.hpDropTimer = 0;
        this.active = true;
        this.type = type;
        this.affixes = affixes;
        this.hitTimer = 0;
        this.dropTargetY = y;
        this.justSpawned = true;
        this.temp = 0;
        this.bumpOffsetY = 0;
        this.isFrozenCurrentTurn = false;

        // 视觉种子
        this.visualSeed = Math.random();

        // --- 生成高级断裂纹路 (Fissures) ---
        // 不再是中心辐射，而是生成贯穿身体的随机折线
        this.fissures = [];
        const crackCount = 3; // 裂纹数量

        for (let i = 0; i < crackCount; i++) {
            const points = [];
            // 1. 随机起点 (在边界上)
            const angle = Math.random() * Math.PI * 2;
            // 半径略小于宽的一半，保证在身体内部
            const startDist = (width / 2) * 0.8;
            const start = new Vec2(Math.cos(angle) * startDist, Math.sin(angle) * startDist);
            points.push(start);

            // 2. 随机终点 (在对面)
            // 角度偏移 120~240度，保证裂纹是横穿的
            const endAngle = angle + Math.PI + (Math.random() - 0.5);
            const endDist = (width / 2) * 0.8;
            const end = new Vec2(Math.cos(endAngle) * endDist, Math.sin(endAngle) * endDist);

            // 3. 生成 2-3 个中间断点 (Jitter Nodes)
            // 模拟岩石/冰层不规则的受力断裂
            const steps = 3;
            for (let j = 1; j < steps; j++) {
                const t = j / steps;
                // 线性插值位置
                const lerpX = start.x + (end.x - start.x) * t;
                const lerpY = start.y + (end.y - start.y) * t;

                // 垂直于路径方向的随机扰动
                const jitter = (Math.random() - 0.5) * (width * 0.4);

                points.push(new Vec2(lerpX + jitter, lerpY + jitter));
            }
            points.push(end);
            this.fissures.push(points);
        }

        this.hasActedThisTurn = false;
        this.scanFeedbackTimer = 0;
    }

    /**
     * 更新敌人状态
     * @param {number} timeScale - 时间缩放
     */
    update(timeScale) {
        if (!this.active) return;
        // 移动逻辑：吸附目标位置
        if (this.pos.y < this.dropTargetY) {
            this.pos.y += 3 * timeScale;
            if (this.pos.y > this.dropTargetY) this.pos.y = this.dropTargetY;
        }

        if (this.hitTimer > 0) this.hitTimer -= timeScale;
        if (this.justSpawned) { this.justSpawned = false; }

        // 弹跳恢复
        if (this.bumpOffsetY < 0) {
            this.bumpOffsetY += 1 * timeScale;
            if (this.bumpOffsetY > 0) this.bumpOffsetY = 0;
        } else if (this.bumpOffsetY > 0) { // 增加向下回弹的逻辑(冰冻时)
            this.bumpOffsetY -= 1 * timeScale;
            if (this.bumpOffsetY < 0) this.bumpOffsetY = 0;
        }

        // 血量滚动
        if (this.displayHp > this.hp) {
            const diff = this.displayHp - this.hp;
            if (diff > 20) {
                this.displayHp -= diff * 0.2 * timeScale;
                this.hpDropTimer = 0;
            } else {
                this.hpDropTimer += timeScale;
                if (this.hpDropTimer >= Math.max(1, 5 - Math.floor(diff / 5))) {
                    this.hpDropTimer = 0;
                    this.displayHp -= 1;
                }
            }
            if (this.displayHp < this.hp) this.displayHp = this.hp;
        } else {
            this.displayHp = this.hp;
            this.hpDropTimer = 0;
        }

        // 白色延迟血条逻辑
        if (this.whiteBarTimer > 0) {
            // 如果还在缓冲期（刚受过伤），白色血条不动，保持在旧的高位
            this.whiteBarTimer--;
        } else {
            // 缓冲结束，白色血条快速追赶当前血量
            if (this.delayedHp > this.displayHp) {
                // 追赶速度比 displayHp 快，产生"崩塌"感
                this.delayedHp = lerp(this.delayedHp, this.displayHp, 0.25);

                // 阈值修正，防止无限逼近
                if (Math.abs(this.delayedHp - this.displayHp) < 0.1) {
                    this.delayedHp = this.displayHp;
                }
            }
        }

        // 确保白色血条不会低于真实血条 (比如治疗时)
        if (this.delayedHp < this.displayHp) {
            this.delayedHp = this.displayHp;
        }
        this.updateTempParticles(timeScale);
    }

    /**
     * 处理随温度产生的持续粒子 (Mist巨型化版)
     * @param {number} timeScale - 时间缩放
     */
    updateTempParticles(timeScale) {
        const absTemp = Math.abs(this.temp);
        // 需要访问全局 game 对象
        if (!this.active || !window.game || this.pos.y > window.game.height) return;

        const game = window.game;

        // === 🔥 高温特效 (Heat) ===
        if (this.temp >= 34) {

            // 1. 燃烧前的黑烟 -> 改为 Mist (模拟热浪/蒸汽)
            // 概率随温度升高
            if (Math.random() < (0.05 + (this.temp / 200)) * timeScale) {
                const spawnX = this.pos.x + (Math.random() - 0.5) * this.width * 0.8;
                const spawnY = this.pos.y - this.height * 0.4;

                // 颜色：使用纯黑色，带一点透明度
                // 必须包含 '0,0,0' 以便让 Particle.draw 识别并关闭混合模式
                const smokeColor = `rgba(0, 0, 0, ${0.4 + Math.random() * 0.3})`;

                const heatSmoke = new Particle(spawnX, spawnY, smokeColor, { type: 'mist' });
                heatSmoke.vel.y = -0.8 - Math.random() * 0.8; // 上升速度稍快
                heatSmoke.vel.x = (Math.random() - 0.5) * 0.5; // 稍微左右飘
                heatSmoke.size = this.width * 0.35; // 大团烟雾
                game.particles.add(heatSmoke);
            }

            // 2. 燃烧时的黑烟 -> 改为 Ember (燃烧的余烬/火星)
            if (this.temp >= 100) {
                const count = Math.ceil((this.temp - 90) / 20);
                for (let i = 0; i < count; i++) {
                    if (Math.random() < 0.4 * timeScale) {
                        // 位置：全身随机冒出
                        const px = this.pos.x + (Math.random() - 0.5) * this.width;
                        const py = this.pos.y + (Math.random() - 0.5) * this.height;

                        // 颜色：亮橙色/金色
                        if (game.createParticle) {
                            game.createParticle(px, py, '#fbbf24', 'spark');
                        }

                        // 偶尔加一个颜色深一点的 'ember' 颗粒
                        if (Math.random() < 0.3) {
                            if (game.createParticle) {
                                game.createParticle(px, py, '#f97316', 'ember');
                            }
                        }
                    }
                }
            }
        }

        // === ❄️ 低温特效 (Cold) - (保持之前的 Mist 优化逻辑) ===
        if (this.temp <= -34) {
            const freezeIntensity = (absTemp - 34) / 66;
            const sizeFactor = this.width / 100;
            const baseChance = 0.2 * sizeFactor;
            const mistChance = (baseChance + freezeIntensity * 0.2);

            let chancePool = mistChance * timeScale;
            while (chancePool > 0) {
                if (Math.random() < chancePool) {
                    const spawnX = this.pos.x + (Math.random() - 0.5) * this.width * 0.9;
                    const spawnY = this.pos.y + (Math.random() - 0.2) * this.height;

                    // 这里的 mist 是白色的冷气
                    const mist = new Particle(spawnX, spawnY, null, { type: 'mist' });
                    mist.size = this.width * (0.15 + Math.random() * 0.1);
                    mist.size *= (1 + freezeIntensity * 0.2);
                    mist.vel = new Vec2((Math.random() - 0.5) * 0.3, 0.8 + Math.random() * 0.5); // 下沉
                    mist.decay *= 1.5;
                    game.particles.add(mist);
                }
                chancePool -= 1.0;
            }

            if (this.temp <= -80 && Math.random() < 0.08 * timeScale) {
                const shard = new Particle(this.pos.x + (Math.random() - 0.5) * this.width, this.pos.y, '#a5f3fc', { type: 'shard' });
                shard.size = 2.5;
                game.particles.add(shard);
            }
        }
    }

    /**
     * 向下推进
     * @param {number} amount - 推进距离
     */
    advance(amount) {
        this.dropTargetY += amount;
    }

    /**
     * 执行回合行动和移动
     * @param {Object} gameInstance - 游戏实例
     */
    performTurnActionAndMove(gameInstance) {
        const afx = CONFIG.balance.affixes;
        let actionCount = 1;
        if (this.affixes.includes('haste')) actionCount = 2;
        else if (this.temp > 0 && this.temp < 100 && this.affixes.includes('berserk')) {
            if (Math.random() < (this.temp / 100) * afx.berserkChanceMult) actionCount = 2;
        }

        if (this.isFrozenCurrentTurn) {
            actionCount = 0;
            this.playFreezeBlockEffect(gameInstance);
        }

        for (let i = 0; i < actionCount; i++) {
            const isSecondAction = (i === 1);

            // --- 1. 再生 (Regen) ---
            if (this.affixes.includes('regen')) {
                const heal = Math.floor(this.maxHp * afx.regenPercent) || 1;
                if (this.hp < this.maxHp) {
                    this.hp = Math.min(this.maxHp, this.hp + heal);
                    if (gameInstance.createFloatingText) {
                        gameInstance.createFloatingText(this.pos.x, this.pos.y - 30, `+${heal}`, '#4ade80');
                    }
                    if (gameInstance.createParticle) {
                        gameInstance.createParticle(this.pos.x, this.pos.y, '#4ade80', 'spark');
                    }
                    if (window.audio) {
                        window.audio.playEffect('regen');
                    }
                }
            }

            // --- 2. 範圍治療 (Healer) ---
            if (this.affixes.includes('healer')) {
                // 定義範圍：自身寬度的 1.5 倍 (大約覆蓋周圍 8 格)
                const range = this.width * afx.healerRange;
                let healedCount = 0;

                gameInstance.enemies.forEach(other => {
                    if (other !== this && other.active && other.hp < other.maxHp && this.pos.dist(other.pos) < range) {
                        const healAmt = Math.ceil(other.maxHp * afx.healerPercent);

                        other.hp = Math.min(other.maxHp, other.hp + healAmt);

                        // 特效：發射治療粒子飛向隊友
                        if (gameInstance.createParticle) {
                            gameInstance.createParticle(other.pos.x, other.pos.y, '#f472b6', 'spark'); // 粉色粒子
                        }
                        if (gameInstance.createFloatingText) {
                            gameInstance.createFloatingText(other.pos.x, other.pos.y - 20, `+${healAmt}`, '#f472b6');
                        }
                        healedCount++;
                    }
                });

                if (healedCount > 0) {
                    if (window.audio) {
                        window.audio.playEffect('regen'); // 復用治療音效
                    }
                    if (gameInstance.createShockwave) {
                        gameInstance.createShockwave(this.pos.x, this.pos.y, '#f472b6'); // 自身粉色波動
                    }
                }
            }

            // --- 3. 吞噬 (Devour) ---
            // 50% 概率觸發，且必須不是滿血或者想獲取詞條
            if (this.affixes.includes('devour') && Math.random() < afx.devourChance) {
                const range = this.width * afx.devourRange;
                // 尋找鄰居 (不能吞噬 Boss)
                const neighbors = gameInstance.enemies.filter(e =>
                    e !== this && e.active && e.type !== 'boss' && this.pos.dist(e.pos) < range
                );

                if (neighbors.length > 0) {
                    const victim = neighbors[Math.floor(Math.random() * neighbors.length)];

                    // 吞噬數值
                    const absorbHp = victim.hp;
                    const absorbMax = victim.maxHp;

                    this.maxHp += absorbMax;
                    this.hp += absorbHp;

                    // 吞噬詞條 (去重)
                    victim.affixes.forEach(af => {
                        if (!this.affixes.includes(af)) this.affixes.push(af);
                    });

                    // 處決受害者
                    victim.hp = 0;
                    victim.active = false;

                    // 特效
                    if (gameInstance.createFloatingText) {
                        gameInstance.createFloatingText(this.pos.x, this.pos.y - 40, "DEVOUR!", "#ef4444");
                    }
                    if (gameInstance.createParticle) {
                        gameInstance.createParticle(victim.pos.x, victim.pos.y, '#ef4444', 'mist'); // 血霧
                    }
                    if (gameInstance.createShockwave) {
                        gameInstance.createShockwave(this.pos.x, this.pos.y, '#ef4444');
                    }
                    if (window.audio) {
                        window.audio.playEffect('split'); // 播放分裂音效模擬吞噬聲
                    }
                }
            }

            // --- 4. 增殖 (Clone) ---
            if (this.affixes.includes('clone') && Math.random() < afx.cloneChanceTurn) {
                if (gameInstance.triggerCloneSpawn) {
                    gameInstance.triggerCloneSpawn(this);
                }
            }

            if (isSecondAction) {
                if (gameInstance.createFloatingText) {
                    gameInstance.createFloatingText(this.pos.x, this.pos.y - 50, "⚡DOUBLE!", "#facc15");
                }
            }

            // --- 移動與跳躍邏輯 ---
            let moveAmount = gameInstance.enemyHeight;
            const targetY = this.dropTargetY + moveAmount;

            // 檢查前方是否被阻擋
            const isBlocked = gameInstance.isAreaOccupied ?
                gameInstance.isAreaOccupied(this.pos.x, targetY, this.width * 0.8, this.height * 0.8, this) : false;

            if (!isBlocked) {
                // 正常移動
                this.advance(moveAmount);
            } else {
                // --- 5. 跳躍 (Jump) ---
                // 如果被阻擋，且擁有 jump 詞條，檢查下下個格子
                if (this.affixes.includes('jump')) {
                    // 跳跃行数 (jumpRows)
                    const jumpTargetY = this.dropTargetY + (moveAmount * afx.jumpRows);
                    const isJumpBlocked = gameInstance.isAreaOccupied ?
                        gameInstance.isAreaOccupied(this.pos.x, jumpTargetY, this.width * 0.8, this.height * 0.8, this) : false;

                    if (!isJumpBlocked) {
                        // 執行跳躍
                        this.advance(moveAmount * 2);
                        this.bumpOffsetY = -30; // 視覺上跳得更高
                        if (gameInstance.createFloatingText) {
                            gameInstance.createFloatingText(this.pos.x, this.pos.y, "JUMP!", "#38bdf8");
                        }
                        if (gameInstance.createParticle) {
                            gameInstance.createParticle(this.pos.x, this.pos.y, '#38bdf8', 'mist'); // 殘影
                        }
                    } else {
                        // 跳躍也被阻擋，撞牆
                        if (i === 0) {
                            this.bumpOffsetY = -10;
                            if (Math.random() < 0.3 && gameInstance.createFloatingText) {
                                gameInstance.createFloatingText(this.pos.x, this.pos.y - 20, "⛔ BLOCKED", "#ef4444");
                            }
                        }
                    }
                } else {
                    // 沒有跳躍詞條，正常撞牆
                    if (i === 0) {
                        this.bumpOffsetY = -10;
                        if (Math.random() < 0.3 && gameInstance.createFloatingText) {
                            gameInstance.createFloatingText(this.pos.x, this.pos.y - 20, "⛔ BLOCKED", "#ef4444");
                        }
                    }
                }
            }
        }
    }

    /**
     * 播放冰冻阻挡特效
     * @param {Object} gameInstance - 游戏实例
     */
    playFreezeBlockEffect(gameInstance) {
        this.bumpOffsetY = 6;
        if (gameInstance.createFloatingText) {
            gameInstance.createFloatingText(this.pos.x, this.pos.y, "❄️FROZEN", "#06b6d4");
        }

        const mistCount = 4 + Math.floor(this.width / 15);
        for (let i = 0; i < mistCount; i++) {
            const spawnX = this.pos.x + (Math.random() - 0.5) * this.width * 0.8;
            const spawnY = this.pos.y + this.height * 0.4;
            const mist = new Particle(spawnX, spawnY, null, { type: 'mist' });
            const dirX = (spawnX - this.pos.x) / (this.width / 2);
            mist.vel = new Vec2(dirX * 1.5, 1.0);
            mist.size = this.width * 0.5;
            mist.life = 1.5;
            if (gameInstance.particles && gameInstance.particles.add) {
                gameInstance.particles.add(mist);
            }
        }
        for (let i = 0; i < 5; i++) {
            if (gameInstance.createParticle) {
                gameInstance.createParticle(this.pos.x + (Math.random() - 0.5) * this.width, this.pos.y, '#a5f3fc', 'shard');
            }
        }
    }

    /**
     * 播放燃烧伤害特效
     * @param {Object} gameInstance - 游戏实例
     * @param {number} dmg - 伤害值
     */
    playBurnTickEffect(gameInstance, dmg) {
        this.hitTimer = 15;
        for (let i = 0; i < 8; i++) {
            if (gameInstance.createParticle) {
                gameInstance.createParticle(this.pos.x, this.pos.y, '#f97316', 'spark');
            }
        }
        for (let i = 0; i < 3; i++) {
            if (gameInstance.createParticle) {
                gameInstance.createParticle(this.pos.x, this.pos.y, 'rgba(0,0,0,0.6)', 'smoke');
            }
        }
        if (gameInstance.createFloatingText) {
            gameInstance.createFloatingText(this.pos.x, this.pos.y, `🔥-${dmg}`, '#fbbf24');
        }
        if (window.audio) {
            window.audio.playEffect('burn_tick');
        }
    }

    /**
     * 播放扫描反馈
     */
    playScanFeedback() {
        this.scanFeedbackTimer = 1.0;
    }

    /**
     * 绘制敌人
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y + this.bumpOffsetY);

        // 震动
        if (this.hitTimer > 0) {
            const shake = this.hitTimer * 0.5;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        }

        const w = this.width - 4;
        const h = this.height - 4;
        const r = 6;

        // === Layer 1: 容器裁剪 ===
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.clip();

        // === Layer 2: 液体血条 (含延迟白条) ===

        // A. 计算高度比例
        const hpRatio = Math.max(0, Math.min(1, this.displayHp / this.maxHp));
        const whiteRatio = Math.max(0, Math.min(1, this.delayedHp / this.maxHp)); // 白色条比例

        const fillHeight = h * hpRatio;
        const whiteHeight = h * whiteRatio; // 白色条高度

        const fillY = (h / 2) - fillHeight;
        const whiteY = (h / 2) - whiteHeight; // 白色条Y坐标

        // B. 绘制白色延迟条 (在彩色条底下)
        // 只有当 delayedHp > displayHp 时才绘制，避免不必要的重绘
        if (whiteRatio > hpRatio) {
            ctx.fillStyle = '#ffffff';
            // 稍微加一点透明度，不那么刺眼
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-w / 2, whiteY, w, whiteHeight);
            ctx.globalAlpha = 1.0;
        }

        // C. 绘制真实彩色条 (盖在白条上面)
        let baseColor = '#475569';
        if (this.type === 'elite') baseColor = '#581c87';
        if (this.type === 'boss') baseColor = '#7f1d1d';

        // 温度变色逻辑
        if (this.temp > 0) {
            const t = Math.min(1, this.temp / 34);
            baseColor = lerpColor(baseColor, '#ea580c', t);
        } else if (this.temp < 0) {
            const t = Math.min(1, Math.abs(this.temp) / 34);
            baseColor = lerpColor(baseColor, '#0891b2', t);
        }

        ctx.fillStyle = baseColor;
        ctx.fillRect(-w / 2, fillY, w, fillHeight);

        // D. 液面亮边 (保持不变)
        if (hpRatio > 0 && hpRatio < 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-w / 2, fillY, w, 2);
        }

        // === Layer 3: 内部覆盖层 (Glow & Mist) ===

        // **过热 Stage 3: 内部炙热发光**
        if (this.temp >= 67) {
            const glowAlpha = Math.min(0.6, (this.temp - 60) / 60);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
            grad.addColorStop(0, `rgba(251, 146, 60, ${glowAlpha})`);
            grad.addColorStop(1, `rgba(251, 146, 60, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        // **过冷 Stage 2~4: 动态雾化蒙层 (Mist Overlay)**
        if (this.temp <= -34) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            // 大幅降低不透明度
            let mistOpacity = 0;
            // 即使完全冻结，透明度最高也只有 0.5 (原来是 0.9)
            if (this.isFrozenCurrentTurn || this.temp <= -100) mistOpacity = 0.5;
            else mistOpacity = Math.min(0.4, (Math.abs(this.temp) - 30) / 70);

            const time = Date.now() / 2500;

            // 绘制浮动雾团 (保持逻辑，但颜色更淡)
            const patchCount = 2; // 减少层数
            for (let i = 0; i < patchCount; i++) {
                const seed = this.visualSeed * 100 + i;
                const offsetX = Math.sin(seed + time) * (w * 0.25);
                const offsetY = Math.cos(seed + time * 1.2) * (h * 0.25);
                // 稍微减小雾团尺寸
                const size = w * (0.5 + Math.sin(time * 2 + i) * 0.1);

                const grad = ctx.createRadialGradient(offsetX, offsetY, 0, offsetX, offsetY, size);
                // 颜色变得极淡
                grad.addColorStop(0, `rgba(207, 250, 254, ${mistOpacity * 0.4})`);
                grad.addColorStop(1, `rgba(207, 250, 254, 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2); ctx.fill();
            }

            // 全身薄霜 (降低浓度)
            ctx.fillStyle = `rgba(165, 243, 252, ${mistOpacity * 0.15})`;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.restore();
        }

        // === Layer 4: 裂纹绘制 (Fissures) ===

        // **过热 Stage 3**
        if (this.temp >= 67) {
            const crackAlpha = Math.min(1, (this.temp - 60) / 40);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `rgba(255, 255, 255, ${crackAlpha * 0.9})`;
            ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            this.fissures.forEach(path => {
                if (path.length < 2) return;
                ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            });
            ctx.restore();
        }

        // **过冷 Stage 4**
        if (this.temp <= -67 || this.isFrozenCurrentTurn) {
            const crackAlpha = this.isFrozenCurrentTurn ? 0.8 : Math.min(0.6, (Math.abs(this.temp) - 60) / 40);
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.strokeStyle = `rgba(255, 255, 255, ${crackAlpha})`;
            ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'bevel';
            this.fissures.forEach(path => {
                if (path.length < 2) return;
                ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            });
            ctx.restore();
        }

        // === Layer 5: 内部边框 ===
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
        if (this.type === 'elite') { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; }
        if (this.type === 'boss') { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; }
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // 文字与图标
        if (this.affixes.length > 0) {
            ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
            let icons = '';
            if (this.affixes.includes('shield')) icons += '🛡️';
            if (this.affixes.includes('haste')) icons += '⚡';
            if (this.affixes.includes('regen')) icons += '💚';
            if (this.affixes.includes('clone')) icons += '🦠';
            if (this.affixes.includes('berserk')) icons += '😡';
            if (this.affixes.includes('healer')) icons += '💖';
            if (this.affixes.includes('devour')) icons += '👅';
            if (this.affixes.includes('jump')) icons += '🦘';
            ctx.textAlign = 'center'; ctx.fillText(icons, 0, -h / 2 + 8);
        }
        if (!this.isFrozenCurrentTurn) {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            if (this.displayHp > this.hp + 1) ctx.fillStyle = '#fca5a5';
            ctx.fillText(Math.ceil(this.displayHp), 0, 2);
        }

        // 受击闪白
        if (this.hitTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.hitTimer / 10 * 0.6})`;
            ctx.fillRect(-w / 2, -h / 2, w, h);
        }

        ctx.restore(); // <--- 裁剪结束

        // === Layer 6: 外部特效 (光环/冰壳) ===

        // **过热 Stage 4: 炙热发光边框**
        if (this.temp >= 100) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y + this.bumpOffsetY);
            const pulse = (Math.sin(Date.now() / 200) + 1) * 0.5;
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 15 + pulse * 10;
            ctx.strokeStyle = `rgba(251, 146, 60, ${0.6 + pulse * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.roundRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, r); ctx.stroke();
            ctx.restore();
        }

        // **过冷 Stage 4: 冰封外壳 - 晶体冰块**
        if (this.temp <= -100 || this.isFrozenCurrentTurn) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y + this.bumpOffsetY);

            // --- 1. 绘制冰块轮廓 (硬朗的多边形) ---
            const borderW = w + 8;
            const borderH = h + 8;

            // 使用 bevel 连接，产生硬角，不使用 spike 正弦波
            ctx.lineJoin = 'bevel';
            ctx.lineWidth = 2;

            // 冰的颜色：边框亮白/青，内部半透明
            ctx.strokeStyle = 'rgba(207, 250, 254, 0.9)'; // 亮青白
            ctx.fillStyle = 'rgba(165, 243, 252, 0.25)';  // 内部淡淡的冻结感

            // 给整个冰块加一点发光
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            // 左上角 (切角)
            ctx.moveTo(-borderW / 2 + 5, -borderH / 2);
            // 右上角
            ctx.lineTo(borderW / 2 - 2, -borderH / 2);
            ctx.lineTo(borderW / 2, -borderH / 2 + 5);
            // 右下角
            ctx.lineTo(borderW / 2, borderH / 2 - 3);
            ctx.lineTo(borderW / 2 - 5, borderH / 2);
            // 左下角
            ctx.lineTo(-borderW / 2 + 2, borderH / 2);
            ctx.lineTo(-borderW / 2, borderH / 2 - 5);
            // 回到左上
            ctx.lineTo(-borderW / 2, -borderH / 2 + 5);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            // --- 2. 绘制冰面反光 (Glossy Highlight) ---
            // 在冰块表面画两道斜着的亮光，增加质感
            ctx.shadowBlur = 0; // 反光不需要发光
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // 斜线 1
            ctx.moveTo(-w / 4, -h / 2);
            ctx.lineTo(-w / 2, -h / 4);
            // 斜线 2
            ctx.moveTo(w / 4, h / 2);
            ctx.lineTo(w / 2, h / 4);
            ctx.stroke();

            ctx.restore();
        }

        // === Layer 7: 扫描反馈 ===
        if (this.scanFeedbackTimer > 0) {
            this.scanFeedbackTimer -= 0.05;
            const alpha = Math.max(0, this.scanFeedbackTimer);
            const expand = (1.0 - alpha) * 10;
            const bracketSize = 10;
            const hw = this.width / 2 + 4 + expand;
            const hh = this.height / 2 + 4 + expand;
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y + this.bumpOffsetY);
            ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-hw, -hh + bracketSize); ctx.lineTo(-hw, -hh); ctx.lineTo(-hw + bracketSize, -hh);
            ctx.moveTo(hw - bracketSize, -hh); ctx.lineTo(hw, -hh); ctx.lineTo(hw, -hh + bracketSize);
            ctx.moveTo(hw, hh - bracketSize); ctx.lineTo(hw, hh); ctx.lineTo(hw - bracketSize, hh);
            ctx.moveTo(-hw + bracketSize, hh); ctx.lineTo(-hw, hh); ctx.lineTo(-hw, hh - bracketSize);
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害值
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount) {
        this.hp -= amount;
        this.hitTimer = 10;

        // 重置白色血条的滞留时间
        // 设定为 45 帧 (约 0.75秒)，这段时间内白色血条不会减少
        this.whiteBarTimer = 45;

        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    /**
     * 应用温度变化
     * @param {number} amount - 温度变化量
     */
    applyTemp(amount) {
        this.temp += amount;
    }

    /**
     * 获取边界
     * @returns {Object} 边界对象
     */
    getBounds() {
        return {
            left: this.pos.x - this.width / 2,
            right: this.pos.x + this.width / 2,
            top: this.pos.y - this.height / 2,
            bottom: this.pos.y + this.height / 2
        };
    }
}

export default Enemy;
