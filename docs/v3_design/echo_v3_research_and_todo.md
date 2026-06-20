# Echo V3 经营开放世界肉鸽：世界模拟器调研与研究 Todo 规划

本文档基于对社会学、经济学、地缘政治学、计算机仿真以及游戏工程等多个领域的深度调研，罗列了可用于构建“从个体到世界四层社会模拟”的成熟理论与系统。文档的最终目的是提供一份以**调研与研究任务**为主体的 Todo 清单，避免过早陷入具体机制设计的细节。

## 一、 领域调研发现汇总

为了实现基于晶石核心资源、中世纪背景的四层社会模拟（个人、团体、城市、世界），并结合涌现叙事，我们对五个核心领域进行了梳理：

### 1. 领域一：个体行为与认知建模（Individual Agent Modeling）

要模拟从无脑生物部落到少数精细化人类的行为，需要针对不同颗粒度选择不同范式。

- **Needs-based AI / Utility AI**：以《The Sims》为代表。智能体受一组动机（如饥饿、社交、娱乐）驱动，动机随时间衰减；环境中的物体向智能体广播自己能满足的需求（Advertisements 机制），智能体通过效用曲线加权打分并引入随机性做出决策 [1]。适合模拟具有基本生存需求和简单社会属性的普通人类或高级部落首领。
- **Generative Agents**：以斯坦福的 Smallville 实验为代表，采用大语言模型（LLM）驱动。核心架构包含记忆流（Memory Stream）、反思（Reflection）和规划（Planning） [2]。这非常适合用于“对核心故事有直接或一层间接关系”的极少数核心人物的高保真模拟。
- **反应式规则 / 元胞自动机（CA）**：如 Boids 模型。适合处理大量不具备复杂智慧、只凭简单本能（寻找资源、认首领）的底层生物部落。

### 2. 领域二：社会关系网络与小团体动态（Social Networks & Group Dynamics）

如何从小颗粒度个体聚合成具有社会关系的小团体。

- **同质性原则（Homophily）**：社会网络分析（SNA）的核心概念，“物以类聚，人以群分”。连边形成机制包括选择（Selection，相似的人成边）和影响（Influence，成边后趋同） [3]。可用于指导部落和小团体的自然结成。
- **中心性度量（Centrality）**：度中心性、介数中心性和特征向量中心性。通过网络中心性计算，可以自动筛选出“谁值得被精细化模拟”（例如控制关键节点的掮客）。
- **信任与声誉模型（Trust & Reputation）**：多智能体系统中的 FIRE 模型整合了直接交互信任、基于角色的信任、见证人声誉和认证声誉 [4]。可用于商队交易、跨城市声誉传播。
- **合作博弈论与联盟形成（Coalition Formation）**：基于夏普利值（Shapley value）或核（The Core）的利益分配决定联盟的稳定性。可用于小团体或城市间的结盟与分裂。

### 3. 领域三：城市/聚落、经济与商路模拟（Economy & Trade）

从团体到基于地理位置的城市与经济流转。

- **Agent-Based Computational Economics (ACE)**：将经济视为由异构智能体交互驱动的开放式、局部建构的序贯博弈 [5]。支持智能体的生灭与合并，与“复制人重生/文明重建”设定契合。
- **中心地理论（Central Place Theory）**：Christaller 提出的经典理论。核心概念包括门槛人口（Threshold）和商品范围（Range）。解释了为什么聚落越大数量越少、间距越远，以及贸易网络如何形成 [6]。
- **引力模型（Gravity Model of Trade）**：双边贸易流与两地“质量”（如人口、晶石产出）成正比，与距离（或地形阻力）成反比 [7]。是驱动商路自动连接的最简健壮模型。

### 4. 领域四：地缘政治、迁徙与通信（Geopolitics, Migration & Contagion）

基于地缘政治和通信的最高层势力关系。

- **推拉理论（Push-Pull Theory）**：人口迁徙决策受出发地推力、目的地拉力及中间阻碍影响 [8]。结合网络驱动迁徙（通过社会关系传递目的地信息），可用于模拟幸存者流亡与链式迁徙。
- **地缘边界涌现**：Cederman 的有限智能体方法（Finite-agent method）将国家视为叠加在底层网格上的高层结构，势力边界和帝国兴衰由底层交互自然涌现，而非硬编码 [9]。
- **创新扩散与传染病模型（Diffusion of Innovation / SIR）**：信息传播受地形延迟和社交网络“桥”节点的控制。可用于情报传递、谣言发酵以及“晶石病”的传播 [10]。

### 5. 领域五：涌现叙事与游戏工程实践（Emergent Narrative & Engineering）

如何定义“故事”以及在游戏中落地。

- **故事筛选（Story Sifting）**：在海量底层模拟事件流中，使用可组合的模式（Patterns）去匹配并提取具有戏剧性的事件序列（如“背叛与复仇”） [11]。
- **分阶段联合生成（Combined World and Story PCG）**：以《Caves of Qud》为代表，采用静态骨架包裹程序化世界的方法，先生成地理与深厚历史，再分阶段生成传说和任务 [12]。
- **戏剧管理器（Drama Manager / AI Storyteller）**：如《RimWorld》的 AI 导演，监控玩家状态（财富、爽点密集度），动态调度事件强度与节奏。结合“反向推导机制”，根据预期的爽点结果，反向生成合理的伏笔或历史事件以维持叙事自洽。

---

## 二、 研究与调研 Todo 清单

基于上述理论框架，接下来的工作应集中在对具体模型的可行性研究和原型验证上，暂不涉及游戏具体代码的重构。

### 阶段一：底层架构与个体认知研究
- [ ] **研究 Needs-based AI 架构设计**：调研《The Sims》的“广告（Advertisements）”机制，分析如何将行为逻辑剥离到环境物体（如晶石矿、庇护所）上，降低底层生物的计算开销。
- [ ] **评估 LLM 驱动核心人物的可行性**：调研 Generative Agents（记忆-反思-规划）架构在现有技术栈下的性能开销，研究如何将其限定在极少数高介数中心性节点上。
- [ ] **调研大尺度元胞自动机与 ABM 混合架构**：研究如何在 echov2 现有的四层 CA 基础上，平滑接入离散的个体 Agent，并保持性能稳定。

### 阶段二：社会关系与经济网络研究
- [ ] **研究动态网络生成算法**：调研基于同质性（Homophily）和距离衰减的社会连边算法，设计实验验证其能否自然涌现出符合 Dunbar 上限（~150人）的稳定小团体。
- [ ] **调研多智能体声誉模型**：深入阅读 FIRE 模型论文，研究如何将直接交互与第三方见证转化为可量化的“信任值”，以驱动商队的路线选择。
- [ ] **验证引力模型与中心地理论结合**：设计一个独立的 Python/脚本原型，使用 echov2 的地形阻力替代物理距离，验证引力模型能否自然形成分级的城市和商路网络。

### 阶段三：地缘政治与宏观流动研究
- [ ] **调研有限智能体（Finite-agent）边界涌现模型**：研究 Cederman 模型的实现细节，分析如何根据底层城市的经济联系与文化/信仰趋同度，自动划定并动态调整势力版图。
- [ ] **研究网络驱动的迁徙模型**：调研基于推拉理论和信息扩散的离散选择模型（Discrete Choice Model），分析社会网络在迁徙目的地选择中的权重作用。
- [ ] **调研延迟通信模型**：研究基于地形和信使的异步信息传播机制（如 SIR 变体），分析情报延迟对势力决策（如边境叛乱）的影响。

### 阶段四：叙事引擎与故事筛选研究
- [ ] **研究 Story Sifting 模式匹配算法**：调研 Felt 等系统的实现，尝试定义 3-5 个基础的“故事模式”（如：剧烈扰动 -> 核心人物受影响 -> 团体状态突变 -> 新稳态），并研究其在事件流中的匹配效率。
- [ ] **调研反向推导剧情机制的工程实现**：研究 AI Drama Manager（如《RimWorld》或基于遗传算法的 DM）如何评估当前的“爽点密集度”，并探索如何反向生成历史事件框架以支撑预期奖励。
- [ ] **研究《Caves of Qud》分阶段生成管线**：深入分析其静态骨架与程序化生成的耦合方式，制定将 echov2 世界观（复制人、晶石）转化为静态骨架的预研计划。

---

## 参考文献

[1] Brown, M. (2020). The Genius AI Behind The Sims. *Game Maker's Toolkit*. https://gmtk.substack.com/p/the-genius-ai-behind-the-sims
[2] Park, J. S., et al. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *arXiv preprint arXiv:2304.03442*.
[3] McPherson, M., Smith-Lovin, L., & Cook, J. M. (2001). Birds of a Feather: Homophily in Social Networks. *Annual Review of Sociology*, 27, 415-444.
[4] Huynh, T. D., Jennings, N. R., & Shadbolt, N. R. (2006). An integrated trust and reputation model for open multi-agent systems. *Autonomous Agents and Multi-Agent Systems*, 13(2), 119-154.
[5] Tesfatsion, L. (2017). Modeling Economic Systems as Locally-Constructive Sequential Games. *Journal of Economic Methodology*, 24(4), 384-409.
[6] Wikipedia Contributors. (2024). Central place theory. *Wikipedia, The Free Encyclopedia*. https://en.wikipedia.org/wiki/Central_place_theory
[7] Head, K., & Mayer, T. (2014). Gravity Equations: Workhorse, Toolkit, and Cookbook. *Handbook of International Economics*, 4, 131-195.
[8] Klabunde, A., & Willekens, F. (2016). Decision-Making in Agent-Based Models of Migration: State of the Art and Challenges. *European Journal of Population*, 32(1), 73-97.
[9] Cederman, L. E. (2002). Endogenizing geopolitical boundaries with agent-based modeling. *PNAS*, 99(suppl_3), 7296-7303.
[10] Al-Taie, M. Z., & Kadry, S. (2017). Information Diffusion in Social Networks. *Python for Graph and Network Analysis*, 165-184.
[11] Kreminski, M., et al. (2025). Emergent Narratives with Composable Story Sifting Patterns. *ACM Transactions on Computer-Human Interaction*.
[12] Grinblat, J. (2022). Tapping into the potential of procedural generation in Caves of Qud. *Game Developer*. https://www.gamedeveloper.com/design/tapping-into-the-potential-of-procedural-generation-in-caves-of-qud
