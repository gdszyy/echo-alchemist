# Echo Alchemist 交接文档

> 本文档用于 Agent 会话间的上下文传递，确保项目迭代的连续性。

## 项目状态

**当前版本**: 2.0.0 (模块化重构版)  
**最后更新**: 2024-12-23

## 已完成工作

### 1. 项目结构重构

将原始单文件 HTML (9600+ 行) 拆分为模块化结构：

- ✅ 配置模块 (`src/config/`)
  - `game.config.js` - 游戏平衡性配置
  - `physics.config.js` - 物理引擎配置
  - `visual.config.js` - 视觉效果配置

- ✅ 数据模块 (`src/data/`)
  - `relics.js` - 遗物数据库
  - `skills.js` - 技能数据库
  - `marbles.js` - 弹珠定义

- ✅ 核心模块 (`src/core/`)
  - `Vec2.js` - 向量数学工具
  - `utils.js` - 通用工具函数

- ✅ 音频模块 (`src/audio/`)
  - `SoundManager.js` - 声音管理器

- ✅ 实体模块 (`src/entities/`)
  - `Peg.js` - 钉子类
  - `SpecialSlot.js` - 特殊槽位

- ✅ 效果模块 (`src/effects/`)
  - `Particle.js` - 粒子系统
  - `FloatingText.js` - 浮动文字
  - `LightningBolt.js` - 闪电效果

### 2. 构建配置

- ✅ Vite 配置
- ✅ package.json
- ✅ 样式文件分离

## 待完成工作

### 高优先级

1. **迁移 Game 类** (`src/core/Game.js`)
   - 原文件行号: 5643-9571
   - 包含游戏主循环、状态管理、阶段切换

2. **迁移 DropBall 类** (`src/entities/DropBall.js`)
   - 原文件行号: 2620-3325
   - 收集阶段弹珠物理模拟

3. **迁移 Enemy 类** (`src/entities/Enemy.js`)
   - 原文件行号: 3326-4017
   - 敌人逻辑、词缀系统

4. **迁移 Projectile 类** (`src/entities/Projectile.js`)
   - 原文件行号: 4018-4745
   - 战斗阶段子弹逻辑

### 中优先级

5. **迁移 UIManager 类** (`src/ui/UIManager.js`)
   - 原文件行号: 5392-5642

6. **迁移剩余效果类**
   - `LaserBeam.js` (5049-5102)
   - `CollectionBeam.js` (4944-4997)
   - `Shockwave.js` (4998-5048)
   - `EnergyOrb.js` (5146-5277)
   - `FireWave.js` (5360-5391)

### 低优先级

7. **添加单元测试**
8. **性能优化**
9. **移动端适配优化**

## 关键设计决策

1. **ES Module 格式**: 所有模块使用 ES6 模块语法
2. **全局兼容**: 关键对象挂载到 `window` 以兼容原有代码
3. **渐进式迁移**: 保持游戏可运行的同时逐步迁移

## 已知问题

- [ ] 完整 Game 类尚未迁移，当前 main.js 中的 Game 是简化版
- [ ] 部分效果类尚未实现

## 参考资源

- 原始文件: `/home/ubuntu/upload/echoAlchemistV2.0.html`
- 架构图: `/home/ubuntu/upload/04_triangle_architecture.mmd`
- 工作理念: `/home/ubuntu/upload/创新工作流与核心理念.md`

---

*此文档应在每次重要更新后更新*
