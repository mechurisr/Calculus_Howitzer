# 메인 세션 지시문 (기획·구현)

너는 이 시리즈의 메인 세션이다. 스펙, 계획, 코딩, 테스트, PR을 맡는다. 머지는 사람만 한다.
헌장(`.kittify/charter/charter.md`, 규칙 PRJ-001~010)을 항상 따른다.

## 작업 흐름

| # | 누가 | 무엇을 | Issue 라벨 |
|---|---|---|---|
| 1 | 리서치 세션 | 아이디어를 Issue로 등록 | `idea` |
| 2 | 사람 | 채택할 아이디어 선택 (검토 에이전트 팩트체크 댓글 참고) | `idea` |
| 3 | 메인 세션 | `/spec-kitty.specify`로 스펙 초안 + `answers.md` | → `spec-ready` 전 단계 |
| 4 | 검토 에이전트 | 스펙 검토 → `spec-review.md` (스펙당 한 번) | |
| 5 | 사람 → 메인 세션 | 사람이 반영할 지적 선택 → 반영 후 `/spec-kitty.plan`, `/spec-kitty.tasks` | `spec-ready` |
| 6 | 메인 세션 | 구현 → PR | `building` → `review` |
| 7 | 검토 에이전트 | PR 크로스체크 댓글 | `review` |
| 8 | 사람 | 확인 후 머지 → 자동 배포 | `deployed` |

수학 오류나 모호함을 발견하면 어느 단계든 멈추고 사람에게 묻는다. Issue에 `needs-clarification`을 단다 (PRJ-005).

## 3. 스펙

- 채택된 Issue 번호를 받으면 main에서 기능 브랜치를 만든다: `git switch -c mission/<NN-slug> main`
  (Spec Kitty는 계획 산출물을 **현재 브랜치**에 자동 커밋하므로, main에서 직접 하지 않는다)
- `/spec-kitty.specify`를 실행한다. 템플릿의 "Episode Design" 8항목을 채운다 (PRJ-006)
- 미션의 정답·풀이·검증 공식은 **같은 폴더의 `answers.md`**에만 쓴다. `spec.md`에는 넣지 않는다
  (검토 에이전트가 답을 보기 전에 직접 풀어 보게 하기 위함)
- 물리값·실제 데이터는 `answers.md`의 "Physical values" 표에 출처와 함께 적고, 게임용 값·검증 필요를 구분한다
- 끝나면 검토를 요청한다: `scripts/review-agent.sh spec kitty-specs/<미션 폴더>` (1차 독립 풀이 → 2차 정답 비교. 사람이 OpenCode 패널에서 `/spec-review`, `/spec-compare`로 해도 됨)
- `spec-review.md`가 나오면 지적 목록을 요약해 사람에게 보여 주고, **어떤 지적을 반영할지 사람이 고를 때까지 기다린다**.
  스스로 반영 여부를 정하지 않는다. 검토는 스펙당 한 번이므로 다시 요청하지 않는다

## 5. 계획과 작업

- 사람이 고른 지적만 반영하고, 반영한 것과 반영하지 않은 것을 `spec-review.md` 끝 "반영 결과"에 적는다
- Issue 라벨을 `spec-ready`로 바꾼다: `gh issue edit <번호> --remove-label idea --add-label spec-ready`
- `/spec-kitty.plan` → `/spec-kitty.tasks`

## 6. 구현과 PR

- 라벨 `building`. `/spec-kitty.implement`로 작업 패키지(WP)를 구현한다 (Spec Kitty가 `.worktrees/` 아래 worktree를 만든다)
- 순수 계산은 `src/model/`에, 단위 테스트는 `tests/`에 (PRJ-002). 에피소드는 `@series/engine`만 import (PRJ-003)
- 새 에피소드는 `episodes/_template/`을 복사해 시작한다. 모바일 Playwright 테스트를 추가한다 (PRJ-004)
- 모든 WP가 승인되면 기능 브랜치로 합친다: `spec-kitty merge --mission <미션> --target mission/<NN-slug>` (`--push` 쓰지 않음)
- `pnpm check`와 `pnpm test:e2e`가 통과해야 PR을 만든다. 실패를 숨기지 않는다
- `git push -u origin mission/<NN-slug>` → `gh pr create` (PR 템플릿의 구현 요약, 수학 검증 결과, 스크린샷, 리뷰 요청 사항을 채움.
  본문에 `Closes #<Issue 번호>`)
- 라벨 `review`. 크로스체크를 요청한다: `scripts/review-agent.sh pr-check <PR 번호>`
- 크로스체크의 [치명적] 지적은 사람에게 알리고, 고칠지 사람이 정한다. 고친 뒤 같은 PR에 커밋한다

> Spec Kitty merge → 기능 브랜치 → GitHub PR 연결 방식은 7단계 리허설에서 검증한다. 결과에 따라 이 절을 고친다.

## 하지 말 것

- main에 직접 커밋·push, PR 머지, `spec-kitty merge --push`
- 비밀값 커밋 (PRJ-009). `.env`는 gitignore 대상
- 문서·커밋 메시지에 에이전트를 제품 이름으로 쓰기. "리서치 세션", "검토 에이전트"처럼 역할로 쓴다 (PRJ-008)
- 커밋 메시지는 Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`)
