# Research: 튜토리얼 조작 버튼 44px

새 의존성이 없으므로 공급망 점검 대상 없음.

## R-1. 크기 수단: min-height·min-width

- **Decision**: `.tut-body .act`와 `.tut-btn`에 `min-height:44px;min-width:44px`. 여백·테두리·글자는 그대로
- **Rationale**: 검토 R2. 고정 `height`는 긴 문구가 두 줄로 감길 때 잘림. 여백만 늘리면(9.375px) 글꼴 메트릭이 바뀌면 다시 미달. `button`은 내용이 세로 가운데 정렬되므로 min-height만으로 모양이 유지됨. 전역 `box-sizing:border-box`라 44px에 테두리 포함 (answers.md V1)
- **Alternatives**: `height:44px` (잘림), `padding:9.375px 12px` (글꼴 의존), 에피소드 전용 덮어쓰기 (사람이 엔진으로 결정)

## R-2. 이전 비교에서 크기 변경 끄기

- **Decision**: `e2e/helpers.ts` `open()`에 옵션 `touch`(기본 false)를 둔다. false면 페이지 스크립트 전에 `<style>.tut-btn{min-height:0!important;min-width:0!important}</style>`을 넣어 원래 41.25px 배치로 되돌린다. 새 측정 테스트·15단계 테스트(`gotoExperimentStep`)는 `touch: true`
- **Rationale**: `.tut-btn`은 머리말에 있어 높이가 바뀌면 아래 내용이 2.75px 밀려 이전 비교의 전체 페이지 스크린샷과 튜토리얼 스크롤 위치(`scrollY`)가 달라진다 (C-002). 눈금 미션이 `data-ticks`를 지운 것과 같은 방식. 카드 안 `.act`는 고정 위치 카드 안이라 페이지 배치·스냅샷(HTML)에 영향 없어 끄지 않는다
- **Alternatives**: 이전 비교 기준(legacy)을 고침 — 기준이 바뀌어 회귀 검사 의미가 약해짐. 스크린샷 허용 오차 — 다른 회귀를 가림

## R-3. 측정 테스트 위치와 방식

- **Decision**: 새 파일 `e2e/touch-targets.spec.ts`, CI firefox·webkit `testMatch`에 추가. 360px에서
  1. 튜토리얼 닫힌 상태: `#tutOpen` ≥ 44×44, 가로 스크롤 없음
  2. 튜토리얼 22단계 자동 진행(`walkTutorial`) 중 각 단계에서 `#tut` 안 보이는 모든 `button`의 경계 상자 ≥ 44×44 (실패 단언, 검토 S4)
  3. 19·20단계: 카드를 끝까지 스크롤했을 때 `#tutNext`가 카드 보이는 영역 안. 카드 스크롤 깊이(`scrollHeight − clientHeight`)를 크기 변경을 끈 상태(스타일 주입)와 비교해 증가분 ≤ 보이는 `.act` 수 × 2.75 + 1px (검토 S5)
  4. 영어로 바꿔 19단계 버튼도 같은 기준
- **Rationale**: 검토 R3(세 엔진·360px), S4(기록만 하는 보고 금지), S5. 기존 `mobile.spec.ts`는 390px이고 보고만 함
- **Alternatives**: `mobile.spec.ts`에 추가 — 390px `test.use`가 파일 전체에 걸려 있어 360px 측정과 섞임

## R-4. 주석

- **Decision**: 두 CSS 규칙 위에 `/* 터치 대상 44px (헌장 PRJ-004, kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ): 지금 높이 41.25px → 최소 44. 고정 높이는 긴 문구를 자르므로 min */`
- **Rationale**: 검토 S2, PRJ-001
