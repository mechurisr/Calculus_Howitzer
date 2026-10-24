// 실근: a·u² + b·u + c = 0 → u = (−b ± √(b² − 4ac)) / 2a (근의 공식). a ≠ 0이어야 함.
// 판별식이 음수면 실근 없음 → null. 반환 순서는 [−√D 쪽, +√D 쪽]이라 a > 0이면 작은 근이 먼저
export function solveQuadratic(a: number, b: number, c: number): [number, number] | null {
  const D = b * b - 4 * a * c;
  if (D < 0) return null;
  return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)];
}
