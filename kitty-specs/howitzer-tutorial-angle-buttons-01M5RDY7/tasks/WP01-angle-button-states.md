---
work_package_id: WP01
title: 15단계 각도 버튼 상태와 관찰 문장 (계산 + 화면)
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- NFR-001
- NFR-002
planning_base_branch: mission/howitzer-tutorial-angle-buttons
merge_target_branch: mission/howitzer-tutorial-angle-buttons
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-tutorial-angle-buttons. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-tutorial-angle-buttons unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - User Stories 1·2·3
history:
- at: '2026-10-25T04:12:54Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/01-calculus-howitzer/src/
create_intent:
- episodes/01-calculus-howitzer/src/model/angle-buttons.ts
- episodes/01-calculus-howitzer/tests/angle-buttons.test.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/01-calculus-howitzer/src/model/angle-buttons.ts
- episodes/01-calculus-howitzer/tests/angle-buttons.test.ts
- episodes/01-calculus-howitzer/src/missions.ts
- episodes/01-calculus-howitzer/src/main.ts
- episodes/01-calculus-howitzer/src/style.css
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 15단계 각도 버튼 상태와 관찰 문장

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

튜토리얼 15/22단계("실험: 각도만 바꿔 보기")의 각도 버튼 5개에 세 상태를 표시하고, 쏜 각도 버튼을 비활성으로 만든다. 4발 뒤 관찰 문장을 기록에 맞춘다. 계산(탄도·지형·조준)과 엔진은 바꾸지 않는다.

먼저 읽을 것: [spec.md](../spec.md) §4 상태 표·관찰 문장 표, [data-model.md](../data-model.md), [research.md](../research.md) R-1~R-6, [answers.md](../answers.md) 상태 규칙 확인표·관찰 문장 선택.

## Branch Strategy

- Planning base / merge target: `mission/howitzer-tutorial-angle-buttons`
- 이 브랜치에서 직접 구현한다. lane worktree·`/spec-kitty.implement`는 쓰지 않는다 (docs/agents/main.md 6절, setup-log 막힌 지점 5)
- 끝나면 커밋: `feat(WP01): show angle button states in tutorial step 15 (#4)`

## Subtasks

### T001 — `src/model/angle-buttons.ts` (신규)

**Purpose**: 버튼 상태와 관찰 문장 종류를 DOM 없이 계산 (PRJ-002, data-model.md).

**Steps**:
1. 파일 머리 주석: `// 튜토리얼 15단계 각도 버튼 상태·관찰 문장 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7)` + "여기에는 DOM 없이 계산만" (기존 `model/ticks.ts` 관례)
2. `export const EXP_ANGLES = [30, 40, 45, 50, 60] as const;` — 출처 주석: 기존 `missions.ts` 4장 실험 단계의 버튼 각도
3. `export type AngleButtonState = 'normal' | 'current' | 'fired';`
4. `export function angleButtonState(a: number, theta: number, recorded: readonly number[]): AngleButtonState`
   - `recorded.includes(a)` → `'fired'` (θ와 무관, FR-004)
   - `theta === a` → `'current'` (슬라이더 값은 10 + 0.5k라 이진 정확값 — 주석으로 근거)
   - 그 밖 `'normal'`
5. `export type ObservationKind = 'both' | 'mid' | 'pair' | 'none';`
6. `export function observationKind(recorded: readonly number[]): ObservationKind`
   - `mid = [40, 45, 50].every(a => recorded.includes(a))`, `pair = [30, 60].every(...)`
   - both / mid / pair / none (answers.md 표)
   - 주석: spec FR-007, 검토 R3 ②
7. 인자는 기록 각도 배열(`s.exp.map(q => q.ang)`)로 받는다 — 중복이 있어도 결과 같음

**Validation**: 타입 검사 통과. 상수·함수 export 이름이 위와 같음 (T002·T003이 씀).

### T002 — `tests/angle-buttons.test.ts` (신규) [P]

**Purpose**: answers.md의 표와 예시를 그대로 테스트 기준값으로 (PRJ-002).

**Cases** (`describe`/`it` 한국어 설명, 기존 `tests/ticks.test.ts` 형식):
- 상태: E = [30, 45], θ = 45 → [30,40,45,50,60] 순서로 `['fired','normal','fired','normal','normal']` ("현재" 없음, US2-4)
- 상태: E = [30, 37.5], θ = 50 → `['fired','normal','normal','current','normal']`
- 상태: E = [], θ = 45 → 45만 current
- 상태: θ = 50.5 → current 없음 (US2-3)
- 상태: 중복 기록 [30, 30] → 30 fired
- 관찰: 버튼 4개 조합 5가지 — {40,45,50,60}·{30,40,45,50} → `'mid'`, {30,40,45,60}·{30,40,50,60}·{30,45,50,60} → `'pair'` (answers.md)
- 관찰: 5개 모두 → `'both'`
- 관찰: [30, 37.5, 45, 50] → `'none'`
- `EXP_ANGLES`가 `[30,40,45,50,60]`

**Validation**: `pnpm check` 안의 vitest 통과.

### T003 — `src/missions.ts` 15단계

**Purpose**: 버튼 상태 속성·즉시 갱신 핸들러·관찰 문장 4쌍 (FR-001~FR-007).

**지금 코드** (`missions.ts` 약 227~240행, `{ch:CH4, ... title:P('실험: 각도만 바꿔 보기', ...)`):
- 버튼: `` `<p>${[30,40,45,50,60].map(a=>`<button class="act" data-act="seta" data-v="${a}">${a}°</button>`).join(' ')}</p>` ``
- 관찰 문장: `if(angs.length>=4)h+='<p class="fb">'+tr('40°·45°·50°는 …','40°, 45° and 50° …')+'</p>';`

**Steps**:
1. `import { EXP_ANGLES, angleButtonState, observationKind } from './model/angle-buttons';`
2. 현재 각도: 15단계 `body`에서 슬라이더 값을 읽는다. `game.ts`의 상태(`S`)나 `#ang` 값 중 기존 코드가 쓰는 쪽을 따른다 (`setAngle`이 `ang.value`를 바꾸고 input을 보냄 — `+$('ang').value`가 가장 확실. `$`는 이미 import됨)
3. 버튼 줄을 `<p class="exp-angs">…</p>`로 바꾸고 각 버튼:
   - 공통: `class="act" data-act="seta" data-v="${a}"`, 글자 `${a}°`
   - current: ` aria-pressed="true"`
   - fired: ` disabled aria-label="${tr(`${a}°, 이미 쏨`, `${a}°, already fired`)}"`
   - 버튼 사이 공백 문자 없이 이어 붙인다 (간격은 CSS gap — T005)
4. `on`에 `angle:()=>{}` 추가 — 엔진 `emit('angle')`이 이 단계만 `render(false)` 하게 함. 주석: research R-3
5. 관찰 문장: `if(angs.length>=4)` 안에서 `observationKind(angs)`로 고르고 spec.md §4 표의 한/영 문구 4쌍을 그대로 쓴다. `'both'` 문구는 지금 문장을 **글자 하나 바꾸지 않고** 옮긴다 (`<b>` 태그 위치 포함). `<p class="fb">` 감싸기는 그대로
6. 나머지(장약 문장, 결과 표, 작은 안내 문장, `angleExp` 저장, `gate`, `on.land`, `enter`)는 그대로 (FR-005)

**Validation**: 타입 검사. 15단계 외 단계 코드 diff 없음. 다른 `.act` 버튼(`setaBtn`, 장약 버튼) 그대로 (C-002).

### T004 — `src/main.ts` 갱신 이벤트와 초점 복원

**Purpose**: 드래그·±·키보드에도 곧바로 갱신 (FR-003), 카드 다시 그리기 뒤 키보드 초점 유지 (research R-4).

**Steps**:
1. `['ang', 'vel'].forEach(id => $(id).addEventListener('input', …))` 리스너 안에서 `id === 'ang'`일 때 `tut.emit('angle')` 호출 (또는 `ang` 전용 리스너 한 줄 추가). 주석: "튜토리얼 15단계가 버튼 '현재' 표시를 다시 그림 (research R-3). 다른 단계는 on.angle이 없어 무시됨"
2. `tut`이 리스너보다 먼저 만들어져 있는지 확인 (지금 `createTutorial`이 위에 있음)
3. 초점 복원:
   - `let focusAng: string | undefined;`
   - `onAction`: `seta`이고 `a.closest('.exp-angs')`면 `focusAng = a.dataset.v`
   - `onRender`: 지금 `updateFlightBtns`만 부르므로 `() => { updateFlightBtns(); restoreAngFocus(); }`로 바꾼다
   - `restoreAngFocus`: `focusAng`가 있고 `document.activeElement`가 `body`(또는 null)일 때 `#tutBody .exp-angs [data-v="${focusAng}"]`가 있고 `disabled`가 아니면 `focus({ preventScroll: true })`. 값은 지우지 않는다 (각도 버튼 클릭은 render가 두 번 — research R-3 Note)
4. 엔진 파일은 건드리지 않는다 (C-004)

**Validation**: 15단계에서 ± 버튼으로 50 → 50.5 → 50: 50 버튼 강조가 꺼졌다 켜짐, 화면 스크롤 없음. Tab으로 40° 버튼 → Enter → 초점이 40° 버튼에 남음.

### T005 — `src/style.css` 전용 스타일 [P]

**Purpose**: 한 줄·44px·간격 8px (NFR-001), 상태별 채움 (NFR-002). 공용 `.act`는 바꾸지 않음 (C-002).

**Rules** (research R-2·R-5, 출처 주석에 answers.md V1 상한 51.0px와 대비 값 적기):
```css
/* 튜토리얼 15단계 각도 버튼 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7). 공용 .act 는 그대로 */
.tut-body .exp-angs{display:flex;flex-wrap:nowrap;gap:8px}
.tut-body .exp-angs .act{flex:1 1 0;min-width:44px;min-height:44px;padding:0 4px}
.tut-body .exp-angs .act[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.tut-body .exp-angs .act:disabled{background:var(--line);border-color:var(--line);color:var(--muted);cursor:default}
```
- `opacity` 쓰지 않음 (검토 R11)
- 엔진 `tutorial.css`의 `.tut-body p{margin:0 0 8px}`가 줄에도 적용되는지 확인 (그대로 두면 됨)

**Validation**: 360px 개발자 도구에서 5개 한 줄, 높이 44 이상. 밝은·어두운 테마 확인.

### T006 — 검사와 손 확인

1. `pnpm check` (타입·의존 규칙·단위 테스트) 통과
2. `pnpm dev` → quickstart.md "손으로 확인" 1~8. 결과를 커밋 메시지 본문이나 PR 메모에 적는다
3. `pnpm test:e2e`는 이 시점에 parity 15단계가 실패한다 (WP02에서 조정) — 숨기지 말고 WP02로 넘긴다

## Definition of Done

- [ ] T001~T005 구현, `pnpm check` 통과
- [ ] 15단계 외 단계·공용 `.act`·엔진 diff 없음
- [ ] 관찰 문장 'both'가 기존 문장과 글자까지 같음
- [ ] 새 학습자 문구(관찰 문장 3쌍, aria-label) 한/영 (PRJ-007)
- [ ] 커밋 `feat(WP01): …`

## Risks

- `tut.render`를 input에서 직접 부르면 다른 단계(조준 단계 등) 본문이 슬라이더마다 다시 그려져 parity가 흔들림 → 반드시 `emit('angle')` + 15단계 `on.angle`
- 버튼 사이 공백을 남기면 flex 안에서 텍스트 노드가 되진 않지만 parity 마스킹 정규식(WP02)과 맞춰야 함 — 공백 없이
- Firefox·WebKit의 `button:disabled` 기본 색이 덮어쓰지 않도록 `color`를 명시

## Reviewer Guidance

- 상태 규칙이 answers.md 표와 같은지, fired가 current보다 우선인지
- 초점 복원이 사용자가 옮긴 초점을 빼앗지 않는지 (`activeElement === body` 조건)
- 스타일 선택자가 `.exp-angs` 안으로 한정되는지
