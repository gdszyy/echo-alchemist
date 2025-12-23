/**
 * 二维向量类
 * 用于位置和速度计算
 */
export class Vec2 {
    /**
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 向量加法
     * @param {Vec2} v - 另一个向量
     * @returns {Vec2} 新向量
     */
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    /**
     * 向量减法
     * @param {Vec2} v - 另一个向量
     * @returns {Vec2} 新向量
     */
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    /**
     * 向量乘标量
     * @param {number} s - 标量
     * @returns {Vec2} 新向量
     */
    mult(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    /**
     * 向量长度
     * @returns {number} 长度
     */
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 归一化向量
     * @returns {Vec2} 单位向量
     */
    norm() {
        const m = this.mag();
        return m === 0 ? new Vec2(0, 0) : new Vec2(this.x / m, this.y / m);
    }

    /**
     * 计算到另一个向量的距离
     * @param {Vec2} v - 另一个向量
     * @returns {number} 距离
     */
    dist(v) {
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    }

    /**
     * 计算点积
     * @param {Vec2} v - 另一个向量
     * @returns {number} 点积
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * 旋转向量
     * @param {number} angle - 旋转角度 (弧度)
     * @returns {Vec2} 旋转后的向量
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * 克隆向量
     * @returns {Vec2} 新向量
     */
    clone() {
        return new Vec2(this.x, this.y);
    }

    /**
     * 设置向量值
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @returns {Vec2} 自身
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
}

export default Vec2;
