# Tasks: 튜토리얼 조작 버튼 44px

**Mission**: `howitzer-tutorial-act-buttons-01M5RVRJ` · **Branch**: `mission/howitzer-tutorial-act-buttons` (planning base = merge target)
**Inputs**: [spec.md](spec.md) · [plan.md](plan.md) · [research.md](research.md) · [quickstart.md](quickstart.md) · [answers.md](answers.md)

구현은 기능 브랜치에서 직접 하고 WP마다 커밋한다 (`feat(WP01): …`). `/spec-kitty.implement`·`spec-kitty merge`는 쓰지 않는다 (docs/agents/main.md 6절).

## WP 나누기

엔진 스타일 두 줄과 그 검증·이전 비교 조정이 한 변경이라 WP 하나로 둔다. 스타일만 먼저 커밋하면 이전 비교가 깨진 상태가 되므로 함께 커밋한다.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | `tutorial.css` `.tut-body .act`, `components.css` `.tut-btn`에 min-height·min-width 44px + 주석 | WP01 | |
| T002 | `e2e/helpers.ts` `open()` 옵션 `touch` (기본: 머리말 버튼 크기 변경 끔), `gotoExperimentStep`은 `touch: true` | WP01 | |
| T003 | `e2e/touch-targets.spec.ts`: 열기 버튼, 22단계 카드 버튼, 19·20단계 스크롤 깊이·"다음", 영어 | WP01 | |
| T004 | `playwright.config.ts` CI firefox·webkit 대상에 `touch-targets` 추가 | WP01 | [P] |
| T005 | `pnpm check` + `pnpm test:e2e` 전체 통과 | WP01 | |

## WP01 — 튜토리얼 버튼 최소 44px와 검증

- **Goal**: `.act`·`.tut-btn` 44×44 이상, 세 엔진에서 360px 전 단계 측정, 이전 비교 통과
- **Priority**: P1 (MVP 전부)
- **Independent test**: `pnpm exec playwright test e2e/touch-targets.spec.ts`, 이어서 `pnpm test:e2e`
- **Requirements**: FR-001, FR-002, FR-003, NFR-001, NFR-002, C-001, C-002, C-003
- **Prompt**: [tasks/WP01-touch-target-44px.md](tasks/WP01-touch-target-44px.md) (~200 lines)

T001 엔진 스타일 (WP01)
T002 이전 비교용 크기 끄기 (WP01)
T003 측정 테스트 (WP01)
T004 CI 대상 (WP01)
T005 전체 통과 (WP01)

- **Sketch**: T001 → T002 → (T003 ∥ T004) → T005
- **Dependencies**: none
- **Risks**: 이전 비교 스크린샷·스크롤(머리말 2.75px) / 15단계 `.exp-angs`에 영향 없어야 함 / 세 엔진 전 단계 진행 시간
