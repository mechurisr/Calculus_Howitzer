# Mission Specification: 자주포 발사각 슬라이더 눈금

**Mission Branch**: `mission/howitzer-angle-ticks`  
**Created**: 2026-10-24  
**Status**: Draft  
**Input**: Issue #3 (채택, 검토 에이전트 팩트체크 반영) — 미적분 자주포 발사각 슬라이더(10°~80°)에 눈금과 숫자 라벨 추가

## Episode Design *(기존 에피소드 01-calculus-howitzer 개선: 바뀌는 항목만 작성)*

### 1. Role Setting

N/A — 역할(자주포 포수)과 상황은 그대로다.

### 2. Math Concepts

- 각도 눈금 읽기: 슬라이더 위치 ↔ 발사각의 선형 대응
- 진공·평지 사거리 R(θ) = v²·sin2θ / g 가 θ = 45°에서 최대 (튜토리얼 4장에서 이미 다룸)
- 선수 지식: 없음 (튜토리얼 4장 내용을 조작 화면에서 다시 보이게 하는 것)

### 3. Learning Goals *(at most 3)*

1. 슬라이더 위치만 보고 발사각을 10° 단위로 읽을 수 있다
2. 45° 위치를 바로 찾고, 그것이 "진공·평지에서" 사거리가 가장 긴 각도라는 조건을 함께 인식한다

### 4. Core Interaction

- 발사각 슬라이더 바로 아래에 눈금 줄이 붙는다. 슬라이더를 움직이면 손잡이가 눈금 위를 지나간다 (눈금 자체는 조작 대상이 아님)
- 5°마다 작은 눈금, 10°·20°·…·80°에 숫자. 45°는 굵은 눈금과 짧은 주석 "진공·평지 최대" / "max range (vacuum, flat)"
- 360px 폭(휴대폰)에서 슬라이더 실폭은 약 210px — 숫자가 겹치지 않아야 한다
- 슬라이더 조작(드래그, ± 버튼, 0.5° 단위)은 바뀌지 않는다

### 5. Staged Missions

N/A — 튜토리얼 미션은 바뀌지 않는다. 튜토리얼 4장 "45°는 사거리 그래프의 꼭대기"를 슬라이더에서도 볼 수 있게 할 뿐이다.

### 6. Answers and Verification

정답·풀이는 같은 폴더의 `answers.md`에 있다. 검토 시 아래 문제를 먼저 직접 풀 것.

- **V1.** 슬라이더 트랙 폭이 L(px), 손잡이 폭이 w(px), 범위가 10°~80°일 때, 각도 θ에 해당하는 손잡이 중심의 x 좌표(트랙 왼쪽 끝 기준)는?
- **V2.** 360px 폭 화면에서 슬라이더 실폭이 210px이고 손잡이 폭이 16px이면, 10° 간격 숫자 사이 거리는 몇 px인가? 숫자 "80°"(약 22px 폭)가 겹치지 않는가?
- **V3.** 발사 지점이 착탄 지면보다 h(m) 높을 때 진공에서 사거리를 최대로 하는 각도 θ*는? v = 75 m/s, h ≈ 14.5 m(자주포 2호 장약, 포구 높이)이면 θ*는 45°보다 큰가 작은가, 대략 몇 도인가?

### 7. References

| Item | Source | URL | Verified? |
|------|--------|-----|-----------|
| 진공 사거리 R = v²sin2θ/g, 최대 45° | Wikipedia "Range of a projectile" | https://en.wikipedia.org/wiki/Range_of_a_projectile | yes (검토 에이전트 팩트체크, Issue #3) |
| 발사 높이가 있을 때 최대 사거리 각 | 같은 문서 "Maximum range" (높이 y₀) | https://en.wikipedia.org/wiki/Range_of_a_projectile | needs verification (answers.md V3) |
| range 입력 눈금, datalist label | MDN `<input type="range">` "Adding tick marks" | https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#adding_tick_marks | yes (Safari는 label 미지원 — 팩트체크) |
| 이 게임의 실제 최대 각 43.5~46.5° | 검토 에이전트 팩트체크 계산 (Issue #3 댓글) | https://github.com/mechurisr/Calculus_Howitzer/issues/3 | needs verification |

### 8. Difficulty

1 — 화면 표시만 추가하고 계산·튜토리얼은 바꾸지 않는다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 슬라이더로 각도 읽기 (Priority: P1)

학습자가 발사각 슬라이더를 움직이며, 숫자 칸(θ 값)을 보지 않고도 눈금만으로 지금 각도를 대략 안다.

**Why this priority**: 이 기능의 핵심 가치. 다른 이야기 없이도 단독으로 쓸모가 있다.

**Independent Test**: 슬라이더를 10°, 30°, 45°, 80°에 두고 손잡이 중심이 해당 눈금과 맞는지 본다.

**Acceptance Scenarios**:

1. **Given** 데스크톱(1280px) 화면, **When** 슬라이더를 30°에 두면, **Then** 손잡이 중심이 "30" 눈금 바로 위에 있다
2. **Given** 휴대폰(360px) 화면, **When** 페이지를 열면, **Then** 10~80의 숫자 8개가 서로 겹치지 않고 모두 보인다
3. **Given** 슬라이더가 10° 또는 80°(양 끝), **When** 화면을 보면, **Then** 끝 숫자 "10"과 "80"이 잘리지 않는다

---

### User Story 2 - 45° 찾기와 조건 인식 (Priority: P2)

학습자가 45° 눈금을 바로 찾고, 그 옆 주석으로 "진공·평지에서" 최대라는 조건을 본다.

**Why this priority**: 튜토리얼 4장 개념을 조작 화면과 잇는다. 1번 없이는 의미가 약하다.

**Independent Test**: 45° 눈금이 다른 눈금과 구별되고, 주석이 한국어·영어로 바뀌는지 본다.

**Acceptance Scenarios**:

1. **Given** 한국어 화면, **When** 눈금 줄을 보면, **Then** 45°가 굵게 강조되고 "진공·평지 최대" 주석이 보인다
2. **Given** 언어를 English로 바꾸면, **Then** 주석이 "max range (vacuum, flat)"로 바뀌고 위치는 그대로다
3. **Given** 공기저항 모드, **When** 눈금 줄을 보면, **Then** 주석은 여전히 "진공·평지" 조건을 밝히며 "최대"를 단정하지 않는다

---

### Edge Cases

- 창 크기를 바꾸거나(360px ↔ 1280px) 휴대폰을 회전해도 눈금이 손잡이 위치와 어긋나지 않는다
- 다크 모드에서도 눈금과 숫자가 읽힌다
- iOS Safari처럼 range 입력의 눈금 숫자를 그리지 않는 브라우저에서도 숫자가 보인다
- 튜토리얼이 슬라이더를 강조(어두운 막)할 때 눈금이 어색하게 가려지거나 튀지 않는다
- 눈금이 슬라이더 터치·드래그를 가로채지 않는다

## Requirements *(mandatory)*

### Functional Requirements

| ID | Title | User Story | Priority | Status |
|----|-------|------------|----------|--------|
| FR-001 | 5° 작은 눈금 | 학습자로서 10°~80° 사이 5°마다 작은 눈금(15개)을 보고 싶다, 각도를 촘촘히 가늠하기 위해 | High | Open |
| FR-002 | 10° 숫자 라벨 | 학습자로서 10, 20, …, 80(8개)에 숫자를 보고 싶다, 각도를 읽기 위해 | High | Open |
| FR-003 | 45° 강조와 조건 주석 | 학습자로서 45° 눈금이 굵게 강조되고 "진공·평지 최대"라는 조건이 함께 보이길 원한다, 최대 사거리 각을 오해하지 않기 위해 | High | Open |
| FR-004 | 손잡이 위치와 일치 | 학습자로서 손잡이를 어떤 각도에 두든 그 각도의 눈금 바로 위에 손잡이 중심이 오길 원한다 | High | Open |
| FR-005 | 한/영 주석 | 학습자로서 언어 전환 시 주석도 같이 바뀌길 원한다 | Medium | Open |
| FR-006 | 대칭 단정 금지 | 학습자로서 30°와 60°가 "같은 거리"라는 잘못된 표시를 보지 않길 원한다 (이 게임은 지형·포구 높이로 실제 거리가 다름) | Medium | Open |

### Non-Functional Requirements

| ID | Title | Requirement | Category | Priority | Status |
|----|-------|-------------|----------|----------|--------|
| NFR-001 | 휴대폰 배치 | 360px 폭에서 가로 스크롤 0, 숫자 라벨 8개의 영역이 서로 겹치지 않음, 양 끝 숫자가 잘리지 않음 | Usability | High | Open |
| NFR-002 | 위치 정확도 | 360px·768px·1280px 폭에서 손잡이 중심과 해당 눈금의 가로 차이 ≤ 2 CSS px (10°, 45°, 80°에서 측정) | Accuracy | High | Open |
| NFR-003 | 조작 불변 | 슬라이더의 터치 영역·드래그·± 버튼 동작이 바뀌지 않음 (기존 모바일 테스트 통과, 눈금은 입력을 받지 않음) | Usability | High | Open |
| NFR-004 | 브라우저 | Chromium·Firefox·WebKit 엔진에서 숫자 8개와 주석이 모두 보임 | Compatibility | Medium | Open |
| NFR-005 | 테마 | 라이트·다크 모두 테마 색 토큰을 써서 눈금·숫자가 배경과 구별됨 | Usability | Medium | Open |

### Constraints

| ID | Title | Constraint | Category | Priority | Status |
|----|-------|------------|----------|----------|--------|
| C-001 | 계산 불변 | 탄도 계산, 장약, 튜토리얼 문구·단계는 바꾸지 않는다 | Technical | High | Open |
| C-002 | 슬라이더 범위 불변 | 범위 10°~80°, 0.5° 단위, ± 버튼 0.5°는 그대로 | Technical | High | Open |
| C-003 | 엔진만 의존 | 에피소드는 공통 엔진만 사용 (헌장 PRJ-003). 눈금이 다른 에피소드에도 쓸모 있으면 엔진에 둘 수 있다 | Technical | Medium | Open |
| C-004 | 표현 정확성 | 45°를 조건 없이 "최대"로 쓰지 않는다 (헌장 PRJ-001: 게임 값과 실제를 구분) | Business | High | Open |
| C-005 | 이전 비교 테스트 | 원본과 픽셀 단위로 같아야 하는 기존 비교 테스트는 화면이 의도적으로 바뀌면 깨진다. 계속 지킬 범위를 plan에서 정한다 | Technical | Medium | Open |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 휴대폰 크기 화면에서 학습자가 숫자 칸을 보지 않고 슬라이더를 30°·45°·60° 근처(±2.5°)에 3번 중 3번 맞출 수 있다
- **SC-002**: 360px·768px·1280px 세 크기 모두에서 눈금 숫자 8개가 겹침 없이 보인다
- **SC-003**: 45° 표시 어디에도 조건("진공·평지") 없는 "최대" 문구가 없다 (한국어·영어 모두)
- **SC-004**: 기존 플레이·튜토리얼의 동작(착탄 결과, 튜토리얼 진행)은 변경 전과 같다

## Assumptions

- 브라우저 기본 손잡이 폭은 약 16px로 본다 (V2 계산). 실제 폭이 달라도 FR-004는 실제 손잡이 위치 기준으로 검증한다
- 주석 문구는 짧게 유지한다: "진공·평지 최대" / "max range (vacuum, flat)"
- 30°/60° 대칭은 튜토리얼 4장이 이미 "비슷하다"로 다루므로 슬라이더에는 표시하지 않는다
