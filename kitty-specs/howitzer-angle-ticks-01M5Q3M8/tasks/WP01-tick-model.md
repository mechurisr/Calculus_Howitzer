---
work_package_id: WP01
title: 눈금 계산 모델
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-004
- FR-006
planning_base_branch: mission/howitzer-angle-ticks
merge_target_branch: mission/howitzer-angle-ticks
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-angle-ticks. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-angle-ticks unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 1 - Foundation
history:
- at: '2026-10-25T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: episodes/01-calculus-howitzer/src/model/
create_intent:
- episodes/01-calculus-howitzer/src/model/ticks.ts
- episodes/01-calculus-howitzer/tests/ticks.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/01-calculus-howitzer/src/model/ticks.ts
- episodes/01-calculus-howitzer/tests/ticks.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 눈금 계산 모델

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## ⚠️ IMPORTANT: Review Feedback

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_ref` field in the event log (via `spec-kitty agent tasks status` or the Activity Log below).
- **You must address all feedback** before your work is complete.
- **Report progress**: As you address each feedback item, update the Activity Log explaining what you changed.

---

## Markdown Formatting

Wrap HTML/XML tags in backticks: `` `<div>` ``. Use language identifiers in code blocks.

---

## Objectives & Success Criteria

- 슬라이더 눈금에 필요한 계산을 DOM 없는 순수 함수로 만든다: 각도 → 비율, 눈금 15개 목록, 45° 주석 표시 조건
- 단위 테스트가 비율·목록·조건을 독립 기준(손계산 값, answers.md V1)과 비교한다
- `pnpm check`(타입 검사 + 의존 규칙 + 단위 테스트) 통과

## Context & Constraints

- 스펙: `kitty-specs/howitzer-angle-ticks-01M5Q3M8/spec.md` (FR-001, FR-002, FR-004, FR-006, C-006)
- 정답: `kitty-specs/howitzer-angle-ticks-01M5Q3M8/answers.md` V1 — x(θ) = w/2 + (θ − 10)/70 · (L − w). 이 WP는 비율 f(θ) = (θ − 10)/70만 계산하고, px 변환은 CSS가 한다 (research R-3)
- 데이터 모델: `kitty-specs/howitzer-angle-ticks-01M5Q3M8/data-model.md` (TickMark, AngleNote)
- 헌장 `.kittify/charter/charter.md`: PRJ-001(식 옆 출처 주석), PRJ-002(단위 테스트 필수, model은 DOM 금지), PRJ-003(엔진만 import)
- 기존 패턴: `episodes/01-calculus-howitzer/src/model/*.ts` (주석에 공식·출처, 함수 단위 export), `episodes/01-calculus-howitzer/tests/*.test.ts` (Vitest, 한국어 테스트 이름)
- 계산 코드(`ballistics.ts`, `game.ts`)는 바꾸지 않는다 (C-001)

## Branch Strategy

- **Strategy**: lane worktree per computed lane (`lanes.json`)
- **Planning base branch**: `mission/howitzer-angle-ticks`
- **Merge target branch**: `mission/howitzer-angle-ticks`
- 실행 worktree는 `finalize-tasks`가 계산한 lane에 따라 `.worktrees/` 아래에 배정된다. 구현 명령: `spec-kitty agent action implement WP01 --agent claude`

## Subtasks

### T001 — 눈금 모델 (`src/model/ticks.ts`)

**Purpose**: 각도 범위와 눈금 목록·비율을 한 곳에서 정의한다.

**Steps**:
1. 새 파일 `episodes/01-calculus-howitzer/src/model/ticks.ts`
2. 상수: `ANGLE_MIN = 10`, `ANGLE_MAX = 80` (°), `TICK_STEP = 5`, `EMPHASIS_ANGLE = 45`. 주석: "발사각 슬라이더 범위 — `index.html` `#ang`의 min/max와 같아야 함 (e2e/ticks.spec.ts가 확인)"
3. `export function angleFraction(deg: number): number` — `(deg − ANGLE_MIN) / (ANGLE_MAX − ANGLE_MIN)`. 주석에 answers.md V1 식 전체와 "px 변환은 CSS: left = thumb/2 + f·(100% − thumb)" 명시. 범위 밖 입력은 계산만 하고 자르지 않는다(호출자는 범위 안 각도만 넘김)
4. `export type TickKind = 'major' | 'minor' | 'emphasis'`
5. `export interface TickMark { angle: number; kind: TickKind; label: string | null; f: number }`
6. `export function tickMarks(): TickMark[]` — 10, 15, …, 80 (15개). angle % 10 === 0 → `major`, label = `String(angle)`; angle === 45 → `emphasis`, label = null; 나머지 → `minor`, label = null. 순서는 각도 오름차순
7. 부동소수점: 각도는 정수라 `% 10` 판정에 문제 없음. 루프는 정수 누적(`for (let a = ANGLE_MIN; a <= ANGLE_MAX; a += TICK_STEP)`)

**Files**: `episodes/01-calculus-howitzer/src/model/ticks.ts` (신규, ~40줄)

**Validation**:
- `tickMarks().length === 15`
- major 8개, minor 6개(15·25·35·55·65·75), emphasis 1개(45)
- 45의 label은 null (숫자 줄 겹침 방지 — answers.md V2 주의)

### T002 — 주석 표시 조건 `angleNoteVisible` [P]

**Purpose**: 45° 주석을 언제 보일지 순수 함수로 정한다 (FR-006, data-model AngleNote).

**Steps**:
1. 같은 파일에 `export function angleNoteVisible(state: { seen: boolean; tutDone: boolean }): boolean` → `state.seen || state.tutDone`
2. 주석: "seen = 튜토리얼 4장 '45°는 사거리 그래프의 꼭대기' 단계에 들어간 적 있음, tutDone = 튜토리얼 끝냄·건너뜀. 한 번 보이면 다시 숨기지 않음 (data-model.md)"
3. 저장소 키 이름 상수도 여기 둔다: `export const ANGLE_NOTE_SEEN_KEY = 'howitzer:angleNoteSeen'` (엔진 storage가 `series:` 접두어를 붙임). 실제 load/save는 WP02의 view 코드가 엔진 `@series/engine/ui`의 `load`/`save`로 한다 — model은 DOM·storage를 직접 쓰지 않는다

**Files**: 위와 같음

**Validation**: 진리표 4가지 (false,false)→false, (true,false)→true, (false,true)→true, (true,true)→true

### T003 — 단위 테스트 (`tests/ticks.test.ts`)

**Purpose**: 비율·목록·조건을 독립 기준과 비교해 고정한다 (PRJ-002).

**Steps**:
1. 새 파일 `episodes/01-calculus-howitzer/tests/ticks.test.ts` (Vitest, 기존 `tests/*.test.ts`처럼 `describe`/`it` 한국어 이름)
2. `angleFraction`: 10 → 0, 45 → 0.5, 80 → 1, 30 → 2/7 (`toBeCloseTo`)
3. answers.md V1 손계산 대조: L = 210, w = 22로 x(θ) = w/2 + f·(L − w)를 계산해 x(10) = 11, x(45) = 105, x(80) = 199 (= L − w/2). 주석에 "WP02 CSS와 같은 식"
4. 10° 숫자 간격: (L − w)/7 > 22 (숫자 폭 가정) — 360px의 L = 210, w = 22 → 26.86 px > 22 확인 (answers.md V2를 손잡이 22px로 다시 계산한 값)
5. `tickMarks`: 길이 15, 각도 오름차순·간격 5, kind 개수(8/6/1), label이 major에만 있고 "10"…"80", 45는 emphasis·label null, 모든 f가 0~1이고 단조 증가
6. `angleNoteVisible` 진리표 4가지
7. 대칭 단정 금지(C-006): `tickMarks()` 어디에도 30·60을 짝지은 표시가 없음 — 모델에 그런 필드가 없음을 타입으로 보장하므로 별도 테스트 대신 주석으로 남김

**Files**: `episodes/01-calculus-howitzer/tests/ticks.test.ts` (신규, ~60줄)

**Validation**: `pnpm check` 통과 (기존 39개 + 새 테스트)

## Definition of Done

- [ ] `src/model/ticks.ts`에 상수·`angleFraction`·`tickMarks`·`angleNoteVisible`·키 상수, 식 옆 출처 주석
- [ ] `tests/ticks.test.ts` 통과, 기존 테스트 전부 통과
- [ ] `pnpm check` 통과 (타입·의존 규칙 포함). model 파일은 DOM·localStorage를 쓰지 않음
- [ ] 다른 파일 수정 없음

## Risks

- 슬라이더 범위 상수 중복: `index.html`의 min/max, `game.ts`의 `clampAng`도 10/80을 쓴다. 이번 WP에서 그쪽을 고치지 않는다(C-001). 일치는 WP03 브라우저 테스트가 확인
- 손잡이 폭 22px는 WP02 CSS 값. 테스트는 그 값을 예시로만 쓴다

## Reviewer Guidance

- 식이 answers.md V1과 같은지, 45에 숫자가 없는지, model이 순수한지(DOM·storage 없음) 확인
- 테스트가 함수 결과를 그대로 복사한 값이 아니라 손계산 값과 비교하는지 확인

## Activity Log

- 2026-10-25 — Prompt generated via /spec-kitty.tasks
