# 世界模拟器 · 领域调研笔记（原始素材）

> 本文件用于沉淀各领域调研发现，最终汇总为以"调研/研究任务"为主体的 Todo 文档。

---

## 领域一：个体行为与认知建模（Individual Behavior & Cognition）

### 1. Agent-Based Modeling (ABM) / Individual-Based Models (IBM)
- 定义：模拟自治 agent 的行为与交互以理解系统涌现行为；结合博弈论、复杂系统、涌现、计算社会学、多智能体系统、进化编程。生态学里称 IBM。
- 核心五要素：①多尺度 agent（agent-granularity）②决策启发式 ③学习/适应规则 ④交互拓扑 ⑤环境。
- 关键理念：bounded rationality（有限理性），agent 用启发式/简单规则行动；微观规则→宏观涌现。
- 历史里程碑模型（重要参考）：
  - **Schelling 隔离模型 (1971)**：微观个人偏好→宏观隔离涌现，ABM 鼻祖。
  - **Conway 生命游戏 / von Neumann 元胞自动机**：CA 是 echov2 world_sim 已用的范式。
  - **Reynolds Boids (flocking)**：分离/对齐/聚合三规则→群体运动，artificial life。
  - **Axelrod 囚徒困境锦标赛**：策略演化、合作涌现、文化传播 ABM（政治学）。
  - **Sugarscape (Epstein & Axtell, 1996)**：人工社会，模拟季节迁徙、污染、繁殖、战斗、疾病、文化传播——与本项目"部落迁徙+资源"高度对口。
  - **Kathleen Carley**：社会网络与文化共演化 ABM。
  - **Ron Sun**：cognitive social simulation，把人类认知模型作为 ABM 基础。
  - **2020+ LLM agents（Generative Agents, Stanford "Smallville"）**：语言模型 agent 在沙盒中规划生日会、选举等——少量核心人物精细化模拟的现代范式。
- 分类：reactive agents（反应式）vs deliberative/cognitive agents（基于心智状态的复杂动作选择）。
- 工具平台：NetLogo、Swarm、Repast、MASON、GAMA、Mesa(Python)。

### 2. BDI（Belief–Desire–Intention）认知架构
- 来源：Bratman 的人类实践推理理论；分离"选计划"与"执行计划"。
- 三要素：Belief（对世界的信念，可不为真）/ Desire（动机目标）/ Intention（已承诺执行的计划）。
- 扩展：BOID（加 Obligation/规范义务，用于社会环境）；LORA（加行动逻辑，可推理多 agent 通信）。
- 解释器循环：option-generator→deliberate→update-intentions→execute→get-events→drop-failed/impossible。
- 局限（重要）：①缺学习机制 ②不显式支持多 agent 交互 ③逻辑模型不易计算 ④无前瞻规划。
- 实现：PRS、Jason/AgentSpeak、Jadex、GOAL、2APL、JACK 等。

### 3. 游戏 AI 行为决策范式（工程实践层）
- **FSM（有限状态机）**：最简单。
- **Behavior Tree（行为树）**：模块化、可组合，游戏业界主流。
- **GOAP（Goal-Oriented Action Planning）**：给规划器一组动作+前置/效果，运行时搜索动作序列达成目标（F.E.A.R. 起家）。
- **Utility AI（效用 AI）**：为每个候选行为打效用分，按分选择；适合"需求驱动"的生活模拟（The Sims 的 needs 系统）。
- 业界常见组合：Utility 选目标 → GOAP 规划 → BT 执行。
- 与本项目关联：个人颗粒度的"生存需求/欲望"驱动，可参考 Maslow 式需求层级 + Utility AI；少数核心人物可上 BDI 或 LLM agent。

### 待深入
- The Sims 的 needs/utility 模型细节；Maslow 需求层级在 ABM 中的形式化。
- Generative Agents（Stanford）记忆-反思-规划架构论文细节。
- PECS、Soar、ACT-R 等认知架构与 ABM 的结合。

### 4. 现代认知范式补充
- **Generative Agents (Stanford, Park et al. 2023, arXiv:2304.03442)**：LLM 驱动的可信人类行为模拟。核心架构三件套——**Memory Stream（记忆流，带 recency/importance/relevance 检索）→ Reflection（反思，把记忆抽象成更高层洞察）→ Planning（规划，自顶向下分解日程）**；反思与计划回写记忆流影响未来行为。适合"少数核心人物精细化"。
- **The Sims 的 Utility/Needs AI（needs-based AI）**：
  - 动机（motives）：饥饿/卫生/膀胱/精力/娱乐/社交/舒适/房间，[-100,+100]，随时间衰减。
  - **"广告（advertisements）"机制**：物体/对象向 agent 广播自己能满足的需求增量，agent 据当前需求加权打分排序——把行为知识放在环境对象上而非 agent，极易扩展（灵感来自 SimAnt 信息素）。
  - 各需求用**独立效用曲线**（饥饿用凸曲线，吃饱后趋零；社交/娱乐越满越想要，呼应 Maslow 层级）。
  - 个性/特质（traits）影响打分；Sims 3 把特质做成"额外动机"加入需求池。
  - **从 top-N 随机选**而非永远选最优——避免机械可预测。
  - 社交情境用"临时动机"模拟（进健身房临时获得"健身"动机）。
  - 对话/社交用 **production rules（产生式规则，按特异性排序取最高）** 硬编码兜底。
- **经典符号认知架构**：Soar、ACT-R、CLARION、DUAL/PECS——可作"少数核心人物"高保真心智的理论参照（生产式记忆、声明性/程序性记忆分离）。

### 个体层可参考模型总表（待写入 Todo）
| 范式 | 代表 | 适用颗粒度 | 特点 |
|------|------|-----------|------|
| 反应式规则 / CA | Boids、生命游戏 | 大量野怪/生物部落 | 极廉价，涌现群体行为 |
| Utility/Needs AI | The Sims | 普通人类个体 | 需求驱动、环境广告、易扩展 |
| BT / GOAP / FSM | F.E.A.R.、游戏业界 | 个体行动执行 | 可组合、可规划 |
| BDI | PRS/Jason | 少数关键人物 | 信念-欲望-意图、社会义务(BOID) |
| 符号认知架构 | Soar/ACT-R | 极少数主角级 | 高保真记忆与推理 |
| LLM Generative Agent | Stanford Smallville | 故事核心人物 | 记忆-反思-规划、可信涌现 |

---

## 领域二：社会关系网络与小团体动态（Social Networks & Group Dynamics）

### 1. 社会网络分析（SNA）与连边形成机制
- **Homophily（同质性，McPherson 2001 "Birds of a Feather"）**：相似的人优先成边（婚姻、友谊、工作、建议、支持、信息传递皆受其结构化）。两种机制：**Selection（选择，相似→成边）** 与 **Influence/Socialization（影响，成边→趋同）**——二者形成反馈回路。
- **网络生成模型**：Social Distance Attachment (SDA)、configuration model、preferential attachment（Barabási–Albert 无标度网络）、small-world（Watts–Strogatz）。
- **SNA 度量**：中心性（度/介数/接近/特征向量）→ 可识别"关键人物/掮客/桥"，正好对应"对核心故事有间接关系的人"的筛选。
- 与项目关联：用同质性 + 距离衰减决定个体间好感连边；用中心性自动识别值得精细化模拟的人。

### 2. 信任与声誉模型（Trust & Reputation, 多智能体系统）
- 综述：Pinyol & Sabater-Mir《Trust and Reputation Models for MAS》（ACM Computing Surveys）。
- **FIRE 模型**：整合四类信息源——**interaction trust（直接交互经验）、role-based trust（基于角色/关系的先验）、witness reputation（第三方见证）、certified reputation（自带认证推荐）**；开放系统中能选到更好交互伙伴、能响应环境变化。
- **ReGreT**：直接信任 + 见证声誉 + 见证可信度评估（防虚假评价）。
- 经典：EigenTrust（P2P 声誉传播）、Beta Reputation System（基于 Beta 分布的评价聚合）。
- 与项目关联：团体内信任/背叛、商队是否守信、跨城市口碑传播。

### 3. 联盟/合作形成（Coalition Formation, 合作博弈论）
- 合作博弈论把"联盟"当作基本行为单位；核心概念：characteristic function（联盟价值）、**the Core（核）、Shapley value（夏普利值，公平分配）、nucleolus**。
- ABM 方法：用 agent-based simulation 研究联盟形成动态与何种理性导向均衡（JASSS 24/1/6；agencies method）。
- 与项目关联：小团体如何结成、城市如何结盟成势力、利益（晶石）如何分配决定联盟稳定性与分裂。

### 4. 其他可参考社会动力学模型
- **意见动力学**：Axelrod 文化传播模型、Bounded Confidence（Deffuant、Hegselmann–Krause）——可模拟信仰/谣言/文化趋同。
- **Granovetter 阈值模型**：集体行动/暴动的临界点（个体行动取决于已行动人数比例）——可作"剧烈震荡/暴乱"触发判定。
- **Dunbar's number**：~150 的稳定社会关系上限——为"小团体"规模与人类精细模拟数量提供经验上界。

### 社会关系层可参考模型总表（待写入 Todo）
| 子问题 | 可参考模型 |
|--------|-----------|
| 关系连边如何形成 | Homophily(选择/影响)、SDA、preferential attachment |
| 谁值得精细模拟 | SNA 中心性（介数/特征向量）、Dunbar 上限 |
| 信任与背叛 | FIRE、ReGreT、EigenTrust、Beta Reputation |
| 联盟与分配 | 合作博弈(Core/Shapley/nucleolus)、coalition ABM |
| 文化/谣言/信仰 | Axelrod 文化、Bounded Confidence 意见动力学 |
| 集体行动/暴动触发 | Granovetter 阈值模型 |

---

## 领域三：城市/聚落、经济、资源与商路（Economy, Settlement & Trade）

### 1. 经济体 ABM —— Agent-Based Computational Economics (ACE)
- 代表：Leigh Tesfatsion（Iowa State）。把经济建模为"自下而上、开放式、局部建构的序贯博弈"。
- 七条建模原则（c-ABM, MP1–MP7）：agent 定义、agent 范围（可含生命体/社会组织/制度/物理现象）、局部建构性、自治性、系统建构性、系统历史性、建模者只设初值后观察（培养皿实验范式）。
- 关键能力：agent 可被其他 agent 吸纳为组件、可分裂、可创建/销毁（用进化算法建模生灭）——与"复制人重生/部落生灭"高度契合。
- 经典源头：**Sugarscape（资源/糖-香料贸易）**、Santa Fe 人工股票市场、Epstein "growing artificial societies"。
- 工具：NetLogo、Mesa、MASON、JASMINE 等。

### 2. 中心地理论（Central Place Theory, Christaller 1933）
- 解释聚落的数量/规模/区位：聚落按其提供的商品服务等级形成层级。
- 两个核心概念：**Threshold（门槛人口/需求，维持某商品所需的最小市场）** 与 **Range（range，消费者愿意为某商品旅行的最大距离）**。
- 规律：聚落越大越少、越大间距越远、越大功能越多越专门化；高阶商品 range 更大。
- 几何：理想各向同性平面上聚落形成六边形/三角格网；K=3（市场原则，最小化出行距离）、K=4（交通原则，聚落沿主干道排列，最小化道路长度）、K=7（行政原则，下级完全嵌入上级）。
- 局限：静态、对工业/后工业不适用、受地形/历史扭曲——Veneris (1984) 提出从"中世纪均匀城镇→工业层级城市→后工业"的动态演化版本（正好契合中世纪背景）。
- 与项目关联：城市自动分级、商品按 range 决定贸易半径、地形扭曲格网；echov2 的 terrainMoveCost 正可替代"距离"。

### 3. 贸易/物流网络模型
- **引力模型（Gravity Model of Trade）**：双边贸易流 ∝ 两地"质量"（人口/产出）乘积 / 距离的幂——简单且经验上极稳健，可直接驱动城市间晶石/物资流量。
- **Gravity chains**：当存在中间品/零部件贸易（多段供应链）时标准引力模型需修正——对应"商路上的多级中转贸易"。
- **供应链/物资流仿真**：bullwhip effect（牛鞭效应）、库存-订货策略；可做物资短缺与价格波动。
- **空间均衡 / spatial price equilibrium**：套利使各地价格趋于"价差≤运输成本"——决定商队何时有利可图。

### 4. 经典经济地理与区位理论补充
- **Von Thünen 孤立国模型**：围绕市场的同心农业土地利用圈（运输成本决定作物布局）——可用于城市周边资源采集圈。
- **Krugman 新经济地理（New Economic Geography）**：规模报酬递增 + 运输成本 → 产业集聚与核心-边缘结构涌现。

### 城市/经济层可参考模型总表（待写入 Todo）
| 子问题 | 可参考模型 |
|--------|-----------|
| 经济自下而上涌现 | ACE (Tesfatsion)、Sugarscape、SFI 人工股市 |
| 城市数量/规模/层级 | 中心地理论(Threshold/Range/K值)、Veneris 动态CPT |
| 城市间贸易流量 | 贸易引力模型、Gravity chains、空间价格均衡 |
| 城市周边资源圈 | Von Thünen 同心圈 |
| 产业集聚/核心-边缘 | Krugman 新经济地理 |
| 物资短缺与价格 | 供应链仿真、牛鞭效应、库存策略 |

---

## 领域四：世界/势力层 —— 地缘政治、人口迁徙与通信传播

### 1. 地缘政治 / 势力边界的 ABM
- **Cederman / Axelrod 谱系**："finite-agent method"，把国家/民族作为叠加在底层 agent/文化特质网格上的高层结构——势力边界由底层涌现，而非硬编码（正契合"城市自动结盟成势力"）。
- **Axelrod 文化传播 + 帝国兴衰**：tribute model（进贡模型）模拟联盟、战争与帝国的聚散周期。
- **JASSS 21/3/4**：把国家当 agent，研究正式防御同盟的连锁后果（同盟→集团对抗）。
- **AGILE / SoarTech**：地缘政治冲突的可执行领导人决策 ABM。
- 与项目关联：势力范围、外交同盟、帝国兴衰周期皆可自下而上涌现。

### 2. 人口迁徙模型（Migration）
- 综述：Klabunde & Willekens (2016) ABM of Migration。
- **宏观传统**：gravity model of migration（迁徙量 ∝ 两地人口积 / 距离），及其演化的 spatial interaction models。
- **Lee 的推拉理论（push-pull, 1966）**：origin 推力 + destination 拉力 + intervening obstacles（中间阻碍）+ 个人因素。echov2 迁徙者"按温度贪婪移动 + 地形阻力"已是其雏形。
- **微观决策理论**：random utility theory / discrete choice model（离散选择）、theory of planned behaviour（计划行为理论）、value-expectancy。
- **网络驱动迁徙（关键）**：社会网络传递目的地信息与就业机会、提供社会资本（路费/落脚），使迁徙路径依赖、自我强化——可把迁徙与社会关系层耦合。
- 与项目关联：部落/复制人迁徙的目的地选择、链式迁徙、难民潮（灭绝后幸存者流动）。

### 3. 信息 / 通信传播（Information Diffusion & Contagion）
- 三要素：Sender / Receiver / Medium（信使、口耳、市集告示）。
- 两大类模型：
  - **创新扩散（Diffusion of Innovation, Rogers）**：含 awareness→interest→decision→trial→adoption 五阶段；早期采用者、意见领袖、boundary spanners/bridges 跨社区传播。
  - **传染/流行病模型（SIR/SIS）**：susceptible-infected-recovered，可建模谣言、信仰、瘟疫、恐慌。
- **阈值模型 / 信息级联（Granovetter / Independent Cascade / Linear Threshold）**：节点在邻居影响超阈值后被激活——可建模暴动、信仰浪潮、技术普及。
- **关键结构**：介数中心性高的"桥"控制跨社区传播；通信延迟受地形/距离影响（中世纪信使）。
- 与项目关联：势力指令/情报/谣言的传播与延迟，边境"将在外君命有所不受"、瘟疫与信仰扩散。

### 世界/势力层可参考模型总表（待写入 Todo）
| 子问题 | 可参考模型 |
|--------|-----------|
| 势力边界/同盟涌现 | Cederman finite-agent、Axelrod 文化/进贡模型 |
| 帝国兴衰周期 | Axelrod tribute model、冲突 ABM |
| 迁徙量（宏观） | 迁徙引力模型、空间交互模型 |
| 迁徙决策（微观） | 推拉理论、离散选择、计划行为理论、网络驱动迁徙 |
| 情报/谣言/信仰传播 | 创新扩散(Rogers)、SIR/SIS、独立级联/线性阈值 |
| 通信延迟 | 基于地形/距离的信使传播、介数中心性桥 |

---

## 领域五：涌现叙事 / 故事生成与世界模拟游戏工程实践

### 1. 故事的"定义"与提取 —— Story Sifting / Drama Manager（最关键，直接回答用户的"故事单位"问题）
- **Emergent Narrative（涌现叙事）**：故事不预写，而由底层模拟的实体互动涌现，再由系统"发现并讲述"。
- **Story Sifting（故事筛选，Ryan / Kreminski 等）**：在海量模拟事件历史中，用**可组合的模式（story sifting patterns）** 去匹配"具备戏剧性的事件序列"。这正是把"什么算一个故事"工程化：定义一组模式（如"背叛""复仇""崛起后陨落"），引擎在事件流里搜寻满足模式的子序列并标记为一个 story。
  - 代表系统：**Felt / StoryAssembler / Sheldon / Why Are We Like This?**（Kreminski & Wardrip-Fruin）。
- **Drama Manager（戏剧管理器）**：全知系统，动态引导/塑造故事走向（如经典 **Façade**、search-based DM、**Aldabra（遗传算法非确定性 DM）**）。可对应用户提到的"反向推导剧情/控制爽点密集度"。
- **Quality-Based Narrative（QBN，Failbetter/Fallen London）**：用"品质（quality）"状态 + 触发条件门控叙事卡片，是较轻量、可工程化的故事调度框架。
- **"故事边界"的可操作定义（综合）**：一个 story = 在事件流中，由一次**显著扰动（significant perturbation，状态突变超阈值）** 触发、围绕一个或少数 **focal entity（焦点实体）** 展开、其影响**传播到更高聚合层（团体/城市/势力）** 并最终**回落到新稳态**的事件子序列。开始=扰动越阈值；结束=影响衰减回稳态或达成新均衡。这与领域二的 Granovetter 阈值、领域四的扩散模型天然耦合。

### 2. Dwarf Fortress —— 历史/编年史式涌现叙事
- 世界生成阶段先跑数百年历史模拟（文明兴衰、战争、传说生物、神器、人物谱系），生成 legends/编年史。
- 角色刻画靠大量属性 + 关系 + 记忆 + 情绪，玩家在 ASCII 抽象表现上"脑补"出故事（characterization & emergent narrative 研究主题）。
- 启示：先生成深厚历史再开局；抽象表现 + 丰富底层状态 = 玩家自发叙事。

### 3. Caves of Qud —— 分阶段世界+故事联合生成
- Brian Bucklew & Jason Grinblat（Freehold Games）。核心范式：
  - **静态骨架 + 程序化包裹（static backbone wrapped in procedural world）**：手作核心剧情/城镇承载世界观，程序化生成荒野/地牢/历史/传说。
  - **分阶段联合生成（world + story in stages）**：先生成通用世界，再在其上分阶段生成历史与任务（CEUR Vol-3217 paper12 专门讨论"combined world and story PCG"）。
  - **Entity-Component 架构**：组件化让"可能性空间"自下而上涌现出设计者预想不到的故事。
  - 强调"process 与 culture 的耦合"——自然行为如何被智慧生物升华为文化/仪式（对应少数智慧人类 vs 大量生物部落）。

### 4. RimWorld —— AI Storyteller（叙事导演）
- 三位 Storyteller（Cassandra 渐进式、Phoebe 平缓、Randy 随机）作为 **AI Director**，依据玩家当前状态（财富/人口/历史）动态调度事件强度与节奏——典型的"节奏控制 + 反向触发事件"。可直接对应用户的"爽点密集度/故事阶段"控制。

### 5. LLM 驱动的交互戏剧（前沿，呼应核心人物精细化）
- LLM-based interactive drama：多智能体 LLM 生成自适应叙事；与领域一 Generative Agents（记忆-反思-规划）一脉相承。适合"对核心故事有直接关系的少数人"做高保真演出，与底层规则模拟分层。

### 叙事/故事层可参考模型总表（待写入 Todo）
| 子问题 | 可参考模型/系统 |
|--------|-----------------|
| 如何定义/发现一个"故事" | Story Sifting patterns、Felt/Why Are We Like This |
| 故事节奏与爽点控制 | Drama Manager、RimWorld Storyteller、Aldabra、QBN |
| 先生成历史再开局 | Dwarf Fortress 历史模拟、Caves of Qud 分阶段生成 |
| 手作核心 + 程序化包裹 | Caves of Qud static backbone |
| 底层状态驱动脑补叙事 | DF 属性/关系/记忆 + 抽象表现 |
| 核心人物高保真演出 | Generative Agents、LLM interactive drama |
