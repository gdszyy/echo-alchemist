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
MANUS_API_KEY = "sk-Uoa0Zeqa00SJseTT2HouC5azQ0QjIBgNeu4xo7Mb0Z7zyGPWo-XW4e9XYbXcnX6hAi4GXALz1zknai2QFx42pqPjtlf2"

# 连接器 ID
CONNECTOR_IDS = {
    "linear": "982c169d-0c89-4dbd-95fd-30b49cc2f71e",
    "github": "bbb0df76-66bd-4a24-ae4f-2aac4750d90b"
}

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
        "agentProfile": "manus-1.6",
        "taskMode": "agent",
        "connectors": [CONNECTOR_IDS["github"], CONNECTOR_IDS["linear"]]
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
        issue_id="VOI-60",
        issue_url="https://linear.app/voidzyy/issue/VOI-60/紧急-修复-vite-构建错误：缺少-terser-依赖",
        issue_title="[紧急] 修复 Vite 构建错误：缺少 terser 依赖",
        issue_description="""
## 任务描述

修复 Vite 构建错误：缺少 terser 依赖。

## 原文件位置

* 文件: `docs/reference/echoAlchemistV2.0.original.html`* 文件: \`package.json\`
## 关键功能
* 在 \`package.json\` 的 \`devDependencies\` 中添加 \`terser\`。
* 运行 \`npm install\` 或 \`pnpm install\` 安装依赖。
* 验证 \`npm run build\` 能够成功构建。# 验收标准1. \`package.json\` 中包含 \`terser\` 依赖
2. 保持与其他模块的正确导入关系
3. 游戏可正常运行

## 参考

* GitHub: https://github.com/gdszyy/echo-alchemist
* 交接文档: `docs/HANDOVER_DOCUMENT.md`
"""
    )
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
