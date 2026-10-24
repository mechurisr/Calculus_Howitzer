import { describe, expect, it } from 'vitest';
import { CHARGES, DT, G } from '../src/model/constants';
import { advance, checkImpact, neededAngles, rangeSlopePerDeg, rangeVacuum, vacuumPoint, type Body } from '../src/model/ballistics';
import { groundHeight } from '../src/model/terrain';

const flat = () => 0;
// 평지(y = 0)에서 원점 발사 → 착탄 x
function simulate(v: number, deg: number, env = { air: false, wind: 0 }) {
  const a = deg * Math.PI / 180;
  const b: Body = { x: 0, y: 0, vx: v * Math.cos(a), vy: v * Math.sin(a), t: 0, ax: 0, ay: 0 };
  while (!checkImpact(b, flat, 1e9)) advance(b, env, DT);
  return b;
}

describe('진공 수치적분 vs 해석해', () => {
  it.each([[60, 30], [75, 45], [93, 60], [115, 20]])('v=%i m/s, θ=%i°: 사거리 R = v²sin2θ/g 와 1 m 안쪽', (v, deg) => {
    expect(Math.abs(simulate(v, deg).x - rangeVacuum(v, deg))).toBeLessThan(1);
  });
  it('비행시간 T = 2v·sinθ/g 와 0.02 s 안쪽', () => {
    expect(Math.abs(simulate(75, 45).t - 2 * 75 * Math.sin(Math.PI / 4) / G)).toBeLessThan(0.02);
  });
});

describe('공기저항', () => {
  it('항력이 있으면 사거리가 줄어듦', () => expect(simulate(75, 45, { air: true, wind: 0 }).x).toBeLessThan(simulate(75, 45).x));
  it('뒷바람(+)이면 맞바람(−)보다 멀리', () => expect(simulate(75, 45, { air: true, wind: 8 }).x).toBeGreaterThan(simulate(75, 45, { air: true, wind: -8 }).x));
});

describe('neededAngles: 진공 궤적이 목표점을 지나는 발사각', () => {
  it.each([[75, 400, 0], [93, 600, 25], [60, 300, -15]])('v=%i, Δx=%i, Δh=%i → 두 각 모두 y(Δx) = Δh', (v, dx, dh) => {
    const r = neededAngles(v, dx, dh)!;
    expect(r[0]).toBeLessThan(r[1]);
    for (const deg of r) {
      const a = deg * Math.PI / 180, t = dx / (v * Math.cos(a));
      expect(vacuumPoint(0, 0, v, a, t).y).toBeCloseTo(dh, 6);
    }
  });
  it('평지에서는 두 각이 45°에 대칭 (θ와 90°−θ)', () => {
    const [lo, hi] = neededAngles(75, 400, 0)!; expect(lo + hi).toBeCloseTo(90, 9);
  });
  it('최대 사거리 v²/g 를 넘으면 null', () => expect(neededAngles(60, 60 * 60 / G + 1, 0)).toBeNull());
});

describe('사거리 그래프', () => {
  it('45°에서 최대, 기울기 0', () => { expect(rangeVacuum(75, 45)).toBeCloseTo(75 * 75 / G, 9); expect(rangeSlopePerDeg(75, 45)).toBeCloseTo(0, 9); });
  it('dR/dθ(1°당)가 수치 미분과 일치', () => {
    const v = 93, d = 30, h = 1e-4;
    expect(rangeSlopePerDeg(v, d)).toBeCloseTo((rangeVacuum(v, d + h) - rangeVacuum(v, d - h)) / (2 * h), 4);
  });
});

describe('장약 구성: 모든 목표(330~910 m 지점, 거리 270~850 m)에 닿는 장약·각도(10°~80°)가 있음', () => {
  it('여러 지형 시드에서 진공 해가 존재', () => {
    for (let seed = 0; seed < 10; seed += 0.5) for (let tx = 330; tx <= 910; tx += 10) {
      const g = (x: number) => groundHeight(x, seed), m = { x: 60 + 12 * Math.cos(Math.PI / 4), y: g(60) + 6 + 12 * Math.sin(Math.PI / 4) };
      const ok = CHARGES.some(v => (neededAngles(v, tx - m.x, g(tx) - m.y) ?? []).some(a => a >= 10 && a <= 80));
      expect(ok, `seed ${seed}, target ${tx}`).toBe(true);
    }
  });
});
