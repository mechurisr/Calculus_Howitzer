# Data Model: 자주포 발사각 슬라이더 눈금

## TickMark (눈금 하나)

| 필드 | 타입 | 규칙 |
|---|---|---|
| angle | number (°) | 10, 15, …, 80 (5° 간격, 15개) |
| kind | `'major' \| 'minor' \| 'emphasis'` | angle % 10 = 0 → major(8개), angle = 45 → emphasis(1개), 나머지 → minor(6개) |
| label | string \| null | major만 숫자 문자열("10"…"80"), 나머지 null |
| f | number | (angle − 10) / 70, 0 ≤ f ≤ 1 (V1 비율) |

불변 조건: 범위·간격은 슬라이더의 min/max(10/80)에서 온다. 45에는 label이 없다 (숫자 줄 겹침 — answers.md V2).

## AngleNote (45° 주석 표시 상태)

| 필드 | 출처 | 의미 |
|---|---|---|
| seen | localStorage `series:howitzer:angleNoteSeen` | 4장 해당 단계에 들어간 적 있음 |
| tutDone | localStorage `series:howitzer:tutDone` (기존) | 튜토리얼을 끝냈거나 건너뜀 |
| visible | 계산 | seen ∨ tutDone |

상태 전이: hidden → visible (4장 단계 진입 또는 튜토리얼 종료/건너뛰기). visible → hidden 전이는 없음 (되감지 않음).

의도: 튜토리얼을 상단 버튼으로 다시 볼 때도 주석이 계속 보인다. 처음 볼 때의 발견 학습만 보호하고, 다시 보는 학습자에게는 정보를 숨기지 않기로 함 (PR #5 크로스체크 #5).

화면 낭독기: 눈금 줄은 장식이라 `aria-hidden`, 주석 문구는 보이지 않는 `#angNoteSr`에 두고 주석이 보일 때만 `#ang`의 `aria-describedby`로 연결 (크로스체크 #8).
