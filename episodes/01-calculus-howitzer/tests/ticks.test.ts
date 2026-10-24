import { describe, expect, it } from 'vitest';
import { ANGLE_MAX, ANGLE_MIN, angleFraction, angleNoteVisible, clampAngle, tickMarks } from '../src/model/ticks';

describe('angleFraction (answers.md V1의 비율)', () => {
  it('양 끝과 가운데: 10° → 0, 45° → 0.5, 80° → 1', () => {
    expect(angleFraction(10)).toBe(0);
    expect(angleFraction(45)).toBe(0.5);
    expect(angleFraction(80)).toBe(1);
  });
  it('30° → 20/70 = 2/7', () => expect(angleFraction(30)).toBeCloseTo(2 / 7, 12));
});

// WP02의 CSS와 같은 식: x = w/2 + f·(L − w). 360px 화면에서 상자 L = 210px(여백 0), 손잡이 w = 22px (plan R-1·R-2)
describe('손잡이 중심 x (손계산 값과 비교)', () => {
  const L = 210, w = 22, x = (deg: number) => w / 2 + angleFraction(deg) * (L - w);
  it('x(10) = 11, x(45) = 105 = L/2, x(80) = 199 = L − w/2', () => {
    expect(x(10)).toBe(11);
    expect(x(45)).toBe(105);
    expect(x(80)).toBe(199);
  });
  it('10° 숫자 간격 (210 − 22)/7 ≈ 26.9px 가 숫자 폭(약 22px)보다 넓음', () => {
    const gap = x(20) - x(10);
    expect(gap).toBeCloseTo(188 / 7, 9);
    expect(gap).toBeGreaterThan(22);
  });
});

describe('tickMarks', () => {
  const t = tickMarks();
  it('10~80° 5° 간격 15곳, 오름차순', () => {
    expect(t.map(m => m.angle)).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
    expect(t[0].angle).toBe(ANGLE_MIN);
    expect(t.at(-1)!.angle).toBe(ANGLE_MAX);
  });
  it('종류: major 8개, minor 6개(15·25·35·55·65·75), emphasis 1개(45)', () => {
    expect(t.filter(m => m.kind === 'major').map(m => m.angle)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(t.filter(m => m.kind === 'minor').map(m => m.angle)).toEqual([15, 25, 35, 55, 65, 75]);
    expect(t.filter(m => m.kind === 'emphasis').map(m => m.angle)).toEqual([45]);
  });
  it('숫자는 major에만 "10"…"80", 45에는 없음 (숫자 줄 겹침 방지)', () => {
    expect(t.filter(m => m.label !== null).map(m => m.label)).toEqual(['10', '20', '30', '40', '50', '60', '70', '80']);
    expect(t.find(m => m.angle === 45)!.label).toBeNull();
  });
  it('비율 f는 0~1에서 단조 증가하고 각 눈금의 angleFraction과 같음', () => {
    t.forEach((m, i) => {
      expect(m.f).toBe(angleFraction(m.angle));
      if (i) expect(m.f).toBeGreaterThan(t[i - 1].f);
    });
    expect(t[0].f).toBe(0);
    expect(t.at(-1)!.f).toBe(1);
  });
});

describe('angleNoteVisible (주석 표시 조건)', () => {
  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
    [true, true, true],
  ])('seen=%s, tutDone=%s → %s', (seen, tutDone, want) => {
    expect(angleNoteVisible({ seen, tutDone })).toBe(want);
  });
});

describe('clampAngle (슬라이더 범위 10~80°)', () => {
  it('범위 밖은 끝값으로, 안쪽은 그대로', () => {
    expect(clampAngle(5)).toBe(10);
    expect(clampAngle(95)).toBe(80);
    expect(clampAngle(37.5)).toBe(37.5);
    expect(clampAngle(ANGLE_MIN)).toBe(10);
    expect(clampAngle(ANGLE_MAX)).toBe(80);
  });
});
