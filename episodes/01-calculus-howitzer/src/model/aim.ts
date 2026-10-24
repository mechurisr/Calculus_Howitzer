import { CHARGES, G } from './constants';

export interface ShotRecord { x: number; ang: number; v0: number; tid: number; air: boolean; out: boolean }

// 같은 목표·모드·장약으로 쏜 기록 중 마지막 발(b)과, 그보다 앞서 각도가 달랐던 가장 최근 발(a)로
// 할선 기울기 k = Δ탄착/Δ각도 (m/°)를 구함. 미분 dR/dθ의 근삿값
export function measureRate<T extends ShotRecord>(list: T[], f: { tid: number; air: boolean; v0: number }): { b?: T; a?: T; k?: number | null } {
  const sh = list.filter(r => !r.out && r.tid === f.tid && r.air === f.air && r.v0 === f.v0);
  if (!sh.length) return {};
  const b = sh[sh.length - 1], a = [...sh].reverse().find(r => r.ang !== b.ang);
  return { b, a, k: a ? (b.x - a.x) / (b.ang - a.ang) : null };
}

// 할선으로 1차 근사한 보정: 남은 거리 ÷ k 만큼 각도를 바꿈 (뉴턴법 한 걸음과 같은 꼴). 0.5° 단위로 반올림
export function correctedAngle(ang: number, remaining: number, k: number) {
  const need = remaining / k;
  return { need, next: Math.round((ang + need) * 2) / 2 };
}

// 조준 미션 시작 장약: 목표가 최대 사거리(v²/g)의 80% 안쪽에 들어오는 가장 약한 장약.
// 공기저항이면 사거리를 약 70%로 어림 (게임용 경험값)
export function pickCharge(distance: number, air: boolean): number {
  const f = air ? 0.7 : 1;
  return CHARGES.find(v => v * v / G * f * 0.8 >= distance) ?? CHARGES[CHARGES.length - 1];
}
