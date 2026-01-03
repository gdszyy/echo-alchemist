# 战斗方法分类

## 大型方法 (3个)
1. **damageEnemy** - 处理敌人伤害、元素效果、爆炸等复杂逻辑
2. **spawnEnemyRowAt** - 生成敌人行，包含布局、词缀、血量计算
3. **spawnBullet** - 生成弹丸，处理激光、散射等特殊效果

## 战斗逻辑方法 (约15个)
1. **updateCombat** - 战斗阶段主更新循环
2. **startCombatPhase** - 开始战斗阶段
3. **advanceWave** - 推进波次
4. **finalizeRound** - 结算回合
5. **checkDefeat** - 检查失败条件
6. **recordDamage** - 记录伤害
7. **addScore** - 添加分数
8. **resetMultiplier** - 重置倍率
9. **calculateWaveSpeed** - 计算波速
10. **startEnemyTurnLogic** - 开始敌人回合
11. **processSingleEnemyTurn** - 处理单个敌人回合
12. **clearProjectiles** - 清除弹丸
13. **checkEnemyHover** - 检查敌人悬停
14. **fireNextShot** - 发射下一发
15. **createHitFeedback** - 创建击中反馈

## 技能系统方法 (约20个)
1. **activateSkill** - 激活技能
2. **addSkillPoint** - 添加技能点
3. **triggerLightningChain** - 触发闪电链
4. **fireLaser** - 发射激光
5. **castRayToReflectors** - 光线投射到反射器
6. **processLaserPenetration** - 处理激光穿透
7. **getLineRectIntersection** - 获取线段矩形交点
8. **createExplosion** - 创建爆炸
9. **createShockwave** - 创建冲击波
10. **createParticle** - 创建粒子
11. **createFloatingText** - 创建浮动文字
12. **triggerLevelUpEvent** - 触发升级事件
13. **updateMulticastDisplay** - 更新多重施法显示
14. **playMulticastTransferEffect** - 播放多重施法转移效果
15. **compileCollectionToRecipe** - 编译收集到配方
16. **drawLauncherOrbitals** - 绘制发射器轨道
17. **renderAmmoIcon** - 渲染弹药图标
18. **updateAmmoUI** - 更新弹药UI
19. **renderRecipeHUD** - 渲染配方HUD
20. **renderRecipeCard** - 渲染配方卡片

## 敌人AI方法 (约10个)
1. **spawnEnemyRow** - 生成敌人行（简化版）
2. **generateAffixes** - 生成词缀
3. **isAreaOccupied** - 检查区域是否被占用
4. **triggerCloneSpawn** - 触发克隆生成
5. **initGameStart** - 初始化游戏开始（生成初始敌人）

## 生成系统方法 (约10个)
1. **getTiltOffset** - 获取倾斜偏移
2. **updateUICache** - 更新UI缓存
3. **updateMultiplierUI** - 更新倍率UI
4. **initRecipeHUD** - 初始化配方HUD
5. **toggleHud** - 切换HUD
6. **attemptCompleteGatheringTurn** - 尝试完成收集回合

## 其他需要保留在Game类的方法
- constructor
- loop
- resize
- setupInputs
- handleInputStart
- handleInputMove
- handleInputEnd
- handleOrientation
- switchPhase
- updateUI
- initSelectionPhase
- generateMarbleOptions
- toggleMarbleSelection
- confirmSelection
- startGatheringPhase
- updateGathering
- initPachinko
- getRandomPegType
- showRelicSelection
- selectRelic
- confirmRelicSelection
- skipRelic
- closeRelicSelection
- resetGame
- updateGatheringQueueUI
- updateHitProgress

## 总计需要迁移的方法：约70个
