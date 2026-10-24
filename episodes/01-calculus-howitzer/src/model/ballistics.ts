import { semiImplicitEuler2D, solveQuadratic, toDeg, toRad, type State2D } from '@series/engine/math';
import { G, K } from './constants';

export interface Env { air: boolean; wind: number }
export interface Body extends State2D { t: number; ax: number; ay: number }

// 가속도 (m/s²). 진공: a = (0, −g).
// 공기: 바람 w에 대한 상대속도 r = v − w로 이차 항력 a = −k|r|r 을 더함 (뉴턴 제2법칙 + 이차 항력, constants.ts의 K 참고)
export function accel(vx: number, vy: number, env: Env): [number, number] {
  if (!env.air) return [0, -G];
  const rx = vx - env.wind, ry = vy, s = Math.hypot(rx, ry);
  return [-K * s * rx, -G - K * s * ry];
}

// 한 걸음 Δt 진행: 이번 걸음의 가속도를 기록하고 반암시적 오일러로 속도 → 위치 순서로 적분
export function advance(b: Body, env: Env, dt: number): void {
  const [ax, ay] = accel(b.vx, b.vy, env); b.ax = ax; b.ay = ay;
  semiImplicitEuler2D(b, ax, ay, dt); b.t += dt;
}

// 착탄 판정: 화면 좌우 40 m 밖이면 'out', 내려오다 지면 아래로 들어가면 'ground'
export function checkImpact(b: State2D, ground: (x: number) => number, width: number): 'out' | 'ground' | null {
  if (b.x > width + 40 || b.x < -40) return 'out';
  if (b.y <= ground(b.x) && b.vy < 0) return 'ground';
  return null;
}

// 포구 위치: 포 받침(지면 + 6 m)에서 포신 길이 12 m 끝
export function muzzlePos(angleDeg: number, gunX: number, ground: (x: number) => number) {
  const a = toRad(angleDeg);
  return { x: gunX + Math.cos(a) * 12, y: ground(gunX) + 6 + Math.sin(a) * 12 };
}

// 진공 궤적 식 y = x·u − g·x²(1+u²)/(2v²) (u = tanθ)에 y(Δx) = Δh를 넣으면 u에 대한 이차방정식
//   c·u² − Δx·u + (c + Δh) = 0,  c = g·Δx²/(2v²)
// 근 두 개 = 낮은 각(직사)과 높은 각(곡사), 도 단위로 [낮은 각, 높은 각]. 근이 없으면 이 속도로는 닿지 않음 → null
// 출처: 포물선 운동, 예) Halliday·Resnick·Walker, Fundamentals of Physics §4-6
export function neededAngles(v: number, dx: number, dh: number): [number, number] | null {
  const c = G * dx * dx / (2 * v * v);
  const r = solveQuadratic(c, -dx, c + dh);
  return r && [toDeg(Math.atan(r[0])), toDeg(Math.atan(r[1]))];
}

// 진공 궤적의 시각 t 위치: x = x₀ + v·cosθ·t, y = y₀ + v·sinθ·t − ½gt²
export function vacuumPoint(x0: number, y0: number, v: number, a: number, t: number) {
  return { x: x0 + v * Math.cos(a) * t, y: y0 + v * Math.sin(a) * t - 0.5 * G * t * t };
}

// 평지·진공 사거리 R(θ) = v²·sin2θ / g (m), 그리고 발사각 1°당 사거리 변화 dR/dθ = 2v²cos2θ/g · π/180 (m/°)
export const rangeVacuum = (v: number, deg: number) => v * v * Math.sin(2 * deg * Math.PI / 180) / G;
export const rangeSlopePerDeg = (v: number, deg: number) => 2 * v * v * Math.cos(2 * deg * Math.PI / 180) / G * Math.PI / 180;
