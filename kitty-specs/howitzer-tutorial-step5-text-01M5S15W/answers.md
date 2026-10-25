# Answers and Verification: 튜토리얼 5단계 설명 순서와 문구

검토 에이전트는 `spec.md`의 V1을 먼저 직접 푼 뒤 이 파일과 비교할 것.
이 미션은 계산을 바꾸지 않는다(C-001). V1은 옮기는 표 설명 문장이 맞는지 확인하는 것이다.

## V1. "vy가 매번 약 4.9씩 줄어요 (중력 9.8 × 0.5초)"

- Answer: 맞다. 진공에서 0.5초마다 vy는 정확히 g·Δt = 9.8 × 0.5 = **4.9 m/s** 줄고, 표의 이웃한 두 줄 vy 시작값의 차이도 4.9다 (표시 반올림 0.1 단위 안에서)
- Derivation:
  - 진공에서 가속도는 중력뿐: dvy/dt = −g → vy(t + Δt) = vy(t) − g·Δt (등가속도라 정확)
  - g = 9.8 m/s² (`src/model/constants.ts` `G`), Δt = 0.5 s → 4.9 m/s
  - 게임은 Δt = 0.01 s 오일러 적분이지만 가속도가 일정해 vy 갱신은 정확히 선형 → 0.5초(50걸음) 뒤 감소량도 정확히 4.9 (부동소수 오차만)
  - "약"을 붙인 것은 표가 vy를 소수 첫째 자리로 반올림해 보여 주기 때문 (예: 26.5 → 21.6 → 16.7)
- Verification: 기존 단위 테스트 `episodes/01-calculus-howitzer/tests/aim-riemann.test.ts`가 리만 조각 계산을 확인한다(변경 없음). 이 미션은 문장 위치만 바꾸므로 새 계산 테스트 없음

## Physical values

| Quantity | Value | Unit | Source | Status |
|---|---|---|---|---|
| 중력가속도 g | 9.8 | m/s² | `src/model/constants.ts` (표준중력 9.80665 반올림) | verified |
| 진행 한 번의 시간 Δt | 0.5 | s | `missions.ts` 2장 "손으로 쌓아 보기", `game.ts` 0.5초 진행 | verified |
| 0.5초당 vy 감소 | 4.9 | m/s | g × Δt | verified |
