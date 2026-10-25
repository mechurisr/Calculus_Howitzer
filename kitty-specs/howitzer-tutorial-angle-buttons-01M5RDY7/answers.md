# Answers and Verification: 튜토리얼 실험 단계 각도 버튼 상태

검토 에이전트는 `spec.md`의 V1을 먼저 직접 푼 뒤 이 파일과 비교할 것.
이 미션은 계산을 바꾸지 않는다(C-001). 정답은 화면 배치 확인 하나다.

## V1. 360px 화면의 카드 안쪽 폭과 버튼 5개 배치

- Answer: 카드 안쪽 폭 **302 px**. 44 px 버튼 5개 + 간격 4개는 한 줄에 들어간다
- Derivation:
  - 카드 폭 = min(560, 360 − 24) = 336 px (`engine/src/tutorial/tutorial.css` `.tut{width:min(560px,calc(100% - 24px))}`)
  - 안쪽 폭 = 336 − 2·1(테두리 좌우) − 2·16(안쪽 여백 좌우) = **302 px** (`border:1px`, `padding:14px 16px`. `engine/src/ui/theme.css`의 `*{box-sizing:border-box}`라 336 px 안에 테두리·여백이 포함됨)
  - 최소 배치: 5·44 + 4·g ≤ 302 → 간격 g ≤ 20.5 px. 지금 버튼 사이는 공백 한 칸(약 4 px)이라 여유가 있다
  - 지금 버튼("30°", 글자 약 26 px + 좌우 안쪽 여백 12·2 + 테두리 1·2 ≈ 52 px 폭)도 5·52 + 4·4 = 276 ≤ 302 → 한 줄. 높이는 줄 높이 + 8·2 + 2 ≈ 40 px 안팎으로 44 px에 못 미칠 수 있다 → NFR-001
- Verification: Playwright 360px(및 기존 모바일 390px)에서 15단계 버튼 5개의 경계 상자가 각각 44×44 이상인지, `scrollWidth ≤ clientWidth`인지 확인 (NFR-001)

## 상태 규칙 확인표 (FR-001~FR-004)

슬라이더 θ, 기록된 각도 집합 E에 대해 버튼 a의 상태:

| 조건 | 상태 |
|---|---|
| a ∈ E | 쏜 각도 (비활성) — θ와 상관없이 |
| a ∉ E, θ = a | 현재 |
| 그 밖 | 보통 |

예: E = {30, 45}, θ = 45 → 30 쏜 각도, 40 보통, 45 쏜 각도, 50 보통, 60 보통.
E = {30, 37.5}, θ = 50 → 30 쏜 각도, 50 현재, 나머지 보통 (37.5는 버튼 없음).

## Physical values

| Quantity | Value | Unit | Source | Status |
|---|---|---|---|---|
| 실험 각도 버튼 | 30·40·45·50·60 | ° | `episodes/01-calculus-howitzer/src/missions.ts` 4장 실험 단계 | verified |
| 슬라이더 단위 | 0.5 | ° | `episodes/01-calculus-howitzer/index.html` `#ang` `step` | verified |
| 실험 단계 장약 | 2호 (75) | m/s | `missions.ts` `setCharge(75)` | game value |
| 터치 대상 최소 크기 | 44 × 44 | CSS px | 헌장 PRJ-004, WCAG 2.2 SC 2.5.5 | verified |
| 튜토리얼 카드 폭 @360px | 336 (안쪽 302) | px | `engine/src/tutorial/tutorial.css` `.tut` | verified |
