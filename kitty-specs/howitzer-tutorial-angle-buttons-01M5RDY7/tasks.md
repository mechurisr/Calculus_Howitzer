# Tasks: 튜토리얼 실험 단계 각도 버튼 상태

**Mission**: `howitzer-tutorial-angle-buttons-01M5RDY7` · **Branch**: `mission/howitzer-tutorial-angle-buttons` (planning base = merge target)
**Inputs**: [spec.md](spec.md) · [plan.md](plan.md) · [research.md](research.md) · [data-model.md](data-model.md) · [quickstart.md](quickstart.md) · [answers.md](answers.md)

구현은 기능 브랜치에서 직접 하고 WP마다 커밋한다 (`feat(WPnn): …`). `/spec-kitty.implement`·`spec-kitty merge`는 쓰지 않는다 (docs/agents/main.md 6절).

## WP 나누기

plan.md의 구현 관심사 IC-01(버튼 상태)·IC-02(관찰 문장)는 같은 파일(`missions.ts`, 모델, e2e)을 건드려 WP 소유 파일이 겹친다. 그래서 다음처럼 나눈다.

- **WP01** = 계산 두 개 + 그 계산을 쓰는 15단계 화면 전부 (IC-01·IC-02의 코드). 죽은 코드 없음
- **WP02** = 브라우저 테스트·CI·이전 비교 조정 (IC-01·IC-02의 e2e). 코드 변경 없음

WP01만 커밋된 시점에는 이전 비교 테스트(15단계 tutBody)가 실패한다. PR 전 `pnpm test:e2e` 통과는 WP02 뒤에 확인한다.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | `src/model/angle-buttons.ts`: `EXP_ANGLES`, `angleButtonState`, `observationKind` | WP01 | |
| T002 | `tests/angle-buttons.test.ts`: 상태 확인표·관찰 문장 조합 단위 테스트 | WP01 | [P] |
| T003 | `missions.ts` 15단계: 버튼 상태 속성·`on.angle`·관찰 문장 4쌍 | WP01 | |
| T004 | `main.ts`: 슬라이더 input → `tut.emit('angle')`, 각도 버튼 초점 복원 | WP01 | |
| T005 | `style.css`: `.exp-angs` 한 줄 배치와 상태 스타일 | WP01 | [P] |
| T006 | `pnpm check` + 손으로 확인 (quickstart 1~8) | WP01 | |
| T007 | `e2e/helpers.ts`: 15단계까지 진행·튜토리얼 발사 도우미, 15단계 비교 마스킹 함수 | WP02 | |
| T008 | `e2e/angle-buttons.spec.ts`: 상태·비활성·갱신 경로·접근성·관찰 문장 | WP02 | |
| T009 | `e2e/angle-buttons.spec.ts`: 360px·390px 배치, 테마 대비 | WP02 | |
| T010 | `playwright.config.ts` CI firefox·webkit 대상 추가, `parity.spec.ts` 마스킹 적용 | WP02 | |
| T011 | `pnpm check` + `pnpm test:e2e` 전체 통과 확인 | WP02 | |

## WP01 — 15단계 각도 버튼 상태와 관찰 문장 (계산 + 화면)

- **Goal**: 버튼 세 상태(보통·현재·쏜 각도)와 관찰 문장 네 가지를 순수 함수로 정하고 15단계 화면에 그린다. 슬라이더 어떤 조작에도 곧바로 갱신
- **Priority**: P1 (MVP — US1·US2·US3·FR-007 화면 동작 전부)
- **Independent test**: `pnpm check` 통과 + `pnpm dev`에서 quickstart "손으로 확인" 1~8
- **Requirements**: FR-001~FR-007, NFR-001, NFR-002, C-001, C-002, C-004, C-005
- **Prompt**: [tasks/WP01-angle-button-states.md](tasks/WP01-angle-button-states.md) (~260 lines)

T001 모델 함수 (WP01)
T002 단위 테스트 (WP01)
T003 15단계 렌더링·이벤트·문장 (WP01)
T004 갱신 이벤트·초점 복원 (WP01)
T005 전용 스타일 (WP01)
T006 검사·손 확인 (WP01)

- **Sketch**: T001 → (T002 ∥ T003) → T004 → T005 → T006
- **Dependencies**: none
- **Risks**: 공용 `.act`를 고치면 C-002 위반 / `tut.render`를 직접 부르면 다른 단계 본문 영향 / "둘 다" 문장이 지금 문장과 글자 하나라도 다르면 parity 실패

## WP02 — 브라우저 테스트·CI·이전 비교 조정

- **Goal**: WP01 동작을 Chromium·Firefox·WebKit에서 검증하고, 이전 비교 테스트가 C-003의 두 차이만 허용하게 한다
- **Priority**: P1 (PR 조건: `pnpm test:e2e`)
- **Independent test**: `pnpm exec playwright test e2e/angle-buttons.spec.ts`, 이어서 `pnpm test:e2e`
- **Requirements**: NFR-001, NFR-002, NFR-003, C-003, FR-001~FR-007 (검증)
- **Prompt**: [tasks/WP02-browser-tests-parity.md](tasks/WP02-browser-tests-parity.md) (~250 lines)

T007 e2e 도우미·마스킹 (WP02)
T008 동작 시나리오 테스트 (WP02)
T009 배치·대비 테스트 (WP02)
T010 CI 대상·parity 적용 (WP02)
T011 전체 통과 확인 (WP02)

- **Sketch**: T007 → (T008 ∥ T009) → T010 → T011
- **Dependencies**: WP01
- **Risks**: 15단계까지 진행에 시간이 걸림(시간 제한 300초) / 마스킹 정규식이 너무 넓으면 실제 회귀를 가림 / Firefox·WebKit 폰트 폭 차이

## MVP

WP01이 사용자 가치 전부다. WP02는 PR 조건(테스트·CI)을 채운다.
