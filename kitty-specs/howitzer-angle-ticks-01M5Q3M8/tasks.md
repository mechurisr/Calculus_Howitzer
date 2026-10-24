# Tasks: 자주포 발사각 슬라이더 눈금

**Mission**: `howitzer-angle-ticks-01M5Q3M8` · **Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)
**Branch**: planning base `mission/howitzer-angle-ticks` → merge target `mission/howitzer-angle-ticks` (이후 PR로 `main`)

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | 눈금 모델: 각도 범위 상수, `angleFraction`, `tickMarks` | WP01 | |
| T002 | 주석 표시 조건 `angleNoteVisible` | WP01 | [P] |
| T003 | 단위 테스트 `tests/ticks.test.ts` | WP01 | |
| T004 | `index.html`: 슬라이더를 `.ang-track[data-ticks]`로 감싸고 눈금 3줄 자리 | WP02 | |
| T005 | `style.css`: 직접 그린 손잡이(22px), 여백 0, 눈금·숫자·주석 배치 | WP02 | |
| T006 | `view/ticks.ts`: 눈금 DOM 생성, 주석 표시 갱신, "봤음" 저장 | WP02 | |
| T007 | `strings.ts`: 주석 문구 ko/en | WP02 | [P] |
| T008 | 튜토리얼 연결: 엔진 `onEnd` 훅, 4장 단계 `enter`, `main.ts` 초기화 | WP02 | |
| T009 | `e2e/ticks.spec.ts`: 겹침·가로 스크롤·언어·표시 시점 | WP03 | |
| T010 | `e2e/ticks.spec.ts`: 손잡이-눈금 위치 ±2px (10°·45°·80°, 3개 폭, 창 크기 변경 후) | WP03 | |
| T011 | `e2e/parity.spec.ts`: 스크린샷 비교 때 `data-ticks` 제거 | WP03 | [P] |
| T012 | `playwright.config.ts`: chromium / firefox·webkit projects | WP03 | [P] |
| T013 | `.github/workflows/ci.yml`: firefox·webkit 브라우저 설치 | WP03 | [P] |

## Phase 1 — Foundation

### WP01 — 눈금 계산 모델

- **Goal**: DOM 없이 눈금 위치 비율·목록·주석 표시 조건을 계산하고 단위 테스트로 고정한다 (PRJ-002)
- **Priority**: P1 (WP02·WP03의 기반)
- **Independent test**: `pnpm check` 통과, `tests/ticks.test.ts`가 비율 0/0.5/1, 눈금 15개(8/6/1), 45에 숫자 없음, 표시 조건 진리표를 확인
- **Prompt**: [tasks/WP01-tick-model.md](tasks/WP01-tick-model.md) (~200 lines)

T001 눈금 모델: 각도 범위 상수, `angleFraction`, `tickMarks` (WP01)
T002 주석 표시 조건 `angleNoteVisible` (WP01)
T003 단위 테스트 `tests/ticks.test.ts` (WP01)

- **Dependencies**: none
- **Risks**: 범위 10/80이 `index.html` min/max와 어긋나지 않게 — WP03 테스트가 일치 확인

## Phase 2 — User Stories 1·2 (화면)

### WP02 — 손잡이·눈금 화면과 45° 주석 시점

- **Goal**: 슬라이더 아래 눈금·숫자·주석 3줄을 손잡이와 맞게 그리고, 주석을 튜토리얼 4장 도달·튜토리얼 종료 뒤부터 보인다
- **Priority**: P1 (User Story 1·2)
- **Independent test**: `pnpm dev`에서 quickstart.md 1~6 수동 확인, 기존 `pnpm test:e2e` 중 parity 스크린샷 2건 외 통과
- **Prompt**: [tasks/WP02-ticks-ui.md](tasks/WP02-ticks-ui.md) (~330 lines)

T004 `index.html` 감싸기와 눈금 자리 (WP02)
T005 `style.css` 손잡이·배치 (WP02)
T006 `view/ticks.ts` (WP02)
T007 `strings.ts` 주석 문구 (WP02)
T008 튜토리얼 연결 (WP02)

- **Dependencies**: WP01
- **Risks**: 손잡이 의사요소는 엔진별 작성 필요, 터치 영역(높이 28px) 유지, 튜토리얼 문구·gate 불변(C-001), 엔진 `createTutorial` 변경은 선택 콜백 추가만

## Phase 3 — 검증

### WP03 — 브라우저 테스트와 CI

- **Goal**: 위치·겹침·언어·표시 시점을 브라우저로 검증하고, 이전 비교를 눈금 없이 계속 픽셀 비교하며, CI에서 3개 엔진으로 돌린다
- **Priority**: P2
- **Independent test**: 로컬 `pnpm test:e2e`(chromium) 전부 통과, CI에서 firefox·webkit project 통과
- **Prompt**: [tasks/WP03-browser-tests-ci.md](tasks/WP03-browser-tests-ci.md) (~300 lines)

T009 눈금 브라우저 테스트: 겹침·스크롤·언어·시점 (WP03)
T010 눈금 브라우저 테스트: 위치 ±2px (WP03)
T011 parity 스크린샷에서 `data-ticks` 제거 (WP03)
T012 Playwright projects (WP03)
T013 CI 브라우저 설치 (WP03)

- **Dependencies**: WP02
- **Risks**: 손잡이는 의사요소라 DOM 좌표가 없음 → 스크린샷 픽셀로 측정. 로컬 Arch는 WebKit 미지원 → CI가 기준

## Parallelization

WP01 → WP02 → WP03 순서 의존. WP 안에서 [P] 표시 하위 작업은 다른 파일이라 병렬 가능.

## MVP

WP01 + WP02 (User Story 1·2가 화면에 동작). WP03은 회귀 보호와 엔진 확인.
