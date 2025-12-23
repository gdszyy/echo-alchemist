/**
 * Projectile 类 - 战斗阶段子弹
 * 负责子弹物理、材料效果、伤害计算和特殊效果触发
 */

import { Vec2 } from '../core/Vec2.js';
import { CONFIG } from '../config/index.js';
import { Particle } from '../effects/Particle.js';

export class Projectile {
    /**
     * @param {number} x - 起始 x 坐标
     * @param {number} y - 起始 y 坐标
     * @param {Object} vel - 初始速度向量 {x, y}
     * @param {Object} config - 子弹配置
     * @param {boolean} isCopy - 是否为复制体
     */
    constructor(x, y, vel, config, isCopy = false) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(vel.x, vel.y);
        this.config = config;
        
        // --- 1. 使用统一的公式计算半径 ---
        const params = Projectile.calculateVisualParams(config, isCopy);
        this.radius = params.radius; 
        this.intensity = params.intensity; // 存储光晕强度供 update 使用

        this.active = true;
        this.isCopy = isCopy;
        this.bouncesLeft = config.bounce || 0;
        this.piercesLeft = config.pierce || 0;
        this.maxBounces = config.bounce || 0;
        this.maxPierces = config.pierce || 0;
        this.maxDurability = (this.maxBounces + this.maxPierces) || 1;

        this.hitCooldowns = new Map();
        this.destroyed = false;
        this.lifeTime = 60 * 15;
        this.chainHistory = [];

        // 视觉相关
        this.trail = []; 
        this.rotation = 0;
        
        // 物理变形初始化
        this.deformation = { x: 1, y: 1 }; 
        this.targetDeformation = { x: 1, y: 1 }; 
        this.elasticity = 0.2;

        this.crackSeed = [];
        for (let i = 0; i < 3; i++) {
            this.crackSeed.push({
                angle: Math.random() * Math.PI * 2,
                len: 0.3 + Math.random() * 0.4, // 裂纹长度比例
                jagged: (Math.random() - 0.5) * 0.5 // 裂纹曲折度
            });
        }
    }

    /**
     * 统一计算视觉参数 (尺寸、光晕)
     * @param {Object} config - 子弹配置
     * @param {boolean} isCopy - 是否为复制体
     * @returns {Object} 包含 radius 和 intensity 的对象
     */
    static calculateVisualParams(config, isCopy) {
        const v = CONFIG.visuals;
        // 1. 计算半径：基础 + (伤害加成，但不超过上限)
        let r = v.baseRadius + Math.min(v.maxSizeBonus, (config.damage - 2) * v.damageGrowth);

        // 2. 应用类型倍率
        if (isCopy) r *= v.copyScale;
        if (config.explosive) r *= v.explosiveScale;
        if (config.pierce > 0) r *= v.arrowScale;

        // 3. 计算光晕强度
        let glow = 1.0 + (config.damage * v.glowPerDamage) / 10;
        glow = Math.min(v.maxGlow / v.glowBase, glow);

        return { radius: r, intensity: glow };
    }

    /**
     * 核心更新逻辑：融合了【视觉特效】与【物理碰撞】
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {Array} enemies - 敌人数组
     * @param {Function} spawnCallback - 生成回调函数
     * @param {number} timeScale - 时间缩放
     */
    update(width, height, enemies, spawnCallback, timeScale) {
        if (!this.active) return;

        // --- A. 视觉表现更新 ---
        // 1. 旋转
        if (this.config.pierce > 0) {
            this.rotation = Math.atan2(this.vel.y, this.vel.x);
        } else if (this.config.scatter > 0) {
            this.rotation += 0.3 * timeScale; 
        } else {
            this.rotation += 0.1 * timeScale;
        }

        // 2. 弹性变形 (Q弹效果)
        if (this.config.bounce > 0) {
            const speed = this.vel.mag();
            if (speed > 1) {
                const wobble = 1.0 + Math.sin(Date.now() / 100) * 0.1;
                this.targetDeformation = { x: 1 / wobble, y: wobble };
            }
        }
        this.deformation.x += (this.targetDeformation.x - this.deformation.x) * this.elasticity * timeScale;
        this.deformation.y += (this.targetDeformation.y - this.deformation.y) * this.elasticity * timeScale;

        // 3. 拖尾更新
        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > 8) this.trail.shift();


        // --- B. 物理与碰撞逻辑 ---
        
        // 更新冷却
        for (const [enemy, timer] of this.hitCooldowns) {
            if (timer > 0) this.hitCooldowns.set(enemy, timer - timeScale);
            else this.hitCooldowns.delete(enemy);
        }

        this.lifeTime -= timeScale;
        if (this.lifeTime <= 0) { 
            this.destroy(spawnCallback); 
            return; 
        }

        const fullMove = this.vel.mult(timeScale);
        const totalSpeed = fullMove.mag();

        // 1. 粗测阶段 (Broadphase)
        let potentialEnemies = enemies;
        if (totalSpeed > this.radius) {
            const minX = Math.min(this.pos.x, this.pos.x + fullMove.x) - this.radius;
            const maxX = Math.max(this.pos.x, this.pos.x + fullMove.x) + this.radius;
            const minY = Math.min(this.pos.y, this.pos.y + fullMove.y) - this.radius;
            const maxY = Math.max(this.pos.y, this.pos.y + fullMove.y) + this.radius;

            potentialEnemies = [];
            for (let e of enemies) {
                if (!e.active) continue;
                const ex = e.pos.x - e.width / 2;
                const ey = e.pos.y - e.height / 2;
                if (minX < ex + e.width && maxX > ex && minY < ey + e.height && maxY > ey) {
                    potentialEnemies.push(e);
                }
            }
        }

        if (potentialEnemies.length === 0) {
            this._applyMove(fullMove, width, height, spawnCallback);
            return;
        }

        // 2. 精测阶段 (Sub-stepping)
        const safeStepSize = this.radius * 0.8; 
        const steps = Math.ceil(totalSpeed / safeStepSize);
        const subStepVel = fullMove.mult(1 / steps);

        for (let s = 0; s < steps; s++) {
            // 执行一小步移动
            this._applyMove(subStepVel, width, height, spawnCallback);
            if (!this.active) return; 

            // 检测碰撞
            for (let e of potentialEnemies) {
                if (!e.active) continue;
                const halfW = e.width / 2;
                const halfH = e.height / 2;
                const dx = this.pos.x - e.pos.x;
                const dy = this.pos.y - e.pos.y;
                const overlapX = (halfW + this.radius) - Math.abs(dx);
                const overlapY = (halfH + this.radius) - Math.abs(dy);

                if (overlapX > 0 && overlapY > 0) {
                    // 命中判定
                    let dealDamage = false;
                    if (!this.hitCooldowns.has(e)) {
                        this.hitCooldowns.clear();
                        dealDamage = true;
                        this.hitCooldowns.set(e, CONFIG.gameplay.hitCooldowns);
                        this.onHit(e, enemies);

                        // 命中时触发Q弹变形
                        if (this.config.bounce > 0) {
                            this.deformation = { x: 1.4, y: 0.6 };
                        }
                    }

                    // 穿透/销毁逻辑
                    if (dealDamage) {
                        if (this.piercesLeft > 0) {
                            this.piercesLeft--;
                            continue; // 继续飞行
                        } else if (this.bouncesLeft > 0) {
                            this.bouncesLeft--;
                        } else {
                            this.destroy(spawnCallback);
                            return;
                        }
                    } else {
                        if (this.piercesLeft > 0) continue;
                    }

                    // 物理反弹
                    if (overlapX < overlapY) {
                        this.vel.x *= -1;
                        subStepVel.x *= -1;
                        if (dx < 0) this.pos.x = e.pos.x - halfW - this.radius - 0.1;
                        else this.pos.x = e.pos.x + halfW + this.radius + 0.1;
                    } else {
                        this.vel.y *= -1;
                        subStepVel.y *= -1; 
                        if (dy < 0) this.pos.y = e.pos.y - halfH - this.radius - 0.1;
                        else this.pos.y = e.pos.y + halfH + this.radius + 0.1;
                    }
                }
            }
        }
        
        // 粒子效果生成 (需要 game 实例)
        this._createParticleEffects();
    }

    /**
     * 创建粒子效果
     * @private
     */
    _createParticleEffects() {
        // 注意：此方法依赖全局 game 对象
        if (typeof game === 'undefined') return;

        // 1. 爆破弹珠：引信燃烧效果 (高频掉落火星)
        if (this.config.explosive) {
            // 每帧都有很高概率掉落火星
            if (Math.random() < 0.7) {
                const trailDir = this.vel.norm().mult(-1);
                const smokeX = this.pos.x + trailDir.x * this.radius + (Math.random() - 0.5) * 4;
                const smokeY = this.pos.y + trailDir.y * this.radius + (Math.random() - 0.5) * 4;
                
                // 使用深灰色/黑色，带有一定的透明度
                // 模拟未完全燃烧的火药烟雾
                game.createParticle(smokeX, smokeY, 'rgba(51, 65, 85, 0.6)', 'smoke');
            }
            if (Math.random() < 0.2) {
                const trailDir = this.vel.norm().mult(-1);
                const dustX = this.pos.x + trailDir.x * this.radius;
                const dustY = this.pos.y + trailDir.y * this.radius;
                
                // 使用暗红色，不使用 'spark' 模式(因为 spark 会发光)
                // 改用 'normal' 模式，就是一个普通的红色圆点
                const p = new Particle(dustX, dustY, '#ef4444', 'normal');
                p.size = Math.random() * 1.5 + 0.5; // 很小的粉尘
                p.life = 0.5; // 消失得很快
                game.particles.push(p);
            }
        } else if (Math.random() < 0.3) {
            let color = null;
            if (this.config.pyro > 0) color = '#f97316';
            else if (this.config.cryo > 0) color = '#06b6d4';
            else if (this.config.lightning > 0) color = '#c084fc';
            if (color) game.createParticle(this.pos.x, this.pos.y, color);
        }
    }

    /**
     * 内部移动与边界处理 (包含撞墙变形)
     * @param {Vec2} vel - 速度向量
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {Function} spawnCallback - 生成回调函数
     * @private
     */
    _applyMove(vel, width, height, spawnCallback) {
        this.pos = this.pos.add(vel);

        // 左右墙反弹
        if (this.pos.x < this.radius) { 
            this.pos.x = this.radius; 
            this.vel.x = Math.abs(this.vel.x); 
            if (this.config.bounce > 0) this.deformation = { x: 0.7, y: 1.3 };
        }
        if (this.pos.x > width - this.radius) { 
            this.pos.x = width - this.radius; 
            this.vel.x = -Math.abs(this.vel.x); 
            if (this.config.bounce > 0) this.deformation = { x: 0.7, y: 1.3 };
        }
        // 顶部反弹
        if (this.pos.y < this.radius) { 
            this.pos.y = this.radius; 
            this.vel.y = Math.abs(this.vel.y); 
            if (this.config.bounce > 0) this.deformation = { x: 1.3, y: 0.7 };
        }
        
        // 底部逻辑
        if (this.pos.y > height - this.radius) {
            let didBounce = false;
            // 如果有战斗底墙遗物 (需要 game 实例)
            if (typeof game !== 'undefined' && game.hasCombatWall && (this.piercesLeft > 0 || this.config.bounce > 0)) {
                if (this.piercesLeft > 0) {
                    this.piercesLeft--;
                    didBounce = true;
                    game.createShockwave(this.pos.x, height);
                } else if (this.config.bounce > 0) {
                    // 弹力球属性也允许反弹
                    didBounce = true; 
                }
            }

            if (didBounce) {
                this.pos.y = height - this.radius;
                this.vel.y *= -1;
                this.vel.x += (Math.random() - 0.5) * 2;
                // 播放音效 (需要 audio 实例)
                if (typeof audio !== 'undefined') {
                    audio.playHit('bounce');
                }
                if (this.config.bounce > 0) this.deformation = { x: 1.4, y: 0.6 };
            } else {
                this.destroy(spawnCallback);
            }
        }
        if (this.pos.y > height + 50) { 
            this.destroy(spawnCallback); 
        }
    }
    
    /**
     * 命中敌人时的处理
     * @param {Object} enemy - 被命中的敌人
     * @param {Array} allEnemies - 所有敌人数组
     */
    onHit(enemy, allEnemies) {
        // 需要 game 实例来处理伤害
        if (typeof game !== 'undefined') {
            game.damageEnemy(enemy, this);
        }
    }

    /**
     * 销毁子弹
     * @param {Function} spawnCallback - 生成回调函数
     */
    destroy(spawnCallback) {
        this.active = false; 
        this.destroyed = true;
        
        // 套娃生成逻辑
        if (this.config.nestedPayload && !this.isCopy) {
            let nextVel = this.vel.norm().mult(this.vel.mag() * 1.1); 
            if (nextVel.mag() < 2) nextVel = new Vec2(0, -5);
            spawnCallback({ 
                x: this.pos.x, 
                y: this.pos.y, 
                vel: nextVel, 
                config: this.config.nestedPayload 
            });
        }
        // 连锁生成逻辑
        else if (this.config.chainPayload && !this.isCopy) {
            let nextVel = this.vel; 
            if (nextVel.mag() < 1) nextVel = new Vec2(0, 5);
            spawnCallback({ 
                x: this.pos.x, 
                y: this.pos.y, 
                vel: nextVel.norm().mult(10), 
                config: this.config.chainPayload 
            });
        }
    }

    /**
     * 绘制子弹
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     */
    draw(ctx) {
        // 1. 计算当前耐久度比例
        const currentDurability = (this.bouncesLeft + this.piercesLeft);
        let integrity = 1.0;
        if (this.maxDurability > 0) {
            integrity = currentDurability / this.maxDurability;
        }
        integrity = Math.max(0.2, integrity);

        // --- 核心修复：判定是否需要绘制拖尾 ---
        const hasElementalTrail = this.config.pyro > 0 || 
                                  this.config.cryo > 0 || 
                                  this.config.pierce > 0 || 
                                  this.config.scatter > 0 || 
                                  this.config.explosive;

        if ((this.config.bounce === 0 || hasElementalTrail) && this.trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'lighter'; 
            
            let trailColor = '255, 255, 255'; 
            if (this.config.explosive) trailColor = '252, 165, 165'; 
            else if (this.config.pyro) trailColor = '251, 146, 60'; 
            else if (this.config.cryo) trailColor = '165, 243, 252'; 
            else if (this.config.pierce) trailColor = '252, 165, 165'; 
            else if (this.config.scatter) trailColor = '253, 224, 71'; 

            for (let i = 0; i < this.trail.length - 1; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i + 1];
                const progress = i / this.trail.length; 
                
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                // 1. 基础系数 (普通弹保持 0.6, 弹性弹保持 0.4)
                let widthMod = this.config.bounce > 0 ? 0.2 : 0.42;
                
                // 2. 如果是爆破弹珠，强制使用极小的系数
                // 因为爆破弹本来就很大，不能让拖尾跟着变大
                if (this.config.explosive) {
                    widthMod = 0.15; 
                }
                
                // 3. 计算宽度
                let finalWidth = (this.radius * widthMod) * progress * integrity;

                // 4. [绝对防线]：如果是爆破弹，设置一个像素级的硬上限
                // 无论炸弹变得多巨大，拖尾最粗不能超过 4px
                if (this.config.explosive) {
                    finalWidth = Math.min(finalWidth, 4); 
                }

                ctx.lineWidth = finalWidth;
                
                // 稍微降低一点透明度
                ctx.strokeStyle = `rgba(${trailColor}, ${progress * 0.2 * integrity})`;
                ctx.stroke();
            }
            ctx.restore();
        }

        // ... 绘制子弹本体的代码保持不变 ...
        const dimIntensity = this.intensity * (0.5 + 0.5 * integrity); 

        Projectile.drawVisuals(
            ctx, 
            this.pos.x, 
            this.pos.y, 
            this.radius, 
            this.config, 
            this.rotation, 
            dimIntensity, 
            this.deformation,
            integrity,      
            this.crackSeed  
        );
    }

    /**
     * 静态绘制方法 (已包含修正后的箭头和组合特效)
     * @param {CanvasRenderingContext2D} ctx - 绘图上下文
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {number} radius - 半径
     * @param {Object} config - 配置
     * @param {number} rotation - 旋转角度
     * @param {number} intensity - 光晕强度
     * @param {Object} deformation - 变形参数
     * @param {number} integrity - 完整度
     * @param {Array} crackSeed - 裂纹种子
     */
    static drawVisuals(ctx, x, y, radius, config, rotation, intensity, deformation = { x: 1, y: 1 }, integrity = 1.0, crackSeed = []) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        if (config.explosive) {
            const time = Date.now();
            
            // 1. 高频脉冲 (每秒闪烁约 10 次)
            // 产生一个 0.0 ~ 1.0 的波动值
            const pulse = (Math.sin(time / 50) + 1) / 2; 

            // 2. 颜色闪烁 (核心过热警告)
            // 当脉冲达到峰值时，颜色由红色变为纯白，模拟临界状态
            let coreColor = '#ef4444'; // 基础红
            let glowColor = '#b91c1c'; // 深红光晕
            
            if (pulse > 0.7) {
                coreColor = '#ffffff'; // 闪白
                glowColor = '#fca5a5'; // 光晕变亮红
                intensity *= 1.5; // 光晕暴涨
            }

            // 3. 体积膨胀 (呼吸感)
            // 让子弹在 100% ~ 115% 大小之间震荡
            const scaleMod = 1.0 + pulse * 0.15;
            ctx.scale(deformation.x * scaleMod, deformation.y * scaleMod);

            // 4. 位置颤抖 (Jitter - 关键特效)
            // 就在原位置疯狂抖动，表现出能量无法控制的感觉
            const shakeAmount = 1.5; 
            ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);

            // --- 绘制炸弹本体 ---
            // 光晕
            ctx.shadowBlur = CONFIG.visuals.glowBase * intensity * 1.5;
            ctx.shadowColor = glowColor;
            
            // 核心圆
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            // 内部高光 (让它看起来像球体)
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            return; // *** 爆破弹绘制完毕，直接返回，跳过后续通用逻辑 ***
        }


        // 1. 决定形状 (修复：加回 crystal)
        let shapeType = 'circle';
        if (config.isMatryoshka) shapeType = 'matryoshka';
        else if (config.pierce > 0) shapeType = 'arrow';
        else if (config.scatter > 0) shapeType = 'star';
        else if (config.cryo > 0) shapeType = 'crystal'; // <--- 找回了丢失的冰霜形状判定
        else if (config.isLaser) shapeType = 'orb';

        // 2. 决定颜色
        let mainColors = [];
        let glowColors = [];
        
        if (config.isLaser) { 
            mainColors.push('#ffffff'); // 核心纯白
            glowColors.push(CONFIG.colors.laser); // 外圈天蓝
        }

        if (config.explosive) { mainColors.push('#fff'); glowColors.push('#ef4444'); }
        if (config.pyro > 0) { mainColors.push('#fdba74'); glowColors.push('#f97316'); }
        if (config.cryo > 0) { mainColors.push('#cffafe'); glowColors.push('#06b6d4'); }
        if (config.lightning > 0) { mainColors.push('#f3e8ff'); glowColors.push('#c084fc'); }
        if (config.pierce > 0 && mainColors.length === 0) { mainColors.push('#fee2e2'); glowColors.push('#ef4444'); }

        if (mainColors.length === 0) {
            if (config.bounce > 0) { mainColors.push('#dcfce7'); glowColors.push('#22c55e'); }
            else { mainColors.push('#f1f5f9'); glowColors.push('#94a3b8'); }
        }

        const mainColor = mainColors[mainColors.length - 1];
        const glowColor = glowColors[glowColors.length - 1];

        if (config.explosive && integrity > 0.1) {
            const time = Date.now();
            
            // 1. 高频脉冲 (每秒闪烁约 10 次)
            // 产生一个 0.0 ~ 1.0 的波动值
            const pulse = (Math.sin(time / 50) + 1) / 2; 

            // 2. 颜色闪烁 (核心过热)
            // 当脉冲达到峰值时，颜色由红色变为纯白
            if (pulse > 0.7) {
                // 混合白色：简单的逻辑是直接覆盖 mainColor
                // 视觉上会产生红-白-红的急促警报感
                mainColors[mainColors.length - 1] = '#ffffff'; 
                glowColors[glowColors.length - 1] = '#fca5a5'; // 光晕变亮红
                intensity *= 1.5; // 光晕暴涨
            }

            // 3. 体积膨胀 (呼吸感)
            // 让子弹在 100% ~ 115% 大小之间震荡
            const scaleMod = 1.0 + pulse * 0.15;
            deformation.x *= scaleMod;
            deformation.y *= scaleMod;

            // 4. 位置颤抖 (Jitter)
            // 就在原位置疯狂抖动，表现出能量无法控制
            const shakeAmount = 1.5; 
            ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
        }
        
        // ---  光球的特殊渲染逻辑 (绑定特效) ---
        if (shapeType === 'orb') {
            // 1. 动态脉冲 (模拟能量不稳定的感觉)
            const time = Date.now() / 200;
            const pulse = Math.sin(time) * 0.1 + 1.0; 
            
            // 2. 根据激光层数 (config.laser) 增强光晕和大小
            // config.laser 越高，球体越亮，核心越大
            const laserPower = config.laser || 0;
            const sizeMod = 1 + (laserPower * 0.1); 
            
            // 绘制强光晕 (多层叠加)
            ctx.shadowBlur = 20 * intensity * sizeMod;
            ctx.shadowColor = glowColor;
            
            // 外层光环
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.2 * pulse * sizeMod, 0, Math.PI * 2);
            ctx.fill();

            // 内层核心 (高亮)
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.8 * sizeMod, 0, Math.PI * 2);
            ctx.fill();
            
            // 恢复上下文，跳过后续通用绘制
            ctx.restore();
            return; 
        }
        
        // 3. 绘制形状
        ctx.beginPath();
        if (shapeType === 'arrow') {
            ctx.moveTo(radius * 1.3, 0); 
            ctx.lineTo(-radius * 0.8, radius * 0.5); 
            ctx.lineTo(-radius * 0.4, 0); 
            ctx.lineTo(-radius * 0.8, -radius * 0.5); 
        } else if (shapeType === 'star') {
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.lineTo(radius, 0);
                ctx.lineTo(radius * 0.4, radius * 0.4);
            }
        } else if (shapeType === 'crystal') { // <--- 找回了丢失的菱形绘制逻辑
            ctx.moveTo(0, -radius * 1.3);
            ctx.lineTo(radius * 0.8, 0);
            ctx.lineTo(0, radius * 1.3);
            ctx.lineTo(-radius * 0.8, 0);
        } else if (shapeType === 'matryoshka') {
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
        } else {
            // 默认圆形/流体
            if (config.pyro > 0) {
                const time = Date.now() / 60;
                for (let i = 0; i <= 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    const wave = Math.sin(time + angle * 4) * (radius * 0.2); 
                    const r = radius + wave;
                    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                }
            } else {
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
            }
        }
        ctx.closePath();

        // --- [视觉修改]：应用老化效果 ---
    
        // A. 光晕减弱
        ctx.shadowBlur = CONFIG.visuals.glowBase * intensity * integrity; // 越破损光晕越小
        ctx.shadowColor = glowColor;
        
        // B. 颜色变暗 (使用 globalAlpha 简单模拟或者在颜色上覆盖黑色层)
        // 这里我们填充主色
        ctx.fillStyle = mainColor;
        ctx.fill();

        // 如果耐久度不满，覆盖一层半透明黑色，使其看起来变暗/脏
        if (integrity < 1.0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.6 - 0.6 * integrity})`; // 最多 60% 的黑度
            ctx.fill();
        }

        // 4. 填充
        ctx.shadowBlur = CONFIG.visuals.glowBase * intensity;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = mainColor;
        ctx.fill();

        // 5. 内部细节
        if (config.cryo > 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            if (shapeType === 'arrow') {
                ctx.moveTo(0, -radius * 0.25); 
                ctx.lineTo(radius * 0.3, 0); 
                ctx.lineTo(0, radius * 0.25); 
                ctx.lineTo(-radius * 0.3, 0);
            } else if (shapeType === 'crystal') {
                // 如果是菱形，内部画个小菱形高光
                ctx.moveTo(0, -radius * 0.6); 
                ctx.lineTo(radius * 0.3, 0); 
                ctx.lineTo(0, radius * 0.6); 
                ctx.lineTo(-radius * 0.3, 0);
            } else {
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    const r = radius * 0.5;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
            }
            ctx.fill();
        }

        // --- [视觉修改]：绘制裂纹 ---
        // 只有当完整度低于 60% 时才开始出现裂纹
        if (integrity < 0.6 && crackSeed && crackSeed.length > 0) {
            ctx.save();
            ctx.shadowBlur = 0; // 裂纹没有光晕
            ctx.lineWidth = 1.5; // 裂纹宽度
            // 裂纹颜色：深色，带一点点 glowColor 的余光
            ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)'; 
            
            // 剪切路径，保证裂纹只画在子弹内部
            ctx.clip(); 

            crackSeed.forEach(seed => {
                ctx.beginPath();
                ctx.moveTo(0, 0); // 从中心裂开
                // 计算裂纹终点
                const r = radius * seed.len;
                const endX = Math.cos(seed.angle) * r;
                const endY = Math.sin(seed.angle) * r;
                
                // 画一个折线，增加破碎感
                const midX = endX * 0.5 + Math.cos(seed.angle + Math.PI / 2) * (radius * seed.jagged);
                const midY = endY * 0.5 + Math.sin(seed.angle + Math.PI / 2) * (radius * seed.jagged);
                
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });
            ctx.restore();
        }
        
        // --- [视觉修改]：如果弹性耗尽，绘制一个沉重的外边框 ---
        // 判断逻辑：如果 config 里本来有弹性，但现在 integrity 很低
        if (config.bounce > 0 && integrity < 0.2) {
            ctx.strokeStyle = '#475569'; // 铁灰色
            ctx.lineWidth = 2;
            ctx.stroke(); // 给圆球画个圈，表示它变成了实心铁球，不再Q弹
        }
        
        // --- [新增/修改]：子弹的狂暴电弧特效 ---
        if (config.lightning > 0) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'lighter'; // 高亮叠加

            // 1. 动态数量：层数越高，电弧越多
            // 子弹飞行速度快，每帧刷新会导致电弧疯狂跳动，这正符合"球状闪电"的不稳定感
            const arcCount = 1 + Math.floor(config.lightning / 2);

            ctx.shadowBlur = 8 + config.lightning;
            ctx.shadowColor = '#a855f7'; // Purple-500
            ctx.strokeStyle = '#e9d5ff'; // Purple-200 (同款高亮紫)
            
            for (let k = 0; k < arcCount; k++) {
                ctx.beginPath();
                
                // 随机起始角度
                const startAngle = Math.random() * Math.PI * 2;
                // 弧长比 DropBall 小一点，显得更紧凑
                const arcLen = 0.5 + Math.random() * 0.5; 
                
                // 3~5 段折线
                const segments = 3 + Math.floor(Math.random() * 2);

                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const currentAngle = startAngle + t * arcLen;
                    
                    // 悬浮距离：半径的 1.1 ~ 1.4 倍
                    // 加上 deformation 修正，确保电弧跟随子弹被压扁/拉长
                    const jitter = (Math.random() - 0.5) * (radius * 0.3);
                    const dist = radius * 1.2 + jitter;
                    
                    const px = Math.cos(currentAngle) * dist;
                    const py = Math.sin(currentAngle) * dist;
                    
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                
                // 线条稍微细一点，因为子弹本来就小
                ctx.lineWidth = 0.8 + Math.random() * 1.2;
                ctx.stroke();
            }
            
            // 偶尔的核心闪烁 (High Voltage Flicker)
            if (Math.random() < 0.2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        if (config.isMatryoshka) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#d946ef'; 
            ctx.beginPath(); 
            ctx.arc(0, -radius * 0.2, radius * 0.4, 0, Math.PI * 2); 
            ctx.fill(); 
            ctx.strokeStyle = '#fff'; 
            ctx.lineWidth = 1; 
            ctx.beginPath(); 
            ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2); 
            ctx.stroke();
        }

        ctx.restore();
    }
}

// 全局兼容：挂载到 window 对象
if (typeof window !== 'undefined') {
    window.Projectile = Projectile;
}

export default Projectile;
