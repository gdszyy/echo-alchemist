/**
 * phases.js - 游戏阶段管理类
 * 
 * 负责：
 * - 战斗阶段的所有逻辑
 * - 敌人AI和生成系统
 * - 技能系统和元素效果
 * - 战斗UI和反馈
 * 
 * @module phases
 */

import { CONFIG } from './config/index.js';
import { Vec2, showToast } from './core/index.js';
import { Enemy, Projectile, CloneSpore } from './entities/index.js';
import { Particle, FloatingText, LightningBolt, Shockwave, FireWave, EnergyOrb } from './effects/index.js';

const audio = window.audio;

/**
 * CombatPhase 类
 * 管理战斗阶段的所有逻辑
 */
export class CombatPhase {
    /**
     * 构造函数
     * @param {Game} game - Game实例的引用
     */
    constructor(game) {
        this.game = game;
    }


        damageEnemy(enemy, projectile) {
            if (!enemy || !enemy.active) return; 
            // --- [修復]：如果是光球/偽造子彈，補齊 chainHistory 防止報錯 ---
            if (!projectile.chainHistory) projectile.chainHistory = [];
    
            const config = projectile.config;
            const dmg = projectile.isCopy ? config.damage * 0.5 : config.damage;
            
            // --- 1. 视觉特效生成逻辑 ---
            const hitX = projectile.pos.x;
            const hitY = projectile.pos.y;
            const afx = CONFIG.balance.affixes; // 获取配置引用
            
            // 根据子弹属性决定打击特效
            // 根据子弹属性决定打击特效
            if (config.cryo > 0) {
                // === ❄️ 冰霜打击 (Frost Impact) ===
                
                // 2. 冰刺爆发 (Ice Spikes)
                // 数量随层数增加
                const shardCount = 1 + Math.floor(config.cryo /3); 
                for(let i=0; i<shardCount; i++) {
                    // 颜色：随机在 青色 和 白色 之间跳动
                    const color = Math.random() > 0.5 ? '#cffafe' : '#ffffff';
                    const shard = new Particle(hitX, hitY, color, 'shard');
                    this.particles.push(shard);
                }
    
                // 3. 滞留寒雾 (Lingering Mist)
                // 在击中点生成一团慢慢扩散的雾气
                const mistCount = 3 + Math.floor(config.cryo / 2);
                for(let i=0; i<mistCount; i++) {
                    // 随机分布在击中点周围
                    const mx = hitX + (Math.random()-0.5) * 20;
                    const my = hitY + (Math.random()-0.5) * 20;
                    // 颜色传 null 即可，Mist 模式内部处理了颜色
                    const mist = new Particle(mx, my, null, 'mist');
                    // 初始给一个向外的扩散速度
                    mist.vel = new Vec2((mx - hitX)*0.05, (my - hitY)*0.05);
                    this.particles.push(mist);
                }
    
            } else if (config.pyro > 0) {
                // 火焰：生成橙色火星和上升烟雾
                for(let i=0; i<5; i++) this.createParticle(hitX, hitY, '#fdba74', 'spark');
                for(let i=0; i<3; i++) this.createParticle(hitX, hitY, '#7c2d12', 'smoke');
            } else if (config.lightning > 0) {
                // 闪电：生成紫色快速火花
                for(let i=0; i<8; i++) this.createParticle(hitX, hitY, '#d8b4fe', 'spark');
            } else if (config.pierce > 0) {
                // 穿透：红色锐利碎片
                for(let i=0; i<5; i++) this.createParticle(hitX, hitY, '#fca5a5', 'spark');
            } else {
                // 普通：生成基础粒子
                const color = config.damage > 5 ? '#d8b4fe' : '#e2e8f0';
                for(let i=0; i<4; i++) this.createParticle(hitX, hitY, color, 'normal');
            }
            // --- ：判断伤害类型 ---
            let hitType = 'normal';
            if (config.cryo > 0) hitType = 'cryo';
            else if (config.pyro > 0) hitType = 'pyro';
            else if (config.lightning > 0) hitType = 'lightning';
            else if (config.pierce > 0) hitType = 'pierce';
            // --- 2. 伤害与状态逻辑 (保持原有逻辑) ---
            if (config.cryo > 0) enemy.applyTemp(-CONFIG.balance.cryoAmount * config.cryo); 
            if (config.pyro > 0) enemy.applyTemp(CONFIG.balance.pyroAmount * config.pyro); 
            if (config.lightning > 0) {
                 // 1. 尝试触发闪电链，并获取结果
                 const isChainTriggered = this.triggerLightningChain(enemy, dmg, projectile.chainHistory); 
                 
                 // 2. 只有在成功触发闪电链时，才提升当前敌人的温度
                 if (isChainTriggered) {
                     enemy.applyTemp(config.lightning); 
                 }
                 
                 projectile.chainHistory.push(enemy); 
            }
    
            const killed = enemy.takeDamage(dmg); 
            this.recordDamage(dmg);
            audio.playEnemyHit(hitType);
            // 克隆词缀逻辑: 如果敌人被伤害且有 'clone' 词缀，有概率生成克隆
            
            if (!killed && enemy.affixes.includes('clone') && Math.random() < CONFIG.balance.cloneChanceHit) {
                 // ... (复制你原来的 clone 生成代码) ...
                 const cloneHp = Math.max(1, Math.floor(enemy.maxHp * 0.2));
                 const w = this.enemyWidth;
                 // ... 寻找位置 ...
                 // 简写：实际请保留原来的完整逻辑
                 const validCols = [];
                 for(let r = 0; r < 3; r++) { for(let c = 0; c < CONFIG.gameplay.enemyCols; c++) { validCols.push({x: c*w+w/2, y: 80+r*50}); }} // 简单示意
                 if (validCols.length > 0) {
                     const pos = validCols[Math.floor(Math.random() * validCols.length)];
                     this.spores.push(new CloneSpore(enemy.pos.x, enemy.pos.y, pos.x, pos.y, () => {
                        const clone = new Enemy(pos.x, pos.y, w, this.enemyHeight, cloneHp, cloneHp);
                        clone.affixes = []; 
                        this.enemies.push(clone);
                    }));
                 }
            }
    
            if (killed) { 
                this.addScore(enemy.maxHp); 
                // 燃烧扩散逻辑 (保留)
                if (enemy.temp >= 100) {
                    this.fireWaves.push(new FireWave(enemy.pos.x, enemy.pos.y));
                    this.createFloatingText(enemy.pos.x, enemy.pos.y - 20, "🔥SPREAD!", "#f97316");
                    audio.playExplosion();
                    this.enemies.forEach(other => {
                        if (other.active && other !== enemy && enemy.pos.dist(other.pos) < CONFIG.gameplay.fireSpreadRadius) {
                            other.applyTemp(CONFIG.gameplay.fireSpreadTempIncrease);
                            other.takeDamage(enemy.maxHp*CONFIG.gameplay.fireSpreadDamagePercent);
                        }
                    });
                }
                const activeCount = this.enemies.filter(e => e.active).length;
                if(activeCount === 0) this.clearProjectiles(); 
                if (enemy.type === 'boss') {
                    setTimeout(() => {
                        this.stateBeforeRelic = this.phase; 
                        this.openRelicSelection(); 
                    }, 500);
                }
            }
            
            // 爆炸逻辑 (保留并增强视觉)
           if (config.explosive) {
                // --- 1. 解析爆炸主题 (Visual Theme Resolver) ---
                // 默认主题 (物理爆炸)
                let theme = {
                    waveColor: '#ef4444',       // 冲击波颜色 (红)
                    particleColor: '#f87171',   // 粒子颜色 (浅红)
                    particleMode: 'spark',      // 粒子模式
                    sound: 'explosion'          // (预留)
                };
    
                // 元素覆盖逻辑 (优先级：火 > 冰 > 电 > 毒/其他)
                if (config.pyro > 0) {
                    theme.waveColor = '#f97316';      // 橙色冲击波
                    theme.particleColor = '#fdba74';  // 橙黄火星
                    theme.particleMode = 'spark';     // 火星四溅
                } else if (config.cryo > 0) {
                    theme.waveColor = '#06b6d4';      // 青色冲击波 (寒气)
                    theme.particleColor = '#a5f3fc';  // 冰蓝碎片
                    theme.particleMode = 'shard';     // 冰渣飞溅
                } else if (config.lightning > 0) {
                    theme.waveColor = '#c084fc';      // 紫色冲击波 (电磁脉冲)
                    theme.particleColor = '#d8b4fe';  // 紫色电弧
                    theme.particleMode = 'spark';     
                } else if (config.isMatryoshka) {
                    theme.waveColor = '#d946ef';      // 粉色冲击波 (魔力)
                    theme.particleColor = '#f5d0fe';
                    theme.particleMode = 'normal';
                }
    
                // --- 2. 播放视觉特效 ---
                // 生成带有属性颜色的 Shockwave
                this.createShockwave(projectile.pos.x, projectile.pos.y, theme.waveColor); 
                
                // 生成对应的爆炸粒子群
                const particleCount = 12; // 爆炸产生的粒子数量
                for(let i=0; i < particleCount; i++) { 
                    this.createParticle(projectile.pos.x, projectile.pos.y, theme.particleColor, theme.particleMode); 
                }
    
                // 如果是火焰爆炸，额外加一点黑烟，增加质感
                if (config.pyro > 0) {
                    for(let i=0; i<5; i++) {
                        this.createParticle(projectile.pos.x, projectile.pos.y, 'rgba(0,0,0,0.5)', 'smoke');
                    }
                }
                
                // 播放音效
                audio.playExplosion();
    
                // --- 3. 造成范围伤害与效果 ---
                this.enemies.forEach(other => {
                    // 排除自身 & 距离检测 (爆炸半径 100)
                    if (other !== enemy && other.active && projectile.pos.dist(other.pos) < 100) { 
                        
                        // 造成 AOE 伤害 (减半)
                        const aoeDmg = dmg * 0.5;
                        const k = other.takeDamage(aoeDmg); 
                        this.recordDamage(aoeDmg); 
                        if (k) this.addScore(other.maxHp); 
                        
                        // --- 4. 关键：AOE 也要施加元素效果 ---
                        // 这样爆炸范围内的敌人也会被冰冻/点燃，符合直觉
                        if (config.cryo > 0) {
                            // 范围冰冻效果稍弱 (0.5倍)
                            other.applyTemp(-CONFIG.balance.cryoAmount * config.cryo * 0.5);
                            // 视觉反馈：给被波及的敌人也冒一点冷气
                            if (Math.random() < 0.3) this.createParticle(other.pos.x, other.pos.y, '#a5f3fc', 'smoke');
                        }
                        if (config.pyro > 0) {
                            other.applyTemp(CONFIG.balance.pyroAmount * config.pyro * 0.5);
                        }
                        if (config.lightning > 0) {
                            other.applyTemp(10 * config.lightning * 0.5);
                            // 闪电链通常只由直接击中触发，这里不触发链式，只加温度/易伤
                        }
                    }
                });
            }
        }
    

        spawnEnemyRowAt(yPos) {
            const b = CONFIG.balance;
            const baseHP = Math.floor(b.enemyBaseHp + (this.round * b.enemyHpPerRound) * this.nextRoundHpMultiplier);
            const w = this.enemyWidth;
            
            // 標記被佔用的列 (0-9)
            const occupiedCols = Array(CONFIG.gameplay.enemyCols).fill(false);
            
            // --- 1. Boss / Elite 生成逻辑 (保持不变，略) ---
            if (this.round > 3 && Math.random() < b.eliteChance) {
                 // ... (这里保留你原有的 Boss/Elite 生成代码) ...
                 // 记得同步更新 occupiedCols 数组
                 // 假设你之前的代码在这里已经处理好了 occupiedCols
            }
    
            // --- 2.  机会生成器：设计关卡布局 ---
            // 仅在非 Boss 覆盖的区域生效，且在初期 (前15关) 概率更高，给玩家一种“可以突破”的感觉
            let layoutType = 'random'; 
            const helpChance = this.round < 8 ? 0.7 : 0.3; // 前8关有70%概率出现特殊布局
    
            if (Math.random() < helpChance) {
                const types = ['gap', 'weak_spot', 'checkerboard'];
                layoutType = types[Math.floor(Math.random() * types.length)];
            }
    
            // 策略 A: [缺口] 强制留空一列，制造“钻入后排”的通道
            if (layoutType === 'gap') {
                const gapCol = Math.floor(Math.random() * CONFIG.gameplay.enemyCols);
                if (!occupiedCols[gapCol]) {
                    occupiedCols[gapCol] = true; // 标记为占用，但不生成敌人 -> 变为空格
                }
            }
            
            // 策略 B: [弱点] 生成一个 1 HP 的敌人，一触即碎的“大门”
            let weakSpotCol = -1;
            if (layoutType === 'weak_spot') {
                // 找一个没被占用的空位
                const freeIndices = occupiedCols.map((occupied, idx) => occupied ? -1 : idx).filter(idx => idx !== -1);
                if (freeIndices.length > 0) {
                    weakSpotCol = freeIndices[Math.floor(Math.random() * freeIndices.length)];
                }
            }
    
            // 策略 C: [棋盘] 强制隔一个生成一个，容易产生斜向反弹
            if (layoutType === 'checkerboard') {
                const parity = Math.random() > 0.5 ? 0 : 1; // 偶数或奇数
                for (let c = 0; c < CONFIG.gameplay.enemyCols; c++) {
                    if (c % 2 === parity) {
                        occupiedCols[c] = true; // 这些列强制留空
                    }
                }
            }
    
            // --- 3. 填充普通敌人 (修改版) ---
            const minEnemies = Math.min(CONFIG.gameplay.enemyCols, CONFIG.gameplay.spawnMin + Math.floor(this.round / 4));
            let currentCount = occupiedCols.filter(x => x).length; // 注意：如果是 gap 策略，这里的 count 会虚高，但这正是我们要的（生成更少的怪）
            
            // 获取所有未占用的列
            let freeCols = [];
            for(let c=0; c<CONFIG.gameplay.enemyCols; c++) {
                if(!occupiedCols[c]) freeCols.push(c);
            }
            
            // 洗牌
            for (let i = freeCols.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [freeCols[i], freeCols[j]] = [freeCols[j], freeCols[i]];
            }
    
            // 生成
            for (let c of freeCols) {
                const centerX = c * w + w / 2;
                
                // 基础生成判定
                let shouldSpawn = false;
                
                // 如果是弱点位置，强制生成
                if (c === weakSpotCol) shouldSpawn = true;
                // 否则按概率或最小数量生成
                else if (currentCount < minEnemies || Math.random() < b.spawnProb) shouldSpawn = true;
    
                if (shouldSpawn && !this.isAreaOccupied(centerX, yPos, w * 0.8, this.enemyHeight * 0.8)) {
                    
                    // 决定血量
                    let hp = Math.floor(baseHP * (0.8 + Math.random() * 0.4));
                    
                    // [应用弱点策略]：如果是选定的弱点列，血量强制设为 1 (或者极低)
                    if (c === weakSpotCol) {
                        hp = 1; 
                    }
    
                    const e = new Enemy(centerX, yPos, w, this.enemyHeight, hp);
                    e.affixes = this.generateAffixes();
                    if (e.affixes.length > 0) e.type = 'elite'; 
                    
                    // [视觉暗示] 如果是弱点怪，哪怕它是普通怪，我们也可以稍微改一下颜色或去掉词缀，让它看起来好欺负
                    if (c === weakSpotCol) {
                        e.affixes = []; // 弱点怪不带词缀
                        // 也可以在 Enemy.draw 里判断 hp=1 时画个裂纹，或者简单的：
                        e.maxHp = 1; // 确保血条显示也是满的但是很短
                    }
    
                    this.enemies.push(e);
                    currentCount++;
                }
            }
        }
    

        spawnBullet(x, y, vel, recipe) { 
            // [关键] 如果是激光，发射光束后直接 return，不生成 Projectile
            if (recipe.isLaser) {
                this.fireLaser(x, y, vel, recipe);
                
                // 处理散射激光 (如果激光带有散射属性，比如吃了黄色钉子)
                if (recipe.scatter > 0) {
                     for (let i = 1; i <= recipe.scatter; i++) { 
                        const sign = i % 2 === 0 ? -1 : 1; 
                        const multiplier = Math.ceil(i / 2); 
                        const angleOffset = 0.2 * multiplier * sign; 
                        const newVel = vel.rotate(angleOffset); 
                        // 递归调用 fireLaser 或 spawnBullet
                        // 注意：散射出的激光伤害通常减半或者保持
                        const copyRecipe = { ...recipe, scatter: 0 }; 
                        this.fireLaser(x, y, newVel, copyRecipe);
                    } 
                }
                return; // <--- 确保这里有 return，就不会生成下面的 Projectile 实体球了
            }
    
            this.projectiles.push(new Projectile(x, y, vel, recipe)); 
            if (recipe.isLaser) {
                this.fireLaser(x, y, vel, recipe);
                return;
            }
            // 散射 (Scatter)
            if (recipe.scatter > 0) { 
                for (let i = 1; i <= recipe.scatter; i++) { 
                    const sign = i % 2 === 0 ? -1 : 1; 
                    const multiplier = Math.ceil(i / 2); 
                    const angleOffset = 0.2 * multiplier * sign; // 散射角度偏移
                    const newVel = vel.rotate(angleOffset); 
                    const copyRecipe = { ...recipe, scatter: 0, chainPayload: null }; // 散射弹丸不带散射和连锁
                    this.projectiles.push(new Projectile(x, y, newVel, copyRecipe, true)); 
                } 
            } 
        }
    

        fireLaser(startX, startY, vel, recipe) {
            // --- 1. 参数计算 ---
            
            // [射程] 基础 500 + 每层穿透 250 (决定光线能跑多远)
            let maxLen = 500 + (recipe.pierce * 250); 
            
            // [粗细] 基础 3px + 每层激光 4px + 爆破加成 (决定光线视觉宽度)
            let width = 3 + (recipe.laser * 4) + (recipe.explosive ? 10 : 0);
            
            // [反弹] 直接读取配方中的 bounce 值 (决定折射次数)
            let bounces = recipe.bounce; 
    
            // [颜色] 优先级：爆破 > 元素 > 默认蓝
            let color = '#0ea5e9'; 
            if (recipe.pyro > 0) color = '#f97316';
            else if (recipe.cryo > 0) color = '#06b6d4';
            else if (recipe.lightning > 0) color = '#d8b4fe';
            else if (recipe.explosive) color = '#ef4444';
    
            // --- 2. 射线检测 (Raycasting Logic) ---
            let points = [new Vec2(startX, startY)]; 
            let currPos = new Vec2(startX, startY);
            let currDir = vel.norm(); 
            let remainLen = maxLen;
            
            // 循环条件：只要还有剩余长度 (remainLen > 0) 就继续
            // 内部会判断是否撞墙/次数耗尽来 break
            while (remainLen > 0) {
                // A. 寻找最近的反射面 (墙壁 或 护盾敌人)
                let hitResult = this.castRayToReflectors(currPos, currDir, remainLen);
                
                // B. 结算这一段路径 (移动光标)
                let segmentLen = hitResult.dist;
                let nextPos = currPos.add(currDir.mult(segmentLen));
                
                // C. 伤害路径上的普通敌人 (穿透所有)
                this.processLaserPenetration(currPos, nextPos, recipe);
    
                // 记录路径点用于绘制
                points.push(nextPos);
                
                // 扣除长度
                remainLen -= segmentLen;
                currPos = nextPos;
    
                // D. 处理撞击结果
                if (hitResult.hitType === 'none') {
                    // 没撞到任何反射面，光线在空气中耗尽长度，结束
                    break; 
                } else {
                    // 撞到了反射面！检查是否有剩余反弹次数
                    if (bounces <= 0) {
                        // 次数耗尽，光线在这里终止 (虽有长度但无法折射)
                        // 可以在末端加个小火花表示能量耗尽
                        this.createParticle(nextPos.x, nextPos.y, color, 'spark');
                        break;
                    }
    
                    // 消耗一次反弹次数
                    bounces--;
                    
                    // 触发撞击反馈
                    if (hitResult.hitType === 'wall') {
                        audio.playHit('bounce');
                        this.createParticle(nextPos.x, nextPos.y, color, 'spark');
                    } else if (hitResult.hitType === 'shield') {
                        // 击中护盾敌人
                        this.damageEnemy(hitResult.enemy, { config: recipe, pos: nextPos, isCopy: false }); 
                        audio.playHit('bounce'); // 听起来像打铁
                        this.createParticle(nextPos.x, nextPos.y, '#3b82f6', 'spark');
                    }
    
                    // 计算反射向量 (镜面反射)
                    if (hitResult.normal === 'x') currDir.x *= -1;
                    else currDir.y *= -1;
                }
            }
    
            // --- 3. 生成视觉与音效 ---
            this.particles.push(new LaserBeam(points, width, color));
            
            // 音效：越粗越低沉
            audio.playTone(Math.max(100, 800 - width * 20), 'sawtooth', 0.15, 0.2 + width * 0.01); 
        }
    

        castRayToReflectors(start, dir, maxDist) {
            let closest = { dist: maxDist, hitType: 'none', normal: null, enemy: null };
    
            // 1. 检测墙壁
            // 左墙 (x=radius)
            if (dir.x < 0) {
                let d = (CONFIG.physics.bulletRadius - start.x) / dir.x;
                if (d > 0 && d < closest.dist) closest = { dist: d, hitType: 'wall', normal: 'x' };
            }
            // 右墙 (x=width-radius)
            if (dir.x > 0) {
                let d = (this.width - CONFIG.physics.bulletRadius - start.x) / dir.x;
                if (d > 0 && d < closest.dist) closest = { dist: d, hitType: 'wall', normal: 'x' };
            }
            // 顶墙 (y=radius)
            if (dir.y < 0) {
                let d = (CONFIG.physics.bulletRadius - start.y) / dir.y;
                if (d > 0 && d < closest.dist) closest = { dist: d, hitType: 'wall', normal: 'y' };
            }
            // 底墙 (y=height-radius) - 只有在有 CombatWall 遗物时才反弹
            if (this.hasCombatWall && dir.y > 0) {
                let d = (this.height - CONFIG.physics.bulletRadius - start.y) / dir.y;
                if (d > 0 && d < closest.dist) closest = { dist: d, hitType: 'wall', normal: 'y' };
            }
    
            // 2. 检测带盾敌人 (视为反射面)
            this.enemies.forEach(e => {
                if (!e.active || !e.affixes.includes('shield')) return;
                
                // 简单的 AABB 射线检测
                // 扩展一下边界作为碰撞箱
                const halfW = e.width / 2 + 5;
                const halfH = e.height / 2 + 5;
                
                // 为了简化，我们把敌人看作一个圆或者简单的矩形
                // 这里使用简化的矩形求交 (Slab method 的简化版)
                // 实际上，为了游戏手感，我们可以遍历所有敌人的边界线
                // 但最简单的方法是：检测射线是否穿过敌人中心附近
                
                // 使用线段与矩形相交检测
                const t = this.getLineRectIntersection(start, dir, e.pos.x - halfW, e.pos.y - halfH, e.width, e.height);
                if (t !== null && t > 0 && t < closest.dist) {
                    // 确定法线 (简化：看击中点的相对位置)
                    const hitX = start.x + dir.x * t;
                    const hitY = start.y + dir.y * t;
                    const dx = Math.abs(hitX - e.pos.x);
                    const dy = Math.abs(hitY - e.pos.y);
                    // 如果 x 偏差比 y 偏差大，说明撞的是左右侧 (Normal X)，否则是上下侧
                    // 需归一化比较 (宽高比)
                    const nx = dx / halfW;
                    const ny = dy / halfH;
                    
                    closest = { 
                        dist: t, 
                        hitType: 'shield', 
                        normal: nx > ny ? 'x' : 'y',
                        enemy: e 
                    };
                }
            });
    
            return closest;
        }
    

        processLaserPenetration(p1, p2, recipe) {
            // 构建线段包围盒用于快速剔除
            const minX = Math.min(p1.x, p2.x) - 20;
            const maxX = Math.max(p1.x, p2.x) + 20;
            const minY = Math.min(p1.y, p2.y) - 20;
            const maxY = Math.max(p1.y, p2.y) + 20;
    
            this.enemies.forEach(e => {
                if (!e.active) return;
                // 如果是护盾怪，之前在反射逻辑里已经处理过了，这里跳过？
                // 不，反射逻辑只处理了“最近”的一个。
                // 激光原理是：它会穿透所有普通怪，直到遇到反射面。
                // 所以这里要排除掉那个充当反射面的护盾怪（如果这束光正好终结于它）。
                // 简单处理：全部检测一遍，伤害频率不高。
                
                if (e.pos.x < minX || e.pos.x > maxX || e.pos.y < minY || e.pos.y > maxY) return;
    
                // 点到线段距离公式
                const l2 = p1.dist(p2) * p1.dist(p2);
                if (l2 == 0) return;
                let t = ((e.pos.x - p1.x) * (p2.x - p1.x) + (e.pos.y - p1.y) * (p2.y - p1.y)) / l2;
                t = Math.max(0, Math.min(1, t));
                const projX = p1.x + t * (p2.x - p1.x);
                const projY = p1.y + t * (p2.y - p1.y);
                const dist = Math.sqrt(Math.pow(e.pos.x - projX, 2) + Math.pow(e.pos.y - projY, 2));
    
                // 判定半径：敌人半径 + 激光粗细
                const hitRadius = Math.min(e.width, e.height) / 2 + (recipe.explosive ? 15 : 5);
    
                if (dist < hitRadius) {
                    // 造成伤害
                    // 为了避免多重判定问题，我们可以在这里直接伤害
                    // 伪造一个 projectile 对象传给 damageEnemy
                    this.damageEnemy(e, { config: recipe, pos: new Vec2(projX, projY), isCopy: false });
                    
                    // 视觉：受击点特效
                    if (Math.random() < 0.3) this.createParticle(projX, projY, '#fff', 'spark');
                }
            });
        }
    

        getLineRectIntersection(start, dir, rx, ry, rw, rh) {
            let tmin = -Infinity;
            let tmax = Infinity;
    
            if (dir.x !== 0) {
                let tx1 = (rx - start.x) / dir.x;
                let tx2 = (rx + rw - start.x) / dir.x;
                tmin = Math.max(tmin, Math.min(tx1, tx2));
                tmax = Math.min(tmax, Math.max(tx1, tx2));
            } else if (start.x < rx || start.x > rx + rw) {
                return null;
            }
    
            if (dir.y !== 0) {
                let ty1 = (ry - start.y) / dir.y;
                let ty2 = (ry + rh - start.y) / dir.y;
                tmin = Math.max(tmin, Math.min(ty1, ty2));
                tmax = Math.min(tmax, Math.max(ty1, ty2));
            } else if (start.y < ry || start.y > ry + rh) {
                return null;
            }
    
            if (tmax >= tmin && tmin >= 0) return tmin;
            return null;
        }
    

        triggerLightningChain(sourceEnemy, dmg, history) {
            // [修复1] 安全检查
            if (!sourceEnemy || !sourceEnemy.pos) return false; // <--- 修改：返回 false
    
            // [修复2] 容错处理
            history = history || [];
    
            // 查找未被击中且在范围内的最近敌人
            let targets = this.enemies.filter(e => 
                e.active &&             
                e !== sourceEnemy &&    
                !history.includes(e)    
            ); 
    
            // [修复3] 如果没有有效目标
            if (targets.length === 0) return false; // <--- 修改：返回 false
    
            let closest = null; 
            let minDist = 150; // 连锁范围
            
            // 寻找最近邻居
            targets.forEach(t => { 
                let d = sourceEnemy.pos.dist(t.pos); 
                if(d < minDist) { 
                    minDist = d; 
                    closest = t; 
                } 
            });
    
            // 只有找到目标才继续递归
            if (closest) { 
                let p = 0.15; // 基础连锁概率
                if (closest.temp < 0) p = Math.min(1.0, 0.15 + Math.abs(closest.temp) * 0.0085); 
                
                if (Math.random() < p) { 
                    // 视觉效果
                    this.lightningBolts.push(new LightningBolt(sourceEnemy.pos.x, sourceEnemy.pos.y, closest.pos.x, closest.pos.y)); 
                    audio.playLightning(); 
                    
                    // 伤害与状态
                    closest.applyTemp(CONFIG.balance.lightningTempIncrease); 
                    const killed = closest.takeDamage(dmg); 
                    this.recordDamage(dmg); 
                    if(killed) this.addScore(closest.maxHp); 
                    
                    // 递归
                    history.push(closest); 
                    this.triggerLightningChain(closest, dmg, history); 
                    
                    return true; // <--- 新增：成功触发，返回 true
                } 
            }
            return false; // <--- 新增：未触发或无目标，返回 false
        }
    

        startCombatPhase() { 
            this.energyOrbs = [];
            this.switchPhase('combat'); 
            
            // --- [核心修复 1]：显式生成弹药队列 ---
            this.ammoQueue = this.marbleQueue.map(item => {
                const hasMulticast = item.collected.includes('multicast'); 
                // [修复点]：这里原来写的是 item.def，改为 item
                // 因为 marbleQueue 里的元素本身就是 MarbleDefinition 定义
                return this.compileCollectionToRecipe(item, item.collected, hasMulticast);
            });
    
            // --- [核心修复 2]：状态重置 ---
            this.resetMultiplier(); 
            this.burstQueue = []; 
            this.pendingShots = []; 
            
            // --- [核心修复 3]：更新技能与 UI ---
            if (this.ui) {
                this.ui.updateSkillPoints(this.skillPoints);
                this.ui.updateSkillBar(this.skillPoints);
            }
    
            // --- [核心修复 4]：立即渲染左侧配方列表 ---
            // 修复后，代码不再报错，这一行将被正确执行，HUD 会立即出现
            this.renderRecipeHUD(); 
        }
    

        advanceWave() { 
            this.resolveTemperatureAndAdvance(); // 结算温度效果
            // 根据场上敌人行数决定生成多少行新敌人
            const rows = new Set(this.enemies.filter(e=>e.active).map(e => Math.floor(e.pos.y))); 
            let spawnCount = 1; 
            if (rows.size < 3) spawnCount = 2; // 如果敌人行数少于3，则生成2行
            this.spawnEnemyRow(spawnCount); 
            
            this.round++; // 回合数增加
            this.prevRoundDamage = this.roundDamage; // 记录上一回合伤害
            this.roundDamage = 0; // 重置本回合伤害
            document.getElementById('round-num').innerText = this.round; 
            showToast(`Round ${this.round}`); 
        }
    

        spawnEnemyRow(count = 1) { for(let i=0; i<count; i++) { this.spawnEnemyRowAt(80 - (i * this.enemyHeight)); } }
    

        recordDamage(amount) { 
            this.roundDamage += amount; 
        }
    

        addScore(amount) { 
            this.score += Math.floor(amount * this.scoreMultiplier); 
            document.getElementById('score-num').innerText = this.score; 
            this.scoreMultiplier = parseFloat((this.scoreMultiplier + 0.2).toFixed(1)); // 乘数增加 0.2
            this.updateMultiplierUI(); 
        }
    

        resetMultiplier() { 
            this.scoreMultiplier = 1.0; 
            this.updateMultiplierUI(); 
            document.getElementById('multiplier-display').classList.remove('opacity-100'); 
            document.getElementById('multiplier-display').classList.add('opacity-0'); 
        }
    

        updateMultiplierUI() { 
            const el = document.getElementById('multiplier-val'); 
            el.innerText = `x${this.scoreMultiplier.toFixed(1)}`; 
            const container = document.getElementById('multiplier-display'); 
            container.classList.remove('opacity-0'); 
            container.classList.add('opacity-100'); 
            el.classList.remove('pop-anim'); 
            void el.offsetWidth; 
            el.classList.add('pop-anim'); 
        }
    

        calculateWaveSpeed() {
            const maxSpeed = 25 * this.timeScale;
            const scanSpeed = 3 * this.timeScale;
            const clearSpeed = 12 * this.timeScale; //  清场时的展示速度 (适中)
    
            // 1. 如果有阻尼 (刚刚触发了事件)，强制慢速
            if (this.waveMomentumTimer > 0) {
                return scanSpeed;
            }
    
            // 2. 波浪已经跑出屏幕上方，加速销毁
            if (this.enemyWaveY < -50) return maxSpeed;
    
            // 3. 统计活着的敌人数量
            const activeEnemyCount = this.enemies.filter(e => e.active).length;
    
            // [核心修复] 如果场上没有敌人 (清场状态)，不要用 maxSpeed，
            // 而是用 clearSpeed，让玩家能看清波浪扫过空场，产生"安全确认"的视觉反馈。
            if (activeEnemyCount === 0) {
                return clearSpeed;
            }
    
            let nearestDist = Infinity;
            const defenseLineY = this.height - 100;
            
            // 刚开始还没进入防线区域时，快速进场
            if (this.enemyWaveY > defenseLineY) return maxSpeed;
    
            let hasEnemyAbove = false;
            this.enemies.forEach(e => {
                if (!e.active || e.hasActedThisTurn) return;
                
                const enemyBottom = e.pos.y + e.height/2;
                // 只检测波浪上方的敌人
                if (enemyBottom <= this.enemyWaveY + 50) { 
                    const dist = this.enemyWaveY - enemyBottom;
                    if (dist >= -20 && dist < nearestDist) {
                        nearestDist = dist;
                        hasEnemyAbove = true;
                    }
                }
            });
    
            if (!hasEnemyAbove) {
                return maxSpeed; // 只有在有敌人但都不在波浪上方时，才全速追赶
            } else {
                const slowDownRange = 150; 
                const stopRange = 10;      
                if (nearestDist > slowDownRange) return maxSpeed;
                else if (nearestDist < stopRange) return scanSpeed;
                else {
                    const t = nearestDist / slowDownRange;
                    return scanSpeed + (maxSpeed - scanSpeed) * (t * t); 
                }
            }
        }
    

        clearProjectiles() { 
            this.projectiles = []; 
            this.burstQueue = []; 
            this.spores = []; // 換場時清理掉還在飛的孢子
            this.fireWaves = []; // 清理火焰波
        }
    

        checkEnemyHover(pos) {
            // 只有战斗阶段且非敌人回合才允许查看
            if (this.phase !== 'combat' || this.isEnemyTurn) return null;
    
            let hit = null;
            // 逆序遍历，优先检测上层(视觉上)的敌人
            for(let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                if (!e.active) continue;
                
                // 简单的矩形碰撞检测
                const halfW = e.width / 2;
                const halfH = e.height / 2;
                if (pos.x >= e.pos.x - halfW && pos.x <= e.pos.x + halfW &&
                    pos.y >= e.pos.y - halfH && pos.y <= e.pos.y + halfH) {
                    hit = e;
                    break;
                }
            }
    
            if (hit) {
                this.ui.showEnemyInfo(hit);
                // 给敌人加一个高亮框 (可选，复用你之前的 scanFeedbackTimer)
                // hit.scanFeedbackTimer = 0.5; // 微微闪亮
            } else {
                // 如果是在PC端鼠标移动，移开即关闭；移动端需要手动点关闭按钮或点空地
                // 为了体验统一，这里设定：如果正在Hover别的，就切过去；如果移到空地，暂时不自动关闭(防止误触)，
                // 或者：移到空地就关闭。这里采用“移到空地不自动关闭，依靠点击关闭或拖拽关闭”，体验较稳。
                // 但如果想要鼠标移开就消失：
                // this.ui.closeDrawer(); 
            }
            return hit;
        }
    

        fireNextShot(vel) { 
            if (this.ammoQueue.length === 0) return;
    
            // ... (套娃提取逻辑保持不变) ...
            const pullNext = () => {
                if (this.ammoQueue.length === 0) return null;
                let r = this.ammoQueue.shift();
                if (r.isMatryoshka) {
                    const nextR = pullNext();
                    if (nextR) r.nestedPayload = nextR;
                }
                return r;
            };
            const finalRecipe = pullNext();
            if (!finalRecipe) return;
    
            // --- 新增：触发UI动画 ---
            const currentSlot = document.getElementById('current-ammo-render');
            if (currentSlot) {
                // 1. 播放飞出动画
                currentSlot.classList.add('shoot-anim');
                
                // 2. 延迟更新 UI (等待动画播放一部分，制造视觉连贯性)
                // 实际子弹已经生成，但UI滞后一点点更新，让玩家看到"发射"的过程
                setTimeout(() => {
                    this.updateAmmoUI();
                    
                    // 3. 为新上膛的子弹添加"滑入"动画
                    const newCurrent = document.getElementById('current-ammo-render');
                    if (newCurrent) {
                        newCurrent.classList.add('slide-in-anim');
                        setTimeout(() => newCurrent.classList.remove('slide-in-anim'), 400);
                    }
                }, 150); 
            } else {
                this.updateAmmoUI();
            }
            
            this.renderRecipeHUD(); 
            
            // 基础射击
            this.burstQueue.push({ delay: 0, vel: vel, recipe: finalRecipe }); 
            
            // 多重射击
            if (finalRecipe.multicast > 0) { 
                for(let i=1; i<=finalRecipe.multicast; i++) { 
                    this.burstQueue.push({ delay: i * 20, vel: vel, recipe: finalRecipe }); 
                } 
            } 
        }
    

        createHitFeedback(x, y, velocity, type = 'normal') {
            // 1. 获取目标坐标
            if (!this.uiCache) this.updateUICache();
            
            let targetX = this.uiCache.x;
            let targetY = this.uiCache.y;
    
            // [核心修复]：兜底检测
            // 如果缓存坐标是 0 (说明上次获取时 UI 可能被隐藏了)，强制重算
            if (targetX === 0 && targetY === 0) {
                this.updateUICache();
                targetX = this.uiCache.x;
                targetY = this.uiCache.y;
                
                // 如果还是 0 (极罕见)，就手动指定一个大概位置 (屏幕中下方)
                if (targetX === 0) {
                    targetX = this.width / 2;
                    targetY = this.height - 100;
                }
            }
    
            // --- 以下保持之前的优化逻辑不变 ---
            
            let color = '#fbbf24'; 
            if (type === 'cryo') color = '#67e8f9';
            else if (type === 'pyro') color = '#f97316';
            else if (type === 'lightning') color = '#d8b4fe';
            else if (type === 'bounce') color = '#4ade80';
    
            const initVel = velocity ? velocity : new Vec2((Math.random()-0.5)*5, -5);
    
            this.energyOrbs.push(new EnergyOrb(x, y, targetX, targetY, color, initVel, () => {
                if(this.currentSession) { 
                    this.currentSession.currentHits++;
                    this.currentSession.totalHits++; 
                    
                    // 音效
                    const progress = Math.min(1, this.currentSession.currentHits / this.currentSession.nextTriggerThreshold);
                    if (this.currentSession.currentHits < this.currentSession.nextTriggerThreshold) {
                        if (Math.random() < 0.5) audio.playTone(500 * (1.0 + progress * 0.5), 'triangle', 0.05, 0.2); 
                    }
    
                    // 更新 UI
                    this.updateHitProgress(this.currentSession.currentHits, this.currentSession.nextTriggerThreshold); 
                    
                    const pulseLayer = this.uiCache.pulseLayer; // 使用缓存 DOM
                    if (pulseLayer) {
                        pulseLayer.style.setProperty('--pulse-color', color);
                        if (!pulseLayer.classList.contains('pulse-active')) {
                            pulseLayer.classList.add('pulse-active');
                            setTimeout(() => pulseLayer.classList.remove('pulse-active'), 700);
                        }
                    }
    
                    // 震动节流
                    const now = Date.now();
                    if (this.uiCache.el && (!this.lastUiShakeTime || now - this.lastUiShakeTime > 100)) {
                        this.lastUiShakeTime = now;
                        const el = this.uiCache.el;
                        el.classList.remove('gauge-shake');
                        void el.offsetWidth; 
                        el.classList.add('gauge-shake');
                    }
                    
                    // 粒子
                    for(let i=0; i<3; i++) {
                        const p = new Particle(targetX, targetY, color, 'spark');
                        p.vel = new Vec2((Math.random()-0.5)*3, (Math.random()-0.5)*3);
                        this.particles.push(p);
                    }
    
                    if (this.currentSession.currentHits >= this.currentSession.nextTriggerThreshold) {
                        this.triggerLevelUpEvent(targetX, targetY); 
                    } 
                }
                this.attemptCompleteGatheringTurn();
            }));
        }
    

        triggerLevelUpEvent(uiX, uiY) {
        this.currentSession.currentHits = 0;
        this.currentSession.multicast++; 
        this.updateMulticastDisplay(1);
        
        // 1. 音效爆發
        audio.playPowerup(this.currentSession.multicast); 
        
        // 2. UI 容器进入“满能量”状态动画
        const gaugeShell = this.uiCache ? this.uiCache.gaugeShell : document.getElementById('gauge-shell');
        if (gaugeShell) {
            // 添加针对圆角优化的发光类
            gaugeShell.classList.add('gauge-full');
            
            // 0.8秒后移除
            setTimeout(() => gaugeShell.classList.remove('gauge-full'), 800);
        }
        // 3. 强力冲击波
        this.createShockwave(uiX, uiY, '#facc15');
        
        // 4. 生成大量粒子
        for(let i=0; i<20; i++) {
            const px = uiX + (Math.random()-0.5) * 80;
            const py = uiY + (Math.random()-0.5) * 30;
            this.createParticle(px, py, '#fcd34d', 'spark');
        }
    
        this.createFloatingText(uiX, uiY - 50, "LEVEL UP!", "#fff");
        this.updateHitProgress(0, this.currentSession.nextTriggerThreshold);
    }
    

        processSingleEnemyTurn(e) {
            if (!e.active || e.hasActedThisTurn) return;
            
            e.hasActedThisTurn = true; 
            
            //  只要觸發了結算，強迫掃描波在接下來的 45 幀內保持慢速
            // 這樣即使敵人被燒死消失了，波浪也會慢慢掃過屍體位置，展現"擊殺確認"的感覺
            this.waveMomentumTimer = 45; 
    
            // --- 1. 溫度結算邏輯 ---
            if (e.temp < 0) {
                // ... (冰凍邏輯保持不變)
                 const freezeChance = Math.min(Math.abs(e.temp) / 100, 1.0)/2;
                 if (Math.random() < freezeChance && e.temp<=-50) { 
                     e.isFrozenCurrentTurn = true;
                     this.createExplosion(e.pos.x, e.pos.y, '#06b6d4');
                     audio.playEffect('freeze');
                 }else{
                     e.isFrozenCurrentTurn = false;
                 }
                 e.temp = Math.ceil(e.temp / 2);
            }
    
            if (e.temp > 0) {
                if (e.temp < 100) {
                     e.temp = Math.max(0, e.temp - 5);
                } else {
                    const dot = 5 + (e.temp - 100);
                    e.takeDamage(dot); // <--- 敵人可能在這裡死亡 (active = false)
                    
                    // 觸發燃燒特效
                    e.playBurnTickEffect(this, Math.floor(dot));
                    
                    const decay = Math.floor(e.temp / 20);
                    e.temp = Math.max(0, e.temp - decay);
                }
            }
    
            // --- 2. 行動邏輯 ---
            // 只有活著的敵人才移動
            if (e.active && e.isFrozenCurrentTurn == false) {
                e.performTurnActionAndMove(this);
            }
        }
    

        startEnemyTurnLogic() {
            this.isEnemyTurn = true;
            this.enemyTurnTimer = 0;
    
            // 初始化扫描波
            this.enemyWaveActive = true;
            this.enemyWaveY = this.height + 50; // 从屏幕最下方开始
            this.waveSpeed = 8 * this.timeScale; // 根据倍速调整扫描速度
    
            // 重置所有敌人的行动标记
            this.enemies.forEach(e => {
                e.hasActedThisTurn = false;
                e.isFrozenCurrentTurn = false; // 重置上一轮的冰冻状态
            });
    
            // UI 提示
            const msgEl = document.getElementById('combat-message');
            if (msgEl) {
                msgEl.innerHTML = '<span class="text-yellow-400 font-bold text-xl drop-shadow-md">⚠️ ENEMY TURN</span>';
                msgEl.classList.remove('opacity-0');
                msgEl.classList.add('pop-anim'); 
            }
        }
    

        finalizeRound() {
            // 1. 统计当前存活敌人数据
            const activeEnemies = this.enemies.filter(e => e.active);
            // 使用 Set 统计有多少个不同的 Y 坐标（即有多少行）
            // Math.round 处理浮点误差，/50 是行高，确保归类准确
            const uniqueRows = new Set(activeEnemies.map(e => Math.round(e.pos.y / this.enemyHeight)));
            
            // 2. 触发条件判定：行数 <= 1 或 总数 <= 5
            if (uniqueRows.size <= 1 || activeEnemies.length <= 5) {
                let buffCount = 0;
                activeEnemies.forEach(e => {
                    if (!e.affixes.includes('haste')) {
                        e.affixes.push('haste');
                        buffCount++;
                        // [视觉] 获得Buff的特效
                        this.createParticle(e.pos.x, e.pos.y, '#facc15', 'spark');
                    }
                });
                
                if (buffCount > 0) {
                    showToast("⚠️ 敵軍狂暴 (HASTE APPLIED) ⚠️");
                    audio.playPowerup(); // 播放警示音
                }
            }
    
            // --- 以下保持原有的回合结算逻辑 ---
            
            // 生成新敌人
            const rowCountCurrent = uniqueRows.size;
            let spawnCount = 1;
            if (rowCountCurrent < 4) spawnCount = 3; // 稍微激进一点的生成
            this.spawnEnemyRow(spawnCount);
    
            // 重置倍率
            if (this.nextRoundHpMultiplier > 1) {
                showToast("強敵來襲！HP x" + this.nextRoundHpMultiplier);
                this.nextRoundHpMultiplier = 1;
            }
    
            // 更新回合数
            this.round++;
            this.prevRoundDamage = this.roundDamage;
            this.roundDamage = 0;
            document.getElementById('round-num').innerText = this.round;
            showToast(`Round ${this.round}`);
    
            // 检查失败
            if (this.checkDefeat()) {
                this.gameOver = true;
                return;
            }
    
            document.getElementById('combat-message').innerHTML = '';
            this.initPachinko();
    
            // 遗物事件检查
            if (this.round % CONFIG.gameplay.relicRoundInterval == 0) {
                showToast("✨ 命運的饋贈 ✨");
                this.phase = 'relic_event';
                setTimeout(() => { this.showRelicSelection(); }, 500);
                return;
            }
            
            this.isEnemyTurn = false;
            if (this.ammoQueue.length === 0) {
                this.initSelectionPhase();
            }
        }
    

        checkDefeat() { 
            // [修正]：使用实体层 Y 轴系数 (-20)
            const viewShiftY = this.boardTilt.current.y * -20;
    
            for(let e of this.enemies) { 
                // 判断：(敌人逻辑位置 + 视觉偏移) 是否超过 防线
                if (e.active && (e.pos.y + viewShiftY) > this.defeatLineY) {
                    return true; 
                }
            } 
            return false; 
        }
    

        isAreaOccupied(x, y, w, h, excludeEnemy = null) {
            // 定義检测区域的邊界
            const l1 = x - w / 2;
            const r1 = x + w / 2;
            const t1 = y - h / 2;
            const b1 = y + h / 2;
    
            for (let e of this.enemies) {
                if (!e.active || e === excludeEnemy) continue;
    
                // --- [核心修复] ---
                // 使用 dropTargetY (逻辑上的目标位置) 而不是 pos.y (当前的动画位置)
                // 这样当底部敌人决定移动后，上方敌人立刻就能知道该格子在逻辑上已经空出来了
                const enemyY = e.dropTargetY; 
                const enemyX = e.pos.x; // X轴通常不改变，用 pos.x 即可
    
                // 手动计算边界，代替 e.getBounds()
                const eLeft = enemyX - e.width / 2;
                const eRight = enemyX + e.width / 2;
                const eTop = enemyY - e.height / 2;
                const eBottom = enemyY + e.height / 2;
    
                // AABB 碰撞檢測 (保留 margin 防止边缘误触)
                const margin = 2;
                if (l1 < eRight - margin &&
                    r1 > eLeft + margin &&
                    t1 < eBottom - margin &&
                    b1 > eTop + margin) {
                    return true;
                }
            }
            return false;
        }
    

        triggerCloneSpawn(sourceEnemy) {
            const w = this.enemyWidth;
            const cloneHp = Math.max(1, Math.floor(sourceEnemy.maxHp * 0.2));
            
            // 寻找落点
            const validCols = [];
            for(let r = 0; r < 3; r++) {
                 for(let c = 0; c < CONFIG.gameplay.enemyCols; c++) {
                     const tx = c * w + w/2;
                     const ty = 80 + r * this.enemyHeight;
                     if (!this.isAreaOccupied(tx, ty, w * 0.9, this.enemyHeight * 0.9)) {
                         validCols.push({x: tx, y: ty});
                     }
                 }
            }
    
            if (validCols.length > 0) {
                const pos = validCols[Math.floor(Math.random() * validCols.length)];
                // 发射孢子
                audio.playEffect('split');
                this.spores.push(new CloneSpore(sourceEnemy.pos.x, sourceEnemy.pos.y, pos.x, pos.y, () => {
                    const clone = new Enemy(pos.x, pos.y, w, this.enemyHeight, cloneHp, cloneHp);
                    clone.affixes = []; // 分身没有词缀
                    this.enemies.push(clone);
                    this.createFloatingText(pos.x, pos.y, "SPAWN", "#a855f7");
                }));
            }
        }
    

        generateAffixes() {
            if (this.round <= 3) return [];
    
            const affixes = [];
            const possible = ['shield', 'haste', 'regen', 'clone','healer', 'devour', 'jump'];
            // --- 修改开始：使用 CONFIG.balance ---
            // 计算获得词缀的概率
            const chance = CONFIG.balance.affixBaseChance + (this.round * CONFIG.balance.affixRoundGrowth);
            // 简单逻辑：根据概率决定获得1个或2个词缀
            const count = Math.random() < (chance * 0.5) ? 2 : (Math.random() < chance ? 1 : 0);
            // --- 修改结束 ---
            
            for(let i=0; i<count; i++) {
                const af = possible[Math.floor(Math.random()*possible.length)];
                if(!affixes.includes(af)) affixes.push(af);
            }
            return affixes;
        }
    

        activateSkill(skill) {
            if (this.phase !== 'combat' || this.isEnemyTurn || this.skillPoints < skill.cost) return;
    
            // 1. 扣除消耗
            this.skillPoints -= skill.cost;
            this.ui.updateSkillPoints(this.skillPoints);
            this.ui.updateSkillBar(this.skillPoints);
            
            audio.playPowerup(5); 
            showToast(`釋放: ${skill.name}!`);
    
            const p = skill.params;
            
            // [核心修改] 使用 methodId 进行逻辑分发
            const method = skill.methodId;
    
            if (method === 'repulsion') {
                // ... (重力反转逻辑保持不变) ...
                const pushDistance = this.enemyHeight * p.pushRows;
                let pushedCount = 0;
                this.enemies.forEach(e => {
                    if (e.active) {
                        e.dropTargetY = Math.max(80, e.dropTargetY - pushDistance); 
                        e.pos.y = e.dropTargetY; 
                        e.bumpOffsetY = p.visualShake;
                        pushedCount++;
                        this.createParticle(e.pos.x, e.pos.y + e.height/2, p.particleColor, 'mist');
                    }
                });
                this.createShockwave(this.width/2, this.height/2, p.shockwaveColor);
                if(pushedCount > 0) audio.playEffect('split');
                document.getElementById('game-container').classList.add('shake-hard');
                setTimeout(() => document.getElementById('game-container').classList.remove('shake-hard'), 200);
            } 
            else if (method === 'chain_lightning_all') {
                // === [新增] 全屏闪电链逻辑 ===
                const dmg = p.baseDmg + (this.round * p.roundMult);
                
                // 视觉：全屏微闪
                const flash = document.createElement('div');
                flash.className = 'absolute inset-0 z-50 pointer-events-none transition-opacity duration-200';
                flash.style.backgroundColor = p.flashColor;
                document.body.appendChild(flash);
                setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 200); }, 50);
                document.getElementById('game-container').classList.add('shake-hard');
                setTimeout(() => document.getElementById('game-container').classList.remove('shake-hard'), 200);
                // 倒序遍历（防止数组变动影响）
                // 策略：对每个敌人从天降下一道闪电，并以此为起点尝试触发连锁
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    if (e.active) {
                        // 1. 视觉：天雷 (从屏幕顶端打到敌人头顶)
                        const startX = e.pos.x + (Math.random() - 0.5) * 50;
                        this.lightningBolts.push(new LightningBolt(startX, 0, e.pos.x, e.pos.y));
                        
                        // 2. 造成主伤害
                        const killed = e.takeDamage(dmg);
                        this.recordDamage(dmg);
                        this.createFloatingText(e.pos.x, e.pos.y, `-${dmg}`, '#c084fc');
                        
                        // 3. 施加感电效果 (温度)
                        e.applyTemp(CONFIG.balance.lightningTempIncrease || 3); 
    
                        // 4. [关键] 触发连锁
                        // 我们调用已有的 triggerLightningChain，把当前敌人 e 作为源头
                        // 传递 [e] 作为历史记录，防止闪电瞬间弹回给自己
                        // 连锁伤害通常比主伤害低一点，这里设定为 100% 或 80% 皆可，暂时用 100%
                        this.triggerLightningChain(e, dmg, [e]);
    
                        if (killed) this.addScore(e.maxHp);
                    }
                }
                audio.playLightning();
    
            } 
            else if (method === 'enhance_ammo') {
                // === [修改] 强化弹药逻辑（支持光属性和散射） ===
                if (this.ammoQueue.length > 0) {
                    const nextAmmo = this.ammoQueue[0];
                    
                    // 1. 遍历并应用 buffs (包含 scatter)
                    for (const [key, val] of Object.entries(p.buffs)) {
                        // 如果是 damage, scatter, bounce 等数值属性，直接累加
                        if (typeof nextAmmo[key] === 'number' || nextAmmo[key] === undefined) {
                            nextAmmo[key] = (nextAmmo[key] || 0) + val;
                        }
                    }
    
                    // 2. 处理 [光属性] 开关
                    if (p.forceLaser) {
                        // 激活激光逻辑标志
                        nextAmmo.isLaser = true; 
                        // 确保激光层数至少为 1 (如果 buffs 里没配 laser)
                        if (!nextAmmo.laser || nextAmmo.laser <= 0) {
                            nextAmmo.laser = 1;
                        }
                    }
    
                    // 3. 处理 [爆破属性] 开关
                    if (p.forceExplosive) nextAmmo.explosive = true;
                    
                    // 4. 视觉反馈
                    this.createExplosion(this.width/2, this.height - 80, p.explosionColor);
                    this.updateAmmoUI(); 
                    this.createFloatingText(this.width/2, this.height - 120, p.floatText, p.explosionColor);
                } else {
                    // 返还 SP
                    this.skillPoints += skill.cost;
                    this.ui.updateSkillPoints(this.skillPoints);
                    this.ui.updateSkillBar(this.skillPoints);
                    showToast("無彈藥可強化");
                }
            }
        }
    

        createExplosion(x, y, color) { 
            for(let i=0; i<10; i++) { 
                this.particles.push(new Particle(x, y, color || '#f87171')); 
            } 
        }
    

        createShockwave(x, y, color = null) { 
            console.log("add shockwaves")
            this.shockwaves.push(new Shockwave(x, y, color)); 
        }
    

        createParticle(x, y, color, mode = 'normal') {
            this.particles.push(new Particle(x, y, color, mode));
        }
    

        createFloatingText(x, y, text, color) { 
            this.floatingTexts.push(new FloatingText(x, y, text, color)); 
        }
    

        updateMulticastDisplay(bonusAmount = 0) {
            // 基礎是 1，加上當前累積的 multicast
            const total = 1 + (this.currentSession ? this.currentSession.multicast : 0);
            
            const ui = document.getElementById('multicast-ui');
            const num = document.getElementById('multicast-num');
            
            if (ui && num) {
                // 顯示 UI
                ui.classList.add('multicast-visible');
                
                // 更新數字
                num.innerText = `x${total}`;
                
                // 如果有增加 (bonusAmount > 0)，播放特效
                if (bonusAmount > 0) {
                    // 1. 容器彈跳
                    ui.classList.remove('multicast-pop');
                    void ui.offsetWidth; // 重繪
                    ui.classList.add('multicast-pop');
                    
                    // 2. 文字閃白
                    num.classList.add('multicast-flash');
                    setTimeout(() => num.classList.remove('multicast-flash'), 300);
                }
            }
        }
    

        playMulticastTransferEffect(multicastValue) {
            // 1. 獲取起點 (右下角倍率 UI)
            const startEl = document.getElementById('multicast-ui');
            // 2. 獲取終點 (左側當前配方卡片)
            // 注意：activeMarbleIndex 對應的是 gathering-hud-mount 裡的第 N 個子元素
            const targetEl = document.querySelector(`#gathering-hud-mount .recipe-card:nth-child(${this.activeMarbleIndex + 1})`);
    
            if (!startEl || !targetEl) return;
    
            const startRect = startEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
    
            // 3. 創建飛行元素
            const flyer = document.createElement('div');
            flyer.className = 'flying-badge';
            flyer.innerText = `x${multicastValue}`;
            
            // 初始位置 (設置在起點)
            // 計算中心點偏移
            const startX = startRect.left + startRect.width / 2 - 20; // 20是寬度的一半
            const startY = startRect.top + startRect.height / 2 - 20;
            
            flyer.style.left = `${startX}px`;
            flyer.style.top = `${startY}px`;
            flyer.style.transform = 'scale(1.2)'; // 起飛時稍微放大
    
            document.body.appendChild(flyer);
    
            // 4. 執行飛行 (下一幀設置終點位置以觸發 transition)
            requestAnimationFrame(() => {
                const targetX = targetRect.left + targetRect.width / 2 - 20;
                const targetY = targetRect.top + targetRect.height / 2 - 20;
    
                flyer.style.left = `${targetX}px`;
                flyer.style.top = `${targetY}px`;
                flyer.classList.add('arrived'); // 配合 CSS 變小變淡
            });
    
            // 5. 飛行結束後清理並觸發卡片高亮
            setTimeout(() => {
                flyer.remove();
                
                // 讓目標卡片閃一下，表示接收到了倍率
                targetEl.style.transition = 'none';
                targetEl.style.filter = 'brightness(2) drop-shadow(0 0 10px orange)';
                targetEl.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    targetEl.style.transition = 'all 0.3s';
                    targetEl.style.filter = 'none';
                    targetEl.style.transform = 'scale(1)';
                }, 100);
    
                // 播放音效
                audio.playCollect(); 
            }, 600); // 這裡的時間要和 CSS transition 匹配
        }
    

        compileCollectionToRecipe(marbleDef, collectedTypes, hasMulticast) {
            const recipe = { 
                damage: 2, 
                bounce: 0, pierce: 0, scatter: 0, 
                explosive: marbleDef.type === 'redStripe', 
                isMatryoshka: marbleDef.type === 'matryoshka', 
                isLaser: marbleDef.type === 'laser', // 默认为 false，由 collected 决定
                nestedPayload: null, chainPayload: null, 
                multicast: hasMulticast ? 2 : 0, 
                cryo: 0, pyro: 0, lightning: 0, laser: marbleDef.type === 'laser' ? 1 : 0 
            };
    
    
            // --- 2. 收集属性 (Collected Stats) ---
            collectedTypes.forEach(t => { 
                // 收集到弹性钉子 -> 增加反弹次数
                if (t === 'bounce') recipe.bounce += 1; 
                if (t === 'pierce') recipe.pierce += 1; 
                if (t === 'scatter') recipe.scatter += 1; 
                if (t === 'damage') recipe.damage += 2; 
                if (t === 'cryo') recipe.cryo += 1; 
                if (t === 'pyro') recipe.pyro += 1;       
                if (t === 'lightning') recipe.lightning += 1;      
                // 收集到激光钉子 -> 增加激光层数
                if (t === 'laser') {
                    recipe.laser += 1; 
                }
            });
            if (recipe.laser > 0) {
                recipe.isLaser = true;
            }
            return recipe;
        }
    

        updateUICache() {
            const gaugeEl = document.getElementById('hero-gauge-container');
            if (gaugeEl) {
                const rect = gaugeEl.getBoundingClientRect();
                // 缓存中心坐标
                this.uiCache = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    // 缓存 DOM 引用，避免重复查询
                    el: gaugeEl,
                    pulseLayer: document.getElementById('gauge-pulse-layer'),
                    gaugeShell: document.getElementById('gauge-shell')
                };
            } else {
                // 兜底坐标
                this.uiCache = { x: this.width / 2, y: this.height - 100, el: null };
            }
        }
    

        initRecipeHUD() { 
            this.renderRecipeHUD(); 
            const container = document.getElementById('recipe-hud-container'); 
            container.classList.add('hidden'); 
        }
    

        toggleHud() { 
            this.hudExpanded = !this.hudExpanded; 
            this.renderRecipeHUD(); 
        }
    

        renderRecipeHUD() {
            // 获取两个容器
            const gatheringHud = document.getElementById('gathering-hud-mount'); 
            const combatHud = document.getElementById('recipe-hud-container');
            
            // --- 战斗阶段 ---
            if (this.phase === 'combat') { 
                // 1. 确保收集阶段的容器为空 (尽管 updateUI 已经隐藏了它的父级，清空更保险)
                if (gatheringHud) gatheringHud.innerHTML = '';
    
                // 2. 渲染战斗悬浮 HUD
                if (combatHud) {
                    combatHud.classList.remove('hidden'); 
                    combatHud.classList.add('recipe-hud-floating'); 
                    combatHud.innerHTML = '';
                    
                    const previewLimit = 4;
                    this.ammoQueue.slice(0, previewLimit).forEach((recipe, idx) => {
                        const isCurrent = (idx === 0);
                        const card = document.createElement('div');
                        card.className = `recipe-card ${isCurrent ? 'current' : 'queue'} mb-1 transition-all duration-300`;
                        
                        // --- 渲染 Header ---
                        const header = document.createElement('div');
                        header.className = 'flex justify-between items-center border-b border-white/10 pb-1 mb-1';
                        let nameStr = '普通魔藥';
                        if (recipe.explosive) nameStr = '爆破魔藥';
                        else if (recipe.isLaser) nameStr = '光束魔藥';
                        else if (recipe.isMatryoshka) nameStr = '套娃魔藥';
                        header.innerHTML = `<span class="font-bold text-amber-400 text-[11px]">${nameStr}</span><span class="text-[10px] text-slate-300 bg-slate-700/50 px-1 rounded">DMG ${recipe.damage || 0}</span>`;
                        
                        // --- 渲染 Grid ---
                        const grid = document.createElement('div');
                        grid.className = 'grid grid-cols-4 gap-0.5 text-[9px] leading-tight';
                        // ... (复制你原有的 stats 遍历逻辑) ...
                        const stats = [
                            { k: 'bounce', i: '⤴️' }, { k: 'pierce', i: '↗️' },
                            { k: 'scatter', i: '🔱' }, { k: 'multicast', i: '🔗' }, // 
                            { k: 'cryo', i: '❄️' }, { k: 'pyro', i: '🔥' },
                            { k: 'lightning', i: '⚡' }, { k: 'laser', i: '🔦' }
                        ];
                        let hasStats = false;
                        stats.forEach(s => {
                            const val = recipe[s.k];
                            if (val > 0) {
                                hasStats = true;
                                const tag = document.createElement('div');
                                tag.innerHTML = `${s.i}<span class="text-white ml-px">${val}</span>`;
                                grid.appendChild(tag);
                            }
                        });
                        if (!hasStats) grid.innerHTML = '<span class="col-span-4 text-slate-500 italic text-center">基础属性</span>';
    
                        card.appendChild(header);
                        card.appendChild(grid);
                        if (isCurrent) {
                            const indicator = document.createElement('div');
                            indicator.className = 'absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]';
                            card.appendChild(indicator);
                        }
                        combatHud.appendChild(card);
                    });
                }
            } 
            else { 
                // --- 收集阶段 ---
                
                // 1. 隐藏战斗 HUD
                if (combatHud) {
                    combatHud.classList.add('hidden'); 
                    combatHud.classList.remove('recipe-hud-floating'); 
                    combatHud.innerHTML = '';
                }
    
                // 2. 渲染收集阶段横向滚动条
                if (gatheringHud && this.phase === 'gathering') {
                    gatheringHud.innerHTML = ''; 
                    this.marbleQueue.forEach((item, idx) => { 
                        const isActive = idx === this.activeMarbleIndex; 
                        this.renderRecipeCard(gatheringHud, item, isActive, isActive ? 'current' : 'queue'); 
                    }); 
                }
            }
        }
    

        renderRecipeCard(container, item, isActive, statusClass) {
            const el = document.createElement('div'); 
            el.className = `recipe-card ${statusClass}`; 
            
            const head = document.createElement('div'); 
            // [优化]：
            // 1. mb-0.5 (2px) 替代 mb-1 (4px)
            // 2. pb-0.5 (2px) 替代 pb-1 (4px)
            // 3. text-[10px] 稍微减小标题字号，使其更精致
            head.className = 'flex items-center justify-between mb-0.5 border-b border-slate-600/50 pb-0.5'; 
            
            const name = document.createElement('span'); 
            name.innerText = item.getName ? item.getName() : (item.name || '光球');
            name.className = 'font-bold text-amber-100 mr-2 text-[11px]'; // 标题字号 11px
            head.appendChild(name); 
            
            const mats = document.createElement('div'); 
            mats.className = 'mats-grid'; // 确保使用了新的 grid 类
    
            const counts = {}; 
            if (item.collected) { 
                item.collected.forEach(type => { 
                    counts[type] = (counts[type] || 0) + 1; 
                }); 
            }
    
            const colors = { 
                'bounce': { c: CONFIG.colors.matBounce, l: '⤴️', n: '彈' }, 
                'pierce': { c: CONFIG.colors.matPierce, l: '↗️', n: '穿' }, 
                'scatter': { c: CONFIG.colors.matScatter, l: '🔱', n: '散' }, 
                'damage': { c: CONFIG.colors.matDamage, l: '⚔️', n: '強' }, 
                'cryo': { c: CONFIG.colors.matCryo, l: '❄️', n: '冷' }, 
                'pyro': { c: CONFIG.colors.matPyro, l: '🔥', n: '熱' }, 
                'lightning': { c: CONFIG.colors.matLightning, l: '⚡', n: '雷' },
                'laser': { c: CONFIG.colors.laser, l: '🔦', n: '光' }
            };
    
            Object.keys(counts).forEach(type => { 
                const info = colors[type]; 
                if(!info) return; 
                const row = document.createElement('div'); 
                row.className = 'mat-row text-slate-300'; 
                // 图标和文字之间只留极小的间距
                row.innerHTML = `<span style="color:${info.c}; font-size:0.8em;">${info.l}</span> <span class="ml-0.5">${info.n}${counts[type]}</span>`; 
                mats.appendChild(row); 
            });
            
            if (item.lightning > 0) {
                 const lightningBadge = document.createElement('div');
                 lightningBadge.className = 'mat-row text-purple-300 font-bold';
                 lightningBadge.innerHTML = `<span style="font-size:0.8em;">⚡</span> <span class="ml-0.5">反應: ${item.lightning}</span>`;
                 mats.appendChild(lightningBadge);
            }
            
            if (Object.keys(counts).length === 0) { 
                mats.className = 'text-slate-500 text-[9px] mt-0.5'; // 无材料时也紧凑点
                mats.innerHTML = '<span>無材料</span>'; 
            } 
            console.log("item.finalHits",item.finalHits)
            if (item.multicast > 0) {
                const badge = document.createElement('div');
                // 样式：绝对定位在卡片右上角或醒目位置
                badge.className = 'absolute -top-2 -right-2 bg-slate-900 border border-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10';
                
                // 根据连击数变色
                if (item.finalHits >= 20) {
                    badge.style.borderColor = '#d8b4fe';
                    badge.style.color = '#d8b4fe';
                    badge.style.boxShadow = '0 0 5px #d8b4fe';
                } else if (item.finalHits >= 10) {
                    badge.style.borderColor = '#facc15';
                    badge.style.color = '#facc15';
                }
                
                badge.innerText = `x${1+item.multicast}`;
                el.appendChild(badge); // 将徽章添加到卡片中
                
                // 确保父元素 el 有 relative 定位，以便 badge 绝对定位
                el.style.position = 'relative';
                // 确保 overflow 不是 hidden，否则徽章会被切掉
                el.style.overflow = 'visible'; 
            }
    
            el.append(head, mats); 
            container.appendChild(el);
        }
    

        renderAmmoIcon(container, recipe, isCurrent) {
            const size = isCurrent ? 24 : 16;
            const div = document.createElement('div');
            
            // 基础球体
            div.style.width = `${size}px`;
            div.style.height = `${size}px`;
            div.style.borderRadius = '50%';
            
            // 颜色逻辑 (与 Projectile 一致)
            let bg = '#e2e8f0';
            let shadow = 'none';
    
    
            //  光球的 UI 样式 (高优先级)
            if (recipe.isLaser) { 
                // 核心白，外发光蓝，模拟“光球”质感
                bg = '#ffffff'; 
                // 动态阴影：激光层数越多，阴影扩散越大
                const glowSize = 10 + (recipe.laser || 0) * 2;
                shadow = `0 0 ${glowSize}px ${CONFIG.colors.laser}, inset 0 0 5px ${CONFIG.colors.laser}`;
            }else if (recipe.explosive) { bg = '#fca5a5'; shadow = '0 0 10px #ef4444'; }
            else if (recipe.pyro) { bg = '#fdba74'; shadow = '0 0 8px #f97316'; }
            else if (recipe.cryo) { bg = '#cffafe'; shadow = '0 0 8px #06b6d4'; }
            else if (recipe.lightning) { bg = '#e9d5ff'; shadow = '0 0 8px #c084fc'; }
            else if (recipe.pierce) { bg = '#fecaca'; }
            else if (recipe.bounce) { bg = '#bbf7d0'; }
            
            div.style.background = bg;
            div.style.boxShadow = shadow;
            div.style.position = 'relative';
    
            if (recipe.isLaser) {
                 div.style.border = '2px solid #fff'; // 加个白圈
            }
            // 简单图标装饰
            if (recipe.scatter) {
                div.style.border = '2px solid #facc15'; // 黄框
            }
            if (recipe.multicast) {
                const badge = document.createElement('div');
                badge.innerText = `+${recipe.multicast}`;
                badge.className = 'absolute -top-2 -right-2 text-[10px] bg-orange-500 text-white rounded-full px-1 font-bold leading-tight';
                container.appendChild(badge);
            }
            
            container.appendChild(div);
        }
    

        updateAmmoUI() {
            const currentContainer = document.getElementById('current-ammo-render');
            const nextContainer = document.getElementById('next-ammo-render');
            const statsContainer = document.getElementById('current-bullet-stats');
            
            if (!currentContainer || !nextContainer) return;
    
            // 清空当前内容
            currentContainer.innerHTML = '';
            nextContainer.innerHTML = '';
    
            // 1. 渲染当前弹药 (Queue[0])
            if (this.ammoQueue.length > 0) {
                const currentRecipe = this.ammoQueue[0];
                this.renderAmmoIcon(currentContainer, currentRecipe, true);
                
                // 更新底部属性文本
                let html = '';
                if (currentRecipe.damage > 2) html += `<span class="text-purple-300">⚔️${currentRecipe.damage}</span>`;
                else html += `<span class="text-slate-400">⚔️${currentRecipe.damage}</span>`;
                
                if (currentRecipe.bounce) html += `<span class="text-green-300">⤴️${currentRecipe.bounce}</span>`;
                if (currentRecipe.pierce) html += `<span class="text-red-300">↗️${currentRecipe.pierce}</span>`;
                if (currentRecipe.scatter) html += `<span class="text-yellow-300">🔱${currentRecipe.scatter}</span>`;
                if (currentRecipe.multicast) html += `<span class="text-orange-400">⚡${currentRecipe.multicast}</span>`;
                if (currentRecipe.cryo) html += `<span class="text-cyan-300">❄️${currentRecipe.cryo}</span>`;
                if (currentRecipe.pyro) html += `<span class="text-orange-500">🔥${currentRecipe.pyro}</span>`;
                if (currentRecipe.lightning) html += `<span class="text-purple-400">⚡${currentRecipe.lightning}</span>`;
                
                if(html === '') html = '<span class="text-slate-500">基础弹药</span>';
                statsContainer.innerHTML = html;
                
                // 移除发射动画类（如果是重新渲染）
                currentContainer.classList.remove('shoot-anim');
            } else {
                currentContainer.innerHTML = '<span class="text-slate-600 text-xs">EMPTY</span>';
                statsContainer.innerHTML = '<span class="text-slate-600">-- 弹药耗尽 --</span>';
            }
    
            // 2. 渲染下一发弹药 (Queue[1])
            if (this.ammoQueue.length > 1) {
                const nextRecipe = this.ammoQueue[1];
                this.renderAmmoIcon(nextContainer, nextRecipe, false);
            } else {
                nextContainer.innerHTML = '<span class="text-slate-700 text-xs">--</span>';
            }
        }
    

        drawLauncherOrbitals(ctx, centerX, centerY, recipe) {
            if (!recipe) return;
    
            // 1. 提取並合併屬性 (Merge Stats)
            const stats = [];
            
            // 定義屬性映射：鍵名 -> {顏色, 圖標, 優先級}
            const mapping = {
                damage:    { val: recipe.damage > 2 ? recipe.damage : 0, color: '#a855f7', icon: '⚔️' }, // 基礎傷害大於2才顯示
                bounce:    { val: recipe.bounce, color: '#4ade80', icon: '⤴️' },
                pierce:    { val: recipe.pierce, color: '#f87171', icon: '↗️' },
                scatter:   { val: recipe.scatter, color: '#facc15', icon: '🔱' },
                cryo:      { val: recipe.cryo, color: '#06b6d4', icon: '❄️' },
                multicast: { val: recipe.multicast, color: '#fb923c', icon: '', isMulticast: true },
                pyro:      { val: recipe.pyro, color: '#f97316', icon: '🔥' },
                lightning: { val: recipe.lightning, color: '#c084fc', icon: '⚡' },
                laser:     { val: recipe.laser, color: '#0ea5e9', icon: '🔦' },
                explosive: { val: recipe.explosive ? 1 : 0, color: '#ef4444', icon: '🧨' }
            };
    
            // 遍歷配方，將大於0的屬性加入列表
            Object.keys(mapping).forEach(key => {
                const item = mapping[key];
                if (item.val > 0) {
                    stats.push(item);
                }
            });
    
            if (stats.length === 0) return;
    
            // 2. 計算軌道參數
            const time = Date.now() / 1000;
            const radius = 55; // 軌道半徑
            const stepAngle = (Math.PI * 2) / stats.length;
            
            ctx.save();
            ctx.translate(centerX, centerY);
    
            // 3. 繪製軌道線 (淡淡的光圈)
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
    
            // 4. 繪製每個屬性球
            stats.forEach((stat, index) => {
                // 動態角度：基礎分佈 + 自轉
                const angle = stepAngle * index + (time * 0.5); 
                const ox = Math.cos(angle) * radius;
                const oy = Math.sin(angle) * radius;
    
                // --- 繪製能量球背景 ---
                ctx.shadowBlur = 10;
                ctx.shadowColor = stat.color;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // 深色半透明底
                ctx.beginPath();
                // 根據數值大小微調球體大小 (基礎 14px, 每層 +1px, 上限 22px)
                const orbSize = Math.min(22, 14 + stat.val * 0.5);
                ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
                ctx.fill();
    
                // --- 繪製邊框 (代表能量顏色) ---
                ctx.strokeStyle = stat.color;
                ctx.lineWidth = 2;
                ctx.stroke();
    
                // --- 繪製圖標與數值 ---
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 如果數值大於1，顯示 "圖標+數字"，否則只顯示圖標
                if (stat.isMulticast) {
                    // [修改点] Multicast 单独绘制逻辑：显示 x2, x3...
                    ctx.font = 'bold 12px monospace';
                    ctx.fillStyle = stat.color; // 使用橙色高亮
                    // 基础发射数是1，multicast是额外增加的，所以显示 1 + val
                    // 或者如果你想显示增加量，就写 x{val}。通常理解是总发射数。
                    // 假设 recipe.multicast 是额外次数 (例如 +2)，则总数为 1+2=3。
                    // 这里为了直观，如果 multicast=2，我们显示 x3
                    const totalShots = 1 + stat.val;
                    ctx.fillText(`x${totalShots}`, ox, oy);
                } else {
                    // 其他属性原有逻辑
                    ctx.font = '10px sans-serif';
                    if (stat.val > 1) {
                        ctx.fillText(stat.icon, ox, oy - 5);
                        ctx.font = 'bold 9px sans-serif';
                        ctx.fillStyle = stat.color; 
                        ctx.fillText(`${stat.val}`, ox, oy + 6);
                    } else {
                        ctx.font = '14px sans-serif';
                        ctx.fillText(stat.icon, ox, oy);
                    }
                }
            });
    
            // 5. 連線特效 (將所有球連向中心，增強"裝填中"的感覺)
            ctx.globalCompositeOperation = 'screen';
            ctx.lineWidth = 1;
            stats.forEach((stat, index) => {
                const angle = stepAngle * index + (time * 0.5);
                const ox = Math.cos(angle) * radius;
                const oy = Math.sin(angle) * radius;
                
                const grad = ctx.createLinearGradient(0, 0, ox, oy);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(1, stat.color); // 漸變到屬性色
                
                ctx.strokeStyle = grad;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(ox, oy);
                ctx.stroke();
            });
    
            ctx.restore();
        }
    

        updateCombat(timeScale) {
            const tilt = this.boardTilt.current;
            const container = document.getElementById('game-container');
            if (container) {
                container.style.perspective = "1200px";
                const rotateX = tilt.y * -8;
                const rotateY = tilt.x * 8;
                const translateZ = -20;
                container.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
            }
    
            // === 1. 计算视差参数 ===
            // 背景层 (地板)：正向移动
            const bgShiftX = tilt.x * 20;
            const bgShiftY = tilt.y * 15;
    
            // 实体层 (敌人/UI/墙壁)：反向移动
            const entityShiftX = tilt.x * -15;
            const entityShiftY = tilt.y * -10;
    
            // 应用 CSS 到 DOM UI
            // const skillBar = document.getElementById('skill-bar');
            // const hud = document.getElementById('recipe-hud-container');
            // const uiTransform = `translate3d(${entityShiftX}px, ${entityShiftY}px, 0)`;
            // if (skillBar) skillBar.style.transform = uiTransform;
            // if (hud) hud.style.transform = uiTransform;
    
            // --- 逻辑更新 ---
            for (let i = this.burstQueue.length - 1; i >= 0; i--) { 
                const shot = this.burstQueue[i]; 
                shot.delay -= timeScale; 
                if (shot.delay <= 0) { 
                    this.spawnBullet(this.width/2, this.height-80, shot.vel, shot.recipe); 
                    audio.playShoot(); 
                    this.burstQueue.splice(i, 1); 
                } 
            }
            if (this.waveMomentumTimer > 0) this.waveMomentumTimer -= timeScale;
    
            // ==========================================
            //  LAYER 0: 固定 UI 层 (防线)
            // ==========================================
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.defeatLineY);
            this.ctx.lineTo(this.width, this.defeatLineY);
            this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            this.ctx.font = 'bold 10px monospace';
            this.ctx.fillText("⚠️ DEFENSE LINE", 10, this.defeatLineY - 6);
            const dangerGrad = this.ctx.createLinearGradient(0, this.defeatLineY, 0, this.height);
            dangerGrad.addColorStop(0, 'rgba(239, 68, 68, 0.1)');
            dangerGrad.addColorStop(1, 'rgba(239, 68, 68, 0.3)');
            this.ctx.fillStyle = dangerGrad;
            this.ctx.fillRect(0, this.defeatLineY, this.width, this.height - this.defeatLineY);
            this.ctx.restore();
    
    
            // ==========================================
            //  LAYER 1: 背景层 (网格 & 扫描波)
            // ==========================================
            this.ctx.save();
            this.ctx.translate(bgShiftX, bgShiftY); 
    
                // A. 绘制背景网格
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                const gridOffsetX = bgShiftX * 1.5;
                const gridOffsetY = bgShiftY * 1.5;
                for (let x = -50; x < this.width + 50; x += 40) {
                    this.ctx.moveTo(x, -50); this.ctx.lineTo(x, this.height + 50);
                }
                for (let y = -50; y < this.height + 50; y += 40) {
                    this.ctx.moveTo(-50, y); this.ctx.lineTo(this.width + 50, y);
                }
                this.ctx.stroke();
                this.ctx.restore();
    
                // B. 绘制扫描波
                if (this.isEnemyTurn && this.enemyWaveActive) {
                    const currentSpeed = this.calculateWaveSpeed();
                    this.enemyWaveY -= currentSpeed;
    
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'lighter';
                    
                    const trailHeight = 220; 
                    const gridGrad = this.ctx.createLinearGradient(0, this.enemyWaveY, 0, this.enemyWaveY + trailHeight);
                    gridGrad.addColorStop(0, 'rgba(251, 191, 36, 0.5)'); 
                    gridGrad.addColorStop(0.3, 'rgba(217, 119, 6, 0.2)'); 
                    gridGrad.addColorStop(1, 'rgba(180, 83, 9, 0)');     
                    this.ctx.strokeStyle = gridGrad;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    const cols = 8;
                    for(let i=0; i<=cols; i++) {
                        const x = (this.width / cols) * i;
                        this.ctx.moveTo(x, this.enemyWaveY);
                        this.ctx.lineTo(x, this.enemyWaveY + trailHeight);
                    }
                    const gridSize = 40;
                    const startGridY = Math.floor(this.enemyWaveY / gridSize) * gridSize;
                    for(let y = startGridY; y < this.enemyWaveY + trailHeight; y += gridSize) {
                        if(y > this.enemyWaveY) { 
                            this.ctx.moveTo(0, y);
                            this.ctx.lineTo(this.width, y);
                        }
                    }
                    this.ctx.stroke();
    
                    const time = Date.now() / 50; 
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = '#ffffff'; 
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowColor = '#fef08a'; 
                    this.ctx.shadowBlur = 15;
                    for (let x = 0; x <= this.width; x += 10) {
                        const offset = Math.sin(x * 0.1 + time) * 2 + (Math.random() - 0.5) * 6;
                        const y = this.enemyWaveY + offset;
                        if (x === 0) this.ctx.moveTo(x, y);
                        else this.ctx.lineTo(x, y);
                    }
                    this.ctx.stroke();
                    
                    this.ctx.fillStyle = '#fef3c7'; 
                    for(let i=0; i<5; i++) {
                        const lx = Math.random() * this.width;
                        const ly = this.enemyWaveY + (Math.random() - 0.5) * 30;
                        const lw = Math.random() * 50 + 10;
                        this.ctx.fillRect(lx, ly, lw, 1);
                    }
                    this.ctx.restore();
    
                    const triggerLine = this.enemyWaveY; 
                    this.enemies.forEach(e => {
                        if (!e.active) return;
                        if (e.pos.y + e.height/2 >= triggerLine && !e.hasActedThisTurn) {
                            e.playScanFeedback();
                            this.processSingleEnemyTurn(e);
                        }
                    });
                    if (this.enemyWaveY < -50) {
                        this.enemyWaveActive = false;
                        this.enemyTurnTimer = 0;
                    }
                }
            this.ctx.restore(); 
    
    
            // ==========================================
            //  LAYER 2: 实体层 (墙壁 / 敌人 / 子弹)
            // ==========================================
            this.ctx.save();
            this.ctx.translate(entityShiftX, entityShiftY); 
    
                // --- [新增]：绘制可视化的边界墙壁 ---
                this.ctx.save();
                // 左墙 (半透明渐变)
                const wallGradLeft = this.ctx.createLinearGradient(0, 0, 20, 0);
                wallGradLeft.addColorStop(0, 'rgba(148, 163, 184, 0.2)');
                wallGradLeft.addColorStop(1, 'rgba(148, 163, 184, 0)');
                this.ctx.fillStyle = wallGradLeft;
                this.ctx.fillRect(0, -100, 20, this.height + 100);
                
                // 右墙 (半透明渐变)
                const wallGradRight = this.ctx.createLinearGradient(this.width, 0, this.width - 20, 0);
                wallGradRight.addColorStop(0, 'rgba(148, 163, 184, 0.2)');
                wallGradRight.addColorStop(1, 'rgba(148, 163, 184, 0)');
                this.ctx.fillStyle = wallGradRight;
                this.ctx.fillRect(this.width - 20, -100, 20, this.height + 100);
    
                // 墙壁发光边框 (明确反弹线)
                this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // Slate-400
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#94a3b8';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                // 左边线
                this.ctx.moveTo(1, -100); this.ctx.lineTo(1, this.height);
                // 右边线
                this.ctx.moveTo(this.width - 1, -100); this.ctx.lineTo(this.width - 1, this.height);
                // 顶部线 (封顶)
                this.ctx.moveTo(0, 1); this.ctx.lineTo(this.width, 1);
                this.ctx.stroke();
                this.ctx.restore();
                // ------------------------------------
    
                // C. 绘制游戏实体
                let activeEnemies = 0; 
                let anyEnemyMoving = false;
                this.enemies.forEach(e => {
                    if (e.active) {
                        e.update(this.timeScale);
                        e.draw(this.ctx);
                        activeEnemies++;
                        if (Math.abs(e.pos.y - e.dropTargetY) > 1) anyEnemyMoving = true;
                    }
                });
    
                if (this.checkDefeat()) this.gameOver = true;
    
                // 更新和绘制弹丸
                for (let i = this.projectiles.length - 1; i >= 0; i--) { 
                    const p = this.projectiles[i]; 
                    if(p) { 
                        p.update(this.width, this.height, this.enemies, (spawnInfo) => { this.spawnBullet(spawnInfo.x, spawnInfo.y, spawnInfo.vel, spawnInfo.config); }, timeScale); 
                        p.draw(this.ctx); 
                        if (p.destroyed) this.projectiles.splice(i, 1); 
                    } 
                }
    
                // 更新和绘制 FireWaves
                for (let i = this.fireWaves.length - 1; i >= 0; i--) {
                    const fw = this.fireWaves[i];
                    fw.update(timeScale);
                    fw.draw(this.ctx);
                    if (fw.life <= 0) this.fireWaves.splice(i, 1);
                }
    
                // 更新和绘制特效
                for(let i=this.particles.length-1; i>=0; i--) { let p = this.particles[i]; if(p) { p.update(timeScale); p.draw(this.ctx); if(p.life <= 0) this.particles.splice(i,1); } } 
                for(let i=this.shockwaves.length-1; i>=0; i--) { let s = this.shockwaves[i]; if(s) { s.update(timeScale); s.draw(this.ctx); if(s.alpha <= 0) this.shockwaves.splice(i,1); } } 
                for(let i=this.lightningBolts.length-1; i>=0; i--) { let b = this.lightningBolts[i]; b.update(timeScale); b.draw(this.ctx); if(b.life <= 0) this.lightningBolts.splice(i,1); } 
                for(let i=this.spores.length-1; i>=0; i--) { let s = this.spores[i]; if(s) { s.update(timeScale); s.draw(this.ctx); if(!s.active) this.spores.splice(i,1); } }
    
                // 拖拽瞄准线
                if (this.isDragging && this.projectiles.length === 0 && this.ammoQueue.length > 0 && this.burstQueue.length === 0) {
                    const start = new Vec2(this.width / 2, this.height - 80);
                    let force = this.lastMousePos.sub(start);
                    
                    if (force.y < -20) {
                        const maxLen = 800; 
                        const radius = CONFIG.physics.bulletRadius;
                        let dir = force.norm(); 
                        
                        this.ctx.save();
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        this.ctx.lineWidth = 2;
                        this.ctx.setLineDash([6, 6]);
                        this.ctx.beginPath();
                        this.ctx.moveTo(start.x, start.y);
    
                        let distToX = Infinity;
                        let distToY = Infinity;
                        if (dir.x > 0) distToX = (this.width - radius - start.x) / dir.x;
                        else if (dir.x < 0) distToX = (radius - start.x) / dir.x;
                        if (dir.y < 0) distToY = (radius - start.y) / dir.y;
    
                        let hitDist = Math.min(distToX, distToY);
                        if (hitDist < maxLen) {
                            const hitPoint = start.add(dir.mult(hitDist));
                            this.ctx.lineTo(hitPoint.x, hitPoint.y);
                            const remainLen = maxLen - hitDist;
                            let reflectDir = new Vec2(dir.x, dir.y);
                            if (distToX < distToY) reflectDir.x *= -1; 
                            else reflectDir.y *= -1; 
                            const endPoint = hitPoint.add(reflectDir.mult(remainLen));
                            this.ctx.lineTo(endPoint.x, endPoint.y);
                            this.ctx.stroke();
                            this.ctx.beginPath();
                            this.ctx.setLineDash([]);
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            this.ctx.arc(endPoint.x, endPoint.y, 3, 0, Math.PI * 2);
                            this.ctx.fill();
                        } else {
                            const end = start.add(dir.mult(maxLen));
                            this.ctx.lineTo(end.x, end.y);
                            this.ctx.stroke();
                        }
                        this.ctx.restore();
    
                        this.ctx.save();
                        this.ctx.translate(start.x, start.y);
                        this.ctx.rotate(Math.atan2(force.y, force.x));
                        this.ctx.fillStyle = '#6366f1';
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.fillStyle = '#818cf8';
                        this.ctx.fillRect(10, -6, 12, 12); 
                        this.ctx.restore();
                    }
                } else if (this.projectiles.length === 0) {
                    const start = new Vec2(this.width / 2, this.height - 80);
                    this.ctx.save();
                    this.ctx.translate(start.x, start.y);
                    this.ctx.rotate(-Math.PI / 2); 
                    this.ctx.fillStyle = '#475569';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillRect(8, -4, 8, 8);
                    this.ctx.restore();
                }
    
            
    
            this.ctx.restore(); // 结束实体层
    
    
            // --- UI Overlays ---
            if (this.gameOver) { 
                document.getElementById('combat-message').innerHTML = '<span class="text-red-400 font-bold text-4xl">防線失守</span><br><span class="text-sm pointer-events-none">點擊重试</span>'; 
                if (this.isDragging) location.reload(); 
                return; 
            }
    
            if (activeEnemies === 0) {
                const hasLeftoverAmmo = this.ammoQueue.length > 0;
                if (hasLeftoverAmmo) {
                    const leftoverCount = this.ammoQueue.length;
                    const scoreMult = Math.pow(CONFIG.balance.unusedAmmoScoreMult, leftoverCount);
                    this.score *= scoreMult;
                    document.getElementById('score-num').innerText = this.score; 
                    this.nextRoundHpMultiplier = CONFIG.balance.nextRoundDifficultyMult;
                    showToast(`完美清場! 分數 x${scoreMult} | 下輪難度 UP!`);
                    audio.playPowerup();
                    this.ammoQueue = []; 
                    this.updateAmmoUI();
                    this.renderRecipeHUD();
                    this.clearProjectiles();
                }
            }
    
            const playerTurnFinished = this.ammoQueue.length === 0 && 
                                       this.projectiles.length === 0 && 
                                       this.burstQueue.length === 0;
    
            if (playerTurnFinished && !this.gameOver) {
                if (!this.isEnemyTurn) {
                    this.startEnemyTurnLogic();
                } else {
                    if (this.enemyWaveActive) return;
                    if (anyEnemyMoving) {
                        this.enemyTurnTimer = 0; 
                        return;
                    }
                    this.enemyTurnTimer += this.timeScale;
                    if (this.enemyTurnTimer > 80) { 
                        this.finalizeRound(); 
                        return;
                    }
                }
                return;
            }
    
            if (this.ammoQueue.length === 0 && this.projectiles.length === 0 && this.burstQueue.length === 0 && !this.gameOver) { 
                document.getElementById('combat-message').innerHTML = '<div class="bg-black/50 p-4 rounded-xl backdrop-blur-md border border-blue-500/50 pointer-events-none"><span class="text-blue-300 font-bold text-xl block mb-2">彈藥耗盡</span><span class="text-sm text-slate-300">點擊收集新彈藥</span></div>'; 
            } else { 
                if (!this.gameOver) document.getElementById('combat-message').innerHTML = ''; 
            }
            // --- 修改开始：调整层级，先画轨道，再画炮台 ---
            this.ctx.save();
            // 应用与实体层相同的视差偏移
            this.ctx.translate(entityShiftX, entityShiftY);
    
            const startPos = new Vec2(this.width / 2, this.height - 80);
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // 深色半透明底 (Slate-900 80%)
            this.ctx.beginPath();
            this.ctx.arc(startPos.x, startPos.y, 22, 0, Math.PI * 2); // 半径比子弹稍大
            this.ctx.fill();
            let nextAmmo = this.ammoQueue.length > 0 ? this.ammoQueue[0] : null;
    
            if (nextAmmo) {
                const params = Projectile.calculateVisualParams(nextAmmo, false);
                let previewRotation = 0;
                let deformation = {x: 1, y: 1};
                
                if (this.isDragging) {
                    const force = this.dragStart.sub(this.dragCurrent);
                    if (force.mag() > 10) {
                        previewRotation = Math.atan2(force.y, force.x) + Math.PI / 2;
                        deformation = {x: 1.15, y: 0.85}; 
                    }
                }
    
                // [修改点 1] 先绘制轨道 (Orbitals) -> 这样它就在炮台下面
                this.drawLauncherOrbitals(this.ctx, startPos.x, startPos.y, nextAmmo);
    
                // [修改点 2] 后绘制炮台核心 (Visuals) -> 这样它就在上面
                Projectile.drawVisuals(this.ctx, startPos.x, startPos.y, params.radius, nextAmmo, previewRotation, params.intensity, deformation);
    
            } else {
                // 空仓状态
                this.ctx.fillStyle = '#1e293b';
                this.ctx.beginPath();
                this.ctx.arc(startPos.x, startPos.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#475569';
                this.ctx.stroke();
            }
            this.ctx.restore();
            
        }
    
}
