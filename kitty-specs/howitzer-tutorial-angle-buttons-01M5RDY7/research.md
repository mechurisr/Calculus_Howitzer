# Research: 튜토리얼 실험 단계 각도 버튼 상태

모든 결정은 저장소 코드 확인과 스펙 검토(`spec-review.md`) 결과에 근거한다. 새 의존성이 없으므로 공급망 점검 대상 없음.

## R-1. 상태 표시 수단: 네이티브 속성 + 전용 클래스

- **Decision**: 현재 = `aria-pressed="true"`, 쏜 각도 = 네이티브 `disabled` + `aria-label="30°, 이미 쏨"`/`"30°, already fired"`. 스타일은 이 속성 선택자로만 정한다 (`.exp-angs .act[aria-pressed=true]`, `.exp-angs .act:disabled`)
- **Rationale**: 저장소의 선택 표시 관례가 `aria-pressed`(`engine/src/ui/components.css` `.mode button[aria-pressed=true]`), 비활성 관례가 네이티브 `disabled`(검토 R5 2차 확인: `aria-disabled` 사용처 없음). 상태가 속성 하나로 화면·보조 기술·테스트에 동시에 드러남. `disabled`는 클릭·Enter·Space를 모두 막고 탭 순서에서 뺌 (FR-001, US1-3)
- **Alternatives**: `aria-disabled` + 클릭 무시 — 초점은 남지만 Enter/Space 무시를 직접 구현해야 하고 관례와 다름 (검토 R5에서 ① 권장). 상태 클래스(`.is-fired`) — 보조 기술에 별도 속성이 또 필요

## R-2. 색: ink 채움 / line 채움 + muted, opacity 금지

- **Decision**:
  - 보통 = 공용 `.act` 그대로 (`--bg` 바탕, `--blue` 테두리·글자)
  - 현재 = `background: var(--ink); color: var(--bg); border-color: var(--ink)`
  - 쏜 각도 = `background: var(--line); color: var(--muted); border-color: var(--line); cursor: default` — `opacity` 쓰지 않음
- **Rationale**: 검토 2절 계산(2차 python3 재현). 현재: 밝은 #1B2320/#E7EBE4 = 13.31:1, 어두운 #DCE4DD/#121815도 4.5:1 이상. 쏜 각도 글자: 밝은 3.62:1, 어두운 4.49:1 (3:1 이상). 세 상태 바탕이 bg / ink / line으로 달라 흑백에서도 구분 (NFR-002)
- **Alternatives**: accent 채움 + 흰 글자 (4.18 / 2.80, 미달 — R1), muted 글자만 (보통과 휘도 같음 — R2), `opacity:.45` (1.89 / 2.33, 미달 — R11)

## R-3. 즉시 갱신: 슬라이더 input → `tut.emit('angle')`

- **Decision**: `main.ts`의 `ang` input 리스너에서 `tut.emit('angle')`을 부르고, 15단계 정의에 `on.angle: () => {}`를 둔다
- **Rationale**: 엔진 `emit(type)`은 현재 단계에 그 핸들러가 있을 때만 `render(false)`(스크롤 없음)를 부른다 (`engine/src/tutorial/index.ts` emit). 15단계만 다시 그려지고 다른 단계는 그대로 → C-003·다른 단계 parity 안전. ± 버튼(`.nudge`)과 키보드·`setAngle`도 모두 `input` 이벤트를 보냄 (`main.ts` nudge, `game.ts` setAngle). 엔진 변경 불필요 (C-004)
- **Alternatives**: input에서 `tut.render(false)` 직접 호출 — 모든 단계를 다시 그려 다른 단계 본문(슬라이더 값에 의존하는 조준 단계 등)과 parity에 영향. 엔진에 새 훅 추가 — 불필요한 엔진 변경
- **Note**: 각도 버튼 클릭 시 `setAngle`의 input → `emit('angle')` → render, 이어서 엔진의 클릭 처리 `render(false)`로 두 번 그린다. 같은 상태라 결과가 같고 비용은 무시할 수준

## R-4. 초점 복원

- **Decision**: `main.ts` `onAction`에서 누른 버튼이 15단계 각도 버튼이면 그 각도를 기억하고, `onRender`에서 초점이 사라졌을 때(`document.activeElement`가 `body`) `#tutBody .exp-angs [data-v="<각도>"]`가 있고 비활성이 아니면 `focus({ preventScroll: true })`. 각도 버튼 클릭은 render가 두 번 일어나므로(R-3 Note) 한 번 쓰고 지우지 않는다. 사용자가 슬라이더 등으로 초점을 옮겼으면 `activeElement`가 `body`가 아니라 빼앗지 않는다
- **Rationale**: `body.innerHTML` 교체로 카드 안 초점이 사라지면 키보드 사용자가 다음 버튼으로 이동할 수 없다 (Edge Case). 슬라이더는 카드 밖이라 영향 없음 (검토 R4 2차 정정). `preventScroll`로 화면이 튀지 않음
- **Alternatives**: 초점 복원 없음 — 키보드 사용자가 매번 카드 처음부터 탭 이동. 엔진에서 일반 초점 보존 — 엔진 변경

## R-5. 배치: flex 한 줄, 내용 폭 분배

- **Decision**: 버튼 줄 `<p class="exp-angs">`에 `display:flex; gap:8px; flex-wrap:nowrap`, 버튼 `.exp-angs .act`에 `flex:1 1 0; min-width:44px; min-height:44px; padding:0 4px`
- **Rationale**: answers.md V1 — 내용 폭 287px(클래식 스크롤바)에서 폭 상한 51.0px. `flex:1 1 0`이면 버튼 폭 = (내용 폭 − 32) / 5 = 51.0 / 54.0 px로 자동 분배되어 글자 폭과 무관하게 한 줄. 높이는 `min-height:44px`로 41.25 → 44 (NFR-001). 공용 `.act`는 손대지 않음 (C-002)
- **Alternatives**: 공용 `.tut-body .act` padding 키우기 — 19·20단계 등 다른 버튼과 parity가 바뀜 (C-002 위반, Issue #9 범위). 고정 폭 48px — 줄 끝 여백이 남고 큰 화면에서 버튼이 작게 보임

## R-6. 관찰 문장: 조건 함수 + 문구 4쌍

- **Decision**: `observationKind(angles)`가 `'both' | 'mid' | 'pair' | 'none'`을 돌려주고 (`mid` = 40·45·50 모두, `pair` = 30·60 모두), `missions.ts`가 종류별 한/영 문구를 고른다. `'both'` 문구는 지금 문장을 그대로 옮긴다
- **Rationale**: 조건이 순수 계산이라 단위 테스트로 answers.md 조합 5가지·경계(37.5° 섞임)를 확인 (PRJ-002). 문구는 i18n `tr`로 화면 쪽에 둠 (기존 관례)
- **Alternatives**: 문구 조립(절 단위 이어 붙이기) — 한/영 어순이 달라 번역 품질이 떨어짐

## R-7. 테스트 배치와 이전 비교

- **Decision**:
  - 새 `e2e/angle-buttons.spec.ts` — 튜토리얼을 열고 `walkTutorial`로 15단계("15 / 22")에서 멈춘 뒤 시나리오 확인. 진행 시간을 감안해 `test.setTimeout(300_000)`. 360px(데스크톱 Chromium 클래식 스크롤바 = 287px 경우)와 모바일 터치 390px 두 폭
  - `playwright.config.ts` CI firefox·webkit `testMatch`를 `/(ticks|mobile|angle-buttons)\.spec\.ts/`로 (NFR-003)
  - `e2e/parity.spec.ts` 튜토리얼 비교: 단계 이름이 "15 / 22"인 스냅샷의 `tutBody`에서 ① 각도 버튼 줄(`<p…>` 안의 `data-act="seta"` 버튼 5개) ② `<p class="fb">` 관찰 문장을 양쪽 모두 같은 자리표시로 바꾼 뒤 비교. 함수는 `helpers.ts`에 두고 주석에 C-003 참조
- **Rationale**: CI의 firefox·webkit은 지정 파일만 돈다 (검토 R6). parity는 tutBody 전체 HTML을 비교하므로 허용 차이를 정확히 그 두 덩어리로 한정 (검토 R7). 자동 진행은 legacy와 같은 순환 순서라 진행 시점은 같다 (검토 R7 2차)
- **Alternatives**: `ticks.spec.ts`에 추가 — 그 파일은 튜토리얼 완료 상태로 열어 15단계 카드가 없음, 주제도 다름. parity에서 15단계 통째 제외 — 설명·결과 표 회귀를 놓침
