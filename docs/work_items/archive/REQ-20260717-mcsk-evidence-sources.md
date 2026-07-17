# REQ-20260717-mcsk-evidence-sources：固定 MCSK 跨仓研究证据

- 状态：Archived
- 负责人：Codex
- 最后更新：2026-07-17 15:31 +08:00
- 当前里程碑：M5 已完成

## 目标

在独立分支中发布 `echo-reforged-design` 实际引用的八份 `v3_research` 笔记版本，使其可由固定 commit URL 与提交内容 SHA-256 复验。

## Owner 授权

- 2026-07-17，Owner 选择跨仓证据方案 1。
- 授权把八份实际引用版本形成独立 evidence commit 并 push 到远程。
- 授权 `echo-reforged-design` 按该固定 commit 引用这些内容。
- 本授权不运行实验、不授权生产实现，也不扩展为源仓其他内容的通用许可证。

## 范围

允许修改：

- 八份 `docs/v3_research/research_notes*.md` 的已授权快照；其中相对 `origin/main` 实际产生 3 个新增文件和 2 个更新文件。
- `.cursor/rules/v3_research.md` 的对应文档索引。
- `.gitattributes` 对分工笔记中 3 处既有 Markdown 硬换行作精确路径声明；另设独立审计只允许这 3 行。
- 本请求卡及其收口归档位置。

不处理：

- 源仓主工作树中的其他 modified/untracked 内容。
- 代码、模型、机制、阈值、实验或运行产物。
- `echo-reforged-design` 的 prereg freeze commit；该决策仍须单独请求。

## 必读入口

- `AGENTS.md`
- `.cursor/rules/global.md`
- `.cursor/rules/v3_research.md`
- `TODO.md`（当前不存在）
- `docs/p0_interaction_optimization_todo.md`（当前不存在）

## 影响面

- 代码：不涉及。
- 文档：八份研究笔记快照、研究模块索引、请求卡。
- 测试：静态路径、严格 UTF-8、提交内容 SHA-256、分支与远程可达性检查。

索引与进度账本：

- auto_index：不涉及；未修改代码或生成索引目标。
- 模块规范：涉及；同步 `.cursor/rules/v3_research.md`。
- TODO/进度大盘：不涉及；约定文件不存在。
- process_insights：不涉及；未发现机制或实现耦合。
- 资产索引/manifest：不涉及。

## 里程碑

- [x] M0 需求澄清：Owner 已授权发布、push 与固定 commit 引用。
- [x] M1 方案确认：从 `origin/main` 建立隔离工作树，不污染主工作树。
- [x] M2 实现完成：八份来源快照和模块索引完成。
- [x] M3 验证完成：路径、UTF-8、SHA-256、Git diff 与远程可达性通过。
- [x] M4 索引同步：模块索引完成，其他同步项明确不涉及。
- [x] M5 收口归档：请求卡归档；隔离工作树在治理提交 push 后移除。

## 验收标准

- commit tree 中八份文件均存在，且内容与授权源快照一致（Git 规范化换行后）。
- 提交只包含本卡列明的研究证据、模块索引和治理记录。
- `git diff --check`、严格 UTF-8 与 Markdown 本地路径检查通过。
- evidence branch push 后，远程 ref 精确指向该 commit。
- `echo-reforged-design` 可使用固定 commit URL，并记录每份提交内容的 SHA-256。

## 验证证据

- evidence commit：`13598bf0f01eddac4f5648683d25a009cd6eb98a`
- parent：`17ee5c5f0fb52569462178385667192188d6e20c`（创建隔离分支时的 `origin/main`）
- remote ref：`refs/heads/codex/req-20260717-mcsk-evidence-sources` 已精确指向 evidence commit。
- commit path closure：7 个文件；5 个研究笔记 delta、研究模块索引、精确 whitespace 属性。
- 8/8 笔记与 Owner 授权源快照在 Git 换行规范化后完全一致。
- staged UTF-8：7/7；conflict marker：0；missing local link：0。
- 首次 `git diff --cached --check` 精确发现 3 处 Markdown 双空格硬换行；加入精确路径属性后 exit 0，独立审计仍只允许第 9、10、282 行各两个空格。

| 提交内容路径 | SHA-256 |
| :--- | :--- |
| `docs/v3_research/research_notes.md` | `aa5f0649945192bf69a5c7954955b1b63435d84db48cce71c75f9c3ec26113b2` |
| `docs/v3_research/research_notes_belief.md` | `89d1c8839a925b54e7a14157c71e53acf073af04c5f0df4aff318493a696ec8c` |
| `docs/v3_research/research_notes_economy_trade.md` | `0ae5dff974a8a6050385cb2d383a6cde36ecf74ff1316c32e65a8f9dec815e2d` |
| `docs/v3_research/research_notes_group.md` | `848454c64333aa5d7f75f6b9075c697b57c7bd4f5bc82a86c5c432fd956d8997` |
| `docs/v3_research/research_notes_leadership_followership.md` | `8268961f5612dba548ab7f9fc841f04d13166718b9082d14c96497ad829507ca` |
| `docs/v3_research/research_notes_retroactive.md` | `c8acee182c61526f4ee8618718e723627454af46480e2713ad9ce12dd0c9f9fe` |
| `docs/v3_research/research_notes_social_division_of_labor.md` | `a166fd54027413ef276f202a7325792bd137df0052ce06ced2373636991a43e8` |
| `docs/v3_research/research_notes_story_sifting.md` | `4a4e49690100caba3ae968ba41f30b1ea46c51602dc42a7b4a90e5664f28a764` |

## 当前进度记录

| 时间 | 阶段 | Codex 动作 | 结果 | 下一步 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-07-17 15:24 +08:00 | Implementing | 从 `17ee5c5f0fb52569462178385667192188d6e20c` 创建隔离分支并复制八份授权来源 | 主工作树未被修改；隔离分支产生预期的 3 新增、2 更新 | 同步索引并验证 |
| 2026-07-17 15:27 +08:00 | Verifying | 首次 staged whitespace 检查 | 仅发现分工笔记第 9、10、282 行的 3 处原始 Markdown 双空格硬换行；保留失败证据，不改授权快照 | 加入精确属性并运行独立行级审计 |
| 2026-07-17 15:29 +08:00 | Verifying | 创建并审计 evidence commit | 8/8 内容匹配；提交路径闭包、UTF-8、链接与 whitespace 审计通过 | push 独立分支 |
| 2026-07-17 15:31 +08:00 | Archived | push 并核对远程 ref | 远程精确指向 `13598bf0…`；请求卡归档 | 由消费仓固定链接并复验 |
| 2026-07-17 15:32 +08:00 | Archived | 治理卡 staged whitespace 检查 | 定位并移除 5 处非源快照的 Markdown 双空格换行；未新增例外 | 复跑治理提交闸门 |

## 收口清单

- [x] 无未归属临时文件
- [x] 无错误/过期文档留在活跃入口
- [x] 所有索引已更新或明确无需更新
- [x] 验证证据已记录
- [x] TODO / 需求大盘不存在，已明确无需同步
- [x] 用户可从本卡看懂当前阶段、剩余工作和验收证据
