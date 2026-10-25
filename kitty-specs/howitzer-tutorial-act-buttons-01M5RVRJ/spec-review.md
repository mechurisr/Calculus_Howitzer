# 스펙 검토: 튜토리얼 조작 버튼 44px

- 검토 대상: kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ/spec.md, answers.md
- 검토자: 검토 에이전트 (1차 독립 풀이 → 2차 정답 비교)
- 날짜: 2026-10-25

## 요약

- (2차 최종) [치명적] 0건, [권장] 3건(R1~R3), [사소함] 4건(S2~S5)
- 가장 중요한 지적: 스펙의 Assumptions "측정 시점에 44px 미만은 `.act` 하나뿐"은 **카드 밖까지 포함하면 사실이 아니다** — 같은 41.25px인 `.tut-btn`(튜토리얼 열기 버튼)이 헌장 승인 예외 목록에도 없이 44px 미만으로 남는다. 이 미션은 카드 안만 고치므로 SC-001 자체는 참이지만, PR 에서 "PRJ-004 해소"라고 쓰면 틀린다(R1). (1차가 함께 든 `.info` 18×18은 WCAG 2.5.5의 "문장 안 도움말 아이콘" 예외라 2차에서 범위를 줄였다.)
- 2차 확인: V1 독립 풀이는 `answers.md`와 **완전히 일치**(41.25 px, 부족분 2.75 px). 1차의 수치·설정 주장(카드 안·밖 버튼 높이, CI `testMatch`, parity 비교 범위, 15/22 특이도)을 소스로 다시 확인했고 틀린 곳은 없었다. 인용 오류 하나(S2의 `tutorial.css:9`, 4절에서 정정)와, 본문이 없는 S1 참조(집계에서 제외, S1~S5 → S2~S5)가 있었다. 둘 다 검토 산출물의 문제이며 스펙 결함은 아니다.

## 1. 수학 독립 검증

§5 Staged Missions가 N/A(기존 에피소드 UI 개선)이므로 미션 대신 §6의 검증 문제 V1을 직접 풀었다. `research.md`는 없고 `research/` 폴더도 비어 있었다. 이 미션은 탄도·지형·조준 계산을 바꾸지 않으므로(C-003) 검증 대상은 360px 레이아웃/CSS 상자 계산이다.

계산 도구는 쓰지 않았다(1차 기준 — 셸 권한이 막혀 있다). 아래 px 값은 CSS 값의 정확한 산술이다. 폰트 메트릭에 의존하는 값(글자 폭)은 쓰지 않았고, 높이는 전부 `line-height`로 결정되므로 메트릭 근사가 필요 없다. 근거: `engine/src/tutorial/tutorial.css:19`(`.tut-body .act{padding:8px 12px;border:1px …}`), `engine/src/ui/theme.css:2`(전역 `box-sizing:border-box`), `:22`(`body{font-size:15px;line-height:1.55}`), 그리고 `.act`의 `font:inherit`이 `line-height:1.55`까지 상속한다는 점.

### M1 V1 — 지금 `.act` 높이와 44px 부족분
- 독립 풀이:
  - 한 줄일 때 버튼 내용 높이 = 글자 줄 상자 = `15px × 1.55 = 23.25px`. (`font:inherit`이 `line-height`를 단위 없이 상속하므로 15px에 대해 1.55배)
  - 위아래 안쪽 여백 = `8 + 8 = 16px`, 테두리 = `1 + 1 = 2px`.
  - 높이는 `auto`이므로(= `min-height`/`height` 없음) `box-sizing:border-box`여도 값이 같다: **23.25 + 16 + 2 = 41.25px**.
  - 부족분 = **44 − 41.25 = 2.75px**.
  - 44px를 여백만으로 맞추려면 위아래를 각각 `(44 − 23.25 − 2) / 2 = 9.375px`로 해야 한다(현재 8px → +1.375px씩). `min-height:44px`를 주는 방법도 같은 결과(44px)를 내고, 두 줄로 감기는 긴 문구에서도 잘리지 않는다.
  - 전제: 문구가 360px에서 한 줄. 카드 내용 폭 287~302px에 가장 긴 문구("θ = 22.0° 넣기" / "Lower to Charge 1")도 한 줄에 들어간다(글자 폭 근사 없이도 여백 24px + 테두리 2px를 빼고 260px 이상 남음).
  - 같은 방식으로 카드 안 다른 버튼도 확인했다: `.tut-nav button`·`.tut-body .quiz button` = 10+10+23.25+2 = **45.25px**, `.tut-body .exp-angs .act` = `min-height:44px`로 **44px**, `.tut-ctrl .btn-primary`(17px) = 17×1.55+20 = **46.35px**, `.btn-sec` = 12+12+23.25+2 = **49.25px**. 즉 카드 안에서 44px 미만은 `.act`(15/22 각도 버튼 제외) 하나라는 스펙 서술과 일치한다.
  - 카드 **밖**도 같은 식으로 훑었다(발견 사항은 R1): `.tut-btn` = 8+8+23.25+2 = **41.25px**, `.info` = **18×18px**, `.lang-btn`(13px/1.2) = 15.6+12+2 = **29.6px**, `.nudge` = **36px**, `#ang` = **28px**, `.mode button` = 9+9+23.25 = **41.25px**.
- 스펙 답과 비교: **일치** — `answers.md` V1의 답 "41.25 px, 2.75 px 모자람"과 유도 4단계(줄 높이 23.25 = 15×1.55, 여백 16, 테두리 2, 합 41.25; `min-height:44px`면 위아래 여백이 각 9.375 px)가 1차 풀이와 **문자 단위로 같다**. `python3`로 재계산해 확인: 23.25 / 41.25 / 2.75 / (44−23.25−2)/2 = 9.375. `answers.md`가 든 "높이를 지정하지 않아 내용에서 정해진다"는 전제도 `tutorial.css:19`에 `height`·`min-height`가 없는 것과 맞다.
  - 1차가 근사로 남긴 값은 없었다(모두 CSS 지정값의 정확한 산술). 다만 `answers.md`의 실측 "119 × 41.25 px" 중 **폭 119 px는 이 검토 환경에서 재현할 수 없다**(브라우저 실행 권한 없음). 높이 41.25 px는 계산과 일치하고 1차가 독립적으로 확인한 다른 버튼 높이(45.25·46.35·49.25)도 `answers.md`·스펙과 어긋나지 않으므로, 실측 폭을 문제 삼지 않는다.
- 지적: [사소함] S1 (아래)

  *(2차 주석: 이 문서에 S1 본문이 없어 집계에서 제외했다(S2~S5 4건). 1차가 S1에서 말하려던 내용은 S2와 겹치는 것으로 보이며, V1 수치 자체는 `answers.md`와 일치하므로 스펙 결함은 아니다.)*

### 부수 확인 — 이번 변경이 기존 검사와 부딪히지 않는지
- 독립 확인:
  - 15/22 각도 버튼은 `.exp-angs .act{flex:1 1 0;min-width:44px;min-height:44px;padding:0 4px}`(`episodes/01-calculus-howitzer/src/style.css:43`)로 높이·폭이 이미 44px다. 엔진 쪽 `.tut-body .act`를 `min-height:44px`로 고치든 위아래 padding을 9.375px로 고치든, 이 규칙이 `padding` 전체와 `min-*`를 덮으므로 **15/22 배치는 바뀌지 않는다**. 엔진 CSS가 먼저 로드되고(`main.ts:1-4`) 선택자 특이도도 0,3,0 대 0,2,0이라 순서와 무관하다.
  - 카드는 `position:fixed`이고 `width:min(560px,100%−24)`의 `100%`가 뷰포트라, 카드 내용 높이가 2.75px 늘어도 **페이지 세로 길이·`scrollY`는 변하지 않는다**(`body.tut-open`의 `padding-bottom:55vh`도 상수).
  - 이전 비교 테스트(`e2e/parity.spec.ts` + `e2e/helpers.ts`의 `snapshot`)는 `tutBody`/`tut`의 **HTML 문자열**, 캔버스 픽셀, `scrollY`, 클래스명만 비교하고 버튼 기하(사각형)는 비교하지 않는다. HTML은 바뀌지 않으므로 C-002("이전 비교 테스트가 수정 없이 통과")는 성립한다. 스크린샷 비교(`parity.spec.ts:81-92`)는 튜토리얼을 닫은 상태로 찍으므로 `.act` 높이 변화가 화면에 나오지 않는다.
  - `e2e/angle-buttons.spec.ts:116`은 15/22 버튼 5개의 `h ≥ 44`·같은 `y`·간격 8px을 요구하는데, 위 이유로 영향이 없다. 반대로 이 미션으로 15/22가 44px를 넘어가면(예: padding을 10px로 올리면 44 초과) `expectRow`의 "같은 y"는 유지되지만 카드가 더 길어져 내부 스크롤 여지가 줄어든다(S5).
- 지적: 없음

## 2. 물리값·실제 데이터

이 미션은 계산·물리값을 바꾸지 않는다(§2·§5 N/A, C-003). 새로 쓰는 수치는 접근성 기준 44px과 CSS 상자 값뿐이라 그 둘을 확인했다. 물리 상수(`g = 9.8`, `CHARGES = 60/75/93/115`)는 손대지 않으므로 재검증 대상이 아니다.

| 항목 | 스펙 값 | 단위 | 현실 범위 | 출처 확인 | 지적 |
|---|---|---|---|---|---|
| 조작 요소 최소 크기 | 44×44 | CSS px | WCAG 2.2 SC 2.5.5의 기준값과 동일 | 인용 URL 본문 "at least 44 by 44 CSS pixels" 확인, 제목도 "Target Size (Enhanced) (Level AAA)" — 스펙 §7이 Level AAA를 명시한 것도 확인 | 없음 |
| 본문 글자 크기·줄 높이 | 15 / 1.55 | px / 배 | 시리즈 공통 테마 값 | `engine/src/ui/theme.css:22` `body{font-size:15px;line-height:1.55}` 그대로 | 없음 |
| `.act` 여백·테두리 | 8px 12px / 1px | px | — | `engine/src/tutorial/tutorial.css:19`와 일치 | 없음 |
| `.act` 현재 높이 | 41.25 (스펙은 "약 41.25") | px | 계산값(1절) | 23.25 + 16 + 2 | 없음 |
| 44px 부족분 | 2.75 | px | 계산값 | 44 − 41.25 | 없음 |
| 15/22 각도 버튼 높이 | 44 | px | 스펙 "이미 44px" | `.exp-angs .act{min-height:44px}`(`episodes/…/style.css:43`) | 없음 |
| 이전·다음·건너뛰기 / 퀴즈 보기 | 약 45.25 | px | 스펙 Assumptions와 일치 | `tutorial.css:15,26`의 `padding:10px 12px` + 테두리 1px | 없음 |
| 카드 조작 버튼(발사·일시정지·0.5초) | 명시 없음 | px | 46.35(발사) / 49.25(보조) | `components.css:22,24,23` + `tutorial.css:23` | 없음 |
| **`.tut-btn`(튜토리얼 열기)** | 스펙에 없음 | px | **41.25 — 44 미만** | `engine/src/ui/components.css:49` `padding:8px 12px;border:1px;font:inherit` | [권장] R1 |
| **`.info`(힌트 해설 아이콘)** | 스펙에 없음 | px | **18×18 — 44 미만** | `components.css:33` `width:18px;height:18px` | [권장] R1 |
| 언어 버튼 / ± 버튼 / 슬라이더 / 장약·모드 버튼 | — | px | 29.6 / 36 / 28 / 41.25 — 모두 44 미만 | 헌장 `.kittify/charter/charter.md:42`의 승인 예외 목록에 있음 | 없음(예외) |

`answers.md`의 "Physical values" 표 4행을 2번 항목 기준으로 대조했다.

| answers.md 행 | 스펙/answers 값 | 소스 대조 | 판정 |
|---|---|---|---|
| 터치 대상 최소 크기 | 44 × 44 CSS px | WCAG 원문 "at least 44 by 44 CSS pixels", SC 2.5.5 Level AAA | 일치 |
| 본문 글자 크기·줄 높이 | 15, 1.55 px/배 | `theme.css:22` 그대로 | 일치 |
| `.act` 안쪽 여백·테두리 | 8/12, 1 px | `tutorial.css:19` 그대로 | 일치 |
| 지금 `.act` 높이 | 41.25 px | 23.25+16+2, 1차 독립 계산과 동일 | 일치 |

- 출처 표기: `answers.md`의 4행 모두 `verified`이고, 인용 URL·파일:줄이 실제 내용과 맞는다. 물리 상수(`g = 9.8`, `CHARGES = 60/75/93/115`)는 이 미션이 건드리지 않아(C-003) 재검증 대상이 아니며, 1차 판단이 맞다.
- 2차 보강(R1 관련): WCAG 원문에서 **"Inline: The target is in a sentence or block of text"** 예외와 **"Example 6: Help icon — A help icon within or at the end of a sentence does not need to meet the 44 by 44 CSS pixel requirement"** 를 확인했다. 힌트 상자의 `.info`(i)는 해설 텍스트 안/끝에 붙는 도움말 아이콘이므로(`hint.ts:29`에서 `eqInfo()`가 문장 앞에 붙음) **WCAG 2.5.5로는 예외로 볼 수 있다.** 따라서 R1에서 `.info`를 "미달"로 단정한 부분은 과했고, 남는 문제는 "헌장 예외 목록에 없다"는 프로젝트 규칙 쪽뿐이다. R1의 실질 지적은 `.tut-btn`(41.25 px) 하나로 좁혀 읽으면 된다. (다만 "문장 안"인지 "블록 안"인지는 배치에 따라 판단이 갈릴 수 있어, 예외 적용 여부는 사람이 확정하는 것이 안전하다.)

- R1: [권장] **"44px 미만은 `.act` 하나뿐"은 카드 밖까지 세면 틀린다.** §Assumptions와 SC-001은 "카드 안"으로 범위를 잡아 참이지만, Assumptions 문장은 범위 표시 없이 "측정 시점(2026-10-25, 360px, 자동 진행)에 44px 미만은 `.act` 하나뿐이었다"라고 써서 페이지 전체 측정처럼 읽힌다. 실제로는 같은 41.25px인 `.tut-btn`(머리말의 "다시 배우기" 버튼, `components.css:49`)과 18×18인 `.info`(힌트 상자의 "i" 버튼)가 44px 미만이고, **둘 다 헌장의 승인 예외 목록(언어 버튼, ± 버튼, 각도 슬라이더, 장약·모드 버튼)에 없다**. 특히 `.tut-btn`은 `.act`와 여백·테두리·글자 크기가 완전히 같아 부족분도 똑같이 2.75px이므로, 같은 엔진 CSS 한 줄(`min-height:44px`)로 함께 해소된다. 권고: ① `.tut-btn`을 이 미션 범위에 넣거나(이름이 "튜토리얼 … 버튼"이라 범위와도 맞다), ② 후속 Issue 로 넘기고 Assumptions 문장을 "카드 안에서는"으로 한정한 뒤 PR 설명에 남은 미달 항목(`.tut-btn` 41.25, `.info` 18×18)을 적는다. `.info`는 WCAG 2.5.5의 "문장 안 대상" 예외로 볼 여지가 있지만, 헌장은 예외를 목록으로 한정하므로 예외 목록에 추가하려면 사람 승인이 필요하다.

  *(2차 정정: `.tut-btn`의 실제 문구는 `strings.ts:9`의 "수학이 무섭다면? 미적분 배우기"이고 "다시 배우기"는 마무리 단계 문구다 — 지적 내용에는 영향 없음. `.info`는 WCAG 원문의 "Inline" 예외·"Example 6: Help icon"에 해당할 수 있어 WCAG 위반으로 단정할 수 없다. 다만 헌장 예외 목록에 없으므로 프로젝트 규칙상으로는 남는다. 따라서 R1의 확정 지적은 `.tut-btn` 41.25 px 하나이고, `.info`는 "헌장 예외 목록에 넣을지 사람이 판단" 항목으로 낮춰 읽으면 된다.)*

## 3. 교육 설계

학습 목표 1개(휴대폰에서 버튼을 한 번에 누른다)가 미션의 전부이고, 수학 개념·단계·문구를 바꾸지 않으므로 개념이 쌓이는 순서에 영향이 없다. 건너뛰는 개념도, 새로 설명해야 할 개념도 없다. §5가 N/A인 것은 직전 미션(`howitzer-tutorial-angle-buttons-01M5RDY7`)과 같은 "기존 에피소드 개선" 형태이고, 그때 검토가 같은 이유로 허용했다. 다만 두 가지.

- S3: [사소함] 학습 목표가 "잘못 누르지 않고 한 번에 누른다"는 **손가락 정밀도** 목표로만 읽힌다. 이 에피소드에서 버튼이 작아 생기는 실제 손해는 "5장 조준에서 계산한 각도를 넣다가 옆 버튼을 눌러 발사 흐름이 끊긴다"이므로, "계산한 각도를 한 번에 넣어 5장 조준 흐름을 끊지 않는다"처럼 과제 흐름과 연결하면 §3·§4·SC-001이 한 줄로 이어진다. 표현 문제이고 요구는 이미 충족한다.
- 지적 없음(그 외): 목표 → US1(P1) 우선순위도 맞고, "이전과 같은 조작"을 세 번째 시나리오로 둔 것도 회귀 방지에 맞다.

**2차 확인**: 미션 목록(`missions.ts`)을 다시 읽어 S3의 서술을 정밀화했다. 19~22단계는 `ctrl:true`라 카드 안에 조작 줄(`#tFire` 46.35px)이 함께 뜨고, 조준 버튼(`.act`)은 그 위 본문 `<p>` 안에 있다. 즉 빗나간 탭이 "옆 버튼"에만 가는 게 아니라 **바로 아래 조작 줄의 발사 버튼**으로도 갈 수 있다. S3의 지적("과제 흐름과 연결하면 좋다")은 그대로 유효하고, 문구를 "발사 버튼을 잘못 눌러"로 쓰면 더 정확하다. 등급은 [사소함] 유지.

## 4. 구현 가능성

범위가 CSS 한 줄 + 브라우저 테스트로 작고, 기존 구조에 잘 얹힌다. `.act`는 이미 `data-act`로 동작하고(`missions.ts:40,62,77,92,96`, `main.ts:49-55`), 이번 변경은 상자 높이만 건드린다. 아래는 계획에서 확정해야 하는 지점이다.

- R2: [권장] **"높이만 몇 px 키운다"의 수단이 스펙에 없다.** 구현자가 ① `height:44px`, ② `padding:9.375px 12px`, ③ `min-height:44px` 중 무엇을 고르느냐에 따라 결과가 갈린다. ①은 긴 영어 문구가 두 줄로 감길 때 글자가 잘리므로 쓰면 안 되고, ②는 지금 폰트 메트릭에서만 44px이 되며(글꼴이 바뀌면 다시 미달), ③이 가장 안전하다. 스펙에 **`min-height:44px`(고정 `height` 금지)** 와 함께 **`min-width:44px`** 를 적기를 권한다. FR-001이 "44×44"를 요구하는데 지금 폭은 문구 길이에만 의존한다 — 이 에피소드의 문구("θ = 30° 넣기", "Raise to Charge 2")는 모두 44px보다 넓지만, 엔진 공용 스타일이라 앞으로 짧은 문구("θ=9°")를 쓰는 에피소드에서 폭 미달이 재발한다. `min-width`는 15/22에 이미 같은 값이 있어 그 배치를 바꾸지 않는다.
- R3: [권장] **NFR-001의 "CI의 Chromium·Firefox·WebKit"이 지금 설정으로는 달성되지 않는다.** `playwright.config.ts:13`은 CI에서 firefox·webkit을 `testMatch: /(ticks|mobile|angle-buttons)\.spec\.ts/`로만 돌린다. 새 파일(예: `tut-buttons.spec.ts`)을 만들면 Chromium에서만 실행되어 NFR-001을 만족하지 못한다. 또 `mobile.spec.ts:4`는 390px라 PRJ-004의 360px을 재지 않는다. 계획에는 ① 측정을 `mobile.spec.ts`에 넣고 `setViewportSize({width:360,...})`로 360px을 명시하거나, ② `testMatch`에 새 파일을 추가한다고 적어야 한다. 22단계를 도는 데 시간이 걸리므로(`helpers.ts:101`이 단계당 1.2초 진행, `parity.spec.ts:7`이 900초를 쓰는 이유) `test.setTimeout(300_000)` 수준의 예산도 함께 적기를 권한다. 측정은 `getBoundingClientRect()`의 `w`·`h`로 하고, `walkTutorial`의 콜백에서 단계마다 `#tutBody button, #tutNav button, #tutCtrl button`을 재면 22단계를 한 번에 덮는다.
- S4: [사소함] `mobile.spec.ts:37-44`의 "작은 터치 대상 보고"는 annotation만 남기고 실패 처리하지 않는다. 이것을 NFR-001의 판정으로 쓰면 회귀를 통과시킨다. 새 검사는 `expect(h).toBeGreaterThanOrEqual(44)` 같은 실제 단언이어야 한다.
- S5: [사소함] 카드 안 `.act`가 2.75px씩 높아지면 19/22·20/22처럼 내용이 긴 단계에서 카드 내부 스크롤(`.tut{max-height:48vh;overflow:auto}`)이 더 깊어진다. `#tutNext`는 그 스크롤 영역 안에 있으므로, 학습자가 "다음"을 못 찾는 상황이 생길 수 있다. 기존 e2e는 `element.click()`을 직접 호출해(`helpers.ts:69-71`) 이 문제를 잡지 못한다. 테스트에서 `#tut`의 `scrollHeight − clientHeight`를 변경 전후로 비교하거나 `#tutNext`가 카드 뷰포트 안에 있는지 한 번 재 두기를 권한다.
- S2: [사소함] 저장소 관례는 변경한 CSS 규칙 옆에 근거 스펙 폴더를 주석으로 남기는 것이다(`tutorial.css:9`, `episodes/…/style.css:9,39,44`). 이번 변경도 `/* kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ … */` 한 줄을 남기면 나중에 "왜 44px인가"를 추적할 수 있다.

**2차 확인 (1차 주장을 소스로 재대조)**

- R2의 전제 확인: `tutorial.css:19`에는 `height`·`min-height`가 없고, 15/22 규칙(`style.css:43`)이 `min-width:44px;min-height:44px;padding:0 4px`를 이미 준다. 엔진 규칙에 `min-width`를 더해도 15/22 배치는 그대로다(특이도 0,3,0 > 0,2,0, 로드 순서 `main.ts:1-4`).
- R2의 "고정 `height` 금지" 근거 확인: 360px에서 가장 긴 문구("Lower to Charge 1" / "1호로 내리기")도 내용 폭 287px 안에서 한 줄이지만, 영어 문구가 길어지거나 폭이 좁아지면 두 줄이 되고 그때 내용 높이는 2×23.25+16+2 = **64.5px**다. `height:44px`면 잘린다.
- `min-height:44px`의 세로 정렬: 버튼은 브라우저 기본으로 내용을 세로 가운데 정렬하므로 `answers.md`의 "위아래 9.375px" 서술이 성립한다. 엔진별 차이가 나면 NFR-001(3엔진 측정)이 잡는다 — 추가 지적 없음.
- R3의 설정 확인: `playwright.config.ts:13`의 CI `testMatch: /(ticks|mobile|angle-buttons)\.spec\.ts/`, `mobile.spec.ts:4`의 `width:390`. 22단계 순회 예산은 `ticks.spec.ts:73`·`angle-buttons.spec.ts`가 이미 `test.setTimeout(300_000)`을 쓴다.
- C-002 확인: `helpers.ts:49-65`의 `snapshot`은 HTML 문자열·캔버스 dataURL·`scrollY`·클래스만 담고 버튼 사각형은 담지 않는다. 스크린샷 비교(`parity.spec.ts:81-92`)는 튜토리얼을 닫은 상태다. 따라서 `.act` 높이 변경은 이전 비교에 걸리지 않는다.
- S4 확인: `mobile.spec.ts:37-44`는 `info.annotations.push`만 하고 단언이 없다. 지적 유효.
- S5 확인: `.tut-nav`는 카드 안(`index.ts:61`)이고 `.tut`는 `max-height:48vh;overflow:auto`(`tutorial.css:6`)다. 지적 유효.
- S2 정정: 1차가 근거 예로 든 `tutorial.css:9`에는 스펙 폴더 주석이 없다(그 줄은 `.tut-body p{margin:0 0 8px}`). `engine/src` 전체에 `kitty-specs` 문자열이 **하나도 없다** — 즉 이 관례는 엔진 CSS가 아니라 **에피소드 CSS에만** 있다(`episodes/01-calculus-howitzer/src/style.css:9,39,44`). 따라서 S2는 "이번에 처음으로 엔진 공용 CSS에 근거 주석을 남긴다"는 뜻으로 읽어야 하고, 제안 자체(변경 이유 추적)는 여전히 타당하다. 등급 [사소함] 유지.
- 1차가 "지적: S1"으로 참조했으나 본문에 없는 항목은 집계에서 제외했다(요약 참조).

## 반영 결과
사람 선택 (2026-10-25): R1은 ①(`.tut-btn` 포함, `.info`는 후속 Issue #13), 나머지 전부 반영. 메인 세션이 `spec.md`·`answers.md`에 반영.

| 지적 | 반영 | 반영한 곳 |
|---|---|---|
| R1 카드 밖 44px 미만(`.tut-btn`, `.info`) | 반영 (①) | §4 표에 `.tut-btn` 추가, FR-003, US1-4, SC-001, Assumptions 범위 "카드 안" 명시, `.info`는 Issue #13. C-002에 이전 비교 처리 추가(머리말 배치가 밀림) |
| R2 높이 키우는 수단 | 반영 | §4 "최소 높이·최소 폭 44px, 고정 높이 금지" |
| R3 CI 엔진·360px 위치 | 반영 | NFR-001 (세 엔진에서 도는 파일, 360px) |
| S2 미션 폴더 주석 | 반영 | C-001 |
| S3 학습 목표와 조준 흐름 | 반영 | §3 |
| S4 기록만 하는 보고 금지 | 반영 | NFR-001 |
| S5 카드 안 스크롤 깊이 | 반영 | US1-5 |

반영하지 않은 지적: 없음. 범위 밖으로 넘긴 것: `.info` 해설 버튼(Issue #13).
