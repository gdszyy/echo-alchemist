# Echo Alchemist 单元测试

本目录包含 Echo Alchemist 项目的单元测试套件。

## 测试框架

使用 **Vitest** 作为测试框架，它与 Vite 无缝集成，提供快速的测试执行和优秀的开发体验。

## 目录结构

```
tests/
├── core/           # 核心模块测试
│   └── Vec2.test.js
├── config/         # 配置模块测试
│   └── config.test.js
├── effects/        # 效果模块测试
│   └── Particle.test.js
└── README.md
```

## 运行测试

### 基本命令

```bash
# 运行所有测试（监听模式）
pnpm test

# 运行一次测试
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 使用 UI 界面运行测试
pnpm test:ui
```

### 运行特定测试

```bash
# 运行特定文件的测试
pnpm test Vec2.test.js

# 运行特定目录的测试
pnpm test tests/core/

# 运行匹配特定模式的测试
pnpm test --grep "向量加法"
```

## 测试覆盖的模块

### ✅ 已完成

1. **Vec2 (向量数学)** - `tests/core/Vec2.test.js`
   - 构造函数
   - 向量运算（加、减、乘）
   - 向量属性（长度、归一化）
   - 向量方法（距离、点积、旋转、克隆）

2. **CONFIG (配置验证)** - `tests/config/config.test.js`
   - 配置对象结构验证
   - 平衡性配置验证
   - 物理配置验证
   - 颜色配置验证
   - 数值合法性检查

3. **Particle (粒子系统)** - `tests/effects/Particle.test.js`
   - 粒子创建和初始化
   - 粒子更新逻辑
   - 粒子绘制方法
   - 粒子系统管理
   - 爆炸效果生成

### 📋 待添加

- Game 类测试
- Entity 类测试（Peg, DropBall, Enemy, Projectile）
- 其他效果类测试（FloatingText, LightningBolt）
- 数据模块测试（relics, skills, marbles）
- UI 管理器测试

## 编写测试指南

### 测试文件命名

测试文件应该与源文件对应，使用 `.test.js` 后缀：

```
src/core/Vec2.js  →  tests/core/Vec2.test.js
```

### 测试结构

```javascript
import { describe, it, expect } from 'vitest';
import { YourClass } from '../../src/path/to/YourClass.js';

describe('YourClass 类名', () => {
  describe('方法名', () => {
    it('应该做什么', () => {
      // 测试代码
      expect(result).toBe(expected);
    });
  });
});
```

### 最佳实践

1. **清晰的测试描述**：使用中文描述测试意图
2. **独立的测试用例**：每个测试应该独立运行
3. **边界条件测试**：测试边界情况和异常输入
4. **使用 beforeEach**：在需要时使用 beforeEach 设置测试环境
5. **Mock 外部依赖**：使用 vi.fn() 模拟外部依赖

### 断言方法

```javascript
// 相等性断言
expect(value).toBe(expected);           // 严格相等
expect(value).toEqual(expected);        // 深度相等

// 数值断言
expect(number).toBeCloseTo(3.14, 2);    // 浮点数比较
expect(number).toBeGreaterThan(5);      // 大于
expect(number).toBeLessThan(10);        // 小于

// 布尔断言
expect(value).toBeTruthy();             // 真值
expect(value).toBeFalsy();              // 假值
expect(value).toBeDefined();            // 已定义
expect(value).toBeUndefined();          // 未定义

// 数组/对象断言
expect(array).toContain(item);          // 包含元素
expect(array).toHaveLength(3);          // 长度
expect(obj).toHaveProperty('key');      // 有属性

// 函数断言
expect(fn).toThrow();                   // 抛出异常
expect(fn).toHaveBeenCalled();          // 被调用（需要 mock）
```

## 配置

测试配置位于 `vite.config.js` 中的 `test` 字段：

```javascript
test: {
  globals: true,           // 全局测试 API
  environment: 'jsdom',    // DOM 环境模拟
  coverage: {              // 覆盖率配置
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  }
}
```

## 持续集成

测试应该在以下情况下运行：

- 提交代码前（pre-commit hook）
- 推送到远程仓库前（pre-push hook）
- Pull Request 时（CI/CD pipeline）

## 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [Vitest API 参考](https://vitest.dev/api/)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**最后更新**: 2024-12-23
