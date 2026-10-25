# 역할별 지시문

## 작업 공간 (herdr)

herdr 안의 아무 패널에서 `scripts/workspace.sh`를 실행하면 아래 네 패널이 한 번에 뜹니다 (작업 공간 이름 `math-sims`).

```
┌──────────────────────────┬──────────────────────────┐
│                          │ 검토 진행 상태 (막대)      │
│ 메인 세션 (ms-main)       ├──────────────────────────┤
│                          │ 검토 에이전트 진행 로그    │
├──────────────────────────┼──────────────────────────┤
│ 리서치 세션 (ms-research) │ spec-kitty 대시보드       │
└──────────────────────────┴──────────────────────────┘
```

- `scripts/workspace.sh --open`: 대시보드를 브라우저로도 열기 · `--close`: 작업 공간 닫기(에이전트 종료)
- 이미 떠 있으면 새로 만들지 않고 그 작업 공간으로 이동
- 다른 패널에서 에이전트에게 일을 시킬 때: `herdr agent prompt ms-main "..." --wait`
- 검토 칸 위쪽은 진행 막대(`scripts/review-status.sh --watch`: 단계·경과/제한·도구 호출·멈춤 의심·결과물), 아래쪽은 진행 로그(`scripts/review-log.sh`). 검토는 `scripts/review-agent.sh`가 `--standalone`으로 돌려 OpenCode 화면에는 안 보임
- OpenCode를 직접 쓰려면 로그 패널에서 Ctrl+C 후 `opencode` 실행. 기본 agent(Build)로 열리고 `/spec-review`, `/pr-check`, `/fact-check` 명령이나 Tab으로 agent를 고름. 이 레포에서는 Build·Plan도 파일 수정이 막혀 있음(`opencode.json`)


작업은 Issue마다 **정식 경로**(스펙 검토 → 계획 → 구현 → 크로스체크)나 **가벼운 경로**(라벨 `light`: 짧은 스펙 → 구현 → 크로스체크)로 진행합니다. 경로는 채택할 때 사람이 정합니다 ([main.md](main.md) "경로").

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
scripts/review-status.sh [--watch]                     # 진행 상태: 단계·시간·도구 호출·멈춤 의심·결과물
```

DeepSeek API 키는 OpenCode 인증 저장소에 있습니다 (`opencode auth login hive`로 등록, `opencode auth list`로 확인).
"Authorization header missing"이 나면 키가 저장소에 있는지 확인하고 `opencode service restart`.

권한은 `opencode.json`이 강제합니다: 검토 에이전트는 코드를 고칠 수 없고, 스펙 검토는 `spec-review.md`만 쓸 수 있습니다.
