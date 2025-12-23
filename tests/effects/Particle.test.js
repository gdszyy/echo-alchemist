/**
 * Particle 粒子系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Particle, ParticleSystem } from '../../src/effects/Particle.js';

describe('Particle 粒子类', () => {
  describe('构造函数', () => {
    it('应该正确创建粒子', () => {
      const particle = new Particle(100, 200, '#ff0000');
      expect(particle.pos.x).toBe(100);
      expect(particle.pos.y).toBe(200);
      expect(particle.color).toBe('#ff0000');
      expect(particle.alive).toBe(true);
    });

    it('应该使用默认选项', () => {
      const particle = new Particle(0, 0, '#fff');
      expect(particle.life).toBeGreaterThan(0);
      expect(particle.size).toBeGreaterThan(0);
      expect(particle.gravity).toBeDefined();
      expect(particle.friction).toBeDefined();
    });

    it('应该接受自定义选项', () => {
      const options = {
        speed: 5,
        life: 50,
        size: 10,
        gravity: 0.2,
        friction: 0.95,
        shape: 'square'
      };
      const particle = new Particle(0, 0, '#fff', options);
      expect(particle.life).toBe(50);
      expect(particle.size).toBe(10);
      expect(particle.gravity).toBe(0.2);
      expect(particle.friction).toBe(0.95);
      expect(particle.shape).toBe('square');
    });

    it('应该正确设置速度向量', () => {
      const particle = new Particle(0, 0, '#fff', { speed: 5, angle: 0 });
      expect(particle.vel.x).toBeGreaterThan(0);
      expect(Math.abs(particle.vel.y)).toBeLessThan(1); // 接近 0
    });
  });

  describe('update 更新方法', () => {
    it('应该更新粒子位置', () => {
      const particle = new Particle(0, 0, '#fff', { 
        speed: 10, 
        angle: 0,
        gravity: 0 
      });
      const initialX = particle.pos.x;
      particle.update();
      expect(particle.pos.x).toBeGreaterThan(initialX);
    });

    it('应该应用重力', () => {
      const particle = new Particle(0, 0, '#fff', { 
        speed: 0,
        gravity: 0.5 
      });
      const initialVelY = particle.vel.y;
      particle.update();
      expect(particle.vel.y).toBeGreaterThan(initialVelY);
    });

    it('应该应用摩擦力', () => {
      const particle = new Particle(0, 0, '#fff', { 
        speed: 10,
        angle: 0,
        gravity: 0,
        friction: 0.9
      });
      const initialSpeed = particle.vel.mag();
      particle.update();
      const newSpeed = particle.vel.mag();
      expect(newSpeed).toBeLessThan(initialSpeed);
    });

    it('应该减少生命值', () => {
      const particle = new Particle(0, 0, '#fff', { life: 10 });
      const initialLife = particle.life;
      particle.update();
      expect(particle.life).toBe(initialLife - 1);
    });

    it('应该更新透明度', () => {
      const particle = new Particle(0, 0, '#fff', { 
        life: 10,
        alphaDecay: true 
      });
      particle.update();
      expect(particle.alpha).toBeLessThan(1);
      expect(particle.alpha).toBeGreaterThan(0);
    });

    it('生命值耗尽时应该标记为死亡', () => {
      const particle = new Particle(0, 0, '#fff', { life: 1 });
      particle.update();
      expect(particle.alive).toBe(false);
    });

    it('死亡的粒子不应该继续更新', () => {
      const particle = new Particle(0, 0, '#fff', { life: 1 });
      particle.update();
      const pos = particle.pos.clone();
      particle.update();
      expect(particle.pos.x).toBe(pos.x);
      expect(particle.pos.y).toBe(pos.y);
    });
  });

  describe('draw 绘制方法', () => {
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        globalAlpha: 1,
        fillStyle: ''
      };
    });

    it('应该调用 canvas 绘图方法', () => {
      const particle = new Particle(100, 200, '#ff0000');
      particle.draw(mockCtx);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('应该设置正确的透明度', () => {
      const particle = new Particle(100, 200, '#ff0000');
      particle.alpha = 0.5;
      particle.draw(mockCtx);
      expect(mockCtx.globalAlpha).toBe(0.5);
    });

    it('应该设置正确的颜色', () => {
      const particle = new Particle(100, 200, '#ff0000');
      particle.draw(mockCtx);
      expect(mockCtx.fillStyle).toBe('#ff0000');
    });

    it('死亡的粒子不应该绘制', () => {
      const particle = new Particle(100, 200, '#ff0000', { life: 1 });
      particle.update();
      particle.draw(mockCtx);
      expect(mockCtx.save).not.toHaveBeenCalled();
    });

    it('应该支持不同的形状', () => {
      const circleParticle = new Particle(0, 0, '#fff', { shape: 'circle' });
      circleParticle.draw(mockCtx);
      expect(mockCtx.arc).toHaveBeenCalled();

      mockCtx.arc.mockClear();
      const squareParticle = new Particle(0, 0, '#fff', { shape: 'square' });
      squareParticle.draw(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });
});

describe('ParticleSystem 粒子系统', () => {
  let system;

  beforeEach(() => {
    system = new ParticleSystem();
  });

  describe('构造函数', () => {
    it('应该创建空的粒子数组', () => {
      expect(system.particles).toBeDefined();
      expect(system.particles.length).toBe(0);
    });
  });

  describe('add 添加粒子', () => {
    it('应该能添加粒子', () => {
      const particle = new Particle(0, 0, '#fff');
      system.add(particle);
      expect(system.particles.length).toBe(1);
      expect(system.particles[0]).toBe(particle);
    });

    it('应该能添加多个粒子', () => {
      system.add(new Particle(0, 0, '#fff'));
      system.add(new Particle(10, 10, '#000'));
      expect(system.particles.length).toBe(2);
    });
  });

  describe('explode 爆炸效果', () => {
    it('应该创建指定数量的粒子', () => {
      system.explode(100, 100, '#ff0000', 10);
      expect(system.particles.length).toBe(10);
    });

    it('所有粒子应该在相同位置生成', () => {
      system.explode(100, 200, '#ff0000', 5);
      system.particles.forEach(particle => {
        expect(particle.pos.x).toBe(100);
        expect(particle.pos.y).toBe(200);
      });
    });

    it('所有粒子应该有相同的颜色', () => {
      system.explode(100, 100, '#00ff00', 5);
      system.particles.forEach(particle => {
        expect(particle.color).toBe('#00ff00');
      });
    });

    it('粒子应该有不同的速度方向', () => {
      system.explode(100, 100, '#ff0000', 10);
      const velocities = system.particles.map(p => ({ x: p.vel.x, y: p.vel.y }));
      // 检查是否有不同的速度向量
      const uniqueVelocities = new Set(velocities.map(v => `${v.x},${v.y}`));
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });
  });

  describe('update 更新所有粒子', () => {
    it('应该更新所有存活的粒子', () => {
      system.add(new Particle(0, 0, '#fff', { life: 10 }));
      system.add(new Particle(10, 10, '#fff', { life: 10 }));
      const initialLives = system.particles.map(p => p.life);
      system.update();
      system.particles.forEach((particle, i) => {
        expect(particle.life).toBe(initialLives[i] - 1);
      });
    });

    it('应该移除死亡的粒子', () => {
      system.add(new Particle(0, 0, '#fff', { life: 1 }));
      system.add(new Particle(10, 10, '#fff', { life: 10 }));
      expect(system.particles.length).toBe(2);
      system.update();
      expect(system.particles.length).toBe(1);
      expect(system.particles[0].life).toBe(9);
    });

    it('空粒子系统更新不应该报错', () => {
      expect(() => system.update()).not.toThrow();
    });
  });

  describe('draw 绘制所有粒子', () => {
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        globalAlpha: 1,
        fillStyle: ''
      };
    });

    it('应该绘制所有粒子', () => {
      system.add(new Particle(0, 0, '#fff'));
      system.add(new Particle(10, 10, '#fff'));
      system.draw(mockCtx);
      expect(mockCtx.save).toHaveBeenCalledTimes(2);
    });

    it('空粒子系统绘制不应该报错', () => {
      expect(() => system.draw(mockCtx)).not.toThrow();
    });
  });

  describe('clear 清空粒子', () => {
    it('应该清空所有粒子', () => {
      system.add(new Particle(0, 0, '#fff'));
      system.add(new Particle(10, 10, '#fff'));
      expect(system.particles.length).toBe(2);
      system.clear();
      expect(system.particles.length).toBe(0);
    });

    it('清空后应该能继续添加粒子', () => {
      system.add(new Particle(0, 0, '#fff'));
      system.clear();
      system.add(new Particle(10, 10, '#fff'));
      expect(system.particles.length).toBe(1);
    });
  });

  describe('粒子生命周期集成测试', () => {
    it('粒子应该随时间自然消亡', () => {
      system.explode(100, 100, '#ff0000', 5);
      expect(system.particles.length).toBe(5);
      
      // 模拟多次更新
      for (let i = 0; i < 50; i++) {
        system.update();
      }
      
      // 所有粒子应该已经消亡
      expect(system.particles.length).toBe(0);
    });
  });
});
