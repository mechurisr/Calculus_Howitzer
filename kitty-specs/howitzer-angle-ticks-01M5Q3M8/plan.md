# Implementation Plan: 자주포 발사각 슬라이더 눈금

**Branch**: `mission/howitzer-angle-ticks` (target/merge: same) | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/howitzer-angle-ticks-01M5Q3M8/spec.md` (검토 반영: [spec-review.md](spec-review.md))

## Summary

미적분 자주포의 발사각 슬라이더 아래에 눈금(5° 간격 15곳), 숫자(10~80), 45° 굵은 눈금과 조건 주석("45° · 같은 높이에서 사거리 최대")을 세 줄로 붙인다. 손잡이를 CSS로 직접 그려 폭을 고정하고, 눈금 위치는 순수 함수가 계산한 비율을 CSS 백분율 식으로 배치해 세 엔진·모든 화면 크기에서 손잡이와 ±2px 안으로 맞춘다. 주석은 튜토리얼 4장 도달·튜토리얼 종료/건너뛰기 뒤부터 보인다. 계산·튜토리얼 문구는 바꾸지 않는다.

## Technical Context

**Language/Version**: TypeScript 7.0 (strict), HTML/CSS — 기존 모노레포 그대로
**Primary Dependencies**: Vite 8.3.5, `@series/engine` (i18n, storage). 새 의존성 없음
**Storage**: 브라우저 localStorage — 엔진 `save/load` (`series:howitzer:angleNoteSeen`, 기존 `series:howitzer:tutDone`)
**Testing**: Vitest(눈금 비율 함수, 표시 조건 함수), Playwright(360/768/1280 위치·겹침, 언어 전환, 튜토리얼 시점, 이전 비교). CI에서 눈금·모바일 테스트는 Chromium·Firefox·WebKit
**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chromium, Firefox, WebKit/iOS Safari)
**Project Type**: web (정적 사이트, 에피소드 한 개 수정)
**Performance Goals**: 60 fps 유지 — 눈금은 정적 DOM이고 매 프레임 다시 그리지 않음
**Constraints**: 360px 폭 가로 스크롤 0, 손잡이-눈금 오차 ≤ 2 CSS px, 계산 코드·튜토리얼 문구 불변(C-001), 슬라이더 범위·단위 불변(C-002)
**Scale/Scope**: 파일 5~7개 수정·추가, 새 테스트 2개 파일

## Charter Check

헌장: `.kittify/charter/charter.md` (PRJ-001~010)

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | 눈금 비율 식 옆에 V1 식과 answers.md 참조, 45° 주석 근거(V3) 주석 | 준수 |
| PRJ-002 단위 테스트 | 비율 함수(양 끝·가운데·5° 간격), 표시 조건 함수 테스트 | 준수 |
| PRJ-003 엔진만 의존 | 에피소드 안에 둠, 엔진 i18n·storage만 사용 | 준수 |
| PRJ-004 모바일 | 360px 테스트 추가. 슬라이더 높이 28px·± 버튼 36px는 기존 승인 예외 그대로(이번에 바꾸지 않음) | 준수(기존 예외 유지) |
| PRJ-005 수학 오류 시 중단 | 스펙 검토로 V2(206px) 정정 완료, 남은 모호함 없음 | 준수 |
| PRJ-006 스펙 항목 | 스펙·answers 분리 완료 | 준수 |
| PRJ-007 한/영 | 주석 두 언어, 숫자는 공통 | 준수 |
| PRJ-009 비밀값 | 해당 없음 | 준수 |

위반 없음 → Complexity Tracking 생략.

## Project Structure

### Documentation (this mission)

```
kitty-specs/howitzer-angle-ticks-01M5Q3M8/
├── spec.md · answers.md · spec-review.md
├── plan.md            # 이 파일
├── research.md        # 결정과 근거
├── data-model.md      # 눈금·표시 상태
├── quickstart.md      # 확인 방법
└── tasks/             # /spec-kitty.tasks 가 만듦
```

contracts/ 없음 — 외부 API·이벤트가 없는 화면 변경.

### Source Code (repository root)

```
episodes/01-calculus-howitzer/
├── index.html                 # #ang 를 .ang-track 상자로 감싸고 눈금 3줄 자리 추가
├── src/
│   ├── view/ticks.ts          # (신규) 눈금 DOM 생성·주석 표시 갱신
│   ├── model/ticks.ts         # (신규) 순수 함수: 비율 f(θ), 눈금 목록, 주석 표시 조건
│   ├── strings.ts             # 주석 문구 ko/en
│   ├── missions.ts            # 4장 "45°는 사거리 그래프의 꼭대기" 단계에 enter 동작 1개 추가(문구 불변)
│   ├── main.ts                # 눈금 초기화, 언어 변경·튜토리얼 종료 때 갱신
│   └── style.css              # 손잡이 CSS(폭 22px), .ang-track, 눈금 3줄
└── tests/ticks.test.ts        # (신규) 단위 테스트
e2e/
├── ticks.spec.ts              # (신규) 위치·겹침·언어·튜토리얼 시점
├── parity.spec.ts             # 스크린샷 비교 때 새 페이지의 눈금·손잡이 스타일 숨김
└── mobile.spec.ts             # 그대로 (CI에서 3엔진)
playwright.config.ts           # projects: chromium(+원본 비교) / firefox·webkit(CI, 눈금·모바일만)
.github/workflows/ci.yml       # firefox·webkit 브라우저 설치
```

**Structure Decision**: 기존 에피소드 구조(model = 순수 계산 + tests, view = DOM) 그대로. 엔진 공용화는 두 번째 사용처가 생길 때(research R-3).

## Implementation Concern Map

### IC-01 — 눈금 위치 계산 (순수 함수)

- **Purpose**: 각도 → 비율 f(θ) = (θ−10)/70, 눈금 목록(15곳의 종류: major·minor·45), 주석 표시 조건을 DOM 없이 계산하고 테스트한다
- **Relevant requirements**: FR-001, FR-002, FR-004, FR-006, NFR-002, C-006
- **Affected surfaces**: `episodes/01-calculus-howitzer/src/model/ticks.ts`, `tests/ticks.test.ts`
- **Sequencing/depends-on**: none
- **Risks**: 범위 상수(10, 80)를 `index.html`의 min/max와 중복 정의하지 않도록 한 곳에서 읽음

### IC-02 — 슬라이더 손잡이와 눈금 화면

- **Purpose**: 손잡이를 CSS로 그려 폭 22px로 고정하고, 입력 요소를 감싼 `.ang-track`(여백 0) 아래에 눈금·숫자·주석 3줄을 `left: calc(var(--thumb)/2 + var(--f) * (100% - var(--thumb)))`로 배치한다
- **Relevant requirements**: FR-001~FR-005, NFR-001, NFR-002, NFR-003, NFR-005, C-002, C-006
- **Affected surfaces**: `index.html`, `src/style.css`, `src/view/ticks.ts`, `src/strings.ts`, `src/main.ts`
- **Sequencing/depends-on**: IC-01
- **Risks**: 손잡이 의사요소(`::-webkit-slider-thumb`, `::-moz-range-thumb`)는 엔진별로 따로 써야 함. 트랙 높이·터치 영역(28px)은 그대로 둬야 NFR-003. 양 끝 숫자가 상자 밖으로 몇 px 나가므로 부모가 잘라내지 않게(overflow visible)

### IC-03 — 45° 주석 표시 시점

- **Purpose**: 튜토리얼 4장 해당 단계 진입 시 "봤음"을 저장하고, 튜토리얼 완료/건너뛰기 기록이 있으면 처음부터 주석을 보인다
- **Relevant requirements**: FR-006, US2 시나리오 3·4, Edge Case(처음부터 건너뛰기)
- **Affected surfaces**: `src/missions.ts`(해당 단계에 `enter` 추가, 문구 불변), `src/view/ticks.ts`, `src/main.ts`
- **Sequencing/depends-on**: IC-01, IC-02
- **Risks**: 튜토리얼 "이전" 버튼으로 4장 전으로 돌아가도 이미 본 주석은 유지(되감지 않음). C-001 위반이 되지 않도록 단계의 문구·gate·순서는 손대지 않음

### IC-04 — 테스트와 CI

- **Purpose**: 위치(±2px)·겹침·언어·표시 시점을 브라우저 테스트로 확인하고, 이전 비교 테스트는 눈금을 숨긴 상태로 계속 픽셀 비교한다
- **Relevant requirements**: NFR-001, NFR-002, NFR-004, C-005, SC-002~SC-004
- **Affected surfaces**: `e2e/ticks.spec.ts`, `e2e/parity.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- **Sequencing/depends-on**: IC-02, IC-03
- **Risks**: 손잡이 중심 측정 — 손잡이는 DOM 요소가 아니므로 값 ↔ 입력 상자 폭으로 계산한 기대 위치와, 스크린샷에서 손잡이 색 픽셀 중심을 비교(research R-4). 로컬(Arch)에서는 Firefox·WebKit을 못 돌리므로 CI 결과가 기준

## Branch Contract

계획 시작 브랜치 `mission/howitzer-angle-ticks` → 계획 기준 브랜치 `mission/howitzer-angle-ticks` → 완성 변경을 합칠 대상 `mission/howitzer-angle-ticks` (일치). 이 브랜치를 PR로 `main`에 올린다.
