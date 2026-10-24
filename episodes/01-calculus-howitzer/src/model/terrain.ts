// 지형 높이 (m): 사인파 두 개 + 완만한 오르막. seed가 위상을 바꿔 목표마다 다른 지형이 됨 (수학적 근거가 아닌 연출용)
export function groundHeight(x: number, seed: number): number {
  return 45 + 20 * Math.sin(x / 105 + seed) + 11 * Math.sin(x / 43 + seed * 1.7) + 0.05 * x;
}
