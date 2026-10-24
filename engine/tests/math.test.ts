import { describe, expect, it } from 'vitest';
import { createRng, semiImplicitEuler2D, solveQuadratic, toDeg, toRad } from '../src/math';

describe('solveQuadratic', () => {
  it('(u−1)(u−3) = u² − 4u + 3 → [1, 3]', () => expect(solveQuadratic(1, -4, 3)).toEqual([1, 3]));
  it('중근: u² − 2u + 1 → [1, 1]', () => expect(solveQuadratic(1, -2, 1)).toEqual([1, 1]));
  it('판별식 < 0이면 null: u² + 1', () => expect(solveQuadratic(1, 0, 1)).toBeNull());
  it('근을 다시 넣으면 0', () => {
    const [a, b, c] = [2.5, -7.1, 1.3], r = solveQuadratic(a, b, c)!;
    r.forEach(u => expect(a * u * u + b * u + c).toBeCloseTo(0, 12));
  });
});

describe('semiImplicitEuler2D', () => {
  it('등가속도 a에서 n걸음 뒤 해석해: v = v₀ + a·nΔt, y = y₀ + Σ v_k·Δt = v₀·nΔt + a·Δt²·n(n+1)/2', () => {
    const s = { x: 0, y: 0, vx: 3, vy: 20 }, a = -9.8, dt = 0.01, n = 200;
    for (let i = 0; i < n; i++) semiImplicitEuler2D(s, 0, a, dt);
    expect(s.vy).toBeCloseTo(20 + a * n * dt, 10);
    expect(s.y).toBeCloseTo(20 * n * dt + a * dt * dt * n * (n + 1) / 2, 10);
    expect(s.x).toBeCloseTo(3 * n * dt, 10);
  });
  it('Δt → 0이면 연속 해 y = v₀t + ½at² 로 수렴 (오차 ∝ Δt)', () => {
    const err = (dt: number) => { const s = { x: 0, y: 0, vx: 0, vy: 20 }; for (let i = 0; i < Math.round(2 / dt); i++) semiImplicitEuler2D(s, 0, -9.8, dt); return Math.abs(s.y - (20 * 2 - 4.9 * 4)); };
    expect(err(0.001)).toBeLessThan(err(0.01) / 5);
  });
});

describe('angles', () => {
  it('180° = π', () => expect(toRad(180)).toBe(Math.PI));
  it('왕복', () => expect(toDeg(toRad(37.5))).toBeCloseTo(37.5, 12));
});

describe('createRng', () => {
  it('같은 시드면 같은 수열', () => { const a = createRng(7), b = createRng(7); for (let i = 0; i < 5; i++) expect(a()).toBe(b()); });
  it('[0, 1) 범위', () => { const r = createRng(1); for (let i = 0; i < 1000; i++) { const x = r(); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); } });
});
