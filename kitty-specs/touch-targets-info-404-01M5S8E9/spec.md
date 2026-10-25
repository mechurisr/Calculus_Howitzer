# Mission Specification: 해설 버튼·404 링크 터치 크기

**Mission Branch**: `mission/touch-targets-info-404`  
**Created**: 2026-10-25  
**Status**: Draft — **가벼운 경로** (라벨 `light`: `answers.md`·스펙 검토·plan/tasks 생략, docs/agents/main.md "경로")  
**Input**: Issue #13 (힌트 해설 (i) 버튼 18×18px), Issue #15 (404 페이지 링크에 최소 크기 미적용) — 헌장 PRJ-004의 44×44 CSS px에 못 미치고 승인 예외에도 없는 남은 두 조작 요소

## Episode Design *(기존 화면 개선: 바뀌는 항목만)*

1~3, 5~8: N/A — 역할·수학·학습 목표·미션·정답과 무관. 계산 변경 없음 (가벼운 경로 조건).

### 4. Core Interaction

| 요소 | 위치 | 지금 | 바뀐 뒤 |
|---|---|---|---|
| 해설 (i) 버튼 | 힌트 상자의 궤적 식 옆 (모든 에피소드 공용) | 보이는 원·누르는 영역 모두 18×18px | 보이는 원은 18px 그대로, **누르는 영역만 44×44px** (사람 결정, 결정 기록 DM-01M5S8EDANWWCMAD700FY9M1Q5) |
| 에피소드 목록 링크 | 404 페이지 | 버튼처럼 보이지만 링크(인라인)라 최소 크기·세로 여백이 안 먹어 실측 35px | 44×44px 이상, 글자 세로 가운데 |

- 해설 버튼의 넓어진 영역은 보이지 않고, 식 줄의 배치·힌트 상자 모양은 그대로다
- 힌트 상자 안쪽 여백이 10px라 넓힌 영역이 상자 가장자리에서 조금 잘릴 수 있다 → 실제로 누를 수 있는 영역을 재서 44×44를 확인한다

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 해설 버튼을 손가락으로 쉽게 누른다 (Priority: P1)

360px 휴대폰에서 힌트를 연 학습자가 식 옆 (i)를 손가락으로 눌러 해설을 연다.

**Acceptance Scenarios**:

1. **Given** 360px, 힌트 열림, **When** (i) 원의 중심에서 상하좌우 21px 떨어진 곳을 누름, **Then** 해설 버튼이 눌린 것으로 처리된다 (누르는 영역 44×44 이상)
2. **Given** 같은 화면, **When** 힌트 상자를 봄, **Then** (i) 원의 크기·위치와 식 줄 배치가 바꾸기 전과 같다

### User Story 2 - 404 페이지에서 목록으로 쉽게 돌아간다 (Priority: P2)

**Acceptance Scenarios**:

1. **Given** 360px, 404 페이지, **When** 링크를 봄, **Then** 44×44 CSS px 이상이고 글자가 세로 가운데, 가로 스크롤 없음

### Edge Cases

- 해설 버튼 옆 글자를 누르려다 넓어진 영역에 걸림: 식 옆 아이콘 하나뿐이라 허용 (해설이 열리고, 다른 곳을 누르면 닫힘)
- 에피소드 머리말의 튜토리얼 버튼(`<button>`)은 #9에서 이미 44px — 이번 변경으로 바뀌지 않아야 함

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | 해설 버튼 누르는 영역 | 학습자로서, 해설 (i) 버튼의 누르는 영역이 44×44 CSS px 이상이기를 원한다. 보이는 원(18px)과 식 줄 배치는 그대로 | High | Open |
| FR-002 | 404 링크 크기 | 방문자로서, 404 페이지의 에피소드 목록 링크가 44×44 CSS px 이상이고 글자가 세로 가운데이기를 원한다 | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | 확인 | 360px에서 두 요소의 크기(해설 버튼은 실제로 눌리는 영역)를 실패 단언으로 확인, CI 세 엔진 | Usability | High | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | 이전 비교 | 이전 버전 비교(힌트 상자 스크린샷 포함)가 조정 없이 통과한다 — 보이는 모양이 바뀌지 않아야 함 | Technical | High | Open |
| C-002 | 엔진 공용 스타일 | 수정은 엔진 공용 스타일에서, 규칙 옆에 이 미션 폴더 주석. 에피소드 머리말 튜토리얼 버튼은 그대로 | Technical | High | Open |

## Success Criteria *(mandatory)*

- **SC-001**: 360px에서 헌장 승인 예외를 뺀 조작 요소 중 44×44 미만 0개 (이 미션 뒤 PRJ-004 남은 항목 없음)
- **SC-002**: 이전 비교 차이 0건

## Assumptions

- 가벼운 경로: 난이도 1, 계산·물리값·학습 흐름 불변 (사람 확인 2026-10-25)
- 헌장 승인 예외(언어 버튼, ± 버튼, 각도 슬라이더, 장약·모드 버튼)는 이번 범위 밖
