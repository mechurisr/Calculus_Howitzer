# Tasks: 튜토리얼 5단계 설명 순서와 문구

**Mission**: `howitzer-tutorial-step5-text-01M5S15W` · **Branch**: `mission/howitzer-tutorial-step5-text` (planning base = merge target)
**Inputs**: [spec.md](spec.md) · [plan.md](plan.md) · [research.md](research.md) · [quickstart.md](quickstart.md) · [answers.md](answers.md)

구현은 기능 브랜치에서 직접, 커밋 `feat(WP01): …`. `/spec-kitty.implement`·`spec-kitty merge`는 쓰지 않는다.

## WP 나누기

문구 변경과 그 검증(이전 비교 변환)이 한 변경이라 WP 하나. 문구만 커밋하면 이전 비교가 깨짐.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | `missions.ts` 5단계: 발사 전 문장 치환(한/영), 표 설명 문단을 🤔 앞으로 | WP01 | |
| T002 | `e2e/helpers.ts` `legacyStep5`, `parity.spec.ts` 5단계 변환 비교·적용 단언 | WP01 | |
| T003 | `e2e/step5-text.spec.ts`: 발사 전 문구, 진행 뒤 순서 (한/영) | WP01 | [P] |
| T004 | `playwright.config.ts` CI 대상 추가 | WP01 | [P] |
| T005 | `pnpm check` + `pnpm test:e2e` 전체 통과 | WP01 | |

## WP01 — 5단계 문구·순서와 검증

- **Goal**: spec §4 ①·② 그대로, 이전 비교는 변환 후 정확 비교
- **Priority**: P1
- **Independent test**: `pnpm exec playwright test e2e/step5-text.spec.ts`, `pnpm test:e2e`
- **Requirements**: FR-001, FR-002, FR-003, NFR-001, C-001, C-002, C-003
- **Prompt**: [tasks/WP01-step5-order-text.md](tasks/WP01-step5-order-text.md) (~180 lines)

T001 문구·순서 (WP01)
T002 이전 비교 변환 (WP01)
T003 새 테스트 (WP01)
T004 CI 대상 (WP01)
T005 전체 통과 (WP01)

- **Sketch**: T001 → (T002 ∥ T003 ∥ T004) → T005
- **Dependencies**: none
- **Risks**: 검토 R1의 세 함정 (research R-2)
