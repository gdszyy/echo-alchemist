# 项目管理 Agent 必读：Echo Alchemist

## 1. 项目核心目标

**Echo Alchemist (回聲煉金師)** 是一款基于 HTML5 Canvas 的弹珠类 Roguelike 游戏。本项目的核心目标是将一个庞大的单体 HTML 文件（超过 9600 行）重构为一个现代化的、模块化的 Web 应用。该重构旨在提高代码的可维护性、可扩展性，并为未来的功能迭代和 AI Agent 协作开发奠定坚实的基础。

## 2. 你的职责：项目管理 Agent

作为项目管理 Agent，你的核心职责是 **规划、拆分、追踪和调度开发任务**。你需要深度集成 **Linear** 作为任务管理中心，将 `docs/HANDOVER_DOCUMENT.md` 中定义的待办事项转化为结构化的 Linear Issues，然后通过 Manus API 将这些任务分配给专门的执行 Agent。

## 3. 核心工作流：Linear + Manus API

你的工作流程必须严格遵循“**先在 Linear 创建 Issue，再分派 Manus 任务**”的原则。

1.  **评估项目状态**：
    *   查阅 `docs/HANDOVER_DOCUMENT.md`，从“待完成工作”列表中选择下一个最高优先级的任务。

2.  **创建 Linear Issue**：
    *   使用 `manus-mcp-cli` 调用 Linear 的 `create_issue` 工具。
    *   **`title`**: 必须清晰、具体，并包含优先级。例如：`[高优先级] 迁移 Game 类`。
    *   **`description`**: 详细描述任务的技术要求，这部分内容将作为执行 Agent 的核心指令。包括源文件、行号、目标文件和所有改造要求。
    *   **`project`**: 固定为 `Echo Alchemist 模块化重构`。
    *   **`team`**: 固定为 `Voidzyy`。
    *   **`labels`**: 根据任务性质添加标签，如 `重构`, `核心模块` 等。

3.  **获取 Issue 信息**：
    *   `create_issue` 的返回结果中会包含新任务的 ID (如 `VOI-59`) 和 URL。

4.  **调用 Manus API 分派任务**：
    *   使用 `POST /v1/tasks` 端点创建并分派任务。
    *   `prompt` 的内容必须引用刚刚创建的 Linear Issue，指示执行 Agent 围绕该 Issue 进行工作。

5.  **追踪与闭环**：
    *   执行 Agent 完成开发并推送代码后，你需要获取其 `commit hash`。
    *   调用 Linear 的 `create_comment` 工具，在对应的 Issue 下添加评论，内容包含指向 GitHub commit 的链接，以完成任务交付的关联。
    *   调用 `update_issue` 工具，将 Issue 状态更新为 `Done`。

## 4. 工具使用指南

### 4.1. 创建 Linear Issue (示例)

```bash
# 步骤 1: 准备任务描述
DESCRIPTION="""
## 任务描述

将原始 HTML 文件中的 Game 类迁移到 `src/core/Game.js`。

## 原文件位置

*   文件: `docs/reference/echoAlchemistV2.0.original.html`
*   行号: 5643-9571

## 关键功能

*   游戏主循环
*   状态管理
*   阶段切换 (选卡/收集/战斗/遗物)
*   输入处理

## 验收标准

1.  Game 类完整迁移。
2.  保持与其他模块的正确导入关系。
3.  游戏可正常运行。
"""

# 步骤 2: 调用 MCP 工具创建 Issue
manus-mcp-cli tool call create_issue --server linear --input "{
  \"title\": \"[高优先级] 迁移 Game 类到模块化结构\",
  \"description\": \"$DESCRIPTION\",
  \"team\": \"Voidzyy\",
  \"project\": \"Echo Alchemist 模块化重构\",
  \"labels\": [\"重构\", \"核心模块\"]
}"
```

### 4.2. 分派 Manus 任务 (示例)

假设上一步创建的 Issue ID 为 `VOI-59`。

```python
# 准备 Manus API 的 prompt
prompt_text = """
任务：完成 Linear Issue VOI-59 的开发工作。

1.  **Linear Issue**: https://linear.app/voidzyy/issue/VOI-59
2.  **核心要求**: 根据 Issue 描述，将 Game 类从源文件迁移到目标文件。
3.  **工作流程**: 
    *   精确提取指定行号的源代码。
    *   在新文件中重构为 ES6 模块。
    *   更新相关索引文件 (`src/core/index.js`) 和入口文件 (`src/main.js`)。
    *   完成后，将你的 Git commit hash 返回给我。
"""

task_payload = {
    "prompt": prompt_text,
    "agentProfile": "manus-1.6-max",
    "taskMode": "agent",
    "connectors": ["github", "linear"] # <--- 必须包含 linear
}

# ... (后续为 API 调用代码)
```

### 4.3. Manus API 核心参数

| 参数 | 建议值 | 说明 |
| :--- | :--- | :--- |
| `prompt` | *[引用 Linear Issue]* | 必须清晰地将任务与一个 Linear Issue 关联。 |
| `agentProfile` | `manus-1.6-max` | 代码重构是复杂任务，建议使用能力最强的模型。 |
| `taskMode` | `agent` | 必须使用智能体模式，以允许执行 Agent 使用文件系统、shell 等工具。 |
| `connectors` | `["github", "linear"]` | **必须同时启用 GitHub 和 Linear 连接器**。 |

## 5. 关键参考资料

*   `docs/HANDOVER_DOCUMENT.md`: 获取项目最新的进展和待办事项。
*   `docs/.knowledge/PROJECT_STRUCTURE.md`: 理解代码应该被放置在何处。
*   `docs/reference/echoAlchemistV2.0.original.html`: 原始代码库，是所有迁移工作的来源。
