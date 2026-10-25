import { describe, expect, it } from 'vitest';
import { EXP_ANGLES, angleButtonState, observationKind } from '../src/model/angle-buttons';

const states = (theta: number, recorded: number[]) => EXP_ANGLES.map(a => angleButtonState(a, theta, recorded));

describe('angleButtonState (answers.md 상태 규칙 확인표)', () => {
  it('버튼 각도는 30·40·45·50·60°', () => expect([...EXP_ANGLES]).toEqual([30, 40, 45, 50, 60]));
  it('기록 없음, θ = 45 → 45만 현재', () => expect(states(45, [])).toEqual(['normal', 'normal', 'current', 'normal', 'normal']));
  it('E = {30, 45}, θ = 45 → 쏜 각도가 우선, 현재 없음 (FR-004, US2-4)', () =>
    expect(states(45, [30, 45])).toEqual(['fired', 'normal', 'fired', 'normal', 'normal']));
  it('E = {30, 37.5}, θ = 50 → 30 쏜 각도, 50 현재 (37.5는 버튼 없음)', () =>
    expect(states(50, [30, 37.5])).toEqual(['fired', 'normal', 'normal', 'current', 'normal']));
  it('θ = 50.5 → 현재 없음 (US2-3)', () => expect(states(50.5, [])).not.toContain('current'));
  it('같은 각도가 두 번 기록돼도 쏜 각도', () => expect(angleButtonState(30, 45, [30, 30])).toBe('fired'));
});

describe('observationKind (answers.md 관찰 문장 선택)', () => {
  it('버튼 4개 조합 5가지: 30 또는 60을 뺐으면 40·45·50만', () => {
    expect(observationKind([40, 45, 50, 60])).toBe('mid');
    expect(observationKind([30, 40, 45, 50])).toBe('mid');
  });
  it('버튼 4개 조합 5가지: 40·45·50 중 하나를 뺐으면 30·60만', () => {
    expect(observationKind([30, 40, 45, 60])).toBe('pair');
    expect(observationKind([30, 40, 50, 60])).toBe('pair');
    expect(observationKind([30, 45, 50, 60])).toBe('pair');
  });
  it('다섯 각도 모두 → 둘 다 (지금 문장)', () => expect(observationKind([30, 40, 45, 50, 60])).toBe('both'));
  it('버튼 각도가 아닌 값이 섞여 어느 쪽도 다 모이지 않으면 none', () => expect(observationKind([30, 37.5, 45, 50])).toBe('none'));
  it('순서와 무관', () => expect(observationKind([50, 30, 45, 40])).toBe('mid'));
});
