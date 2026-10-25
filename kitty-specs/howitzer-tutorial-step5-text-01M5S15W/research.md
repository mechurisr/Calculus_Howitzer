# Research: 튜토리얼 5단계 설명 순서와 문구

새 의존성이 없으므로 공급망 점검 대상 없음.

## R-1. 본문 순서 바꾸기

- **Decision**: `missions.ts` 5단계 `body`에서 `h+=stepTable(s);` 바로 다음에, `r.length`가 있을 때 표 설명 문단(`<p class="small">` + `tr('vy가 매번 약 <b>4.9씩</b>…')`)을 붙이고, 그 뒤에 기존 "🤔 그런데…" 문단과 이유 상자를 그대로 둔다. 문단 글자는 한 글자도 바꾸지 않는다. 음수 조각 안내·"더 눌러 봐도 되고…"는 그대로 맨 아래
- **Rationale**: 표 설명과 "🤔"·이유 상자는 모두 `if(r.length)` 안에 있어 같은 조건. 문단을 옮기기만 하면 됨 (FR-001, FR-003)
- **Alternatives**: 표 설명을 `stepTable()` 안으로 — 표 함수 역할이 바뀌고 다른 단계에도 영향

## R-2. 이전 비교: 원본에 변환을 적용해 정확 비교

- **Decision**: `e2e/helpers.ts`에 `legacyStep5(html)` — 원본 5단계 카드 HTML(`snapshot()`의 `norm()` 뒤)을 기대 HTML로 바꾸고 `{ html, replaced, reordered }`를 돌려줌
  1. 문장 치환: `한 걸음씩 날려 보세요.` → `포탄을 0.5초씩 앞으로 보내 보세요.` (walkthrough는 한국어)
  2. 재배치: `(<p>🤔 그런데[\s\S]*?</p>)(<div class="ex">[\s\S]*?</div>)(<p class="small">vy가 매번 약[\s\S]*?</p>)` → `$3$1$2` (이유 상자 안에는 `div`가 중첩되지 않음 — `missions.ts` 확인)
  
  `parity.spec.ts` 튜토리얼 비교에서 **legacy** 스냅샷 중 라벨이 `/ · 5 \/ 22$/`인 것(정확히 5단계 — 검토 R1 ①)의 `tutBody`·`tut` 둘 다(R1 ③)에 적용하고, 전체 실행에서 치환·재배치가 각각 1번 이상 일어났음을 단언(R1 ②). current 쪽은 손대지 않음
- **Rationale**: 가리기(mask)보다 강함 — 5단계의 다른 글자·숫자·표가 바뀌면 그대로 실패 (NFR-001)
- **Alternatives**: 5단계 mask — 회귀를 가림 (검토가 지적한 15단계 방식의 약점)

## R-3. 새 브라우저 테스트

- **Decision**: `e2e/step5-text.spec.ts` — `open(page, CURRENT, { tutorial: true })` 후 `walkTutorial`로 `· 5 / 22`에서 멈춤
  1. 발사 전: 본문에 바뀐 한국어 문장, 옛 문장 없음. `#langBtn` → 영어 문장 확인 → 다시 한국어
  2. `#tFire` → `#tStep` 1번(필요하면 '계속' 처리 없이 stepMode라 바로 진행) → 본문 최상위 자식 순서: 방금 조각 `p` → `table.steps` → `p.small`(4.9) → `p`(🤔) → `div.ex`. 영어로 바꿔 같은 순서
  3. `#tStep` 3번 더 → "더 눌러 봐도 되고"가 맨 마지막
  CI firefox·webkit `testMatch`에 추가 (5단계는 앞쪽이라 짧음)
- **Rationale**: SC-001 한/영 (검토 S3), US2 문구
