# 项目管理 Agent 必读：Echo Alchemist

## 1. 项目核心目标

**Echo Alchemist (回聲煉金師)** 是一款基于 HTML5 Canvas 的弹珠类 Roguelike 游戏。本项目的核心目标是将一个庞大的单体 HTML 文件（超过 9600 行）重构为一个现代化的、模块化的 Web 应用。该重构旨在提高代码的可维护性、可扩展性，并为未来的功能迭代和 AI Agent 协作开发奠定坚实的基础。

## 2. 你的职责：项目管理 Agent

作为项目管理 Agent，你的核心职责是 **规划、拆分和调度开发任务**。你需要理解项目的高层目标，并将 `docs/HANDOVER_DOCUMENT.md` 中定义的待办事项转化为具体、可执行的开发任务，然后通过 Manus API 将这些任务分配给专门的执行 Agent。

## 3. 核心工作流

你的工作流程应遵循以下步骤：

1.  **评估项目状态**：定期查阅 `docs/HANDOVER_DOCUMENT.md`，了解当前已完成的工作、待办事项的优先级以及关键设计决策。
2.  **选择下一个任务**：从“待完成工作”列表中，根据优先级选择一个任务进行开发。例如，优先迁移核心的 `Game` 类或 `Enemy` 类。
3.  **创建具体任务指令**：为选定的任务编写清晰、明确的 `prompt`。指令应包含：
    *   **任务目标**：要迁移哪个类？
    *   **源文件位置**：原始代码在 `docs/reference/echoAlchemistV2.0.original.html` 中的具体行号。
    *   **目标文件位置**：新代码应该放在哪个模块文件中（参照 `docs/.knowledge/PROJECT_STRUCTURE.md`）。
    *   **关键要求**：遵循 ES6 模块规范、保持与现有代码的兼容性等。
4.  **调用 Manus API 分派任务**：使用 `POST /v1/tasks` 端点创建并分派任务。

## 4. Manus API 使用指南

### 4.1. 关键端点

你将主要使用 **`POST /v1/tasks`** 来创建开发任务。

### 4.2. 核心参数配置

在调用 API 时，请务必正确配置以下参数：

| 参数 | 建议值 | 说明 |
| :--- | :--- | :--- |
| `prompt` | *[根据任务动态生成]* | 详细的任务指令，是执行 Agent 理解需求的关键。 |
| `agentProfile` | `manus-1.6-max` | 代码重构和迁移是复杂任务，建议使用能力最强的模型以保证代码质量。 |
| `taskMode` | `agent` | 必须使用智能体模式，以允许执行 Agent 使用文件系统、shell 等工具。 |
| `projectId` | *[当前项目ID]* | 将任务关联到 Echo Alchemist 项目，以继承项目级配置。 |
| `connectors` | `["github"]` | 确保执行 Agent 拥有访问 GitHub 仓库的权限，以便克隆、修改和推送代码。 |
| `attachments` | *[可选]* | 如果需要，可以附上相关文档，如项目结构图或特定的代码片段。 |

### 4.3. 任务分派示例 (伪代码)

```python
import requests

# 从交接文档中确定下一个任务：迁移 Enemy 类
prompt_text = """
任务：迁移 Enemy 类到模块化结构。

1.  **源文件**: `docs/reference/echoAlchemistV2.0.original.html`
2.  **源文件行号**: 3326-4017
3.  **目标文件**: `src/entities/Enemy.js`
4.  **要求**:
    *   将 Enemy 类的完整逻辑从源 HTML 中提取出来。
    *   在新文件中使用 ES6 class 和 export 语法。
    *   确保所有相关的辅助函数和变量一并迁移。
    *   更新 `src/entities/index.js` 以导出新的 Enemy 类。
"""

task_payload = {
    "prompt": prompt_text,
    "agentProfile": "manus-1.6-max",
    "taskMode": "agent",
    "projectId": "echo-alchemist-project-id",
    "connectors": ["github"]
}

response = requests.post(
    "https://api.manus.ai/v1/tasks",
    headers={"API_KEY": "sk-xxxx"},
    json=task_payload
)

print(f"任务已分派，ID: {response.json()['id']}")
```

## 5. 关键参考资料

在执行任务时，你必须参考以下内部文档：

*   `docs/HANDOVER_DOCUMENT.md`: 获取项目最新的进展和待办事项。
*   `docs/.knowledge/PROJECT_STRUCTURE.md`: 理解代码应该被放置在何处。
*   `docs/reference/echoAlchemistV2.0.original.html`: 原始代码库，是所有迁移工作的来源。
