# Answers and Verification: 자주포 발사각 슬라이더 눈금

검토 에이전트는 `spec.md`의 V1~V3를 먼저 직접 푼 뒤 이 파일과 비교할 것.

## V1. 각도 θ → 손잡이 중심 x

- Answer: x(θ) = w/2 + (θ − 10)/70 · (L − w)  [px]
  - L = 슬라이더 입력 요소의 border box 폭(`getBoundingClientRect().width`), x = 그 상자의 왼쪽 끝 기준. 브라우저 기본 여백(margin 2px)은 상자 바깥이라 식에 들어가지 않는다
- Derivation: 손잡이 중심은 왼쪽 끝 w/2(θ = 10°)에서 오른쪽 끝 L − w/2(θ = 80°)까지 움직인다. 이동 가능 거리 L − w를 범위 70°에 선형으로 나눈다
  - 확인: θ = 10 → w/2, θ = 80 → w/2 + (L − w) = L − w/2, θ = 45 → L/2 (가운데)
- Verification: 브라우저에서 range 입력의 실제 손잡이 위치를 재서 눈금 x와 비교 (NFR-002, 허용 ±2 px). 함수는 단위 테스트로 양 끝·가운데 값 확인

## V2. 360px 화면의 10° 간격

- Answer: (206 − 16) / 7 ≈ **27.1 px**. "80°"(약 22 px)보다 넓어 겹치지 않음 (여유 약 5.1 px)
- Derivation:
  - 배치 공간 210 px = 360 − 2·16(`.wrap` 좌우 여백) − 2·(1 + 14)(`.panel` 테두리·안쪽 여백) − 2·36(± 버튼) − 2·8(간격)
  - 입력 요소 border box L = 210 − 2·2 = **206 px** (Chromium·Firefox·WebKit 기본 스타일 모두 `input[type=range]{margin:2px}` — 검토 에이전트 2차 확인)
  - 숫자 사이 = 이동 가능 거리 (L − w) ÷ 7칸 = 190 ÷ 7
  - (초안은 210으로 계산해 27.7 px로 적었음. 그대로 그리면 80°에서 4 px 어긋나 NFR-002를 넘음)
- Verification: Playwright 360px에서 숫자 라벨 8개의 경계 상자가 서로 겹치지 않는지 확인 (NFR-001)
- 주의: "45" 숫자를 숫자 줄에 따로 달면 40·45·50 간격이 약 13.6 px가 되어 겹친다 → 45°는 굵은 눈금과, 숫자 아래 별도 줄의 주석("45° · …")으로 표시

## V3. 발사 높이 h가 있을 때 최대 사거리 각

- Answer: θ* = arctan( v / √(v² + 2gh) ) — h > 0이면 **45°보다 작다**
- v = 75 m/s [game value], g = 9.8 m/s², h = 14.5 m [game value, 45°일 때 포구 높이]: √(5625 + 284.2) = √5909.2 ≈ 76.87 → θ* = arctan(75 / 76.87) = arctan(0.9757) ≈ **44.3°**
- Derivation: 착탄 높이가 발사 높이보다 h 낮은 진공 포물선의 수평 거리 R(θ) = (v cosθ / g)(v sinθ + √(v²sin²θ + 2gh))를 θ에 대해 미분해 dR/dθ = 0 → tanθ* = v / √(v² + 2gh) (사거리 식 출처: Wikipedia "Range of a projectile"의 y₀ 포함 식. 최적각은 이 식에서 유도)
- 참고: 포구 높이가 각도에 따라 h(θ) = 6 + 12 sinθ로 변하는 것까지 넣어도 최적각은 44.51°로 0.2° 안에서 같다 (검토 에이전트 2차)
- 의미: 자주포는 포구가 지면보다 높아 진공·평지에서도 최적 각이 45°보다 약간 작다(사거리 차이 0.17 m, 화면에서 보이지 않음). 그래서 45° 주석은 "같은 높이에서"라는 조건을 밝힌다: "45° · 같은 높이에서 사거리 최대" (C-004)
- Verification: 이 미션은 계산 코드를 바꾸지 않는다(C-001). 위 값은 주석 문구의 근거로만 쓰며, 게임 화면의 실제 최대 각(지형·공기저항 포함, 모드별 값은 아래 표)은 [needs verification]

## Physical values

| Quantity | Value | Unit | Source | Status |
|---|---|---|---|---|
| 발사각 범위 | 10 ~ 80 | ° | `episodes/01-calculus-howitzer/index.html` `#ang` | verified |
| 슬라이더 단위 | 0.5 | ° | 같은 곳 `step` | verified |
| g | 9.8 | m/s² | `src/model/constants.ts` (표준중력 9.80665 반올림) | verified |
| 2호 장약 포구속도 | 75 | m/s | `src/model/constants.ts` CHARGES | game value |
| 포구 높이 h (45° 기준, 장약과 무관) | ≈ 14.5 (10°: 8.1, 80°: 17.8) | m | 지면 + 6 + 12·sinθ (`muzzlePos`) | game value |
| 브라우저 range 손잡이 폭 | ≈ 16 | px | 브라우저 기본값 (엔진마다 다름) | needs verification |
| 게임 화면의 실제 최대 각: 2호·진공·굴곡 지형 | 44.4 ~ 47.0 (평균 45.8) | ° | 검토 에이전트 재현 60 seed (spec-review.md §2) | needs verification |
| 게임 화면의 실제 최대 각: 평지·진공 / 평지·공기 | 44.4 / 43.0 | ° | 같은 재현 계산 | needs verification |
| 슬라이더 입력 요소 폭 @360px | 206 (배치 공간 210 − margin 2×2) | px | `components.css` + 브라우저 기본 스타일 | verified |
