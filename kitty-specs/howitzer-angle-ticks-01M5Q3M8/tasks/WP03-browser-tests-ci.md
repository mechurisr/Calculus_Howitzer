---
work_package_id: WP03
title: 브라우저 테스트와 CI
dependencies:
- WP02
requirement_refs:
- FR-004
- FR-005
- FR-006
subtasks:
- T009
- T010
- T011
- T012
- T013
phase: Phase 3 - Verification
history:
- !!omap
  - at: '2026-10-25T00:00:00Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: e2e/
create_intent:
- e2e/ticks.spec.ts
execution_mode: code_change
model: ''
owned_files:
- e2e/ticks.spec.ts
- e2e/parity.spec.ts
- playwright.config.ts
- .github/workflows/ci.yml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – 브라우저 테스트와 CI

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

- 눈금의 위치(±2px)·겹침·가로 스크롤·언어·표시 시점을 브라우저 테스트로 확인 (NFR-001, NFR-002, FR-005, FR-006, SC-002, SC-003)
- 이전 비교 테스트는 `data-ticks`를 지운 상태로 원본과 픽셀 비교를 계속 통과 (C-005, SC-004)
- CI에서 눈금·모바일 테스트를 Chromium·Firefox·WebKit으로 실행 (NFR-004)

## Context & Constraints

- 스펙·계획: `kitty-specs/howitzer-angle-ticks-01M5Q3M8/spec.md`, `plan.md` IC-04, `research.md` R-4(측정)·R-6(parity)·R-7(projects)
- 기존 테스트: `e2e/helpers.ts`(시드·시계 고정, `advance`, `tap`), `e2e/parity.spec.ts`(원본 비교, 약 3~8분), `e2e/mobile.spec.ts`
- `playwright.config.ts`: 현재 projects 없음, `channel`은 `PW_CHANNEL`(기본 'chrome', CI는 빈 값 → 번들 Chromium)
- `.github/workflows/ci.yml`: 현재 `pnpm exec playwright install --with-deps chromium`
- WP02 산출물: `.ang-track[data-ticks]`, `.ang-ticks` 안의 `.tick`, `.tick-label`, `.tick-note`, 손잡이 색 `--accent`, 폭 22px
- 로컬(Arch)에서는 Playwright Firefox·WebKit을 못 돌릴 수 있음 → CI 결과가 기준. 로컬은 chromium project만

## Branch Strategy

- **Strategy**: lane worktree per computed lane (`lanes.json`)
- **Planning base branch**: `mission/howitzer-angle-ticks`
- **Merge target branch**: `mission/howitzer-angle-ticks`
- 구현 명령: `spec-kitty agent action implement WP03 --agent claude` (WP02 이후)

## Subtasks

### T009 — `e2e/ticks.spec.ts`: 배치·언어·표시 시점

**Steps**:
1. 새 파일, 각 테스트 전 `localStorage` 조작은 `page.addInitScript`
2. 범위 일치: `#ang`의 min/max가 10/80 (WP01 상수와 같음)
3. 360·768·1280px 각각: 가로 스크롤 0 (`scrollWidth ≤ innerWidth`), `.tick-label` 8개와 `.tick-note`의 경계 상자가 서로 겹치지 않음, 모두 화면 안
4. 언어: tutDone=1 상태에서 주석이 "45° · 같은 높이에서 사거리 최대", English 버튼 후 "45° · longest range on level ground"
5. 시점: (a) 저장소 비움 → 튜토리얼 진행 중 `.tick-note` 숨김 → 건너뛰기 클릭 → 보임 (b) `series:howitzer:angleNoteSeen=1`만 있음 → 보임 (c) tutDone=1 → 보임. 4장 단계 진입 자체는 튜토리얼 gate 때문에 자동화가 무거워 수동 확인(quickstart 2)으로 둠 — 테스트 파일 주석에 명시
6. C-006/SC-003: 눈금 영역 텍스트에 "같은 거리"·"same distance"가 없고, "최대"가 들어간 문구는 조건("같은 높이"/"level ground")과 함께만 나옴

### T010 — `e2e/ticks.spec.ts`: 손잡이-눈금 위치 ±2px

**Purpose**: 손잡이는 의사요소라 DOM 좌표가 없으므로 스크린샷 픽셀로 잰다 (R-4).

**Steps**:
1. 360·768·1280px에서 슬라이더를 10·45·80°로 설정(값 설정 + `input` 이벤트)
2. `.ang-track`의 스크린샷(`locator.screenshot()`, deviceScaleFactor 1)을 찍고, `getComputedStyle(document.documentElement).getPropertyValue('--accent')` 색과 가까운(채널 차 ±40) 픽셀 중 슬라이더 높이(위쪽 28px) 안에 있는 것들의 가로 평균 = 손잡이 중심
3. 해당 각도의 눈금 요소(45는 `.tick-emphasis`, 10·80은 해당 `.tick-major`) 중심 x와 비교 → 차이 ≤ 2 CSS px
4. 창 크기 변경(1280 → 360) 후 같은 측정 반복 (리사이즈 대응)
5. PNG 디코딩: 의존성 추가 없이 — 페이지 안에서 `canvas`에 스크린샷을 그리는 대신, `page.evaluate`로 손잡이와 같은 위치를 계산하지 말 것(식이 틀려도 통과). 권장: `page.screenshot` 버퍼를 페이지에 `data:` URL로 넘겨 `<img>`→`canvas.getImageData`로 픽셀을 읽는다 (브라우저 내장 디코더, 새 패키지 없음)

### T011 — `e2e/parity.spec.ts`: 스크린샷 비교에서 `data-ticks` 제거 [P]

**Steps**:
1. `screenshots match legacy` 테스트에서 CURRENT 페이지를 연 직후 `document.querySelector('.ang-track')?.removeAttribute('data-ticks')`와 `.ang-ticks`를 `display:none` 처리 (새 CSS가 꺼져 원본과 같은 손잡이·여백)
2. LEGACY에는 아무것도 하지 않음
3. 나머지 비교(free play, tutorial walkthrough의 문구·버튼·캔버스)는 그대로 — `snapshot()`의 대상 id에 눈금이 없으므로 수정 불필요. 단 튜토리얼 walkthrough가 주석 표시 변화로 깨지면 원인을 보고(C-001 위반 여부)
4. 주석: "C-005: 눈금 줄이 추가되면 아래 내용이 밀려 마스크로는 비교 불가 → 속성을 지워 원본 배치로 되돌림 (research R-6)"

### T012 — `playwright.config.ts`: projects [P]

**Steps**:
1. `projects`: `chromium`(모든 테스트, 기존 `use` 그대로), `firefox`·`webkit`은 `testMatch: /(ticks|mobile)\.spec\.ts/`, `use: { browserName: 'firefox' | 'webkit' }`, **CI에서만** 포함(`process.env.CI`)
2. 로컬 기본 실행이 chromium만 도는지 확인

### T013 — `.github/workflows/ci.yml` [P]

**Steps**: 설치 단계를 `pnpm exec playwright install --with-deps chromium firefox webkit`로. 실행 명령은 그대로 (`pnpm test:e2e`가 projects 전부 실행). 시간 증가(약 2~3분) 확인

## Definition of Done

- [ ] 로컬 `pnpm test:e2e` (chromium) 전부 통과 — parity 스크린샷 2건 포함
- [ ] `pnpm check` 통과 (`e2e/`는 tsconfig 대상)
- [ ] PR CI에서 chromium·firefox·webkit project 통과 (로컬에서 못 돌린 엔진은 CI가 기준)
- [ ] 새 npm 패키지 없음

## Risks

- 손잡이 색 픽셀 찾기: 안티앨리어싱 가장자리 때문에 중심이 0.5px 정도 흔들릴 수 있음 → 허용 2px 안
- WebKit의 range 렌더링 차이로 손잡이 세로 위치가 다를 수 있음 → 세로 범위를 슬라이더 높이 전체로
- parity 튜토리얼 비교가 주석 때문에 달라지면 `snapshot()`의 대상에 없는지 먼저 확인

## Reviewer Guidance

- 위치 테스트가 실제 픽셀을 재는지(식을 다시 계산해 비교하는 순환 테스트가 아닌지)
- parity가 다른 비교를 약화하지 않았는지
- CI 시간이 합리적인지

## Activity Log

- 2026-10-25 — Prompt generated via /spec-kitty.tasks
