# Mission Specification: 튜토리얼 조작 버튼 44px

**Mission Branch**: `mission/howitzer-tutorial-act-buttons`  
**Created**: 2026-10-25  
**Status**: Draft (스펙 검토 반영 2026-10-25)  
**Input**: Issue #9 (Issue #4 스펙 검토 R10에서 분리, 사람 채택) — 미적분 자주포 튜토리얼 카드의 조작 버튼(`.act`: "θ = … 넣기", 장약 올리기·내리기)이 높이 약 41.25px로 헌장 PRJ-004의 44×44 CSS px에 못 미침

## Episode Design *(기존 에피소드 01-calculus-howitzer 개선: 바뀌는 항목만 작성)*

### 1. Role Setting

N/A — 역할(자주포 포수)과 상황은 그대로다.

### 2. Math Concepts

N/A — 학습 내용·계산 변경 없음. 튜토리얼 버튼의 터치 크기만 바뀐다.

### 3. Learning Goals *(at most 3)*

1. 휴대폰 학습자가 5장 조준에서 계산한 각도·장약을 조작 버튼으로 한 번에 넣어, 조준 흐름(재기 → 계산 → 넣기 → 발사)이 끊기지 않는다

### 4. Core Interaction

튜토리얼 카드 본문의 조작 버튼(`.act`)은 누르면 게임 조작을 대신해 준다.

| 버튼 | 나오는 곳 | 하는 일 |
|---|---|---|
| "θ = …° 넣기" / "Set θ = …°" | 5장 "미분으로 조준" 단계들 (예: 19/22) | 계산한 발사각을 슬라이더에 넣음 |
| "θ = 30° 넣기" / "Set θ = 30°" | 5장 조준에서 45° 근처라 다시 재야 할 때 | 30°를 넣음 |
| "○호로 올리기·내리기" / "Raise·Lower to …" | 5장 조준에서 장약이 맞지 않을 때 | 장약을 바꿈 |
| 30·40·45·50·60° | 4장 실험 (15/22) | 이미 44px (Issue #4) — 이번에 바뀌지 않음 |
| "튜토리얼 다시 보기" (`.tut-btn`, 카드 밖 머리말) | 페이지 머리말 | 튜토리얼을 엶. 같은 여백이라 높이 41.25px (스펙 검토 R1, 사람 결정 2026-10-25) |

- 모든 `.act` 버튼과 튜토리얼 열기 버튼이 360px 휴대폰에서 **44×44 CSS px 이상**이 된다. 모양(색·테두리·굵기·모서리)과 문구는 그대로이고 높이만 몇 px 커진다
- 크기는 **최소 높이·최소 폭 44px**로 정한다. 고정 높이는 긴 문구(영어)가 두 줄로 감길 때 글자를 자르고, 여백만 늘리면 글꼴이 바뀔 때 다시 미달이 되므로 쓰지 않는다 (검토 R2)
- 힌트 상자의 해설 (i) 버튼(18×18)은 이번 범위 밖 — Issue #13
- 이 버튼 모양은 시리즈 엔진의 공용 튜토리얼 스타일이 정한다. 수정도 엔진 공용 스타일에서 한다 (사람 결정 2026-10-25, 결정 기록 DM-01M5RVRTKDYGQM7ZRAPJ76VNKB) → 앞으로의 모든 에피소드 튜토리얼에 같이 적용된다

### 5. Staged Missions

N/A — 튜토리얼 단계·진행 조건·문구는 바뀌지 않는다.

### 6. Answers and Verification

See `answers.md` in this folder. *(Do not copy answers into this file.)*

- V1. 지금 `.act` 버튼(과 같은 여백의 `.tut-btn`)의 높이는 몇 px이고, 44px에 얼마나 모자라는가? (본문 글자 15px, 줄 높이 1.55, 위아래 안쪽 여백 8px, 테두리 1px)

### 7. References

| Item | Source | URL | Verified? |
|------|--------|-----|-----------|
| 조작 요소 44×44 CSS px | 헌장 PRJ-004 (근거: WCAG 2.2 SC 2.5.5 Target Size (Enhanced), Level AAA) | https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html | yes |
| `.act` 스타일 | `engine/src/tutorial/tutorial.css` `.tut-body .act{padding:8px 12px;border:1px …}` | — | yes |
| `.tut-btn` 스타일 | `engine/src/ui/components.css` `.tut-btn{margin-top:10px;padding:8px 12px;border:1px …}` | — | yes |
| 본문 글자 크기·줄 높이 | `engine/src/ui/theme.css` `body{font-size:15px;line-height:1.55}` | — | yes |

### 8. Difficulty

1 — 엔진 스타일 두 줄, 브라우저 테스트, 이전 비교 조정.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 튜토리얼 조작 버튼을 휴대폰에서 쉽게 누른다 (Priority: P1)

360px 휴대폰으로 튜토리얼 5장 조준 단계를 진행하는 학습자가 "θ = …° 넣기" 버튼을 엄지로 누른다.

**Why this priority**: 헌장 PRJ-004 미달을 해소하는 이 미션의 전부다.

**Independent Test**: 360px에서 튜토리얼을 끝까지 진행하며 카드 안 보이는 버튼의 크기를 모두 잰다.

**Acceptance Scenarios**:

1. **Given** 360px 휴대폰, 튜토리얼 19/22단계, **When** 카드를 봄, **Then** "θ = …° 넣기" 버튼이 44×44 CSS px 이상이다
2. **Given** 360px, **When** 튜토리얼 1~22단계를 진행하며 카드 안에 보이는 버튼(조작 버튼, 각도 버튼, 퀴즈 보기, 발사·일시정지, 이전·다음·건너뛰기)을 잼, **Then** 모두 44×44 CSS px 이상이다
3. **Given** 이전 버전과 같은 조작, **When** 튜토리얼을 끝까지 진행, **Then** 문구·버튼 상태·진행 순서가 지금과 같다 (버튼 크기 외에 바뀐 것 없음)
4. **Given** 360px, 튜토리얼이 닫힘, **When** 머리말을 봄, **Then** 튜토리얼 열기 버튼이 44×44 CSS px 이상이다
5. **Given** 360px, 내용이 긴 단계(19·20/22), **When** 카드를 끝까지 스크롤, **Then** "다음" 버튼이 카드 안에서 보이고 누를 수 있으며, 카드 안 스크롤 깊이는 바꾸기 전보다 버튼 개수 × 2.75px 정도만 늘어난다 (검토 S5)

### Edge Cases

- 문구가 긴 버튼("Lower to Charge 1" 등): 폭은 원래 44px보다 넓다. 높이만 맞추면 된다
- 15/22단계 각도 버튼: 에피소드 스타일이 이미 최소 44px를 준다. 이번 변경으로 크기·배치가 바뀌지 않아야 한다
- 영어로 바꿨을 때: 같은 기준 (문구 길이만 다름)
- 어두운 테마: 크기는 테마와 무관

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | 조작 버튼 최소 크기 | 학습자로서, 튜토리얼 카드의 모든 조작 버튼(`.act`)이 44×44 CSS px 이상이기를 원한다. 휴대폰에서 잘못 누르지 않도록 | High | Open |
| FR-003 | 튜토리얼 열기 버튼 최소 크기 | 학습자로서, 머리말의 튜토리얼 열기 버튼(`.tut-btn`)이 44×44 CSS px 이상이기를 원한다 | High | Open |
| FR-002 | 모양·동작 그대로 | 학습자로서, 버튼의 색·테두리·굵기·문구·누르면 하는 일이 지금과 같기를 원한다. 크기 외에는 바뀌지 않도록 | High | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | 전체 확인 | 360px에서 튜토리얼 22단계를 진행하는 동안 카드 안에 보이는 모든 버튼과 튜토리얼 열기 버튼이 44×44 CSS px 이상 — 실패하면 테스트가 실패하는 단언으로 확인하고(기존 '작은 터치 대상 보고'처럼 기록만 하지 않음, 검토 S4), CI의 Chromium·Firefox·WebKit에서 실행되는 파일에 둔다(검토 R3) | Usability | High | Open |
| NFR-002 | 가로 스크롤 없음 | 360px에서 튜토리얼 진행 중 페이지 가로 스크롤 0 | Usability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | 엔진 공용 스타일에서 수정 | 수정은 엔진 공용 스타일(튜토리얼·UI)에서 한다 (사람 결정). 바꾼 규칙 옆에 이 미션 폴더를 주석으로 남긴다 (검토 S2). 에피소드는 엔진만 import하는 규칙(PRJ-003)은 그대로 | Technical | High | Open |
| C-002 | 이전 비교 | 이전 버전 비교 테스트(문구·버튼 상태·캔버스·스크린샷·튜토리얼 진행)가 통과한다. 머리말 버튼이 커지면 페이지 배치가 2.75px 밀려 스크린샷·스크롤 위치가 달라지므로, 비교할 때만 이번 크기 변경을 끄고 원래 배치로 비교한다 (눈금 미션과 같은 방식). 44px 자체는 NFR-001 테스트가 확인 | Technical | High | Open |
| C-003 | 계산·문구 불변 | 계산, 튜토리얼 단계·문구는 바꾸지 않는다 | Technical | High | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 360px에서 튜토리얼 전 단계의 카드 안 버튼과 튜토리얼 열기 버튼 중 44×44 CSS px 미만이 0개 (지금 2종류: `.act`, `.tut-btn`)
- **SC-002**: 이전 비교 테스트에서 차이 0건

## Assumptions

- 측정 시점(2026-10-25, 360px, 자동 진행)에 **튜토리얼 카드 안**에서 44px 미만은 `.act` 하나뿐이었다. 이전·다음(약 45.25px), 퀴즈 보기(약 45.25px), 카드 조작 버튼, 15단계 각도 버튼(44px)은 이미 기준을 넘는다. 카드 밖에서는 `.tut-btn`(41.25px, 이번 범위)과 `.info`(18px, Issue #13)가 헌장 예외 목록 없이 미달 (검토 R1). 언어·±·슬라이더·장약·모드 버튼은 헌장의 승인된 예외
- 장약 버튼과 "θ = 30° 넣기"는 자동 진행 경로에 나오지 않았지만 같은 `.act` 스타일이라 같은 높이다
- 헌장의 승인된 44px 예외 목록에 이번 버튼들은 없으므로 헌장 수정은 필요 없다. 이 미션 뒤에도 PRJ-004가 전부 해소되는 것은 아님(`.info` — Issue #13)
