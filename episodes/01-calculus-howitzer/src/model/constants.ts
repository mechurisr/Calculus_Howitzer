// 중력가속도 g = 9.8 m/s². 표준중력 9.80665 m/s² (CGPM 1901, NIST SP 330)을 교과서 관례대로 반올림.
// 튜토리얼 문구("0.5초에 4.9씩")가 이 값을 전제로 함
export const G = 9.8;

// 공기저항 계수 k (1/m): 가속도 a_drag = −k·|v−w|·(v−w). 이차 항력 F = ½ρC_dAv²에서 k = ρC_dA / 2m.
// [게임용 값] 실제 155 mm 포탄(m ≈ 43.5 kg, 지름 0.155 m, C_d ≈ 0.3 아음속 가정, ρ = 1.225 kg/m³)이면 k ≈ 8.0×10⁻⁵로
// 이 값의 약 1/5. 화면 안(1 km)에서 공기저항 효과가 눈에 보이도록 키운 값임 (검증 필요: 실탄 C_d는 마하수에 따라 크게 변함)
export const K = 0.00042;

// 수치적분 한 걸음 Δt (초). 0.01 s면 진공 사거리 오차가 1 m 안쪽 (tests/ballistics.test.ts)
export const DT = 0.01;

// 전장 크기와 배치 (m). 화면 가로 = 1000 m
export const W = 1000;
export const GUN_X = 60;
// 명중 판정 반경 (m): 깃발 ±14 m
export const HIT_R = 14;

// 장약별 포구속도 (m/s). [게임용 값] 실제 자주포(예: 155 mm)는 수백 m/s지만 화면 안 사거리에 맞춰 줄임.
// 15°~75°에서 각 단계 사거리가 서로 겹치게 골라서 목표(270~850 m)를 놓치는 구간이 없음 (tests/ballistics.test.ts)
export const CHARGES = [60, 75, 93, 115] as const;
