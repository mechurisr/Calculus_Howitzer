---
work_package_id: WP01
title: 튜토리얼 버튼 최소 44px와 검증
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- NFR-001
- NFR-002
planning_base_branch: mission/howitzer-tutorial-act-buttons
merge_target_branch: mission/howitzer-tutorial-act-buttons
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-tutorial-act-buttons. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-tutorial-act-buttons unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - User Story 1
history:
- at: '2026-10-25T07:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: engine/src/
create_intent:
- e2e/touch-targets.spec.ts
execution_mode: code_change
model: ''
owned_files:
- engine/src/tutorial/tutorial.css
- engine/src/ui/components.css
- e2e/touch-targets.spec.ts
- e2e/helpers.ts
- playwright.config.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 튜토리얼 버튼 최소 44px와 검증

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

튜토리얼 카드의 조작 버튼(`.tut-body .act`)과 머리말 튜토리얼 열기 버튼(`.tut-btn`)을 44×44 CSS px 이상으로 만들고(헌장 PRJ-004), 세 엔진 CI에서 360px 전 단계 측정으로 확인한다. 모양·문구·계산은 그대로.

먼저 읽을 것: [spec.md](../spec.md), [research.md](../research.md) R-1~R-4, [answers.md](../answers.md) V1, `e2e/helpers.ts`(`open`, `walkTutorial`, `gotoExperimentStep`), `e2e/angle-buttons.spec.ts`(형식).

## Branch Strategy

- Planning base / merge target: `mission/howitzer-tutorial-act-buttons`. 이 브랜치에서 직접 구현
- 커밋 한 번: `feat(WP01): raise tutorial buttons to 44px touch targets (#9)` — 스타일과 테스트 조정을 같이 (스타일만 커밋하면 이전 비교가 깨짐)

## Subtasks

### T001 — 엔진 스타일

1. `engine/src/tutorial/tutorial.css` `.tut-body .act{…}` 끝에 `min-height:44px;min-width:44px` 추가
2. `engine/src/ui/components.css` `.tut-btn{…}` 끝에 같은 두 속성
3. 각 규칙 바로 위 한 줄 주석 (research R-4): `/* 터치 대상 44px (헌장 PRJ-004, kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ): 원래 높이 41.25px → 최소 44. 고정 높이는 긴 문구를 자르므로 min */`
4. 여백·테두리·색·글자는 손대지 않음 (FR-002). `height` 쓰지 않음 (검토 R2)

**Validation**: 360px 개발자 도구에서 `#tutOpen` 높이 44, 19/22단계 "θ = …° 넣기" 높이 44. 15/22단계 각도 버튼 배치 그대로.

### T002 — 이전 비교에서 머리말 버튼 크기 변경 끄기 (`e2e/helpers.ts`)

1. `open()` 옵션 타입에 `touch?: boolean` 추가, `addInitScript` 인자로 전달
2. `touch`가 false면(기본) 기존 `data-ticks` 처리와 같은 `readystatechange`(interactive) 시점에 `<style>.tut-btn{min-height:0!important;min-width:0!important}</style>`를 `head`에 추가
3. 주석: "원본 비교는 머리말 튜토리얼 버튼 44px 변경 전 배치로 (kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ C-002, research R-2): 2.75px 밀려 스크린샷·스크롤 위치가 달라지기 때문. 44px 자체는 touch-targets.spec.ts 가 검사. 카드 안 .act 는 고정 카드 안이라 끄지 않음"
4. `gotoExperimentStep`의 `open(...)`에 `touch: true` 추가 (15단계 테스트는 실제 배치로)

**Validation**: `pnpm typecheck`. 이전 비교 테스트 통과(T005).

### T003 — `e2e/touch-targets.spec.ts` (신규)

머리 주석: 미션 경로, "CI 에서는 chromium·firefox·webkit". `test.describe.configure({ timeout: 600_000 })`. 뷰포트 360×800.

공통 도우미: 보이는 버튼 경계 상자 목록 `page.locator('#tut button').evaluateAll(...)` (`offsetParent`가 있는 것만), 실패 메시지에 단계·버튼 글자 포함.

**Cases**:
1. 열기 버튼 (FR-003, US1-4): `open(page, CURRENT, { touch: true, ticks: true })`(튜토리얼 완료 상태) → `#tutOpen` 너비·높이 ≥ 44, `document.documentElement.scrollWidth ≤ 360` (NFR-002)
2. 전 단계 카드 버튼 (FR-001, US1-1·2, NFR-001): `open(page, CURRENT, { tutorial: true, touch: true, ticks: true })` → `walkTutorial` 콜백에서 매 단계 보이는 버튼 모두 `w ≥ 44 && h ≥ 44` (`expect.soft` 대신 실패 단언, 검토 S4), 가로 스크롤 없음. 19/22단계에서 `.act`가 실제로 측정됐는지(적어도 1개) 단언
3. 스크롤 깊이·"다음" (US1-5, 검토 S5): 같은 진행 중 단계 이름에 `19 / 22` 또는 `20 / 22`가 처음 보일 때
   - `#tut`를 끝까지 스크롤(`scrollTop = scrollHeight`) → `#tutNext`의 경계 상자가 `#tut`의 경계 상자 안 (세로)
   - 깊이 `d1 = scrollHeight − clientHeight`. 스타일 주입 `.tut-body .act{min-height:0!important;min-width:0!important}` 후 `d0` 측정, 주입한 `<style>` 제거. `d1 − d0 ≤ (보이는 .act 수) × 2.75 + 1`
   - `scrollTop`을 원래대로 (진행에 영향 없게)
4. 영어 (Edge Case): 2번 진행 전에 `#langBtn`을 눌러 영어로 하는 별도 테스트는 시간이 두 배 → 2번 테스트에서 19단계 도착 시 `#langBtn` 눌러 영어로 측정 후 다시 한국어로 (문구 길이만 다름)

**Tips**: `walkTutorial`의 onStep 콜백은 async라 측정을 넣기 좋음. `open`은 `helpers.ts`의 것(가짜 시계) — 크기 측정에는 영향 없음.

### T004 — CI 대상 [P]

`playwright.config.ts` firefox·webkit `testMatch`를 `/(ticks|mobile|angle-buttons|touch-targets)\.spec\.ts/`로, 위 주석의 목록에도 추가 (NFR-001, 검토 R3).

### T005 — 전체 통과

1. `pnpm check`
2. `pnpm exec playwright test e2e/touch-targets.spec.ts` → `pnpm test:e2e` (이전 비교 포함). 실패 숨기지 않음
3. `pnpm preview`를 띄웠다면 4173 포트 node 종료

## Definition of Done

- [ ] 두 CSS 규칙에 min-height·min-width 44px + 주석, 다른 속성 그대로
- [ ] 새 e2e 통과, CI 세 엔진 대상
- [ ] 이전 비교 통과 (머리말 크기만 끈 상태)
- [ ] `pnpm check`·`pnpm test:e2e` 통과, 커밋 `feat(WP01): …`

## Risks

- 이전 비교: 카드 안 `.act` 높이도 `#tut` HTML에는 안 나타나지만, 혹시 스냅샷이 달라지면 `touch` 끄기 대상을 `.tut-body .act`까지 넓히되 15단계 `.exp-angs .act`(에피소드 44px)는 건드리지 않게 선택자 주의
- WebKit·Firefox 폰트 폭 차이 — 높이 기준이라 영향 적음
- 세 엔진 전 단계 진행 시간 → 시간 제한 600초, 부족하면 늘리고 주석

## Reviewer Guidance

- `height` 고정 없이 `min-*`인지, 다른 속성 diff가 없는지
- 이전 비교에서 끄는 범위가 `.tut-btn` 크기뿐인지
- 측정 테스트가 실패 단언이고 360px인지
