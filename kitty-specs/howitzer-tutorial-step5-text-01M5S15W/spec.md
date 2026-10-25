# Mission Specification: 튜토리얼 5단계 설명 순서와 문구

**Mission Branch**: `mission/howitzer-tutorial-step5-text`  
**Created**: 2026-10-25  
**Status**: Draft  
**Input**: Issue #10 (사람 제안·채택) — 미적분 자주포 튜토리얼 5/22단계("손으로 쌓아 보기")에서 표 설명을 표 바로 아래로 옮기고 그 뒤에 "그런데…"가 오게, 발사 전 안내의 "한 걸음씩 날려 보세요"를 자연스럽게

## Episode Design *(기존 에피소드 01-calculus-howitzer 개선: 바뀌는 항목만 작성)*

### 1. Role Setting

N/A — 역할(자주포 포수)과 상황은 그대로다.

### 2. Math Concepts

- 리만 합으로 높이 쌓기: 0.5초 조각(평균 vy × 0.5초)을 더해 높이를 만든다 (튜토리얼 2장). 계산·설명 내용은 바뀌지 않는다
- 선수 지식: 없음

### 3. Learning Goals *(at most 3)*

1. 학습자가 0.5초 조각 표가 무엇을 보여 주는지(vy가 매번 약 4.9씩 줄고, 맨 오른쪽 칸은 조각을 다 더한 값 = 적분) **먼저** 이해한 뒤, "첫 조각이 vy × 0.5가 아니다"라는 의문으로 넘어간다

### 4. Core Interaction

5단계는 진공으로 고정되고, 학습자가 발사하면 포탄이 출발 직후 멈춘다. "0.5초 진행 ⏭"을 누를 때마다 포탄이 0.5초 날아가고 카드의 표에 한 줄씩 쌓인다. 4번 누르면 다음으로 넘어갈 수 있다.

**① 발사 전 안내 문구** (발사하기 전에만 보임)

| | 지금 | 바뀐 뒤 (사람 결정 — Issue #10 후보 B) |
|---|---|---|
| 한국어 | 발사를 누르세요. 이번엔 포탄이 **출발 직후 멈춰** 있어요. 그다음 **0.5초 진행 ⏭**을 눌러 한 걸음씩 날려 보세요. | 발사를 누르세요. 이번엔 포탄이 **출발 직후 멈춰** 있어요. 그다음 **0.5초 진행 ⏭**을 눌러 포탄을 0.5초씩 앞으로 보내 보세요. |
| English | Press FIRE. This time the shell **freezes right after launch**. Then press **Step 0.5 s ⏭** to move it one step at a time. | Press FIRE. This time the shell **freezes right after launch**. Then press **Step 0.5 s ⏭** to send the shell forward 0.5 s at a time. |

마지막 문장만 바뀌고, 강조(굵게·주황) 위치는 그대로다.

**② 진행 뒤 카드 순서** (0.5초 진행을 한 번 이상 누른 뒤)

| 순서 | 지금 | 바뀐 뒤 |
|---|---|---|
| 1 | 방금 조각 문장 ("방금 0.5초 동안 높이 조각 … m를 더해서, 지금까지 쌓인 높이는 … m예요.") | 그대로 |
| 2 | 0.5초 조각 표 | 그대로 |
| 3 | "🤔 그런데 첫 줄을 보세요. … 아래에서 이유를 볼게요." | **표 설명** ("vy가 매번 약 4.9씩 줄어요 (중력 9.8 × 0.5초). 맨 오른쪽 칸은 조각들을 전부 더한 값이에요. 이게 적분이에요.") |
| 4 | 이유 상자 ("방금 조각: (a + b) ÷ 2 × 0.5 = … m" + 평균 설명) | "🤔 그런데 첫 줄을 보세요. … 아래에서 이유를 볼게요." |
| 5 | 표 설명 | 이유 상자 |
| 6 | (조각이 음수가 되면) "조각이 음수가 됐어요! …" | 그대로 |
| 7 | (4번 이상 누르면) "더 눌러 봐도 되고, 계속 ▶을 누르면 끝까지 날아가요." | 그대로 |

- 각 덩어리의 글자·숫자·모양(작은 글씨, 상자)은 그대로이고 순서만 바뀐다. "아래에서 이유를 볼게요"는 바뀐 뒤에도 바로 아래가 이유 상자라 맞다
- 발사했지만 아직 진행을 누르지 않은 상태("이제 0.5초 진행 ⏭을 눌러 보세요.")는 그대로

### 5. Staged Missions

N/A — 튜토리얼 단계·진행 조건(0.5초 진행 4번)은 바뀌지 않는다.

### 6. Answers and Verification

See `answers.md` in this folder. *(Do not copy answers into this file.)*

- V1. 표 설명의 "vy가 매번 약 4.9씩 줄어요 (중력 9.8 × 0.5초)"는 맞는가? 진공에서 0.5초마다 vy가 얼마나 줄고, 표의 첫 두 줄 vy 값의 차이와 같은가?

### 7. References

| Item | Source | URL | Verified? |
|------|--------|-----|-----------|
| 5단계 정의 | `episodes/01-calculus-howitzer/src/missions.ts` 2장 "손으로 쌓아 보기" | — | yes |
| 중력가속도 9.8 m/s² | `episodes/01-calculus-howitzer/src/model/constants.ts` `G` (표준중력 9.80665 반올림) | — | yes |
| 문구 후보 B | Issue #10 (사람 선택) | https://github.com/mechurisr/Math-Role-Simulations/issues/10 | yes |

### 8. Difficulty

1 — 문장 하나와 문단 순서만 바뀐다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 표를 이해한 뒤 의문으로 넘어간다 (Priority: P1)

학습자가 0.5초 진행을 누르면 표 바로 아래에서 표가 무엇을 뜻하는지 읽고, 그다음 "그런데 첫 줄이 왜 vy × 0.5가 아니지?"라는 의문과 그 이유를 차례로 본다.

**Why this priority**: Issue #10의 핵심(설명 순서).

**Independent Test**: 5단계에서 발사 → 0.5초 진행 1번 → 카드 본문의 덩어리 순서 확인.

**Acceptance Scenarios**:

1. **Given** 5단계, 발사 후 0.5초 진행 1번, **When** 카드를 봄, **Then** 방금 조각 → 표 → 표 설명 → "🤔 그런데…" → 이유 상자 순서다
2. **Given** 0.5초 진행 4번 이상, **When** 카드를 봄, **Then** 위 순서 뒤에 "더 눌러 봐도 되고…"가 맨 아래에 있다. 조각이 음수가 됐으면 그 안내가 이유 상자와 "더 눌러 봐도 되고…" 사이에 있다
3. **Given** 영어, **When** 같은 상황, **Then** 같은 순서다

---

### User Story 2 - 발사 전 안내가 자연스럽다 (Priority: P2)

학습자가 5단계에 들어오면 "그다음 0.5초 진행 ⏭을 눌러 포탄을 0.5초씩 앞으로 보내 보세요."를 읽는다.

**Why this priority**: 문구 한 문장 개선.

**Independent Test**: 5단계 진입 직후 카드 문구 확인 (한/영).

**Acceptance Scenarios**:

1. **Given** 5단계 진입, 발사 전, **When** 카드를 봄, **Then** §4 ①의 바뀐 문구(한국어)가 보인다
2. **Given** 영어, **When** 같은 상황, **Then** §4 ①의 바뀐 영어 문구가 보인다

### Edge Cases

- 발사했지만 진행 전: "이제 0.5초 진행 ⏭을 눌러 보세요."만 — 바뀌지 않음
- 표가 6줄을 넘어 중간이 ⋮로 접힐 때: 순서 규칙 같음 (표 덩어리 하나)
- 단계를 나갔다 다시 들어옴: 발사 전 안내부터 다시 (지금과 같음)

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | 표 설명을 표 바로 아래로 | 학습자로서, 0.5초 진행 뒤 카드에서 표 설명이 표 바로 다음, "🤔 그런데…" 앞에 오기를 원한다. 표를 이해한 뒤 의문으로 넘어가도록 (§4 ② 표) | High | Open |
| FR-002 | 발사 전 안내 문구 | 학습자로서, 발사 전 안내의 마지막 문장이 "…눌러 포탄을 0.5초씩 앞으로 보내 보세요." / "…to send the shell forward 0.5 s at a time."이기를 원한다 (§4 ① 표) | Medium | Open |
| FR-003 | 나머지 그대로 | 학습자로서, 각 덩어리의 글자·숫자·모양, 진행 조건, 다른 단계가 지금과 같기를 원한다 | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | 회귀 검사 정확도 | 이전 버전 비교에서 5단계는 가리지 않고, 원본 카드 본문에 §4의 두 변경(문장 치환 1개, 덩어리 순서)을 적용한 결과와 글자까지 같아야 통과한다. 그 밖의 단계·요소는 지금처럼 그대로 비교 | Reliability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | 계산 불변 | 조각 계산·표 값·진행 조건을 바꾸지 않는다 | Technical | High | Open |
| C-002 | 문구 | 바뀌는 문구는 한국어·영어 둘 다 (PRJ-007). 다른 문장은 글자 하나 바꾸지 않는다 | Business | High | Open |
| C-003 | 의존 규칙 | 에피소드는 `@series/engine`만 import (PRJ-003). 엔진 변경 없음 | Technical | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 5단계에서 0.5초 진행 뒤 카드의 덩어리 순서가 §4 ② "바뀐 뒤"와 같다 (한/영)
- **SC-002**: 이전 비교에서 §4의 두 변경 외 차이 0건

## Assumptions

- 표 설명 문장은 지금처럼 작은 글씨로 둔다 (사람이 순서만 지정, 2026-10-25 의도 요약 승인)
- 순서와 문구는 Issue #10에서 사람이 고른 그대로다 (순서: ① → ② → ⑤ → ③ → ④, 문구 후보 B)
