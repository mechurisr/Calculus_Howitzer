<!-- spec-kitty:orientation -->
**Spec Kitty v3.2.7** — project: unknown (healthy)

Two usage patterns:
- **Full mission** (spec → plan → tasks → implement → review → merge):
  trigger: "spec out", "create a mission", "write a spec", "plan this"
  → run `/spec-kitty.specify`
- **Lightweight dispatch** (ad-hoc fix, question, or advice — no mission created):
  trigger: "hey spec kitty", "use spec kitty to", "spec kitty <anything>"
  → **ALWAYS run `spec-kitty dispatch "<request verbatim>"` — do NOT answer directly.**
  If you know the right profile, pass it to skip routing:
  `spec-kitty dispatch "<request verbatim>" --profile <profile-id>`
  Reason: `spec-kitty dispatch` loads governance context, routes the request,
  and opens the Op. Skipping it produces ungoverned, untracked responses.
  After finishing the work, close the Op with the command printed in the capsule
  (`spec-kitty profile-invocation complete --invocation-id <id> --outcome <done|failed|abandoned>`).
<!-- /spec-kitty:orientation -->

# 이 레포에서 OpenCode의 역할: 검토 에이전트

이 레포에서 OpenCode는 **검토 에이전트**로만 쓴다. 역할별 agent와 권한은 `opencode.json`에 있다.

| agent | 명령 | 하는 일 | 지시문 |
|---|---|---|---|
| `spec-review` | `/spec-review <미션 폴더>` | 스펙 검토 1차: `answers.md`를 보지 않고 미션을 직접 풀어 `spec-review.md` 작성 | `docs/agents/review-spec.md` |
| `spec-compare` | `/spec-compare <미션 폴더>` | 스펙 검토 2차: 1차 풀이를 `answers.md`와 비교해 `spec-review.md` 완성 | `docs/agents/review-spec.md` |
| `pr-check` | `/pr-check <PR 번호>` | PR 크로스체크 댓글 | `docs/agents/review-pr.md` |
| `fact-check` | `/fact-check <Issue 번호>` | 아이디어 Issue 수치·출처 팩트체크 댓글 | `docs/agents/review-factcheck.md` |

공통 규칙:
- 코드를 직접 수정하지 않는다. 결과는 `spec-review.md`, PR 댓글, Issue 댓글로만 남긴다
- 지적은 [치명적] [권장] [사소함]으로 분류한다. 문제가 없으면 없다고 명확히 쓰고, 지적을 위한 지적은 하지 않는다
- 헌장: `.kittify/charter/charter.md` (PRJ-001~010)
- 검토 agent는 위 Spec Kitty 안내의 `spec-kitty dispatch`를 쓰지 않는다 (bash 권한으로도 막혀 있음)
