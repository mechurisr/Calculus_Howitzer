---
work_package_id: WP02
title: 손잡이·눈금 화면과 45° 주석 시점
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
planning_base_branch: mission/howitzer-angle-ticks
merge_target_branch: mission/howitzer-angle-ticks
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-angle-ticks. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-angle-ticks unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
- T008
phase: Phase 2 - User Stories 1·2
history:
- at: '2026-10-25T00:00:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/01-calculus-howitzer/src/view/
create_intent:
- episodes/01-calculus-howitzer/src/view/ticks.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/01-calculus-howitzer/index.html
- episodes/01-calculus-howitzer/src/style.css
- episodes/01-calculus-howitzer/src/view/ticks.ts
- episodes/01-calculus-howitzer/src/strings.ts
- episodes/01-calculus-howitzer/src/main.ts
- episodes/01-calculus-howitzer/src/missions.ts
- engine/src/tutorial/index.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – 손잡이·눈금 화면과 45° 주석 시점

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
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

- 발사각 슬라이더 아래 3줄: ① 눈금(5° 간격 15곳, 45°는 굵게) ② 숫자 10~80 ③ 45° 주석 "45° · 같은 높이에서 사거리 최대" / "45° · longest range on level ground"
- 손잡이 중심과 해당 눈금이 360/768/1280px에서 ±2px 안 (손잡이를 CSS로 그려 폭 22px 고정)
- 주석은 튜토리얼 4장 "45°는 사거리 그래프의 꼭대기" 단계 진입 또는 튜토리얼 종료·건너뛰기 뒤부터 보이고, 다시 숨기지 않음
- 360px에서 가로 스크롤 0, 숫자·주석 겹침 없음, 양 끝 잘림 없음
- 슬라이더 조작(드래그·± 버튼·0.5° 단위·터치 높이 28px), 계산, 튜토리얼 문구·gate·순서 불변

## Context & Constraints

- 스펙 `kitty-specs/howitzer-angle-ticks-01M5Q3M8/spec.md`: FR-001~FR-006, NFR-001~NFR-005, C-001, C-002, C-006
- 계획 `plan.md` IC-02·IC-03, 결정 `research.md` R-1(손잡이 CSS)·R-2(기준 상자)·R-3(CSS 백분율)·R-5(표시 시점)·R-6(parity가 `data-ticks`를 지움)
- 정답 `answers.md` V1(x 식), V2(겹침 — 45에 숫자 없음)
- WP01 산출물: `src/model/ticks.ts`의 `tickMarks`, `angleNoteVisible`, `ANGLE_NOTE_SEEN_KEY`
- 헌장: PRJ-003(엔진만 import), PRJ-004(모바일), PRJ-007(한/영)
- 현재 마크업 (`index.html` 34행):
  `<div class="row"><button class="nudge" …>−</button><input type="range" id="ang" min="10" max="80" step="0.5" value="45"><button class="nudge" …>+</button></div>`
- 엔진 CSS `engine/src/ui/components.css`: `.row input[type=range]{flex:1;min-width:0;accent-color:var(--accent);height:28px}`
- 테마 토큰: `--accent`, `--line`, `--muted`, `--ink`, `--panel`, `--bg` (라이트·다크 자동)

## Branch Strategy

- **Strategy**: lane worktree per computed lane (`lanes.json`)
- **Planning base branch**: `mission/howitzer-angle-ticks`
- **Merge target branch**: `mission/howitzer-angle-ticks`
- 구현 명령: `spec-kitty agent action implement WP02 --agent claude` (WP01 이후)

## Subtasks

### T004 — `index.html`: 슬라이더 감싸기와 눈금 자리

**Purpose**: 눈금의 기준 상자를 슬라이더 입력과 정확히 같은 폭으로 만든다 (R-2).

**Steps**:
1. `#ang`을 `<div class="ang-track" data-ticks>`로 감싼다. 감싼 div가 `.row` 안에서 ± 버튼 사이 자리를 차지
2. 같은 div 안, input 바로 뒤에 `<div class="ang-ticks" aria-hidden="true"></div>` (눈금·숫자·주석은 T006이 채움)
3. `data-ticks` 속성은 새 CSS의 스위치다. 이전 비교 테스트(WP03 T011)는 이 속성을 지워 원본 모양으로 되돌린다 → 새 스타일은 모두 `.ang-track[data-ticks]` 아래에만 쓴다
4. input의 id·min·max·step·value, ± 버튼은 그대로

**Validation**: `#ang`을 쓰는 기존 코드(`game.ts`의 `$('ang')`, main.ts의 nudge 처리)가 그대로 동작

### T005 — `style.css`: 손잡이와 3줄 배치

**Purpose**: 손잡이 폭을 고정하고 눈금을 비율로 배치한다 (R-1, R-3).

**Steps** (모든 규칙은 `.ang-track[data-ticks]` 아래):
1. 상자: `.ang-track{position:relative;flex:1;min-width:0}`(속성 없이도 flex 자리를 유지하도록 이 한 줄만 속성 밖). `[data-ticks]`에 `--thumb:22px`
2. 입력: `#ang{margin:0;width:100%;height:28px;-webkit-appearance:none;appearance:none;background:transparent}` — 브라우저 기본 margin 2px를 없애 상자 폭 = 입력 폭 (검토 V2 정정)
3. 트랙: `::-webkit-slider-runnable-track`·`::-moz-range-track`에 높이 6px, `background:var(--line)`, 둥근 끝
4. 손잡이: `::-webkit-slider-thumb{-webkit-appearance:none;width:var(--thumb);height:var(--thumb);border-radius:50%;background:var(--accent);border:2px solid var(--panel);margin-top:calc((6px - var(--thumb))/2)}`, `::-moz-range-thumb`는 같은 크기·색(margin 불필요, `box-sizing:border-box` 주의 — 두 엔진에서 외곽 폭이 22px로 같도록 테두리를 폭에 포함)
5. 포커스: 기존 `input:focus-visible` 윤곽선이 유지되는지 확인
6. 눈금 줄 `.ang-ticks`: `position:relative;height:auto`, 안의 각 요소는 `position:absolute; left:calc(var(--thumb)/2 + var(--f) * (100% - var(--thumb))); transform:translateX(-50%)`
   - 눈금 선: major 높이 8px, minor 4px, emphasis 12px·굵게(3px)·`--accent`, 나머지 `--muted`
   - 숫자 줄: 눈금 아래, `font:11px var(--mono)`, `--muted`
   - 주석 줄: 숫자 아래 별도 줄, `font:12px var(--body)`, `--ink`, 한 줄(`white-space:nowrap`). 45°(가운데) 기준이라 360px에서도 상자 안에 들어오는지 확인 (한국어 약 150px, 영어 약 190px — 상자 210px)
   - 세 줄이 겹치지 않게 각 줄에 고정 top 또는 줄별 컨테이너 높이
7. 잘림 방지: 양 끝 숫자가 상자 밖으로 몇 px 나가므로 `.ang-track`·`.row`·`.panel`이 `overflow:hidden`이 아닌지 확인
8. 터치 영역: input 높이 28px 유지 (NFR-003). 눈금 요소는 `pointer-events:none`

**Validation**: 360px·다크 모드에서 눈으로 확인, Firefox에서도 손잡이 크기 동일

### T006 — `view/ticks.ts`: 눈금 DOM과 주석 상태

**Purpose**: WP01 모델로 눈금을 그리고 주석 표시를 관리한다.

**Steps**:
1. 새 파일 `episodes/01-calculus-howitzer/src/view/ticks.ts`
2. `export function renderTicks(root: HTMLElement)` — `tickMarks()`로 눈금 선 15개(`.tick.tick-major|minor|emphasis`), 숫자 8개(`.tick-label`), 주석 1개(`.tick-note`, `data-i18n="angNote"`, f = angleFraction(45))를 만든다. 각 요소에 `style.setProperty('--f', String(t.f))`
3. 주석 텍스트는 data-i18n으로 엔진 `applyLang`이 채우므로, `renderTicks`는 `applyLang` **전에** 호출되어야 한다 (main.ts 순서 확인)
4. `export function refreshAngleNote()` — `angleNoteVisible({ seen: load(ANGLE_NOTE_SEEN_KEY) === '1', tutDone: load('howitzer:tutDone') === '1' })`로 `.tick-note`의 `hidden` 설정 (`load`는 `@series/engine/ui`)
5. `export function markAngleNoteSeen()` — `save(ANGLE_NOTE_SEEN_KEY, '1')` 후 `refreshAngleNote()`
6. 출처 주석: 식은 answers.md V1, 문구 근거는 V3 (발사점·착탄점 높이가 같을 때 45°)

**Files**: 신규 ~50줄

### T007 — `strings.ts`: 주석 문구 [P]

**Steps**: `STRINGS`에 `angNote: P('45° · 같은 높이에서 사거리 최대', '45° · longest range on level ground')` 추가. 숫자는 언어 공통이라 사전에 넣지 않음

### T008 — 튜토리얼 연결과 초기화

**Purpose**: 4장 진입·튜토리얼 종료 시점에 주석을 켠다 (FR-006, R-5).

**Steps**:
1. 엔진 `engine/src/tutorial/index.ts`: `TutorialOptions`에 선택 콜백 `onEnd?: () => void` 추가, `end()`에서 완료 기록 저장 뒤 호출. 다른 동작·DOM은 바꾸지 않음 (템플릿 에피소드는 영향 없음)
2. `src/missions.ts`: `title:P('45°는 사거리 그래프의 꼭대기', …)` 단계 객체에 `enter: () => markAngleNoteSeen()`만 추가. 단계의 ch·title·body·quiz·순서는 그대로 (C-001)
3. `src/main.ts`:
   - `createTutorial({... , onEnd: refreshAngleNote })`
   - `renderTicks(document.querySelector('.ang-ticks')!)`를 `applyLang()` 호출 전에
   - `applyLang()` 뒤 `refreshAngleNote()` (첫 방문이면 tutDone·seen 모두 없어 숨김 → 튜토리얼 자동 시작)
4. "이전" 버튼으로 4장 전으로 돌아가도 주석은 유지 (되감지 않음 — data-model)

**Validation**:
- 저장소를 비우고 열면 주석 없음 → 건너뛰기 누르면 즉시 보임
- 튜토리얼을 4장 해당 단계까지 진행하면 보임 (수동, quickstart.md 2)
- English 전환 시 문구 변경

## Definition of Done

- [ ] quickstart.md 1~6 수동 확인 (360px·다크 모드 포함)
- [ ] `pnpm check` 통과
- [ ] `pnpm test:e2e`: parity의 스크린샷 비교 2건은 실패해도 됨(WP03에서 처리), 나머지(문구·캔버스·튜토리얼 비교, 모바일) 통과 — 튜토리얼 문구·흐름 불변의 증거
- [ ] 새 CSS가 모두 `[data-ticks]` 아래 (속성을 지우면 원본과 같은 모양)
- [ ] 엔진 변경은 `onEnd` 선택 콜백 하나

## Risks

- 의사요소 선택자는 엔진별로 규칙을 나눠야 함(한 규칙에 묶으면 모르는 선택자 때문에 규칙 전체가 무시됨)
- Firefox 손잡이는 기본 `box-sizing`이 달라 테두리 포함 크기가 다를 수 있음 → 외곽 22px 확인
- `applyLang` 순서를 틀리면 주석 텍스트가 비어 보임

## Reviewer Guidance

- C-001: missions.ts diff가 `enter` 한 줄인지, game.ts·model 계산 변경이 없는지
- 새 CSS 범위(`[data-ticks]`), 터치 높이 28px 유지, 주석이 숫자와 다른 줄인지
- 엔진 변경이 하위 호환인지 (`onEnd` 없이도 동작)

## Activity Log

- 2026-10-25 — Prompt generated via /spec-kitty.tasks
