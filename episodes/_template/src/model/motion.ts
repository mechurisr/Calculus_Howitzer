// 이 폴더(model/)에는 DOM을 건드리지 않는 순수 계산만 둠. 모든 함수에 단위 테스트 필수 (tests/)
// 모든 수식·물리값 옆에는 근거(공식, 출처)를 주석으로 남김

// 중력가속도 g = 9.8 m/s². 표준중력 9.80665 m/s² (NIST SP 330)을 반올림
export const G = 9.8;

// 연직 위로 던진 물체의 높이 y(t) = v₀t − ½gt² (등가속도 운동)
export const heightAt = (v0: number, t: number) => v0 * t - 0.5 * G * t * t;
// 최고점 시각 t* = v₀/g (dy/dt = v₀ − gt = 0)
export const apexTime = (v0: number) => v0 / G;
