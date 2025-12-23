/**
 * Vec2 向量类单元测试
 */

import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../src/core/Vec2.js';

describe('Vec2 向量类', () => {
  describe('构造函数', () => {
    it('应该正确创建向量', () => {
      const v = new Vec2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });
  });

  describe('add 向量加法', () => {
    it('应该正确执行向量加法', () => {
      const v1 = new Vec2(1, 2);
      const v2 = new Vec2(3, 4);
      const result = v1.add(v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('不应该修改原向量', () => {
      const v1 = new Vec2(1, 2);
      const v2 = new Vec2(3, 4);
      v1.add(v2);
      expect(v1.x).toBe(1);
      expect(v1.y).toBe(2);
    });
  });

  describe('sub 向量减法', () => {
    it('应该正确执行向量减法', () => {
      const v1 = new Vec2(5, 7);
      const v2 = new Vec2(2, 3);
      const result = v1.sub(v2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('不应该修改原向量', () => {
      const v1 = new Vec2(5, 7);
      const v2 = new Vec2(2, 3);
      v1.sub(v2);
      expect(v1.x).toBe(5);
      expect(v1.y).toBe(7);
    });
  });

  describe('mult 标量乘法', () => {
    it('应该正确执行标量乘法', () => {
      const v = new Vec2(3, 4);
      const result = v.mult(2);
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('应该支持负数标量', () => {
      const v = new Vec2(3, 4);
      const result = v.mult(-1);
      expect(result.x).toBe(-3);
      expect(result.y).toBe(-4);
    });

    it('应该支持小数标量', () => {
      const v = new Vec2(10, 20);
      const result = v.mult(0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });
  });

  describe('mag 向量长度', () => {
    it('应该正确计算向量长度', () => {
      const v = new Vec2(3, 4);
      expect(v.mag()).toBe(5);
    });

    it('零向量长度应该为 0', () => {
      const v = new Vec2(0, 0);
      expect(v.mag()).toBe(0);
    });

    it('应该正确计算负坐标向量的长度', () => {
      const v = new Vec2(-3, -4);
      expect(v.mag()).toBe(5);
    });
  });

  describe('norm 向量归一化', () => {
    it('应该返回单位向量', () => {
      const v = new Vec2(3, 4);
      const result = v.norm();
      expect(result.mag()).toBeCloseTo(1, 10);
    });

    it('应该保持方向不变', () => {
      const v = new Vec2(3, 4);
      const result = v.norm();
      expect(result.x).toBeCloseTo(0.6, 10);
      expect(result.y).toBeCloseTo(0.8, 10);
    });

    it('零向量归一化应该返回零向量', () => {
      const v = new Vec2(0, 0);
      const result = v.norm();
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('dist 距离计算', () => {
    it('应该正确计算两点间距离', () => {
      const v1 = new Vec2(0, 0);
      const v2 = new Vec2(3, 4);
      expect(v1.dist(v2)).toBe(5);
    });

    it('相同点的距离应该为 0', () => {
      const v1 = new Vec2(5, 5);
      const v2 = new Vec2(5, 5);
      expect(v1.dist(v2)).toBe(0);
    });

    it('距离计算应该是对称的', () => {
      const v1 = new Vec2(1, 2);
      const v2 = new Vec2(4, 6);
      expect(v1.dist(v2)).toBe(v2.dist(v1));
    });
  });

  describe('dot 点积', () => {
    it('应该正确计算点积', () => {
      const v1 = new Vec2(2, 3);
      const v2 = new Vec2(4, 5);
      expect(v1.dot(v2)).toBe(23); // 2*4 + 3*5 = 23
    });

    it('垂直向量的点积应该为 0', () => {
      const v1 = new Vec2(1, 0);
      const v2 = new Vec2(0, 1);
      expect(v1.dot(v2)).toBe(0);
    });

    it('点积应该满足交换律', () => {
      const v1 = new Vec2(2, 3);
      const v2 = new Vec2(4, 5);
      expect(v1.dot(v2)).toBe(v2.dot(v1));
    });
  });

  describe('rotate 向量旋转', () => {
    it('应该正确旋转 90 度', () => {
      const v = new Vec2(1, 0);
      const result = v.rotate(Math.PI / 2);
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(1, 10);
    });

    it('应该正确旋转 180 度', () => {
      const v = new Vec2(1, 0);
      const result = v.rotate(Math.PI);
      expect(result.x).toBeCloseTo(-1, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });

    it('旋转 360 度应该回到原位', () => {
      const v = new Vec2(3, 4);
      const result = v.rotate(Math.PI * 2);
      expect(result.x).toBeCloseTo(3, 10);
      expect(result.y).toBeCloseTo(4, 10);
    });

    it('旋转不应该改变向量长度', () => {
      const v = new Vec2(3, 4);
      const result = v.rotate(Math.PI / 3);
      expect(result.mag()).toBeCloseTo(v.mag(), 10);
    });
  });

  describe('clone 克隆向量', () => {
    it('应该创建新的向量实例', () => {
      const v = new Vec2(3, 4);
      const clone = v.clone();
      expect(clone).not.toBe(v);
    });

    it('克隆的向量应该有相同的值', () => {
      const v = new Vec2(3, 4);
      const clone = v.clone();
      expect(clone.x).toBe(v.x);
      expect(clone.y).toBe(v.y);
    });

    it('修改克隆不应该影响原向量', () => {
      const v = new Vec2(3, 4);
      const clone = v.clone();
      clone.x = 10;
      expect(v.x).toBe(3);
    });
  });

  describe('set 设置向量值', () => {
    it('应该正确设置向量的值', () => {
      const v = new Vec2(0, 0);
      v.set(5, 7);
      expect(v.x).toBe(5);
      expect(v.y).toBe(7);
    });

    it('应该返回自身以支持链式调用', () => {
      const v = new Vec2(0, 0);
      const result = v.set(3, 4);
      expect(result).toBe(v);
    });
  });
});
