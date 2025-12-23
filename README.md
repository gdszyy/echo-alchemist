# Echo Alchemist 回聲煉金師

一款基于 HTML5 Canvas 的弹珠类 Roguelike 游戏。

## 项目结构

```
echo-alchemist/
├── index.html              # 主入口
├── package.json            # 项目配置
├── vite.config.js          # Vite 构建配置
├── src/                    # 源代码
│   ├── main.js             # 应用入口
│   ├── config/             # 游戏配置
│   ├── data/               # 静态数据
│   ├── core/               # 核心模块
│   ├── audio/              # 音频系统
│   ├── entities/           # 游戏实体
│   ├── effects/            # 视觉效果
│   ├── ui/                 # UI 组件
│   └── systems/            # 游戏系统
├── styles/                 # 样式文件
├── docs/                   # 文档
│   └── .knowledge/         # Agent 知识库
└── scripts/                # 开发脚本
```

## 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 部署

本项目支持部署到 Railway、Vercel、Netlify 等平台。

### Railway 部署

1. 连接 GitHub 仓库
2. 设置构建命令: `npm run build`
3. 设置输出目录: `dist`
4. 部署

## 技术栈

- **构建工具**: Vite
- **渲染**: HTML5 Canvas 2D
- **音频**: Web Audio API
- **样式**: TailwindCSS + 自定义 CSS

## 开发规范

详见 `docs/.knowledge/` 目录下的文档：

- `PROJECT_STRUCTURE.md` - 项目结构说明
- `CODING_STANDARDS.md` - 编码规范
- `GAME_MECHANICS.md` - 游戏机制说明

## 协作流程

本项目采用 AI Agent 协作开发模式，通过 Linear 进行任务管理，GitHub 进行代码版本控制。

详见 `docs/HANDOVER_DOCUMENT.md`。

## License

MIT
