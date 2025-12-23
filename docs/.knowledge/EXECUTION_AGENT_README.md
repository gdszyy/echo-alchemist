# 执行 Agent 必读：Echo Alchemist

## 1. 你的角色：执行 Agent

欢迎加入 Echo Alchemist 重构项目！你的角色是 **执行 Agent**，负责接收由项目管理 Agent 分配的具体开发任务，并高质量地完成代码迁移和重构工作。你的工作是整个项目向前推进的核心动力。

## 2. 核心任务：代码迁移

你的主要任务是将 `docs/reference/echoAlchemistV2.0.original.html` 中的 JavaScript 代码，根据指令迁移到 `src/` 目录下相应的模块文件中。这是一个精细且重要的工作，要求你准确、高效地完成代码的提取、重构和集成。

## 3. 标准工作流程

当你接收到一个新任务时，请严格遵循以下工作流程：

1.  **仔细阅读任务 `prompt`**：
    *   `prompt` 是你唯一的任务来源，其中包含了所有必要信息。
    *   **关键信息**：
        *   **任务目标**: 要迁移哪个类或功能？
        *   **源文件**: 永远是 `docs/reference/echoAlchemistV2.0.original.html`。
        *   **源文件行号**: `prompt` 会明确指出需要迁移的代码在源文件中的起止行号。
        *   **目标文件**: `prompt` 会指定代码迁移后应存放的新文件路径，例如 `src/entities/Enemy.js`。

2.  **提取源代码**：
    *   使用 `file` 工具的 `read` 操作，配合 `range` 参数，精确地从源 HTML 文件中读取指定的代码行。
    *   **示例**：`print(default_api.file(action="read", path="docs/reference/echoAlchemistV2.0.original.html", range=[3326, 4017]))`

3.  **编写新模块文件**：
    *   使用 `file` 工具的 `write` 操作，将提取到的代码写入 `prompt` 指定的目标文件。

4.  **代码重构**：
    *   这是最关键的一步。你需要将旧的、非模块化的代码改造为现代 ES6 模块。
    *   **主要改造点**：
        *   **添加 `export`**：使用 `export` 或 `export default` 导出主类或函数。
        *   **处理依赖**：如果迁移的代码依赖于其他模块（如 `Vec2`），使用 `import` 语句导入它们。
        *   **移除全局污染**：删除将对象挂载到 `window` 的代码，除非 `HANDOVER_DOCUMENT.md` 中有特殊说明要求兼容。
        *   **格式化**：确保代码格式整洁、缩进正确。

5.  **更新索引文件（如果需要）**：
    *   许多模块目录下都有一个 `index.js` 文件，用于统一导出该模块的所有内容。如果创建了新文件，记得在 `index.js` 中导出它。
    *   **示例**：在 `src/entities/index.js` 中添加 `export * from './Enemy.js';`。

6.  **提交与推送**：
    *   使用 `shell` 工具执行 `git` 命令。
    *   **提交**：`git add . && git commit -m "feat(entities): migrate Enemy class"` (请遵循 Conventional Commits 规范)。
    *   **推送**：`git push`。

## 4. 开发规范与参考资料

*   **编码规范**: 严格遵守 `docs/.knowledge/CODING_STANDARDS.md` 中定义的规范。
*   **项目结构**: 时刻参考 `docs/.knowledge/PROJECT_STRUCTURE.md`，确保文件放置在正确的位置。
*   **项目状态**: 在开始和结束任务时，可以查阅 `docs/HANDOVER_DOCUMENT.md` 以了解项目的宏观背景。

你的每一次成功迁移，都是项目迈向最终目标的重要一步。请专注、细致地完成每一个任务。
