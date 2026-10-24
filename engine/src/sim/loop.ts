export interface FixedStepLoopOptions {
  dt: number;                  // 시뮬레이션 한 걸음 (초)
  speed?: number;              // 실제 1초에 진행할 시뮬레이션 초
  maxFrame?: number;           // 탭 전환 등으로 프레임 간격이 길어져도 한 번에 따라잡을 최대 실제 시간 (초)
  active: () => boolean;       // 지금 시뮬레이션을 진행할지 (예: 비행 중이고 정지 상태가 아님)
  step: () => boolean;         // 한 걸음 진행. false면 종료(착탄 등)로 보고 남은 시간을 버림
  frame?: (realDt: number) => void;  // 매 프레임 그리기
}

// 고정 Δt 누적기 루프: 화면 주사율과 상관없이 같은 입력이면 같은 궤적이 나오게 함.
// 근거: Glenn Fiedler, "Fix Your Timestep!" https://gafferongames.com/post/fix_your_timestep/
export function startFixedStepLoop(o: FixedStepLoopOptions): void {
  const speed = o.speed ?? 1, maxFrame = o.maxFrame ?? 0.05;
  let last = performance.now(), acc = 0;
  function tick(now: number) {
    const d = Math.min(maxFrame, (now - last) / 1000); last = now;
    if (o.active()) {
      acc += d * speed;
      while (acc >= o.dt && o.active()) { if (!o.step()) { acc = 0; break; } acc -= o.dt; }
    }
    o.frame?.(d);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
