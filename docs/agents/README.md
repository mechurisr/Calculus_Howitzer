# 역할별 지시문

각 세션이 프로젝트 폴더에서 자동으로 읽는 위치와, 역할별 지시문 파일입니다.
`.claude/`, `.opencode/`는 Spec Kitty가 gitignore로 관리하므로 역할 지시문은 모두 이 폴더(커밋됨)에 둡니다.

| 역할 | 도구 | 자동으로 읽는 것 | 역할 지시문 | 띄우는 방법 |
|---|---|---|---|---|
| 메인 세션 | Claude Code | `CLAUDE.md` (→ `docs/agents/main.md` import) | [main.md](main.md) | `claude -n main` |
| 리서치 세션 | Claude Code | `CLAUDE.md` + 시스템 프롬프트에 [research.md](research.md) 추가 | [research.md](research.md) | 아래 명령 |
| 검토 에이전트: 스펙 검토 | OpenCode + DeepSeek | `AGENTS.md`, `opencode.json`의 agent `spec-review` | [review-spec.md](review-spec.md) | `/spec-review <미션 폴더>` |
| 검토 에이전트: PR 크로스체크 | OpenCode + DeepSeek | `AGENTS.md`, agent `pr-check` | [review-pr.md](review-pr.md) | `/pr-check <PR 번호>` |
| 검토 에이전트: 아이디어 팩트체크 | OpenCode + DeepSeek | `AGENTS.md`, agent `fact-check` | [review-factcheck.md](review-factcheck.md) | `/fact-check <Issue 번호>` |

리서치 세션 (코드 수정 도구를 막고 띄움):

```bash
claude -n research \
  --append-system-prompt-file docs/agents/research.md \
  --settings docs/agents/research.settings.json
```

검토 에이전트를 터미널에서 바로 실행 (메인 세션도 이 스크립트로 요청):

```bash
scripts/review-agent.sh spec kitty-specs/<미션 폴더>   # 1차 독립 풀이 → 2차 정답 비교
scripts/review-agent.sh pr-check <PR 번호>
scripts/review-agent.sh fact-check <Issue 번호>
```

스크립트는 `~/.config/hive/env`(또는 `REVIEW_ENV_FILE`)에서 API 키를 불러오고 `opencode run --standalone`으로 실행합니다.
비대화식 셸은 `~/.bashrc`를 읽지 않고, 백그라운드 opencode 서비스가 키 없이 떠 있으면 "Authorization header missing"이 나기 때문입니다.

권한은 `opencode.json`이 강제합니다: 검토 에이전트는 코드를 고칠 수 없고, 스펙 검토는 `spec-review.md`만 쓸 수 있습니다.
