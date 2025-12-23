/**
 * UI 管理器类
 * 负责 UI 状态管理、抽屉面板控制、选项卡切换和 Toast 提示
 */
import { CONFIG } from '../config/index.js';
import { SKILL_DB } from '../data/index.js';
import { adjustColorBrightness } from '../core/utils.js';

/**
 * UIManager 类
 * 管理游戏 UI 交互，包括信息抽屉、技能栏、技能点显示等
 */
export class UIManager {
    constructor() {
        this.drawer = document.getElementById('info-drawer');
        this.currentTab = 'status';
        this.hoveredEnemy = null;
        this.isOpen = false;
        this.spContainer = document.getElementById('sp-panel');
        
        const afx = CONFIG.balance.affixes;
        
        // 词条字典
        this.affixDict = {
            'shield': { 
                name: '🛡️ 護盾', 
                desc: `受到的傷害減少 ${afx.shieldReduction * 100}%。(可反射激光)` 
            },
            'haste': { 
                name: '⚡ 極速', 
                desc: `每回合固定行移動 ${afx.hasteActions} 次。` 
            },
            'regen': { 
                name: '💚 再生', 
                desc: `每回合恢復 ${afx.regenPercent * 100}% 最大生命值。` 
            },
            'clone': { 
                name: '🦠 增殖', 
                desc: `每回合開始和受到攻击时，有 ${afx.cloneChanceHit * 100}% 概率产生分身` 
            },
            'berserk': { 
                name: '😡 狂暴', 
                desc: '有概率行动两次 (概率随温度升高)' 
            },
            'healer': { 
                name: '💖 治癒', 
                desc: `回合行動時，治療周圍友軍 (${afx.healerPercent * 100}% HP)。` 
            },
            'devour': { 
                name: '👅 吞噬', 
                desc: '隨機吞噬相鄰友軍，繼承其血量與詞條。' 
            },
            'jump': { 
                name: '🦘 跳躍', 
                desc: '移動受阻時，可跳過前方敵人前進。' 
            }
        };
    }

    /**
     * 切换 Tab
     * @param {string} tabName - 标签名称 ('status', 'affix', 'recipe')
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新按钮样式
        document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
            const targets = ['status', 'affix', 'recipe'];
            if (targets[idx] === tabName) {
                btn.classList.add('active', 'text-amber-400', 'border-b-2', 'border-amber-400');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('active', 'text-amber-400', 'border-b-2', 'border-amber-400');
                btn.classList.add('text-slate-400');
            }
        });
        
        // 切换内容显示
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    }

    /**
     * 更新技能栏
     * @param {number} currentSP - 当前技能点数
     */
    updateSkillBar(currentSP) {
        const container = document.getElementById('skill-bar');
        if (!container) return;
        container.innerHTML = '';

        SKILL_DB.forEach(skill => {
            const btn = document.createElement('div');
            const isDisabled = currentSP < skill.cost;
            
            btn.className = `
                w-12 h-12 rounded-full border-2 flex items-center justify-center 
                text-xl shadow-lg transition-all duration-200 relative group
                ${isDisabled ? 'border-slate-600 bg-slate-800 opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer hover:scale-110 active:scale-95'}
            `;
            
            // 动态边框颜色
            if (!isDisabled) {
                btn.style.borderColor = skill.color;
                btn.style.background = `radial-gradient(circle, ${adjustColorBrightness(skill.color, 0.5)} 0%, #0f172a 100%)`;
                btn.style.boxShadow = `0 0 10px ${skill.color}`;
            }

            btn.innerHTML = `
                <span>${skill.icon}</span>
                <div class="absolute -bottom-2 -right-2 bg-black border border-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white font-bold">
                    ${skill.cost}
                </div>
            `;

            // 点击事件
            if (!isDisabled) {
                // 定义一个阻止冒泡的函数
                const stopProp = (e) => { e.stopPropagation(); };

                // 监听按下事件，防止它们穿透到 Canvas 触发瞄准拖拽
                btn.addEventListener('mousedown', stopProp);
                btn.addEventListener('touchstart', stopProp, { passive: false });

                // 点击事件处理
                btn.onclick = (e) => {
                    e.stopPropagation();
                    // 使用全局 game 对象
                    if (window.game) {
                        window.game.activateSkill(skill);
                    }
                };
            }

            container.appendChild(btn);
        });
    }

    /**
     * 更新技能点显示
     * @param {number} current - 当前技能点
     * @param {number} max - 最大技能点
     */
    updateSkillPoints(current, max = Math.max(5, current + 1)) {
        if (!this.spContainer) return;
        this.spContainer.innerHTML = '';

        for (let i = 0; i < max; i++) {
            // 创建槽位
            const slot = document.createElement('div');
            slot.className = 'sp-slot';
            
            // 创建宝石
            const gem = document.createElement('div');
            gem.className = 'sp-gem';
            
            // 如果当前索引 < 拥有的点数，则点亮宝石
            if (i < current) {
                gem.classList.add('active');
                slot.style.borderColor = '#10b981'; // 亮绿色边框
                slot.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
            }

            slot.appendChild(gem);
            this.spContainer.appendChild(slot);
        }
    }

    /**
     * 显示敌人信息（打开/更新抽屉）
     * @param {Object} enemy - 敌人对象
     */
    showEnemyInfo(enemy) {
        if (!enemy || !enemy.active) {
            this.closeDrawer();
            return;
        }

        this.hoveredEnemy = enemy;
        this.isOpen = true;
        this.drawer.classList.remove('translate-y-full');

        // --- Tab 1: 状态更新 ---
        
        // 标题与血量
        const typeName = enemy.type === 'boss' ? '💀 BOSS' : (enemy.type === 'elite' ? '⚠️ 精英魔像' : '普通魔像');
        document.getElementById('info-enemy-type').innerText = typeName;
        document.getElementById('info-enemy-type').className = enemy.type === 'boss' ? 'text-xl font-bold text-red-500' : (enemy.type === 'elite' ? 'text-lg font-bold text-yellow-400' : 'text-lg font-bold text-slate-200');
        document.getElementById('info-hp').innerText = `HP: ${Math.ceil(enemy.displayHp)}/${enemy.maxHp}`;

        // 温度条更新
        const tempBar = document.getElementById('info-temp-bar');
        const tempText = document.getElementById('info-temp-text');
        
        const tempPct = Math.min(100, Math.abs(enemy.temp));
        tempBar.style.width = `${tempPct/2}%`;
        
        if (enemy.temp > 0) {
            tempBar.style.left = '50%';
            tempBar.style.transformOrigin = 'left';
            tempBar.style.background = '#f97316'; // Orange
            tempText.innerText = `溫度: +${enemy.temp.toFixed(0)}°C (過熱)`;
            tempText.style.color = '#fbbf24';
        } else if (enemy.temp < 0) {
            tempBar.style.left = `${50 - tempPct/2}%`;
            tempBar.style.transformOrigin = 'right';
            tempBar.style.background = '#06b6d4'; // Cyan
            tempText.innerText = `溫度: ${enemy.temp.toFixed(0)}°C (過冷)`;
            tempText.style.color = '#67e8f9';
        } else {
            tempBar.style.width = '0';
            tempText.innerText = `溫度: 0°C (穩定)`;
            tempText.style.color = '#94a3b8';
        }

        // 状态列表生成
        const statusList = document.getElementById('info-status-list');
        statusList.innerHTML = '';

        // 1. 冰冻判定
        if (enemy.isFrozenCurrentTurn || enemy.temp <= -100) {
            this.addStatusItem(statusList, '❄️ 深度凍結', '無法移動與行動。', 'text-cyan-300');
        } else if (enemy.temp < 0) {
            const freezeChance = Math.min(100, Math.abs(enemy.temp)) / 2;
            this.addStatusItem(statusList, '📉 低溫影響', `下回合有 ${freezeChance.toFixed(0)}% 概率被凍結。`, 'text-cyan-200');
        }

        // 2. 燃烧判定
        if (enemy.temp > 0) {
            if (enemy.temp >= 100) {
                const dmg = 5 + (enemy.temp - 100);
                this.addStatusItem(statusList, '🔥 極限燃燒', `每回合受到 ${dmg.toFixed(0)} 點傷害，並向周圍擴散。`, 'text-orange-400');
            } else {
                this.addStatusItem(statusList, '🌡️ 過熱狀態', '溫度 >100°C 時觸發燃燒傷害。', 'text-orange-200');
            }
            
            // 狂暴判定
            if (enemy.affixes.includes('berserk')) {
                const berserkChance = (enemy.temp / 100) * 0.5 * 100;
                this.addStatusItem(statusList, '😡 熱能狂暴', `因過熱，有 ${berserkChance.toFixed(0)}% 概率行動兩次。`, 'text-red-400');
            }
        }
        
        // 3. 导电判定
        if (enemy.temp < 0) {
            const conductBonus = Math.min(100, 15 + Math.abs(enemy.temp) * 0.85);
            this.addStatusItem(statusList, '⚡ 導電體質', `低溫使連鎖閃電傳導概率提升至 ${(conductBonus).toFixed(0)}%。`, 'text-purple-300');
        } else {
            this.addStatusItem(statusList, '⚡ 導電體質', `基礎連鎖閃電傳導概率 15%。`, 'text-purple-300/50');
        }

        // --- Tab 2: 词条更新 ---
        const affixContainer = document.getElementById('info-affix-list');
        affixContainer.innerHTML = '';
        
        if (enemy.affixes.length === 0) {
            affixContainer.innerHTML = '<p class="text-slate-500 text-center italic mt-4">該敵人無特殊詞條</p>';
        } else {
            enemy.affixes.forEach(affix => {
                const info = this.affixDict[affix];
                if (info) {
                    const div = document.createElement('div');
                    div.className = 'bg-slate-800 p-2 rounded border border-slate-700';
                    div.innerHTML = `<div class="font-bold text-amber-100 mb-1">${info.name}</div><div class="text-xs text-slate-400">${info.desc}</div>`;
                    affixContainer.appendChild(div);
                }
            });
        }
    }

    /**
     * 添加状态项到容器
     * @param {HTMLElement} container - 容器元素
     * @param {string} title - 状态标题
     * @param {string} desc - 状态描述
     * @param {string} colorClass - 颜色类名
     */
    addStatusItem(container, title, desc, colorClass) {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-start';
        div.innerHTML = `<span class="font-bold ${colorClass}">${title}</span> <span class="text-right max-w-[70%]">${desc}</span>`;
        container.appendChild(div);
    }

    /**
     * 关闭抽屉
     */
    closeDrawer() {
        this.isOpen = false;
        this.hoveredEnemy = null;
        if (this.drawer) {
            this.drawer.classList.add('translate-y-full');
        }
    }
}

// 导出到全局以兼容原有代码
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
