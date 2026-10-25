// 튜토리얼 15단계 "실험: 각도만 바꿔 보기"의 각도 버튼 상태와 관찰 문장 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7)
// 여기에는 DOM 없이 계산만 둔다. 화면은 missions.ts 15단계와 style.css .exp-angs

// 실험 각도 버튼 (°) — 4장 실험 단계에 원래 있던 다섯 각도
export const EXP_ANGLES = [30, 40, 45, 50, 60] as const;

export type AngleButtonState = 'normal' | 'current' | 'fired';

// 버튼 각도 a의 상태 (answers.md "상태 규칙 확인표", spec FR-001·FR-002·FR-004)
// recorded: 결과 표에 기록된 발사각들 (화면 안에 떨어진 2호 발사만). 이미 기록됐으면 슬라이더 각도와 상관없이 'fired'
// 슬라이더 값은 10 + 0.5k 라 이진수로 정확히 표현되므로 === 로 비교해도 됨
export function angleButtonState(a: number, theta: number, recorded: readonly number[]): AngleButtonState {
  if (recorded.includes(a)) return 'fired';
  return theta === a ? 'current' : 'normal';
}

// 4발 뒤 관찰 문장 종류 (spec FR-007, answers.md "관찰 문장 선택", 스펙 검토 R3 ②)
// mid: 40·45·50°가 모두 기록됨 (거리가 거의 같음), pair: 30·60°가 모두 기록됨 (서로 비슷함). 기록에 없는 각도는 문장에서 말하지 않음
export type ObservationKind = 'both' | 'mid' | 'pair' | 'none';

export function observationKind(recorded: readonly number[]): ObservationKind {
  const has = (as: number[]) => as.every(a => recorded.includes(a));
  const mid = has([40, 45, 50]), pair = has([30, 60]);
  return mid && pair ? 'both' : mid ? 'mid' : pair ? 'pair' : 'none';
}
