#!/usr/bin/env python3
"""
Echo Alchemist - 任务分派脚本
用于项目管理 Agent 通过 Manus API 分派开发任务
"""

import os
import requests
import json

# Manus API 配置
MANUS_API_BASE = "https://api.manus.ai/v1"
MANUS_API_KEY = os.environ.get("MANUS_API_KEY")

if not MANUS_API_KEY:
    raise ValueError("请设置环境变量 MANUS_API_KEY")

def dispatch_task(issue_id: str, issue_url: str, issue_title: str, issue_description: str):
    """
    分派一个开发任务到 Manus Agent
    
    Args:
        issue_id: Linear Issue ID (如 VOI-50)
        issue_url: Linear Issue URL
        issue_title: Issue 标题
        issue_description: Issue 详细描述
    
    Returns:
        dict: Manus 任务响应
    """
    
    # 构造 prompt
    prompt = f"""
任务：完成 Linear Issue {issue_id} 的开发工作。

**Linear Issue**: {issue_url}
**任务标题**: {issue_title}

## 任务详情

{issue_description}

## 工作流程

1. 克隆 GitHub 仓库: `gh repo clone gdszyy/echo-alchemist`
2. 精确提取源文件中指定行号的代码
3. 在目标文件中重构为 ES6 模块
4. 更新相关的索引文件和入口文件
5. 提交代码并推送到 GitHub
6. 在 Linear Issue {issue_id} 下添加评论，包含 commit hash 和 GitHub commit URL
7. 将 Linear Issue {issue_id} 状态更新为 "Done"

## 重要提醒

- 必须严格遵循 `docs/.knowledge/EXECUTION_AGENT_README.md` 中的开发规范
- 提交信息必须遵循 Conventional Commits 格式
- 完成后必须在 Linear 中关联 GitHub commit
"""
    
    # 构造请求
    payload = {
        "prompt": prompt,
        "agentProfile": "manus-1.6-max",
        "taskMode": "agent",
        "connectors": ["github", "linear"]
    }
    
    headers = {
        "API_KEY": MANUS_API_KEY,
        "Content-Type": "application/json"
    }
    
    # 发送请求
    response = requests.post(
        f"{MANUS_API_BASE}/tasks",
        headers=headers,
        json=payload
    )
    
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    # 示例：分派 VOI-50 任务
    result = dispatch_task(
        issue_id="VOI-50",
        issue_url="https://linear.app/voidzyy/issue/VOI-50/高优先级-迁移-game-类到模块化结构",
        issue_title="[高优先级] 迁移 Game 类到模块化结构",
        issue_description="""
## 任务描述

将原始 HTML 文件中的 Game 类迁移到 `src/core/Game.js`。

## 原文件位置

* 文件: `docs/reference/echoAlchemistV2.0.original.html`
* 行号: 5643-9571

## 关键功能

* 游戏主循环
* 状态管理
* 阶段切换 (选卡/收集/战斗/遗物)
* 输入处理

## 验收标准

1. Game 类完整迁移
2. 保持与其他模块的正确导入关系
3. 游戏可正常运行

## 参考

* GitHub: https://github.com/gdszyy/echo-alchemist
* 交接文档: `docs/HANDOVER_DOCUMENT.md`
"""
    )
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
