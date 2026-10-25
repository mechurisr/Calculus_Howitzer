# Implementation Plan: 튜토리얼 조작 버튼 44px

**Branch**: `mission/howitzer-tutorial-act-buttons` (target/merge: same) | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ/spec.md` (검토 반영: [spec-review.md](spec-review.md))

## Summary

엔진 공용 스타일의 튜토리얼 조작 버튼(`.tut-body .act`)과 튜토리얼 열기 버튼(`.tut-btn`)에 최소 높이·최소 폭 44px를 준다. 360px에서 튜토리얼 22단계를 진행하며 카드 안 모든 버튼과 열기 버튼이 44×44 이상인지, 긴 단계에서 "다음"이 카드 안에 보이는지 확인하는 브라우저 테스트를 세 엔진 CI에 넣는다. 머리말 버튼이 커져 페이지 배치가 밀리므로 이전 비교 테스트에서만 이 크기 변경을 끈다(눈금 미션과 같은 방식). 계산·문구 변경 없음.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict), CSS — 기존 모노레포 그대로
**Primary Dependencies**: Vite 8.3.5, `@series/engine` (CSS 2곳만 수정). 새 의존성 없음
**Storage**: N/A
**Testing**: Playwright 1.64.1 — 새 `e2e/touch-targets.spec.ts`(360px 전 단계 측정, 열기 버튼, 스크롤 깊이), CI firefox·webkit 대상 추가, 이전 비교용 크기 끄기. 단위 테스트 없음 (새 계산 없음 — PRJ-002 대상 아님)
**Target Platform**: 최신 데스크톱·모바일 브라우저 (Chromium, Firefox, WebKit/iOS Safari)
**Project Type**: web (정적 사이트, 엔진 스타일 수정)
**Performance Goals**: N/A (정적 스타일)
**Constraints**: 44×44 CSS px 이상(FR-001·FR-003), 고정 높이 금지(R2), 이전 비교 통과(C-002), 문구·계산 불변(C-003)
**Scale/Scope**: 파일 수정 4개(`tutorial.css`, `components.css`, `e2e/helpers.ts`, `playwright.config.ts`) + 추가 1개(`e2e/touch-targets.spec.ts`)

## Charter Check

헌장: `.kittify/charter/charter.md` (PRJ-001~010)

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | CSS 옆에 미션 폴더·answers.md V1(41.25 → 44) 주석 | 준수 |
| PRJ-002 단위 테스트 | 새 계산 없음 — 브라우저 측정 테스트로 검증 | 해당 없음 |
| PRJ-003 엔진만 의존 | 엔진 CSS 수정, 에피소드 import 변화 없음 | 준수 |
| PRJ-004 모바일 | 이 미션의 목적. `.info`는 Issue #13, 나머지는 승인 예외 | 준수 (범위 밖 #13) |
| PRJ-005 | 남은 모호함 없음 | 준수 |
| PRJ-007 한/영 | 새 문구 없음. 영어 문구 길이도 측정 대상 | 준수 |
| PRJ-008 PR·CI | 기능 브랜치 → PR | 준수 |
| PRJ-009 비밀값 | 해당 없음 | 준수 |

위반 없음 → Complexity Tracking 생략. Phase 1 뒤 재확인: 변화 없음.

## Project Structure

### Documentation (this mission)

```
kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ/
├── spec.md · answers.md · spec-review.md
├── plan.md            # 이 파일
├── research.md        # 결정 R-1~R-4
├── quickstart.md      # 확인 방법
└── tasks/             # /spec-kitty.tasks 가 만듦
```

data-model.md·contracts/ 없음 — 데이터·외부 계약이 없는 스타일 변경.

### Source Code (repository root)

```
engine/src/tutorial/tutorial.css   # .tut-body .act 에 min-height·min-width 44px
engine/src/ui/components.css       # .tut-btn 에 min-height·min-width 44px
e2e/
├── touch-targets.spec.ts          # 신규: 360px 전 단계 카드 버튼·열기 버튼 ≥ 44, 19·20단계 스크롤 깊이·"다음" 보임
└── helpers.ts                     # open() 옵션 touch: 기본은 이번 크기 변경을 끔(이전 비교용), true 면 그대로
playwright.config.ts               # CI firefox·webkit testMatch 에 touch-targets 추가
```

**Structure Decision**: 엔진 CSS 두 규칙만 바꾸고, 검증은 e2e에 둔다. 에피소드 코드는 바꾸지 않는다.

## Implementation Concern Map

### IC-01 — 엔진 버튼 최소 크기와 검증

- **Purpose**: `.act`·`.tut-btn`을 44×44 이상으로 만들고 세 엔진에서 전 단계 측정으로 확인한다
- **Relevant requirements**: FR-001, FR-002, FR-003, NFR-001, NFR-002, C-001, C-002, C-003
- **Affected surfaces**: `engine/src/tutorial/tutorial.css`, `engine/src/ui/components.css`, `e2e/touch-targets.spec.ts`, `e2e/helpers.ts`, `playwright.config.ts`
- **Sequencing/depends-on**: none
- **Risks**: 이전 비교 스크린샷·스크롤 위치(머리말 2.75px) → `open()`에서 끄기. 15단계 `.exp-angs`는 에피소드 스타일이 이미 44px라 영향 없음. 자동 진행 전체를 세 엔진에서 돌리는 시간(시간 제한 600초)
