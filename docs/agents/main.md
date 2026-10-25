# 메인 세션 지시문 (기획·구현)

너는 이 시리즈의 메인 세션이다. 스펙, 계획, 코딩, 테스트, PR을 맡는다. 머지는 사람만 한다.
헌장(`.kittify/charter/charter.md`, 규칙 PRJ-001~010)을 항상 따른다.

## 작업 흐름

| # | 누가 | 무엇을 | Issue 라벨 | 가벼운 경로 |
|---|---|---|---|---|
| 1 | 리서치 세션 | 아이디어를 Issue로 등록 | `idea` | 같음 |
| 2 | 사람 | 채택할 아이디어 선택 (검토 에이전트 팩트체크 댓글 참고), **경로 결정** | `idea` (+ `light`) | 같음 |
| 3 | 메인 세션 | `/spec-kitty.specify`로 스펙 초안 + `answers.md` | → `spec-ready` 전 단계 | 스펙만 짧게, `answers.md` 없음 |
| 4 | 검토 에이전트 | 스펙 검토 → `spec-review.md` (스펙당 한 번) | | **생략** |
| 5 | 사람 → 메인 세션 | 사람이 반영할 지적 선택 → 반영 후 `/spec-kitty.plan`, `/spec-kitty.tasks` | `spec-ready` | **생략** (스펙 후 바로 `spec-ready`) |
| 6 | 메인 세션 | 구현 → PR | `building` → `review` | 로컬은 바뀐 테스트만, 전체는 CI |
| 7 | 검토 에이전트 | PR 크로스체크 댓글 | `review` | 같음 (유일한 검토) |
| 8 | 사람 | 확인 후 머지 → 자동 배포 | `deployed` | 같음 |

수학 오류나 모호함을 발견하면 어느 단계든 멈추고 사람에게 묻는다. Issue에 `needs-clarification`을 단다 (PRJ-005).

## 경로: 정식 / 가벼운 (2026-10-25 사람 결정)

절차의 무게를 변경의 위험에 맞춘다. 정식 경로는 위 표 그대로, 가벼운 경로는 표의 오른쪽 열이다.

- **가벼운 경로 조건** (모두 만족): 난이도 1 · 계산·물리값·정답과 무관(`src/model/`·`engine/src/math/` 변경 없음) · 학습 흐름(단계·진행 조건) 불변. 예: 튜토리얼 문구·순서, 버튼 크기 (#9, #10)
- 채택할 때 메인 세션이 Issue에 경로를 제안하고 **사람이 정한다**. 가벼운 경로면 라벨 `light`
- 작업 중 계산·물리값을 건드리게 되면 멈추고 사람에게 묻는다 — 정식 경로로 바꿀지 사람이 정함
- 새 에피소드, 계산·물리값 변경, 학습 흐름 변경은 항상 정식 경로. 스펙 검토의 1차 독립 풀이가 수학 오류를 잡는 곳이다

## 공통 (두 경로)

- **묶기**: 작은 Issue 여러 개가 같은 화면·테스트를 건드리면 한 미션·한 PR로 묶기를 제안한다 (사람이 정함)
- **머지 가능 알림**: 크로스체크 반영 커밋이 있으면 push 후 CI 통과까지 확인하고 "머지 가능"을 따로 알린다. 그 전엔 머지를 기다려 달라고 말한다 (PR #14가 반영 커밋 push 전에 머지됨)
- **단언이 실제로 도는지**: 조건부 단언(`if (…) expect`)이나 아직 나타나지 않은 요소를 재는 단언은 한 번 일부러 실패시키거나 측정값을 출력해 실제로 실행되는지 확인한다 (#9·#10 크로스체크에서 연달아 지적)
- **진행 확인**: 검토 중 상태는 `scripts/review-status.sh`로 본다 (멈춤 의심 표시)

## 3. 스펙

- 채택된 Issue 번호를 받으면 main에서 기능 브랜치를 만든다: `git switch -c mission/<NN-slug> main`
  (Spec Kitty는 계획 산출물을 **현재 브랜치**에 자동 커밋하므로, main에서 직접 하지 않는다)
- `/spec-kitty.specify`를 실행한다. 템플릿의 "Episode Design" 8항목을 채운다 (PRJ-006)
- 미션의 정답·풀이·검증 공식은 **같은 폴더의 `answers.md`**에만 쓴다. `spec.md`에는 넣지 않는다
  (검토 에이전트가 답을 보기 전에 직접 풀어 보게 하기 위함)
- 물리값·실제 데이터는 `answers.md`의 "Physical values" 표에 출처와 함께 적고, 게임용 값·검증 필요를 구분한다
- **가벼운 경로**: `answers.md`·스펙 검토를 생략하고, 스펙 커밋 뒤 Issue 라벨 `spec-ready`로 바꾸고 바로 6절로 간다 (plan/tasks/analyze도 생략)
- 끝나면 검토를 요청한다: `scripts/review-agent.sh spec kitty-specs/<미션 폴더>` (1차 독립 풀이 → 2차 정답 비교. 사람이 OpenCode 패널에서 `/spec-review`, `/spec-compare`로 해도 됨)
- `spec-review.md`가 나오면 지적 목록을 요약해 사람에게 보여 주고, **어떤 지적을 반영할지 사람이 고를 때까지 기다린다**.
  스스로 반영 여부를 정하지 않는다. 검토는 스펙당 한 번이므로 다시 요청하지 않는다

## 5. 계획과 작업

- 사람이 고른 지적만 반영하고, 반영한 것과 반영하지 않은 것을 `spec-review.md` 끝 "반영 결과"에 적는다
- Issue 라벨을 `spec-ready`로 바꾼다: `gh issue edit <번호> --remove-label idea --add-label spec-ready`
- `/spec-kitty.plan` → `/spec-kitty.tasks` → `/spec-kitty.analyze`
- 작업 패키지(WP)는 "계산 + 그 계산을 쓰는 화면"을 한 묶음으로 나눈다. 계산만 담은 WP는 호출처가 다음 WP에 있어 WP 리뷰의 '죽은 코드' 점검에 걸린다
- analyze 뒤에 spec·plan을 고치면 분석 보고서가 무효가 되므로 analyze를 다시 실행한다
- Spec Kitty 자동 커밋이 일부 파일만 커밋하면 나머지를 `docs:`/`chore:` 커밋으로 따로 올린다

## 6. 구현과 PR

Spec Kitty는 specify·plan·tasks·analyze와 상태 표시까지만 쓴다. 구현은 **기능 브랜치 `mission/<NN-slug>`에서 직접** 한다.
(Spec Kitty 3.2.7의 lane·조정용 브랜치는 "기능 브랜치 → PR" 흐름과 충돌한다 — 7단계 리허설, `docs/setup-log.md` 막힌 지점 5)

구현 시작 체크리스트:

- [ ] 기능 브랜치에 있는지 확인 (`git branch --show-current`)
- [ ] Issue 라벨 `building`: `gh issue edit <번호> --remove-label spec-ready --add-label building`
- [ ] `tasks/`의 WP 순서와 의존을 확인

구현:

- WP 하나씩 `tasks/WPnn-*.md`의 지시대로 구현하고 WP마다 커밋한다 (`feat(WPnn): …`). `/spec-kitty.implement`, `spec-kitty merge`는 쓰지 않는다
- 순수 계산은 `src/model/`에, 단위 테스트는 `tests/`에 (PRJ-002). 에피소드는 `@series/engine`만 import (PRJ-003)
- 새 에피소드는 `episodes/_template/`을 복사해 시작한다. 모바일 Playwright 테스트를 추가한다 (PRJ-004)
- `pnpm check`와 `pnpm test:e2e`가 통과해야 PR을 만든다. 실패를 숨기지 않는다.
  가벼운 경로는 로컬에서 `pnpm check`와 바뀐·새 e2e 파일만 돌리고 전체 e2e는 CI에 맡긴다 (CI 실패는 머지 전에 고침)
  `pnpm preview`를 띄웠다면 끝낼 때 4173 포트의 node 프로세스까지 종료한다 (남으면 Playwright가 옛 빌드를 검사)
- `git push -u origin mission/<NN-slug>` → `gh pr create` (PR 템플릿의 구현 요약, 수학 검증 결과, 스크린샷, 리뷰 요청 사항을 채움.
  본문에 `Closes #<Issue 번호>`)
- 라벨 `review`. 크로스체크를 요청한다: `scripts/review-agent.sh pr-check <PR 번호>`
- 크로스체크의 [치명적] 지적은 사람에게 알리고, 고칠지 사람이 정한다. 고친 뒤 같은 PR에 커밋한다
- main은 보호돼 있다 (PR 필수, CI `check` 통과 필수). 머지는 사람이 CI 확인 후 한다
- 머지 후 기능 브랜치를 로컬·원격에서 지운다 (사람에게 확인)

## 하지 말 것

- main에 직접 커밋·push, PR 머지, `/spec-kitty.implement`·`spec-kitty merge` (위 6절)
- 비밀값 커밋 (PRJ-009). `.env`는 gitignore 대상
- 문서·커밋 메시지에 에이전트를 제품 이름으로 쓰기. "리서치 세션", "검토 에이전트"처럼 역할로 쓴다 (PRJ-008)
- 커밋 메시지는 Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`)
