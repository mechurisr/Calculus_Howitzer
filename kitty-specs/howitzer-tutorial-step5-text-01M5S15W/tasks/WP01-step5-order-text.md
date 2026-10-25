---
work_package_id: WP01
title: 5단계 문구·순서와 검증
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- NFR-001
planning_base_branch: mission/howitzer-tutorial-step5-text
merge_target_branch: mission/howitzer-tutorial-step5-text
branch_strategy: Planning artifacts for this mission were generated on mission/howitzer-tutorial-step5-text. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into mission/howitzer-tutorial-step5-text unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 - User Stories 1·2
history:
- at: '2026-10-25T08:40:00Z'
  actor: system
  action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: episodes/01-calculus-howitzer/src/
create_intent:
- e2e/step5-text.spec.ts
execution_mode: code_change
model: ''
owned_files:
- episodes/01-calculus-howitzer/src/missions.ts
- e2e/step5-text.spec.ts
- e2e/helpers.ts
- e2e/parity.spec.ts
- playwright.config.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – 5단계 문구·순서와 검증

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter (or any user-defined profile), and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

튜토리얼 5/22단계 "손으로 쌓아 보기"의 발사 전 안내 마지막 문장을 바꾸고(한/영), 진행 뒤 본문에서 표 설명 문단을 표 바로 다음·"🤔 그런데…" 앞으로 옮긴다. 이전 비교는 원본에 같은 변환을 적용해 정확히 비교한다.

먼저 읽을 것: [spec.md](../spec.md) §4 ①·② 표, NFR-001, [research.md](../research.md) R-1~R-3.

## Branch Strategy

- `mission/howitzer-tutorial-step5-text`에서 직접. 커밋 한 번: `feat(WP01): reorder tutorial step 5 explanation and reword its prompt (#10)`

## Subtasks

### T001 — `missions.ts` 5단계

1. 발사 전 문장: `'…그다음 <b>0.5초 진행 ⏭</b>을 눌러 한 걸음씩 날려 보세요.'` → `'…눌러 포탄을 0.5초씩 앞으로 보내 보세요.'`, 영어 `'…to move it one step at a time.'` → `'…to send the shell forward 0.5 s at a time.'` — 나머지 글자 그대로
2. `if(r.length){ … }` 블록: `h+=stepTable(s);` 다음에 표 설명 `<p class="small">vy가 매번 약 <b>4.9씩</b>…</p>`를 먼저 붙이고, 이어서 기존 🤔 문단과 이유 상자. 기존 위치(이유 상자 뒤)의 표 설명은 지움. 문단 글자는 그대로
3. 주석 한 줄: `// 표 → 표 설명 → 🤔 의문 → 이유 순서 (kitty-specs/howitzer-tutorial-step5-text-01M5S15W FR-001)`
4. 음수 조각·"더 눌러 봐도 되고" 문단 위치 그대로

### T002 — 이전 비교 변환

1. `e2e/helpers.ts`: `export function legacyStep5(html: string): { html: string; replaced: boolean; reordered: boolean }` (research R-2의 두 변환, 주석에 검토 R1)
2. `e2e/parity.spec.ts` 튜토리얼 비교: legacy 결과에서 라벨이 `/ · 5 \/ 22$/`에 맞는 스냅샷의 `els.tutBody[0]`, `els.tut[0]` 둘 다 변환. `replaced`·`reordered`가 각각 한 번 이상 참이었는지 단언 (`tutBody` 기준으로 셈). 15단계 마스킹은 그대로
3. 15단계 라벨 판정(`includes('15 / 22')`)과 겹치지 않는지 확인

### T003 — `e2e/step5-text.spec.ts` [P]

research R-3대로. 머리 주석에 미션 경로·CI 세 엔진. 본문 최상위 자식 순서는 `#tutBody` 자식의 태그·클래스·앞 글자로 판정. 시간 제한 120초.

### T004 — CI 대상 [P]

`playwright.config.ts` `testMatch`에 `step5-text` 추가, 주석 목록 갱신.

### T005 — 전체 통과

`pnpm check`, `pnpm test:e2e`. 4173 포트 정리.

## Definition of Done

- [ ] 발사 전 문장 한/영 바뀜, 표 설명 위치 바뀜, 다른 글자 diff 없음
- [ ] 이전 비교: 5단계 변환 후 정확 비교, 변환 적용 단언
- [ ] 새 테스트 통과, CI 대상
- [ ] `pnpm check`·`pnpm test:e2e` 통과, 커밋

## Risks

- 검토 R1 세 함정 (라벨 충돌, 무적용 통과, `#tut` 누락)
- 재배치 정규식: 이유 상자 안 `<span class="small">`이 `p.small` 정규식에 잡히지 않게 `<p class="small">vy가 매번 약`으로 시작을 고정

## Reviewer Guidance

- `missions.ts` diff가 문장 하나와 문단 이동뿐인지
- legacy 변환이 current를 보고 만든 것이 아니라 원본에 규칙을 적용한 것인지
