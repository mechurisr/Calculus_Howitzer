# Answers and Verification: 튜토리얼 조작 버튼 44px

검토 에이전트는 `spec.md`의 V1을 먼저 직접 푼 뒤 이 파일과 비교할 것.
이 미션은 계산을 바꾸지 않는다(C-003). 정답은 버튼 높이 계산 하나다.

## V1. 지금 `.act` 버튼 높이

- Answer: **41.25 px**, 44 px에 **2.75 px** 모자람
- Derivation:
  - 줄 높이 = 15 px × 1.55 = 23.25 px (`engine/src/ui/theme.css` `body{font-size:15px;line-height:1.55}`, `.act`는 `font:inherit`)
  - 안쪽 여백 위아래 8 + 8 = 16 px, 테두리 위아래 1 + 1 = 2 px (`.tut-body .act{padding:8px 12px;border:1px solid …}`)
  - 높이 = 23.25 + 16 + 2 = **41.25 px** (전역 `box-sizing:border-box`지만 높이를 지정하지 않아 내용에서 정해짐)
  - 실측: 360px 19/22단계 "θ = 27.0° 넣기" 119 × 41.25 px (2026-10-25, Chromium)
- Verification: 브라우저 테스트로 수정 후 높이 ≥ 44 px (NFR-001). 최소 높이 44 px를 주면 내용(23.25 px)은 가운데 정렬되어 위아래 여백이 각 9.375 px가 됨

## Physical values

| Quantity | Value | Unit | Source | Status |
|---|---|---|---|---|
| 터치 대상 최소 크기 | 44 × 44 | CSS px | 헌장 PRJ-004, WCAG 2.2 SC 2.5.5 (Level AAA) | verified |
| 본문 글자 크기·줄 높이 | 15, 1.55 | px, 배수 | `engine/src/ui/theme.css` | verified |
| `.act` 안쪽 여백·테두리 | 8 / 12, 1 | px | `engine/src/tutorial/tutorial.css` | verified |
| 지금 `.act` 높이 | 41.25 | px | 위 계산 + 360px 실측 | verified |
