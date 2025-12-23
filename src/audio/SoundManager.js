/**
 * 声音管理器模块
 * 使用 Web Audio API 实现游戏音效
 */

export class SoundManager {
    /**
     * 声音管理器类，使用 Web Audio API 播放音效
     */
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.muted = false;

        // 1. 创建主音量节点
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; 

        // 2.  创建动态压缩器 (防止爆音的核心)
        this.compressor = this.ctx.createDynamicsCompressor();
        // 压缩器参数调优 (适合快节奏游戏)
        this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime); // 超过-24dB开始压缩
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);       // 平滑过渡
        this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);      // 压缩比率 (高一点防止极响)
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);  // 快速响应
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);  // 快速释放

        // 3.  连接链路： 节点 -> Master -> Compressor -> 扬声器
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.noiseBuffer = this.createNoiseBuffer();
        
        //  用于防抖动的记录表 (方法二用到)
        this.lastPlayTime = {}; 
    }
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2秒緩衝
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }
    createRollingSound() {
        if (this.muted) return null;

        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 1.0; 

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0; 

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start();

        return {
            node: source,
            gainNode: gainNode,
            filter: filter,
            ctx: this.ctx,
            
            // 核心：根据速度更新声音
            update: function(speed) {
                // 限制最大速度影响
                const clampSpeed = Math.min(Math.max(speed, 0), 25);
                const normalizedSpeed = clampSpeed / 25; 

                const now = this.ctx.currentTime;

                // --- ：大幅提升滚动音量 ---
                // 原来是 0.4，现在提升到 2.5，保证能听得清
                // 使用平方曲线 (normalizedSpeed^2) 让高速时声音增加得更明显，低速保持安静
                const targetVol = Math.pow(normalizedSpeed, 1.5) * 2.5; 
                this.gainNode.gain.setTargetAtTime(targetVol, now, 0.1);

                // 频率随速度变化，高速时更脆
                const targetFreq = 100 + (normalizedSpeed * 800);
                this.filter.frequency.setTargetAtTime(targetFreq, now, 0.1);
            },

            stop: function() {
                const now = this.ctx.currentTime;
                this.gainNode.gain.setTargetAtTime(0, now, 0.2);
                setTimeout(() => {
                    try { source.stop(); source.disconnect(); } catch(e){}
                }, 300);
            }
        };
    }
    /**
     * 切换静音状态
     * @returns {boolean} 当前静音状态
     */
    toggleMute() {
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 0.3;
        
        //  如果静音了，强制暂停所有 AudioContext (因为滚动声是独立节点的)
        if (this.muted) {
            if (this.ctx.state === 'running') this.ctx.suspend();
        } else {
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }
        return this.muted;
    }

    /**
     * 恢复 AudioContext (解决浏览器自动播放限制)
     */
    resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
    /**
     * 播放通用游戏特效音
     * @param {string} type - 'burn_tick', 'freeze', 'regen', 'split', 'ignite'
     */
 playEffect(type) {
        if (this.muted) return;
        const now = this.ctx.currentTime;

        if (type === 'burn_tick') {
            // 🔥 燃烧结算：重做为 "烈火升腾" (Fwoosh + Crackle)
            // 之前的版本太像漏气了，这个版本强调火焰的"吞噬感"
            
            // --- Layer 1: 火焰的主体 (The Body/Whoosh) ---
            // 使用低通滤波后的噪音，模拟热空气膨胀
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 1; // 增加一点共振，让火声更有力
            
            // 关键：频率动态扫描
            // 从中频(1500Hz) 快速滑落到 低频(100Hz)
            // 模拟火苗瞬间窜起又平息的过程 ("Fwump")
            filter.frequency.setValueAtTime(1500, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.02); // 快速起音
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25); // 稍微长一点的尾韵

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(now);
            noise.stop(now + 0.3);

            // --- Layer 2: 爆裂杂音 (The Crackle) ---
            // 极短的高通噪音，模拟木材或燃料的爆裂声
            const crackle = this.ctx.createBufferSource();
            crackle.buffer = this.noiseBuffer;
            
            const cFilter = this.ctx.createBiquadFilter();
            cFilter.type = 'highpass';
            cFilter.frequency.setValueAtTime(3000, now); // 只留高频细节
            
            const cGain = this.ctx.createGain();
            // 随机化音量，让每次燃烧听起来不一样
            cGain.gain.setValueAtTime(0.1 + Math.random() * 0.1, now); 
            cGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // 极短，像火花

            crackle.connect(cFilter);
            cFilter.connect(cGain);
            cGain.connect(this.masterGain);
            crackle.start(now);
            crackle.stop(now + 0.15);
        } else if (type === 'ignite') {
             // 🔥 点燃瞬间：更猛烈的气体爆燃声 (Ignition)
             const noise = this.ctx.createBufferSource();
             noise.buffer = this.noiseBuffer;
             
             // 使用带通滤波器 (Bandpass) 模拟从中心向外爆发的声音
             const filter = this.ctx.createBiquadFilter();
             filter.type = 'bandpass';
             filter.Q.value = 0.5; // 宽频带
             
             // 频率向上扫，模拟火势变大 ("Vwooom")
             filter.frequency.setValueAtTime(200, now);
             filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
             
             const gain = this.ctx.createGain();
             gain.gain.setValueAtTime(0.4, now);
             gain.gain.linearRampToValueAtTime(0, now + 0.4);
 
             noise.connect(filter);
             filter.connect(gain);
             gain.connect(this.masterGain);
             noise.start(now);
             noise.stop(now + 0.5);
        }
        else if (type === 'freeze') {
            // ❄️ 冻结：晶体极速生长 (Arpeggio / Granular)
            // 播放一串快速、随机的高频短音
            const count = 5; // 颗粒数量
            for (let i = 0; i < count; i++) {
                const t = now + i * 0.03; // 间隔极短 (30ms)
                
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                // 频率在 2000Hz ~ 4500Hz 之间随机，且随时间越来越高 (结冰通常是向上蔓延)
                const freq = 2000 + (Math.random() * 1000) + (i * 500);
                osc.frequency.setValueAtTime(freq, t);
                
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(t);
                osc.stop(t + 0.15);
            }
            
            // 底层的风声/寒气 (White Noise Sweep)
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.frequency.linearRampToValueAtTime(4000, now + 0.3); // 滤波器向上扫
            
            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.2, now);
            nGain.gain.linearRampToValueAtTime(0, now + 0.3);
            
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.masterGain);
            noise.start(now);
            noise.stop(now + 0.3);
        }
        else if (type === 'regen') {
            // 💚 恢复：柔和的双音上升 (Magical Chime)
            [400, 600].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                
                // 频率缓慢上升
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.linearRampToValueAtTime(freq + 200, now + 0.5);

                // 缓慢淡入淡出
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.7);
            });
        }
        else if (type === 'split') {
            // 🦠 分裂：类似水泡破裂的声音 (Squishy Pop)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // 使用锯齿波经过低通滤波，模拟粘稠感
            osc.type = 'sawtooth';
            // 频率快速向上滑动一下
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(400, now + 0.1);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            filter.Q.value = 5; // 增加共振，制造“啵”的感觉

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.25);
        }
        else if (type === 'ignite') {
             // 🔥 点燃/燃烧中：低频轰鸣
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);
            const gain = this.ctx.createGain();
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            noise.start(now);
            noise.stop(now + 0.4);
        }
    }
    /**
     * 播放一个音调
     * @param {number} freq - **重要参数** 频率 (Hz)
     * @param {string} type - **重要参数** 波形类型 ('sine', 'square', 'sawtooth', 'triangle')
     * @param {number} duration - **重要参数** 持续时间 (秒)
     * @param {number} [vol=1] - 初始音量
     */
    playMagic() {
        if (this.muted) return;
        const now = this.ctx.currentTime;
        // 播放一串快速的閃爍音
        [400, 600, 800].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.1, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }
    playTone(freq, type, duration, vol = 1) {
        if (this.muted) return;
        
        const now = this.ctx.currentTime;
        //  微小的随机延迟 (0 ~ 0.03秒)，错开波峰
        const randomDelay = Math.random() * 0.03; 
        //  微小的频率抖动 (+- 10Hz)，防止完全共振
        const randomDetune = (Math.random() - 0.5) * 20; 

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        // 使用 detune 来微调，比直接改 freq 更自然
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(randomDetune, now); 

        //  限制单个音效的最大音量，防止传入过大的 vol
        const safeVol = Math.min(vol, 0.5); 

        gain.gain.setValueAtTime(0, now); // 先设为0
        // 快速淡入 (消除点击声)
        gain.gain.linearRampToValueAtTime(safeVol, now + randomDelay + 0.01);
        // 指数淡出
        gain.gain.exponentialRampToValueAtTime(0.01, now + randomDelay + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now + randomDelay);
        osc.stop(now + randomDelay + duration);
    }
    
 
    /**
     * 播放弹珠撞击钉子的音效 (物理真实版：短促、厚实、有打击感)
     * @param {string} type - 钉子类型
     * @param {number} speed - 撞击速度
     */
    playHit(type, speed = 5) {
        if (this.muted) return;

        const now = this.ctx.currentTime;
        
        // 冷却检查
        if (this.lastPlayTime[type] && (now - this.lastPlayTime[type] < 0.05)) {
            return; 
        }
        this.lastPlayTime[type] = now;

        // --- 1. 动态参数 ---
        // 速度影响音量和音调微调
        const velocity = Math.min(Math.max(speed / 15, 0.1), 1.0);
        // 音调微小随机化 (+/- 8%) 模拟不同接触点
        const detune = 1.0 + (Math.random() - 0.5) * 0.16; 

        // --- 2. 基频调整 (整体降低，去除"风铃感") ---
        const baseFreqs = { 
            'normal': 800,    // 降到中频，模拟实心钢珠
            'bounce': 1000,   
            'pierce': 600,    // 更沉
            'scatter': 1200,  
            'damage': 500,    
            'cryo': 2200,     // 冰还是保留一点脆
            'pyro': 300,      // 像爆炸闷响
            'lightning': 900,
            'pink': 1100      
        };
        const baseFreq = (baseFreqs[type] || 800) * detune;

        // --- 3. 声音合成：冲击声 (Impact) + 余音 (Resonance) ---

        // 振荡器 A: 冲击主体 (Impact)
        // 使用正弦波，声音最扎实，不刺耳
        const oscA = this.ctx.createOscillator();
        const gainA = this.ctx.createGain();
        oscA.type = 'sine';
        
        // 振荡器 B: 接触瞬态 (Click)
        // 使用方波模拟刚性接触的瞬间，极短
        const oscB = this.ctx.createOscillator();
        const gainB = this.ctx.createGain();
        oscB.type = 'square'; 

        // --- 4. 频率包络 (模拟物理撞击的音高下潜) ---
        // 极短的时间内频率快速下降，产生"笃"的感觉
        oscA.frequency.setValueAtTime(baseFreq + 200, now);
        oscA.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.05);

        // 瞬态音高更高，衰减更快
        oscB.frequency.setValueAtTime(baseFreq * 3, now); 
        oscB.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.01);

        // --- 5. 音量包络 (极短，无延音) ---
        
        // 主体音：快速起音，快速消逝 (0.08秒内结束)
        gainA.gain.setValueAtTime(0, now);
        gainA.gain.linearRampToValueAtTime(0.8 * velocity, now + 0.002); 
        gainA.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + (velocity * 0.05)); 

        // 接触音：瞬间消失 (0.01秒)，只留个"嗒"的头
        gainB.gain.setValueAtTime(0, now);
        gainB.gain.linearRampToValueAtTime(0.15 * velocity, now + 0.001);
        gainB.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

        // --- 6. 滤波器 (把声音变"闷"一点，去数码味) ---
        // 钢珠撞击不需要太高的高频
        const filter = this.ctx.createBiquadFilter();
        if (type === 'cryo') {
            // [针对冰的优化]：使用高通滤波器
            // 冰块撞击不仅没有低频，还需要突出高频的"脆"
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1500, now); // 切掉 1500Hz 以下的所有声音
            
            // 冰的撞击声包络要更短、更脆
            gainA.gain.cancelScheduledValues(now);
            gainA.gain.setValueAtTime(0, now);
            gainA.gain.linearRampToValueAtTime(0.6 * velocity, now + 0.002);
            gainA.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // 衰减极快
        } else {
            // 其他类型的原有逻辑 (Lowpass 模拟实心物体)
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000 + (velocity * 3000), now);
        }     
        // 连接路径
        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(gainA); // A为主通道控制
        // B的音量单独控制后也汇入 A 的通道或者直接输出，这里简单起见各自连接 Gain
        // 修正连接逻辑：
        oscA.disconnect(); oscB.disconnect();
        
        oscA.connect(gainA);
        gainA.connect(filter);
        
        oscB.connect(gainB);
        gainB.connect(filter);

        filter.connect(this.masterGain);

        // 播放
        oscA.start(now);
        oscA.stop(now + 0.15);
        oscB.start(now);
        oscB.stop(now + 0.15);
    }

    /**
     * 播放发射弹珠的音效 (最终版：干练、清脆、低调爽感)
     * 听感：类似消音手枪或高级机械开关的 "Thwip" 声
     */
    playShoot() {
        if (this.muted) return;
        const now = this.ctx.currentTime;
        
        // 微调：每次发射有极小的音调变化 (+/- 5%)，防止听觉疲劳
        const randomDetune = 1.0 + (Math.random() - 0.5) * 0.1;

        // --- Layer 1: 机械撞针 (The Click) ---
        // 使用高通噪音，制造极短的“咔哒”声
        // 这是“干脆”的关键，负责高频的清晰度
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, now); // 只留2000Hz以上的高频
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now); // 音量适中，不刺耳
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03); // 极短！30ms内消失

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.05);

        // --- Layer 2: 气动推进 (The Thump) ---
        // 使用正弦波，频率极低且快速下潜
        // 制造“噗”的一声，提供力度但没有明显的“Pew”调子
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine'; // 正弦波最干净，不抢戏
        
        // 频率从中低频(180Hz) 瞬间跌落到 超低频(50Hz)
        // 这个范围很低，人耳听起来更像是震动而不是声音
        osc.frequency.setValueAtTime(180 * randomDetune, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08); // 80ms内跌落到底

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.5, now + 0.005); // 瞬间起音 (Punchy)
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); // 快速收尾 (Tight)

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    /**
     * 播放爆炸音效
     */
    playExplosion() { if (!this.muted) this.playTone(100, 'sawtooth', 0.4, 0.5); }

    /**
     * 播放闪电音效
     */
    playLightning() {
        if (this.muted) return;
        const t = this.ctx.currentTime;
        
        // 1. 創建噪聲源
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        
        // 2. 創建濾波器 (Highpass 模擬撕裂聲)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        
        // --- 修改点 A: 降低起始频率 ---
        // 原来是 1000，改小一點（例如 600-800）可以让声音没那么尖锐刺耳
        filter.frequency.setValueAtTime(800, t); 
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.2); 

        // 3. 音量包絡 (ADSR)
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        
        // --- 修改点 B: 降低峰值音量 ---
        // 原来是 0.8 (極大聲)，建議改成 0.2 或 0.25
        gain.gain.linearRampToValueAtTime(0.25, t + 0.05); 
        
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); 

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(t);
        noise.stop(t + 0.5);
    }

    /**
     * 播放敌人被击中音效
     */
    /**
     * 播放敌人被击中音效 (优化版：低沉冲击 + 破碎质感)
     */
    /**
     * 播放敌人被击中音效 (支持元素材质区分)
     * @param {string} type - 伤害类型 ('normal', 'cryo', 'pyro', 'lightning', 'pierce')
     */
    /**
     * 播放敌人被击中音效 (v3.0: ⚡电流FM合成 & ❄️冰晶碎裂增强)
     * @param {string} type - 伤害类型
     */
    playEnemyHit(type = 'normal') {
        if (this.muted) return;
        const now = this.ctx.currentTime;
        const detune = 0.9 + Math.random() * 0.2; 

        // === Layer A: 基础物理打击 (所有类型都有的"肉感") ===
        const oscLow = this.ctx.createOscillator();
        const gainLow = this.ctx.createGain();
        oscLow.type = 'sine';
        oscLow.frequency.setValueAtTime(150 * detune, now);
        oscLow.frequency.exponentialRampToValueAtTime(40, now + 0.12); // 快速下潜

        gainLow.gain.setValueAtTime(0, now);
        gainLow.gain.linearRampToValueAtTime(0.4, now + 0.005);
        gainLow.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        oscLow.connect(gainLow);
        gainLow.connect(this.masterGain);
        oscLow.start(now);
        oscLow.stop(now + 0.15);

        // === Layer B: 元素特征 (重写部分) ===

        if (type === 'lightning') {
            // ⚡ 闪电: Layer 1 (FM撕裂) + Layer 2 (高频滋滋)
            
            // --- Layer 1: FM 合成 (保留之前的撕裂主音) ---
            // 负责制造 "Pew/Zwap" 的动态感
            const carrier = this.ctx.createOscillator();
            const modulator = this.ctx.createOscillator();
            const modGain = this.ctx.createGain();
            const mainGain = this.ctx.createGain();

            carrier.type = 'sawtooth';
            carrier.frequency.setValueAtTime(600 * detune, now);
            carrier.frequency.linearRampToValueAtTime(200, now + 0.15);

            modulator.type = 'square';
            modulator.frequency.setValueAtTime(120, now); // 震动频率
            modGain.gain.setValueAtTime(800, now);        // 震动深度
            
            // 稍微降低 Layer 1 音量，为 Layer 2 留空间
            mainGain.gain.setValueAtTime(0.15, now);
            mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            modulator.connect(modGain);
            modGain.connect(carrier.frequency);
            carrier.connect(mainGain);
            mainGain.connect(this.masterGain);

            carrier.start(now); modulator.start(now);
            carrier.stop(now + 0.2); modulator.stop(now + 0.2);

            // --- Layer 2: 高频噪音 (The Sizzle/Zzzzt) ---
            // 负责制造 "滋滋" 的电流接触声
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            
            const noiseFilter = this.ctx.createBiquadFilter();
            // 使用带通滤波器 (Bandpass) 提取高频电流声
            noiseFilter.type = 'bandpass';
            noiseFilter.Q.value = 1.5; // 稍微窄一点，让声音更尖锐
            // 频率随机化 (3000Hz ~ 6000Hz)，模拟每次电弧的不稳定
            noiseFilter.frequency.setValueAtTime(3000 + Math.random() * 3000, now);
            
            // 还可以让滤波器频率快速滑动，增加"穿透感"
            noiseFilter.frequency.exponentialRampToValueAtTime(1000, now + 0.1);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.35, now); // 噪音层要够亮
            // 衰减极快，模拟火花瞬间熄灭
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); 

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            
            noise.start(now);
            noise.stop(now + 0.15);
        }
        else if (type === 'cryo') {
            // ❄️ 冰冻打击 V4：多重微粒碎裂 (Granular Shatter)
            // 钢管是一个长音，冰是无数个短促的崩裂音组合
            
            // 1. 生成 3-4 个极短的随机高频 "Pop" 音 (模拟裂纹扩散)
            const crackCount = 3 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < crackCount; i++) {
                // 稍微错开时间，制造“咔嚓”的颗粒感，而不是“叮”的一声
                const t = now + (i * 0.015); 
                
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                // 使用三角波 (Triangle) 比正弦波更尖锐，有点玻璃感
                osc.type = 'triangle';
                
                // 频率极高：2500Hz ~ 5000Hz (钢管通常在 800-1500Hz)
                // 每一个颗粒的频率都不同
                const freq = 2500 + Math.random() * 2500;
                osc.frequency.setValueAtTime(freq, t);
                
                // 音量包络：极短！15毫秒内消失
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.15, t + 0.002); // 瞬间起音
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03); // 瞬间停止 (去除余音是关键)
                
                // 高通滤波：切掉所有低频，防止出现“闷”的声音
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(2000, t);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start(t);
                osc.stop(t + 0.05);
            }

            // 2. 冰屑噪音 (Noise Burst) - 增加“沙沙”的质感
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(5000, now); // 只留极高频的呲呲声
            
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); // 50ms 结束

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            
            noise.start(now);
            noise.stop(now + 0.06);
            
            return; // 结束 cryo 的处理
        } else if (type === 'pyro') {
            // 🔥 火焰: 低频锯齿 + 低通滤波 (保持之前的闷响感)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100 * detune, now);
            osc.frequency.linearRampToValueAtTime(30, now + 0.15);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
            osc.start(now); osc.stop(now + 0.2);
        }
        else if (type === 'pierce') {
             // 🗡️ 穿透: 方波 + 高截止频率
             const osc = this.ctx.createOscillator();
             const gain = this.ctx.createGain();
             const filter = this.ctx.createBiquadFilter();
             
             osc.type = 'square';
             osc.frequency.setValueAtTime(800 * detune, now);
             osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
             
             filter.type = 'lowpass'; // 稍微修饰一下方波的刺耳
             filter.frequency.setValueAtTime(4000, now);

             gain.gain.setValueAtTime(0.15, now);
             gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
             
             osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
             osc.start(now); osc.stop(now + 0.2);
        }
    }

    /**
     * 播放充能/升级音效 (音调随等级爬升)
     * @param {number} level - 当前充能等级 (1 ~ 7+)
     */
    playPowerup(level = 1) {
        if (this.muted) return;
        
        // 1. 限制等级范围 (1-7)，超过7级保持最高音，避免太刺耳
        const safeLevel = Math.min(Math.max(level, 1), 7);
        
        // 2. 五声音阶半音增量表 (C, D, E, G, A, C, D...)
        // 对应的半音数: 0, 2, 4, 7, 9, 12, 14
        const intervals = [0, 2, 4, 7, 9, 12, 14];
        const semitoneShift = intervals[safeLevel - 1];
        
        // 3. 计算基频 (基础音 C5 = 523.25Hz)
        // 公式: f = f0 * 2^(n/12)
        const baseFreq = 523.25 * Math.pow(2, semitoneShift / 12);
        
        const now = this.ctx.currentTime;

        // --- 声音合成：清亮的水晶音 ---
        
        // 振荡器 1: 主音 (Triangle - 温暖明亮)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(baseFreq, now);

        // 振荡器 2: 泛音 (Sine - 高八度，增加通透感)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 2, now); // 高八度
        // 微调一点点音分，制造“闪烁感”
        osc2.detune.setValueAtTime(10, now); 

        // --- 包络 (ADSR) ---
        // 快速起音，中等衰减
        
        // 主音包络
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // 泛音包络 (消失得稍微快一点)
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        // 连接
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        // 播放
        osc1.start(now);
        osc1.stop(now + 0.55);
        osc2.start(now);
        osc2.stop(now + 0.55);
    }

    /**
     * 播放收集音效
     */
    playCollect() { this.playTone(700, 'sine', 0.1, 0.4); }
}
export default SoundManager;
