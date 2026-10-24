# Research: 자주포 발사각 슬라이더 눈금

## R-1. 손잡이 폭을 어떻게 정할까 (NFR-002)

- **Decision**: 손잡이를 CSS로 직접 그린다. `appearance: none` + `::-webkit-slider-thumb` / `::-moz-range-thumb`에 폭·높이 22px, 테마 `--accent` 색. 트랙은 높이 6px의 `--line` 색
- **Rationale**: 기본 손잡이 폭은 엔진마다 다르고(Chromium은 테마 페인터, Firefox는 1em+테두리, WebKit은 플랫폼별 — spec-review.md §2) 코드로 읽을 수 없다. 폭을 고정하면 x(θ) = w/2 + f·(L − w)가 세 엔진에서 정확해지고 오차는 반올림 수준(<1px)
- **Alternatives considered**: 기본 손잡이 + 폭 16px 가정 + 스크린샷 실측 — 엔진별로 양 끝 2~3px 어긋날 수 있고 테스트가 복잡해 기각 (사람 결정 2026-10-25, decision 01M5QA62QT4NBKJ7NZSV80E4AP)

## R-2. 눈금의 기준 상자 (검토 묶음 A)

- **Decision**: `#ang`을 `.ang-track`(position: relative, flex: 1) 상자로 감싸고 `#ang`의 margin을 0, 폭 100%로 둔다. 눈금 3줄은 같은 상자 안에 둔다
- **Rationale**: 브라우저 기본 `margin: 2px` 때문에 배치 공간(210px)과 입력 상자(206px)가 달라지는 문제(검토 V2)를 구조로 없앤다. 상자 폭 = 입력 폭 = L
- **Alternatives considered**: margin을 둔 채 −2px 보정 — 엔진 기본값에 기대므로 기각

## R-3. 위치 계산을 어디서 하나

- **Decision**: 비율 f(θ)는 TS 순수 함수가 계산해 각 눈금 요소의 CSS 변수 `--f`로 넣고, 실제 px 위치는 CSS `calc(var(--thumb)/2 + var(--f) * (100% − var(--thumb)))`가 정한다
- **Rationale**: 창 크기·회전이 바뀌어도 브라우저가 다시 계산하므로 resize 감지 코드가 필요 없다 (검토 4절 리사이즈 지적). 비율 함수는 DOM이 없어 단위 테스트 가능(PRJ-002)
- **Alternatives considered**: 로드 시 px 계산 + ResizeObserver — 코드와 테스트가 늘어 기각. 엔진(`@series/engine`)에 공용 컴포넌트로 두기 — 사용처가 하나뿐이라 보류(두 번째 에피소드가 쓰면 이동)

## R-4. 손잡이-눈금 오차를 어떻게 측정하나 (NFR-002 검증)

- **Decision**: Playwright에서 슬라이더를 10°·45°·80°에 두고 슬라이더 영역 스크린샷을 찍어, 손잡이 색(테마 accent) 픽셀의 가로 중심과 해당 눈금 요소의 중심(`getBoundingClientRect`)을 비교한다. 허용 2 CSS px. 360·768·1280px와 창 크기 변경 뒤에 반복
- **Rationale**: 손잡이는 의사요소라 DOM 좌표가 없다. 색을 우리가 정했으므로(R-1) 픽셀로 찾기 쉽다
- **Alternatives considered**: 기대 위치만 계산해 눈금과 비교 — 식이 틀려도 통과하므로 검증이 아님

## R-5. 주석 표시 시점 (검토 묶음 D)

- **Decision**: 4장 "45°는 사거리 그래프의 꼭대기" 단계에 `enter` 동작을 붙여 `series:howitzer:angleNoteSeen=1`을 저장. 표시 조건 = angleNoteSeen 또는 tutDone(튜토리얼 끝냄·건너뜀). 튜토리얼 진행 중 상태가 바뀌면 즉시 갱신
- **Rationale**: 튜토리얼 문구·gate·순서는 그대로(C-001). 건너뛴 학습자는 바로 보임(Edge Case)
- **Alternatives considered**: 4장 진입이 아니라 4장 완료 시점 — 4장 본문이 45°를 설명하는 그 단계에서 보이는 편이 자연스러워 기각

## R-6. 이전 비교 테스트 (C-005, 검토 묶음 F 수정)

- **Decision**: `parity.spec.ts`의 전체 화면 스크린샷 비교에서만, 새 페이지에 스타일을 주입해 눈금 3줄을 숨기고(`display:none`) 손잡이를 브라우저 기본 모양으로 되돌린 뒤 원본과 픽셀 비교한다. 문구·버튼·캔버스·튜토리얼 비교는 그대로
- **Rationale**: 검토 제안("눈금 영역 마스크")은 눈금 줄이 추가되어 그 아래 내용이 모두 아래로 밀리는 점을 놓쳤다. 숨기면 배치가 원본과 같아져 나머지 화면 전체를 계속 픽셀 비교할 수 있다
- **Alternatives considered**: 스크린샷 비교 삭제 — 회귀 보호가 줄어 기각. 마스크 — 위 이유로 비교가 성립하지 않아 기각

## R-7. 브라우저 확인 (NFR-004)

- **Decision**: `playwright.config.ts`에 projects 3개: `chromium`(모든 테스트), `firefox`·`webkit`(눈금·모바일 테스트만, CI에서만). CI에서 `playwright install --with-deps chromium firefox webkit`
- **Rationale**: 이전 비교(약 3~8분)를 세 번 돌릴 필요는 없다. 로컬 Arch는 Playwright WebKit을 공식 지원하지 않음
- **Alternatives considered**: 수동 확인 — 사람이 CI 추가를 선택해 기각

## 공급망

새 패키지 추가 없음 (Playwright 브라우저 바이너리는 기존 `@playwright/test` 1.64.1이 받는 공식 빌드). DIRECTIVE_051 점검 대상 없음, adversarial 검토 생략 사유: 의존성 결정 없음.
