# Echo V3 — 经营开放世界肉鸽：世界模拟器

Echo V3 是一个以**晶石为核心资源、中世纪背景**下的经营 + 开放世界肉鸽游戏。其核心目标是构建一个**自发产生故事**的世界模拟器：各个部落之间的迁徙与发展、经济与商路的自动连接，最终涌现出一个完整的"社会"——所有故事都能追溯到关键个人的动机与经历。

本仓库是 Echo V3 的**设计研究与规划仓库**，基于 [echov2](https://github.com/gdszyy/echo-alchemist-v2-1766564886) 的世界观设定与子弹系统，重构世界为一个四层社会模拟系统。

---

## 世界观核心

大部分情况下人类都是灭绝的，每次只有少部分人类通过**复制人机制**重生重建文明。因此模拟的人数相对较少：大部分部落是不具备复杂智慧的**生物部落**（只有生存需求、资源需求、认首领、划领地），少数**人类**通过四层社会模拟精细运转。

---

## 四层社会模拟架构

| 层级 | 颗粒度 | 核心机制 |
|------|--------|----------|
| **个体层** | 单个人/生物 | 需求驱动决策、AI 调用、常识/信念系统 |
| **团体层** | 小团体/部落 | 权力基础与合法性、目标驱动聚合、裂变机制 |
| **城市层** | 聚落/城市 | 晶石经济、商路自动连接、中心地理论 |
| **世界层** | 势力/文明 | 地缘政治、迁徙、通信延迟、灭绝-重建闭环 |

---

## 文档结构

```
docs/
├── v3_design/          # 系统设计与验收标准（各模块的涌现目标）
│   ├── echo_v3_research_and_todo.md
│   ├── echo_v3_module_acceptance_criteria.md
│   ├── echo_v3_belief_system_criteria.md
│   ├── echo_v3_group_decision_criteria.md
│   ├── echo_v3_economy_criteria.md
│   ├── echo_v3_geopolitics_criteria.md
│   ├── echo_v3_retroactive_backstory_criteria.md
│   ├── echo_v3_society_simulation_plan.md
│   └── echo_v3_leadership_followership_criteria.md  # 领导-追随关系模型验收标准
└── v3_research/        # 各领域调研原始笔记
    ├── research_notes.md
    ├── research_notes_belief.md
    ├── research_notes_group.md
    ├── research_notes_retroactive.md
    └── research_notes_leadership_followership.md    # 领导-追随关系模型调研笔记
```

---

## 当前阶段：预研调研期

正在针对各个模拟层面进行系统性的学术与工程调研，产出各模块的"涌现目标验收标准"。所有标准以"这个模型放入游戏后，世界会涌现出什么社会现象"为尺度，而非代码实现规范。

### 待办（调研）

- [x] 深入调研各类组织/政治体制类型 → 收敛为「领导-追随关系模型」（生产资料/武力/人情债/路径依赖/认可五分量加权合力，普适于任意尺度）
- [ ] 调研晶石经济与商路的具体模型（ACE 经济体 ABM、中心地理论、引力模型的可行性验证）
- [ ] **重新调研 L3/L4 模型**：当前世界观下人口不会大幅增长，最大规模为“一张地图多个部落/小镇”级别，大城市级别的复杂体制治理不适用。需采用适配“部落/小镇尺度 + 生产资料—权—武力三角”的政治人类学模型（队群/部落/酋邦制/大人物制等），重写 echo_v3_economy_criteria.md 和 echo_v3_geopolitics_criteria.md
- [ ] 调研"故事"的形式化定义与筛选机制（Story Sifting 原型验证）
- [ ] 调研 AI API 在个体决策中的输入/输出规范（与常识/信念系统的接口设计）

---

## 关联仓库

- **[echov2](https://github.com/gdszyy/echo-alchemist-v2-1766564886)**：前身，包含成熟的四层世界模拟器（地幔/气候/晶石/生物）、子弹/属性系统（火冰雷激光等属性层、符文、遗物）。V3 将在此基础上重构社会模拟层。
