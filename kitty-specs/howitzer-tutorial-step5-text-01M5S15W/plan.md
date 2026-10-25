# Implementation Plan: 튜토리얼 5단계 설명 순서와 문구

**Branch**: `mission/howitzer-tutorial-step5-text` (target/merge: same) | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/howitzer-tutorial-step5-text-01M5S15W/spec.md` (검토 반영: [spec-review.md](spec-review.md))

## Summary

`missions.ts`의 5단계("손으로 쌓아 보기") 본문에서 표 설명 문단(`<p class="small">vy가 매번 약 4.9씩…`)을 표 바로 다음, "🤔 그런데…" 앞으로 옮기고, 발사 전 안내의 마지막 문장을 한/영 모두 바꾼다. 이전 비교 테스트는 5단계를 가리지 않고 원본 스냅샷에 같은 두 변환(문장 치환, 순서 재배치)을 적용한 뒤 글자까지 비교하며, 변환이 실제로 적용됐는지 단언한다. 새 브라우저 테스트가 5단계 발사 전 문구와 진행 뒤 순서를 한/영으로 확인한다. 계산·엔진 변경 없음.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strict) — 기존 모노레포 그대로
**Primary Dependencies**: Vite 8.3.5, `@series/engine` (i18n `tr`만 사용, 변경 없음). 새 의존성 없음
**Storage**: N/A
**Testing**: Playwright 1.64.1 — 새 `e2e/step5-text.spec.ts`(CI 세 엔진), `e2e/parity.spec.ts` 5단계 변환 비교. 단위 테스트 변경 없음 (계산 그대로, 기존 `tests/aim-riemann.test.ts`)
**Target Platform**: 최신 데스크톱·모바일 브라우저
**Project Type**: web (에피소드 한 개 문구 수정)
**Performance Goals**: N/A
**Constraints**: 각 덩어리 글자 그대로(FR-003, C-002), 변환 비교의 세 함정 방지(NFR-001, 검토 R1)
**Scale/Scope**: 파일 수정 4개(`missions.ts`, `e2e/helpers.ts`, `e2e/parity.spec.ts`, `playwright.config.ts`) + 추가 1개(`e2e/step5-text.spec.ts`)

## Charter Check

| 규칙 | 이 계획에서 | 판정 |
|---|---|---|
| PRJ-001 출처 주석 | 바뀌는 코드 옆에 미션 폴더 주석 | 준수 |
| PRJ-002 단위 테스트 | 새 계산 없음 (기존 리만 조각 테스트 그대로) | 해당 없음 |
| PRJ-003 엔진만 의존 | 변경 없음 | 준수 |
| PRJ-004 모바일 | 문구 길이 변화 작음, 기존 360px 테스트 범위 | 준수 |
| PRJ-007 한/영 | 바뀌는 문장 한/영, 새 테스트가 영어 순서 확인 | 준수 |
| PRJ-008·009 | PR·CI, 비밀값 없음 | 준수 |

위반 없음 → Complexity Tracking 생략. Phase 1 뒤 재확인: 변화 없음.

## Project Structure

### Documentation (this mission)

```
kitty-specs/howitzer-tutorial-step5-text-01M5S15W/
├── spec.md · answers.md · spec-review.md
├── plan.md · research.md · quickstart.md
└── tasks/
```

data-model.md·contracts/ 없음 — 데이터·외부 계약이 없는 문구 변경.

### Source Code (repository root)

```
episodes/01-calculus-howitzer/src/missions.ts   # 5단계 body: 발사 전 문장 치환, 표 설명 문단을 🤔 앞으로
e2e/
├── step5-text.spec.ts                           # 신규: 발사 전 문구(한/영), 진행 뒤 덩어리 순서(한/영)
├── helpers.ts                                   # legacyStep5(html): 원본 5단계 본문 → 기대 본문 변환 (+적용 횟수)
└── parity.spec.ts                               # 튜토리얼 비교에서 5단계(정확히 5/22) legacy 스냅샷에 변환 적용, 적용 단언
playwright.config.ts                             # CI firefox·webkit 대상에 step5-text 추가
```

**Structure Decision**: 에피소드 `missions.ts` 한 곳과 e2e만 바꾼다.

## Implementation Concern Map

### IC-01 — 5단계 문구·순서와 검증

- **Purpose**: 5단계 본문 순서·문구를 바꾸고, 이전 비교를 "변환 후 정확 비교"로 조정한다
- **Relevant requirements**: FR-001, FR-002, FR-003, NFR-001, C-001, C-002, C-003
- **Affected surfaces**: 위 Source Code 5개 파일
- **Sequencing/depends-on**: none
- **Risks**: 라벨 `5 / 22`가 `15 / 22`와 섞임, 변환이 안 걸려도 조용히 통과, `#tut` 스냅샷 누락 (검토 R1) → research R-2
