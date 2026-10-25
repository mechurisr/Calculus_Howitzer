---
work_package_id: WP02
title: 브라우저 테스트·CI·이전 비교 조정
dependencies:
- WP01
requirement_refs:
- NFR-001
- NFR-002
- NFR-003
- C-003
planning_base_branch: mission/howitzer-tutorial-angle-buttons
merge_target_branch: mission/howitzer-tutorial-angle-buttons
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-tutorial-angle-buttons. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-tutorial-angle-buttons unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
phase: Phase 2 - Verification
history:
- at: '2026-10-25T04:12:54Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: e2e/
create_intent:
- e2e/angle-buttons.spec.ts
execution_mode: code_change
model: ''
owned_files:
- e2e/angle-buttons.spec.ts
- e2e/helpers.ts
- e2e/parity.spec.ts
- playwright.config.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – 브라우저 테스트·CI·이전 비교 조정

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

WP01의 15단계 동작을 브라우저에서 검증하고(Chromium 로컬·CI, Firefox·WebKit CI), 이전 비교 테스트가 C-003의 두 차이(각도 버튼 줄, 관찰 문장)만 허용하게 고친다. 에피소드 코드는 바꾸지 않는다.

먼저 읽을 것: [spec.md](../spec.md) User Stories·Edge Cases·NFR·C-003, [research.md](../research.md) R-7, [answers.md](../answers.md) V1·관찰 문장 선택, `e2e/helpers.ts`(`open`, `advance`, `tap`, `setAngle`, `walkTutorial`, `snapshot`), `e2e/ticks.spec.ts`(형식).

## Branch Strategy

- Planning base / merge target: `mission/howitzer-tutorial-angle-buttons`, WP01 커밋 뒤 같은 브랜치에서 직접
- 끝나면 커밋: `test(WP02): cover tutorial angle buttons and adjust parity (#4)`

## Subtasks

### T007 — `e2e/helpers.ts` 도우미

**Steps**:
1. `gotoExperimentStep(page)`: `open(page, CURRENT, { tutorial: true })` 뒤 `walkTutorial(page, async (_i, step) => step.includes('15 / 22'))`로 15단계에서 멈춤. 도착 확인: `#tutTitle`이 "실험: 각도만 바꿔 보기"
2. `tutFire(page)`: `tap(page, '#tFire')` 뒤 `#tFire`가 다시 켜질 때까지 `advance(page, 500)` 반복(최대 120번), 이어서 `advance(page, 200)` — 착탄 `land` 이벤트로 기록이 추가된 상태
3. `maskExperimentStep(html)`: C-003 허용 차이만 자리표시로 바꾼다. 주석에 C-003과 research R-7
   - 각도 버튼 줄: `data-act="seta"` 버튼 5개를 담은 `<p…>…</p>` 하나 → `<p>[angle-buttons]</p>` (legacy는 `<p><button class="act" data-act="seta" data-v="30">30°</button> …</p>`, current는 `<p class="exp-angs">…</p>`. 두 모양 모두 맞는 정규식, 다른 `seta` 버튼(`θ = … 넣기`, 버튼 하나뿐인 `<p>`)은 15단계에 없지만 5개 연속일 때만 맞게)
   - 관찰 문장: `<p class="fb">…</p>` → `<p class="fb">[observation]</p>` (15단계 본문의 `fb`는 관찰 문장 하나뿐 — 확인 후 주석)
   - `snapshot()`의 `norm()`을 거친 HTML(태그 사이 공백 제거됨)에 적용됨을 전제

### T008 — `e2e/angle-buttons.spec.ts` 동작 시나리오

파일 머리 주석: 미션 경로, "CI에서 chromium·firefox·webkit (playwright.config.ts)". `test.describe.configure({ timeout: 300_000 })` (15단계까지 진행).

**Cases** (각 테스트는 `gotoExperimentStep`부터; 공통 선택자 `#tutBody .exp-angs .act`, `[data-v="30"]` 등):
1. 처음: 다섯 버튼 모두 `enabled`, 슬라이더 각도의 버튼만 `aria-pressed="true"` (US1-1, US2-1). 슬라이더 값은 `#ang` value로 읽어 기대값 계산
2. 30° 누름 → 30만 pressed (US2-2) → `tutFire` → 30 `disabled`, `aria-label` "30°, 이미 쏨", pressed 아님(FR-004), 나머지 4개 enabled (US1-2). 결과 표에 "30.0°" 행
3. 비활성 30 누름(`tap`): `#ang` 값 그대로 (US1-3). 키보드: 40° 버튼에 `focus()` 후 `Shift+Tab` → 초점이 30을 건너뜀 (탭 순서에서 빠짐)
4. 갱신 경로 세 가지 (FR-003, US2-3): 50° 상태에서
   - ± 버튼: `tap(page, '.nudge[data-t="ang"][data-d="0.5"]')` → pressed 없음 → `-0.5` → 50 pressed
   - 키보드: `#ang` focus 후 `ArrowRight`/`ArrowLeft` (`page.keyboard.press`) → 같은 확인
   - 값 직접(`setAngle` helper = input 이벤트, 드래그와 같은 경로) → 같은 확인
   - 각 경우 `window.scrollY`와 `#tut` `scrollTop` 변화 없음
5. 초점 복원: 40° 버튼 `focus()` → `page.keyboard.press('Enter')` → `document.activeElement`가 40° 버튼 (research R-4)
6. 관찰 문장 (FR-007, SC-005):
   - 30·40·45·50 순서로 버튼+발사 → `p.fb`에 "40°·45°·50°는 거리가 거의 같죠?" 포함, "60" 미포함
   - 이어서 60 버튼+발사(5발) → 지금 문장 그대로("30°와 60°도 서로 비슷하죠?")
   - 별도 테스트: 30·40·50·60 → "30°와 60°는 거리가 서로 비슷하죠?" 포함, "45" 미포함
   - 별도 테스트: `setAngle` 37.5 발사 + 30·45·50 버튼 → "표에서 비교" 문장
   - 언어 전환(`#langBtn`) 뒤 영어 문장·영어 `aria-label`("30°, already fired"), 버튼 상태 유지 (Edge Case)
7. 화면 밖 포탄: 기록이 안 되는 경우를 만들기 어려우면(2호는 화면 밖으로 안 감 — 검토 R3 2차) 장약 변경으로 대신: 15단계에서 `#charges` 다른 장약 → 30° 발사 → 30 enabled 유지 (Edge Case "다른 장약")

**Tips**: 시나리오가 길면 `gotoExperimentStep`을 `beforeEach`로. 진행 시간이 길면 관찰 문장 테스트를 한 페이지에서 이어 가기.

### T009 — 배치·대비

1. 360px (`page.setViewportSize({ width: 360, height: 800 })`, 데스크톱 Chromium = 클래식 스크롤바 → 내용 폭 287px 경우): 버튼 5개 경계 상자 각각 `w ≥ 44`, `h ≥ 44`, 모두 같은 `y`(±0.5), 이웃 간격 `next.x − (cur.x + cur.w) ≥ 8 − 0.5`, `document.documentElement.scrollWidth ≤ 360`, `#tut` `scrollWidth ≤ clientWidth` (NFR-001, answers.md V1)
2. 모바일 터치 390px (`e2e/mobile.spec.ts`의 `test.use` 설정을 이 describe에만): 같은 확인
3. 대비 (NFR-002): 밝은·어두운(`page.emulateMedia({ colorScheme: 'dark' })`) 각각 보통·현재·쏜 각도 버튼의 `getComputedStyle` `color`/`background-color`를 읽어 WCAG 상대휘도로 대비 계산 — 보통·현재 ≥ 4.5, 쏜 각도 ≥ 3. 세 상태의 `background-color`가 서로 다름 (색 외 단서). 보통 버튼 배경이 투명이면 카드 배경(`--panel` → `.tut` background)으로 계산
4. `opacity`가 1인지 확인 (검토 R11)

### T010 — CI 대상과 parity

1. `playwright.config.ts`: firefox·webkit `testMatch`를 `/(ticks|mobile|angle-buttons)\.spec\.ts/`로, 주석 갱신 (NFR-003)
2. `e2e/parity.spec.ts` 튜토리얼 비교(`tutorial walkthrough matches legacy`): 단계 이름에 `15 / 22`가 들어간 스냅샷의 `els.tutBody[0]`에 양쪽 모두 `maskExperimentStep` 적용 후 `compare`. 다른 단계·다른 요소는 그대로. 주석에 C-003
3. 마스킹이 실제로 일어났는지 확인하는 단언: 15단계 스냅샷 중 적어도 하나에 `[angle-buttons]`가 있음 (정규식이 안 맞아 조용히 비교가 통과·실패하는 것 방지)

### T011 — 전체 통과

1. `pnpm check`
2. `pnpm test:e2e` (이전 비교 약 8분). 실패는 숨기지 않는다
3. `pnpm preview`를 따로 띄웠다면 4173 포트 node 프로세스 종료

## Definition of Done

- [ ] 새 e2e 통과 (로컬 Chromium), CI 대상에 포함
- [ ] parity 통과, 마스킹 범위가 두 덩어리뿐
- [ ] `pnpm check`·`pnpm test:e2e` 통과
- [ ] 커밋 `test(WP02): …`

## Risks

- 정규식이 넓으면 15단계 설명·결과 표 회귀를 가림 → T010 3번 단언 + 마스킹 전후 길이 차이가 버튼 줄·문장 길이 정도인지 눈으로 확인
- Firefox·WebKit에서 `Shift+Tab` 탭 순서 동작 차이 (WebKit은 기본 설정에서 버튼에 Tab 초점이 안 갈 수 있음) → 탭 순서 단언은 `disabled` 속성 확인으로 대체 가능, 대체했으면 주석
- 15단계까지 진행 시간 — 시간 제한 300초로 부족하면 늘리고 이유를 주석

## Reviewer Guidance

- 시나리오가 spec의 Acceptance Scenarios 번호와 대응하는지
- 마스킹 함수가 legacy·current 양쪽 모양을 모두 정확히 맞추는지
- 대비 계산식이 WCAG 상대휘도(선형화)인지
