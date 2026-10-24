import { describe, expect, it } from 'vitest';
import { correctedAngle, measureRate, pickCharge } from '../src/model/aim';
import { exactRise, leftRiemannRise, trapezoidPiece } from '../src/model/riemann';
import { G } from '../src/model/constants';

const shot = (x: number, ang: number, o: Partial<{ v0: number; tid: number; air: boolean; out: boolean }> = {}) => ({ x, ang, v0: 75, tid: 1, air: false, out: false, ...o });
const f = { tid: 1, air: false, v0: 75 };

describe('measureRate (할선 기울기)', () => {
  it('각도가 다른 마지막 두 발로 k = Δx/Δθ', () => expect(measureRate([shot(400, 30), shot(430, 32)], f).k).toBe(15));
  it('같은 각도 기록은 건너뛰고 그 전의 다른 각도를 씀', () => expect(measureRate([shot(400, 30), shot(430, 32), shot(431, 32)], f).k).toBeCloseTo(15.5, 9));
  it('다른 목표·장약·화면 밖 기록은 제외', () => {
    const r = measureRate([shot(100, 20, { tid: 0 }), shot(200, 25, { v0: 93 }), shot(999, 28, { out: true }), shot(400, 30)], f);
    expect(r.a).toBeUndefined(); expect(r.k).toBeNull();
  });
  it('기록이 없으면 빈 객체', () => expect(measureRate([], f)).toEqual({}));
});

describe('correctedAngle (1차 근사 보정)', () => {
  it('남은 45 m ÷ 15 m/° = +3°', () => expect(correctedAngle(32, 45, 15)).toEqual({ need: 3, next: 35 }));
  it('0.5° 단위로 반올림', () => expect(correctedAngle(30, 10, 15).next).toBe(30.5));
});

describe('pickCharge', () => {
  it('진공: 거리 ≤ 0.8·v²/g 인 가장 약한 장약', () => { expect(pickCharge(200, false)).toBe(60); expect(pickCharge(0.8 * 75 * 75 / G, false)).toBe(75); });
  it('너무 멀면 가장 센 장약', () => expect(pickCharge(5000, true)).toBe(115));
});

describe('리만 합', () => {
  it('정확한 높이 변화 = vy₀·0.5 − ½g·0.25', () => expect(exactRise(30)).toBeCloseTo(15 - G / 8, 12));
  it('왼쪽 리만 합 오차 = ½g·T·h (h = 0.5, 0.1, 0.01)', () => {
    for (const h of [0.5, 0.1, 0.01]) expect(leftRiemannRise(30, h) - exactRise(30)).toBeCloseTo(0.5 * G * 0.5 * h, 9);
  });
  it('진공에서 사다리꼴(평균) 조각은 정확함', () => expect(trapezoidPiece(30, 30 - G * 0.5)).toBeCloseTo(exactRise(30), 12));
});
