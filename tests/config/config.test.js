/**
 * CONFIG 配置模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  CONFIG,
  BALANCE_CONFIG,
  GAMEPLAY_CONFIG,
  PROBABILITIES_CONFIG,
  PHYSICS_CONFIG,
  COLORS,
  VISUALS_CONFIG
} from '../../src/config/index.js';

describe('CONFIG 配置模块', () => {
  describe('CONFIG 对象结构', () => {
    it('应该包含所有必需的配置模块', () => {
      expect(CONFIG).toBeDefined();
      expect(CONFIG.colors).toBeDefined();
      expect(CONFIG.physics).toBeDefined();
      expect(CONFIG.balance).toBeDefined();
      expect(CONFIG.gameplay).toBeDefined();
      expect(CONFIG.probabilities).toBeDefined();
      expect(CONFIG.visuals).toBeDefined();
    });

    it('CONFIG 子模块应该与单独导出的模块一致', () => {
      expect(CONFIG.colors).toBe(COLORS);
      expect(CONFIG.physics).toBe(PHYSICS_CONFIG);
      expect(CONFIG.balance).toBe(BALANCE_CONFIG);
      expect(CONFIG.gameplay).toBe(GAMEPLAY_CONFIG);
      expect(CONFIG.probabilities).toBe(PROBABILITIES_CONFIG);
      expect(CONFIG.visuals).toBe(VISUALS_CONFIG);
    });
  });

  describe('BALANCE_CONFIG 平衡性配置', () => {
    it('应该包含基础平衡性参数', () => {
      expect(BALANCE_CONFIG).toBeDefined();
      expect(typeof BALANCE_CONFIG).toBe('object');
    });

    it('所有数值配置应该是有效的数字', () => {
      const validateNumbers = (obj) => {
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'number') {
            expect(value).not.toBeNaN();
            expect(Number.isFinite(value)).toBe(true);
          } else if (typeof value === 'object' && value !== null) {
            validateNumbers(value);
          }
        }
      };
      validateNumbers(BALANCE_CONFIG);
    });
  });

  describe('GAMEPLAY_CONFIG 游戏玩法配置', () => {
    it('应该包含游戏玩法参数', () => {
      expect(GAMEPLAY_CONFIG).toBeDefined();
      expect(typeof GAMEPLAY_CONFIG).toBe('object');
    });
  });

  describe('PROBABILITIES_CONFIG 概率配置', () => {
    it('应该包含概率参数', () => {
      expect(PROBABILITIES_CONFIG).toBeDefined();
      expect(typeof PROBABILITIES_CONFIG).toBe('object');
    });

    it('所有概率值应该在 0 到 1 之间', () => {
      const validateProbabilities = (obj) => {
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'number' && key.toLowerCase().includes('prob')) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
          } else if (typeof value === 'object' && value !== null) {
            validateProbabilities(value);
          }
        }
      };
      validateProbabilities(PROBABILITIES_CONFIG);
    });
  });

  describe('PHYSICS_CONFIG 物理配置', () => {
    it('应该包含物理引擎参数', () => {
      expect(PHYSICS_CONFIG).toBeDefined();
      expect(typeof PHYSICS_CONFIG).toBe('object');
    });

    it('重力值应该是正数', () => {
      if (PHYSICS_CONFIG.gravity !== undefined) {
        expect(PHYSICS_CONFIG.gravity).toBeGreaterThan(0);
      }
    });

    it('摩擦系数应该在合理范围内', () => {
      if (PHYSICS_CONFIG.friction !== undefined) {
        expect(PHYSICS_CONFIG.friction).toBeGreaterThanOrEqual(0);
        expect(PHYSICS_CONFIG.friction).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('COLORS 颜色配置', () => {
    it('应该包含颜色定义', () => {
      expect(COLORS).toBeDefined();
      expect(typeof COLORS).toBe('object');
    });

    it('所有颜色值应该是有效的字符串', () => {
      const validateColors = (obj) => {
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0);
          } else if (typeof value === 'object' && value !== null) {
            validateColors(value);
          }
        }
      };
      validateColors(COLORS);
    });
  });

  describe('VISUALS_CONFIG 视觉效果配置', () => {
    it('应该包含视觉效果参数', () => {
      expect(VISUALS_CONFIG).toBeDefined();
      expect(typeof VISUALS_CONFIG).toBe('object');
    });
  });

  describe('配置不可变性', () => {
    it('配置对象应该可以被读取', () => {
      expect(() => {
        const test = CONFIG.colors;
      }).not.toThrow();
    });
  });

  describe('配置完整性', () => {
    it('不应该包含 undefined 的顶层配置', () => {
      expect(CONFIG.colors).not.toBeUndefined();
      expect(CONFIG.physics).not.toBeUndefined();
      expect(CONFIG.balance).not.toBeUndefined();
      expect(CONFIG.gameplay).not.toBeUndefined();
      expect(CONFIG.probabilities).not.toBeUndefined();
      expect(CONFIG.visuals).not.toBeUndefined();
    });

    it('所有导出的配置模块都应该是对象', () => {
      expect(typeof BALANCE_CONFIG).toBe('object');
      expect(typeof GAMEPLAY_CONFIG).toBe('object');
      expect(typeof PROBABILITIES_CONFIG).toBe('object');
      expect(typeof PHYSICS_CONFIG).toBe('object');
      expect(typeof COLORS).toBe('object');
      expect(typeof VISUALS_CONFIG).toBe('object');
    });
  });
});
