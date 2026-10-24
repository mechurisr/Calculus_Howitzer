import { G } from './constants';

// 진공에서 vy(t) = vy₀ − g·t 를 0~T초 적분한 정확한 높이 변화: vy₀·T − ½gT².
// T = 0.5 s면 vy₀·0.5 − g·0.125
export const exactRise = (vy0: number, T = 0.5) => vy0 * T - G * T * T / 2;

// 왼쪽 리만 합: 조각 크기 h마다 그 조각 시작 시점의 vy로 계산해 더함. h → 0이면 exactRise로 수렴 (오차 = ½g·T·h)
export function leftRiemannRise(vy0: number, h: number, T = 0.5): number {
  const n = Math.round(T / h); let sum = 0;
  for (let k = 0; k < n; k++) sum += (vy0 - G * h * k) * h;
  return sum;
}

// 0.5초 조각의 사다리꼴 넓이 (시작 + 끝) ÷ 2 × 0.5. vy가 일정하게 줄면(진공) 정확한 값과 같음
export const trapezoidPiece = (vy0: number, vy1: number) => (vy0 + vy1) / 4;
