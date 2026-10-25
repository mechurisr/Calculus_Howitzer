# Data Model: 튜토리얼 실험 단계 각도 버튼 상태

저장소에 남는 데이터는 없다. 모두 15단계 튜토리얼 상태와 슬라이더 값에서 매번 계산한다.

## 입력

| 이름 | 출처 | 값 | 비고 |
|---|---|---|---|
| 실험 기록 `E` | 15단계 `StepState.exp: {ang, dist}[]` (`on.land`에서 `!r.out && r.v0 === 75`일 때 push) | 발사각 목록, 중복 가능 | 단계에 들어올 때 `{}`로 초기화 (엔진 `go()`) |
| 슬라이더 각도 `θ` | `#ang` 값 (`S`의 각도) | 10 + 0.5k (10~80) | 이진 정확값 → `===` 비교 |
| 버튼 각도 `EXP_ANGLES` | `missions.ts` 기존 값 | `[30, 40, 45, 50, 60]` | `src/model/angle-buttons.ts`로 옮겨 한 곳에서 정함 |

## AngleButtonState

`angleButtonState(a, θ, E) → 'normal' | 'current' | 'fired'`

| 조건 | 결과 |
|---|---|
| `a ∈ E` | `'fired'` (θ와 무관 — FR-004) |
| `a ∉ E` 이고 `θ === a` | `'current'` |
| 그 밖 | `'normal'` |

화면 대응 (15단계 버튼 `<button class="act" data-act="seta" data-v="a">a°</button>`):

| 상태 | 속성 | 스타일 (research R-2) |
|---|---|---|
| normal | (없음) | 공용 `.act` |
| current | `aria-pressed="true"` | ink 채움 + bg 글자 |
| fired | `disabled`, `aria-label="a°, 이미 쏨"` / `"a°, already fired"` | line 채움 + muted 글자 |

상태 전이는 spec.md §4 상태도와 같다. `fired`는 단계를 다시 들어올 때만 `normal`로 돌아간다.

## ObservationKind

`observationKind(E) → 'both' | 'mid' | 'pair' | 'none'` — 4발(서로 다른 각도 4개) 뒤에만 쓴다

| mid = {40,45,50} ⊆ E | pair = {30,60} ⊆ E | 결과 |
|---|---|---|
| 참 | 참 | `'both'` |
| 참 | 거짓 | `'mid'` |
| 거짓 | 참 | `'pair'` |
| 거짓 | 거짓 | `'none'` |

문구는 spec.md §4 "관찰 문장" 표 (한/영 4쌍). `'both'`는 지금 문장과 글자까지 같다.

## 튜토리얼 이벤트 `angle`

- 보내는 곳: `main.ts`의 `#ang` input 리스너 → `tut.emit('angle')` (데이터 없음)
- 받는 곳: 15단계 `on.angle`만 (빈 핸들러 — 다시 그리기만 일으킴)
- 효과: 엔진 `emit`이 `render(false)` → 15단계 본문을 스크롤 없이 다시 그림. 다른 단계에는 핸들러가 없어 무시됨
