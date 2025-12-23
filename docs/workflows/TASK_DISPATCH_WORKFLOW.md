# Echo Alchemist 任务分派工作流

## 概述

本文档定义了 Echo Alchemist 项目中，项目管理 Agent 如何通过 **Linear + Manus API** 完成任务的规划、分派和追踪。该工作流确保了从需求到交付的完整闭环。

## 工作流架构

```
[HANDOVER_DOCUMENT.md] 
    ↓ (选择任务)
[项目管理 Agent]
    ↓ (创建 Issue)
[Linear Issue (VOI-XX)]
    ↓ (分派任务)
[Manus API Task]
    ↓ (执行开发)
[执行 Agent]
    ↓ (推送代码)
[GitHub Commit]
    ↓ (关联交付)
[Linear Comment + 状态更新]
```

## 详细步骤

### 步骤 1：选择待办任务

项目管理 Agent 查阅 `docs/HANDOVER_DOCUMENT.md` 中的"待完成工作"列表，根据优先级选择下一个任务。

**当前高优先级任务**：

| 任务 | Linear Issue | 状态 |
| :--- | :--- | :--- |
| 迁移 Game 类 | VOI-50 | Backlog |
| 迁移 DropBall 类 | VOI-51 | Backlog |
| 迁移 Enemy 类 | VOI-52 | Backlog |
| 迁移 Projectile 类 | VOI-53 | Backlog |

### 步骤 2：创建或确认 Linear Issue

如果 Linear 中尚未存在对应的 Issue，项目管理 Agent 需要使用 `manus-mcp-cli` 创建。

**创建 Issue 的命令示例**：

```bash
manus-mcp-cli tool call create_issue --server linear --input '{
  "title": "[高优先级] 迁移 Game 类到模块化结构",
  "description": "...",
  "team": "Voidzyy",
  "project": "Echo Alchemist 模块化重构",
  "priority": 2,
  "labels": ["重构", "核心模块"]
}'
```

**Issue 描述模板**：

```markdown
## 任务描述

[简要说明任务目标]

## 原文件位置

*   文件: `docs/reference/echoAlchemistV2.0.original.html`
*   行号: [起始行]-[结束行]

## 关键功能

*   [功能点 1]
*   [功能点 2]

## 验收标准

1.  [标准 1]
2.  [标准 2]

## 参考

*   GitHub: https://github.com/gdszyy/echo-alchemist
*   交接文档: `docs/HANDOVER_DOCUMENT.md`
```

### 步骤 3：通过 Manus API 分派任务

使用 `scripts/dispatch_task.py` 脚本，或直接调用 Manus API。

**Python 脚本示例**：

```python
from scripts.dispatch_task import dispatch_task

result = dispatch_task(
    issue_id="VOI-50",
    issue_url="https://linear.app/voidzyy/issue/VOI-50/...",
    issue_title="[高优先级] 迁移 Game 类到模块化结构",
    issue_description="..."
)

print(f"任务已分派，Manus Task ID: {result['id']}")
```

**Manus API 核心参数**：

| 参数 | 值 | 说明 |
| :--- | :--- | :--- |
| `prompt` | *[引用 Linear Issue]* | 必须清晰地将任务与一个 Linear Issue 关联。 |
| `agentProfile` | `manus-1.6-max` | 代码重构是复杂任务，建议使用能力最强的模型。 |
| `taskMode` | `agent` | 必须使用智能体模式。 |
| `connectors` | `["github", "linear"]` | **必须同时启用 GitHub 和 Linear 连接器**。 |

### 步骤 4：执行 Agent 完成开发

执行 Agent 接收到任务后，按照 `docs/.knowledge/EXECUTION_AGENT_README.md` 中定义的标准工作流程完成开发。

**核心步骤**：

1.  克隆 GitHub 仓库。
2.  精确提取源代码。
3.  重构为 ES6 模块。
4.  更新索引文件和入口文件。
5.  提交并推送代码。

### 步骤 5：关联 GitHub Commit 到 Linear Issue

执行 Agent 完成开发后，必须在 Linear Issue 下添加评论，关联 GitHub commit。

**添加评论的命令示例**：

```bash
manus-mcp-cli tool call create_comment --server linear --input '{
  "issueId": "VOI-50",
  "body": "✅ 开发完成\n\n**GitHub Commit**: https://github.com/gdszyy/echo-alchemist/commit/abc123\n\n所有验收标准已满足。"
}'
```

### 步骤 6：更新 Linear Issue 状态

将 Issue 状态从 `Backlog` 或 `In Progress` 更新为 `Done`。

**更新状态的命令示例**：

```bash
manus-mcp-cli tool call update_issue --server linear --input '{
  "id": "VOI-50",
  "state": "Done"
}'
```

## 关键原则

1.  **先创建 Issue，再分派任务**：所有开发工作必须基于一个明确的 Linear Issue。
2.  **完整的交付闭环**：每个任务完成后，必须在 Linear 中关联 GitHub commit，并更新状态。
3.  **标准化的 Prompt**：分派任务时，`prompt` 必须引用 Linear Issue URL，确保执行 Agent 理解任务上下文。
4.  **双连接器启用**：Manus API 调用时，必须同时启用 `github` 和 `linear` 连接器。

## 参考资料

*   `docs/.knowledge/PM_AGENT_README.md` - 项目管理 Agent 必读
*   `docs/.knowledge/EXECUTION_AGENT_README.md` - 执行 Agent 必读
*   `docs/HANDOVER_DOCUMENT.md` - 项目交接文档
*   `scripts/dispatch_task.py` - 任务分派脚本
