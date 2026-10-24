export interface State2D { x: number; y: number; vx: number; vy: number }

// 반암시적(symplectic) 오일러: 속도를 먼저 v ← v + a·Δt로 갱신하고, 그 새 속도로 p ← p + v·Δt.
// 국소 오차 O(Δt²), 전역 오차 O(Δt). 근거: Hairer, Lubich, Wanner, "Geometric Numerical Integration" (2006) §I.1.2
// https://en.wikipedia.org/wiki/Semi-implicit_Euler_method
// 상태를 제자리에서 바꿈 (시뮬레이션 루프에서 매 Δt마다 객체를 새로 만들지 않기 위해)
export function semiImplicitEuler2D(s: State2D, ax: number, ay: number, dt: number): void {
  s.vx += ax * dt; s.vy += ay * dt;
  s.x += s.vx * dt; s.y += s.vy * dt;
}
