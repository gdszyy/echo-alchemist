# AGENTS.md — Echo V3 全局路由 (Layer 0)

本文件是 Echo V3 仓库的**全局导航入口**，供所有 Agent 在开始任何任务前首先阅读。

## 仓库定位

Echo V3 是一个"自发产生故事的世界模拟器"设计研究仓库。当前处于**预研调研期**，仓库内容全部为设计文档与调研笔记，尚无可运行代码。

## 快速定位

| 你的目标 | 应读文件 |
|----------|----------|
| 了解整体架构与四层社会模拟 | `README.md` → `docs/v3_design/echo_v3_module_acceptance_criteria.md` |
| 了解各模块的涌现目标验收标准 | `docs/v3_design/` 目录下各 `*_criteria.md` |
| 查阅某领域的调研原始笔记 | `docs/v3_research/` 目录下对应笔记 |
| 查看待办调研任务 | `docs/v3_design/echo_v3_research_and_todo.md` |
| 了解常识/信念/偏见/传说系统 | `docs/v3_design/echo_v3_belief_system_criteria.md` |
| 了解团体决策/权力/裂变系统 | `docs/v3_design/echo_v3_group_decision_criteria.md` |
| 了解反向推演（懒提级）系统 | `docs/v3_design/echo_v3_retroactive_backstory_criteria.md` |
| 查阅模块规范（Cursor 规则） | `.cursor/rules/` 目录 |

## 模块索引

| 模块 | 路径 | 规范文件 | 职责 |
|------|------|----------|------|
| v3_design | `docs/v3_design/` | `.cursor/rules/v3_design.md` | 系统设计与各模块涌现目标验收标准 |
| v3_research | `docs/v3_research/` | `.cursor/rules/v3_research.md` | 各领域调研原始笔记（学术 + 工程参考） |

## 核心原则

1. **验收标准优先于实现**：所有 `*_criteria.md` 文件定义的是"模型放入游戏后世界应涌现出什么"，不规定具体实现方式。
2. **调研先于设计**：在产出任何具体游戏机制设计前，必须先完成对应领域的调研，并在 `v3_research/` 中留存笔记。
3. **故事可追溯性**：所有系统设计的终极目标是"任何一件世界中发生的事，都能追溯到具体的人和动机"。
