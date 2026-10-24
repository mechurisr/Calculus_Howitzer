// 발사각 슬라이더 눈금 (kitty-specs/howitzer-angle-ticks-01M5Q3M8)
// 여기에는 DOM·저장소 없이 계산만 둔다. 화면 배치는 view/ticks.ts 와 style.css

// 발사각 슬라이더 범위 (°) — index.html #ang 의 min/max 와 같아야 함 (e2e/ticks.spec.ts 가 확인)
export const ANGLE_MIN = 10;
export const ANGLE_MAX = 80;
export const TICK_STEP = 5;
// 진공·발사점과 착탄점 높이가 같을 때 사거리 R = v²·sin2θ/g 가 최대인 각 (sin2θ = 1).
// 근거: answers.md V3 (이 게임은 포구가 지면보다 높아 실제 최대는 약 44.3°라서 주석에 "같은 높이" 조건을 붙임)
export const EMPHASIS_ANGLE = 45;

// 발사각을 슬라이더 범위로 자름. 게임 코드(game.ts setAngle·튜토리얼 조준 제안)도 이 함수를 써서 범위가 한 곳에서만 정해짐
export function clampAngle(deg: number): number {
  return Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, deg));
}

// 각도 → 트랙 위 비율 f(θ) = (θ − 10)/70.
// 손잡이 중심 x(θ) = w/2 + f(θ)·(L − w)  (L = 슬라이더 상자 폭, w = 손잡이 폭 — answers.md V1).
// px 변환은 CSS 가 한다: left = calc(var(--thumb)/2 + var(--f) * (100% − var(--thumb)))
export function angleFraction(deg: number): number {
  return (deg - ANGLE_MIN) / (ANGLE_MAX - ANGLE_MIN);
}

export type TickKind = 'major' | 'minor' | 'emphasis';
export interface TickMark { angle: number; kind: TickKind; label: string | null; f: number }

// 5° 간격 15곳: 10° 배수는 숫자가 붙는 major(8개), 45° 는 굵은 emphasis(1개), 나머지는 minor(6개).
// 45 에는 숫자를 달지 않는다 — 40·50 숫자와 겹치므로 주석 줄에서 "45°" 를 보여 줌 (answers.md V2)
export function tickMarks(): TickMark[] {
  const out: TickMark[] = [];
  for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += TICK_STEP) {
    const kind: TickKind = a % 10 === 0 ? 'major' : a === EMPHASIS_ANGLE ? 'emphasis' : 'minor';
    out.push({ angle: a, kind, label: kind === 'major' ? String(a) : null, f: angleFraction(a) });
  }
  return out;
}

// 45° 주석을 보일지: seen = 튜토리얼 4장 "45°는 사거리 그래프의 꼭대기" 단계에 들어간 적 있음,
// tutDone = 튜토리얼을 끝냈거나 건너뜀. 한 번 보이면 다시 숨기지 않는다 (data-model.md AngleNote)
export function angleNoteVisible(state: { seen: boolean; tutDone: boolean }): boolean {
  return state.seen || state.tutDone;
}

// "봤음" 저장 키. 엔진 storage 가 "series:" 접두어를 붙임 (기존 튜토리얼 완료 키 "howitzer:tutDone" 와 같은 규칙)
export const ANGLE_NOTE_SEEN_KEY = 'howitzer:angleNoteSeen';
