#!/usr/bin/env bash
# herdr 작업 공간 한 번에 띄우기 (herdr 안의 패널에서 실행)
#
#   ┌──────────────────────────┬──────────────────────────┐
#   │ 메인 세션 (Claude Code)   │ 검토 에이전트 진행 로그    │
#   ├──────────────────────────┼──────────────────────────┤
#   │ 리서치 세션 (Claude Code) │ spec-kitty 대시보드       │
#   └──────────────────────────┴──────────────────────────┘
#
#   scripts/workspace.sh            띄우기 (이미 떠 있으면 그 작업 공간으로 이동)
#   scripts/workspace.sh --open     대시보드를 브라우저로도 열기
#   scripts/workspace.sh --close    작업 공간 닫기 (에이전트도 종료)
set -euo pipefail

LABEL=math-sims
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OPEN=""
case ${1:-} in
  --open) OPEN=--open ;;
  --close|"") ;;
  *) echo "사용법: $0 [--open|--close]" >&2; exit 2 ;;
esac

# herdr 제어 명령은 herdr가 관리하는 패널 안에서만 실행해야 함
if [[ ${HERDR_ENV:-} != 1 ]]; then
  echo "herdr 안의 패널에서 실행하세요 (먼저 'herdr'를 실행)." >&2
  exit 1
fi

existing=$(herdr workspace list | jq -r --arg l "$LABEL" '.result.workspaces[] | select(.label == $l) | .workspace_id' | head -1)

if [[ ${1:-} == --close ]]; then
  [[ -n $existing ]] && herdr workspace close "$existing" >/dev/null && echo "닫음: $existing"
  exit 0
fi
if [[ -n $existing ]]; then
  herdr workspace focus "$existing" >/dev/null
  echo "이미 떠 있음: $existing ($LABEL) — 그 작업 공간으로 이동했습니다. 새로 띄우려면 --close 후 다시 실행."
  exit 0
fi

ws=$(herdr workspace create --cwd "$ROOT" --label "$LABEL" --focus)
main=$(jq -r '.result.root_pane.pane_id' <<<"$ws")
split() { herdr pane split "$1" --direction "$2" --cwd "$ROOT" --no-focus | jq -r '.result.pane.pane_id'; }
review=$(split "$main" right)
research=$(split "$main" down)
dash=$(split "$review" down)

herdr pane rename "$main" "메인 세션" >/dev/null
herdr pane rename "$research" "리서치 세션" >/dev/null
herdr pane rename "$review" "검토 에이전트 로그" >/dev/null
herdr pane rename "$dash" "spec-kitty 대시보드" >/dev/null

# 역할 지시문: docs/agents/README.md
# 에이전트가 시작하자마자 질문 화면(예: 처음 여는 폴더의 신뢰 확인)에서 멈추면 agent_not_ready.
# 스크립트는 멈추지 않고 계속 진행하고, 끝에 어느 패널에서 답해야 하는지 알려 줌
blocked=()
start() {
  local name=$1; shift
  if ! out=$(herdr agent start "$name" "$@" 2>&1); then
    grep -q agent_not_ready <<<"$out" && blocked+=("$name") || { echo "$out" >&2; exit 1; }
  fi
}
start ms-main --kind claude --pane "$main" -- -n main
start ms-research --kind claude --pane "$research" -- -n research \
  --append-system-prompt-file docs/agents/research.md --settings docs/agents/research.settings.json
# 검토 에이전트는 scripts/review-agent.sh 가 --standalone 으로 실행해 OpenCode 화면에 안 보이므로, 이 패널은 진행 로그를 보여 줌.
# OpenCode 를 직접 쓰려면 이 패널에서 Ctrl+C 후 opencode 실행
herdr pane run "$review" "scripts/review-log.sh" >/dev/null
# 대시보드는 백그라운드 서버를 띄우고 주소를 출력한 뒤 셸로 돌아옴
herdr pane run "$dash" "spec-kitty dashboard $OPEN" >/dev/null

herdr agent focus ms-main >/dev/null
echo "띄움: $(jq -r '.result.workspace.workspace_id' <<<"$ws") ($LABEL) — 메인 $main · 리서치 $research · 검토 $review · 대시보드 $dash"
(( ${#blocked[@]} )) && echo "질문 화면에서 기다리는 에이전트: ${blocked[*]} — 해당 패널에서 답해 주세요 (처음 한 번은 Claude Code 폴더 신뢰 확인)"
exit 0
