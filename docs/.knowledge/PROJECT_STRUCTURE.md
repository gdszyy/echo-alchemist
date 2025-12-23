# Echo Alchemist 项目结构设计

## 项目概述

**Echo Alchemist（回聲煉金師）** 是一款基于 HTML5 Canvas 的弹珠类 Roguelike 游戏。本文档定义了模块化重构后的项目结构，旨在支持 AI Agent 协作开发和持续迭代。

## 目录结构

```
echo-alchemist/
├── index.html                 # 主入口文件
├── package.json               # 项目配置
├── vite.config.js             # Vite 构建配置
├── README.md                  # 项目说明
│
├── src/                       # 源代码目录
│   ├── main.js                # 应用入口
│   ├── config/                # 配置模块
│   │   ├── index.js           # 配置导出
│   │   ├── game.config.js     # 游戏平衡性配置
│   │   ├── visual.config.js   # 视觉效果配置
│   │   └── physics.config.js  # 物理引擎配置
│   │
│   ├── data/                  # 静态数据
│   │   ├── relics.js          # 遗物数据库
│   │   ├── skills.js          # 技能数据库
│   │   └── marbles.js         # 弹珠定义
│   │
│   ├── core/                  # 核心模块
│   │   ├── Game.js            # 游戏主类
│   │   ├── Vec2.js            # 向量数学工具
│   │   └── utils.js           # 通用工具函数
│   │
│   ├── audio/                 # 音频模块
│   │   └── SoundManager.js    # 声音管理器
│   │
│   ├── entities/              # 游戏实体
│   │   ├── DropBall.js        # 收集阶段弹珠
│   │   ├── Projectile.js      # 战斗阶段子弹
│   │   ├── Enemy.js           # 敌人类
│   │   ├── Peg.js             # 钉子类
│   │   ├── SpecialSlot.js     # 特殊槽位
│   │   └── CloneSpore.js      # 分裂孢子
│   │
│   ├── effects/               # 视觉效果
│   │   ├── Particle.js        # 粒子系统
│   │   ├── FloatingText.js    # 浮动文字
│   │   ├── LightningBolt.js   # 闪电效果
│   │   ├── LaserBeam.js       # 激光效果
│   │   ├── CollectionBeam.js  # 收集光束
│   │   ├── Shockwave.js       # 冲击波
│   │   ├── EnergyOrb.js       # 能量球
│   │   └── FireWave.js        # 火焰波
│   │
│   ├── ui/                    # UI 模块
│   │   ├── UIManager.js       # UI 管理器
│   │   ├── components/        # UI 组件
│   │   │   ├── TopBar.js      # 顶部状态栏
│   │   │   ├── RecipeHUD.js   # 配方显示
│   │   │   ├── RelicPanel.js  # 遗物选择面板
│   │   │   └── InfoDrawer.js  # 信息抽屉
│   │   └── phases/            # 阶段 UI
│   │       ├── SelectionUI.js # 选卡阶段
│   │       ├── GatheringUI.js # 收集阶段
│   │       └── CombatUI.js    # 战斗阶段
│   │
│   └── systems/               # 游戏系统
│       ├── PhysicsSystem.js   # 物理碰撞系统
│       ├── CombatSystem.js    # 战斗计算系统
│       ├── RelicSystem.js     # 遗物效果系统
│       └── SkillSystem.js     # 技能系统
│
├── styles/                    # 样式文件
│   ├── main.css               # 主样式
│   ├── animations.css         # 动画定义
│   └── components.css         # 组件样式
│
├── docs/                      # 文档目录
│   ├── .knowledge/            # Agent 知识库
│   │   ├── PROJECT_STRUCTURE.md
│   │   ├── CODING_STANDARDS.md
│   │   └── GAME_MECHANICS.md
│   ├── HANDOVER_DOCUMENT.md   # 交接文档
│   └── CHANGELOG.md           # 变更日志
│
└── scripts/                   # 开发脚本
    └── manus_task_dispatcher.py  # Manus 任务分派器
```

## 模块职责说明

### 1. 配置模块 (`src/config/`)

集中管理所有游戏配置，便于调参和平衡性调整。

| 文件 | 职责 |
|------|------|
| `game.config.js` | 敌人血量、生成概率、词缀参数等 |
| `visual.config.js` | 颜色、尺寸、光效强度等 |
| `physics.config.js` | 重力、弹性、摩擦力等 |

### 2. 数据模块 (`src/data/`)

存储静态游戏数据，与逻辑代码分离。

| 文件 | 职责 |
|------|------|
| `relics.js` | 遗物定义（RELIC_DB） |
| `skills.js` | 技能定义（SKILL_DB） |
| `marbles.js` | 弹珠类型定义（MarbleDefinition） |

### 3. 核心模块 (`src/core/`)

游戏运行的核心逻辑。

| 文件 | 职责 |
|------|------|
| `Game.js` | 游戏主循环、状态管理、阶段切换 |
| `Vec2.js` | 二维向量运算 |
| `utils.js` | 颜色处理、数学工具等 |

### 4. 实体模块 (`src/entities/`)

所有可交互的游戏对象。

| 文件 | 职责 |
|------|------|
| `DropBall.js` | 收集阶段的弹珠（物理模拟） |
| `Projectile.js` | 战斗阶段的子弹（伤害计算） |
| `Enemy.js` | 敌人（血量、词缀、状态） |
| `Peg.js` | 钉子（碰撞、特殊效果） |

### 5. 效果模块 (`src/effects/`)

纯视觉效果，不影响游戏逻辑。

### 6. UI 模块 (`src/ui/`)

所有用户界面相关代码。

### 7. 系统模块 (`src/systems/`)

跨实体的游戏机制。

## 技术栈

- **构建工具**: Vite（快速开发、ES Module 支持）
- **样式**: TailwindCSS + 自定义 CSS
- **渲染**: HTML5 Canvas 2D
- **音频**: Web Audio API
- **部署**: Railway（用户自行配置）

## Agent 协作规范

1. **任务粒度**: 每个 Issue 应聚焦于单一模块或功能
2. **分支命名**: `feature/<module>-<description>` 或 `fix/<issue-id>`
3. **提交规范**: 使用 Conventional Commits 格式
4. **知识更新**: 完成任务后更新 `HANDOVER_DOCUMENT.md`
