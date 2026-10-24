#!/usr/bin/env bash
# 검토 에이전트(OpenCode + DeepSeek) 실행
#   scripts/review-agent.sh spec <미션 폴더>        스펙 검토 1차(독립 풀이) → 2차(정답 비교)
#   scripts/review-agent.sh pr-check <PR 번호>
#   scripts/review-agent.sh fact-check <Issue 번호>
# (spec-review / spec-compare 를 따로 지정해도 됨)
set -euo pipefail
agent=${1:?"사용법: $0 <spec|spec-review|spec-compare|pr-check|fact-check> <대상>"}; shift
target=${*:?대상을 지정하세요}
cd "$(dirname "$0")/.."

# API 키는 OpenCode 인증 저장소에 있음 (opencode auth login hive). 레포·환경 변수에 두지 않음
# 진행을 화면에 바로 흘리면서 logs/ 에도 남김 — 다른 터미널에서 tail -f logs/review-*.log 로 볼 수 있음
mkdir -p logs
log="logs/review-$agent-$(echo "$target" | tr -c 'A-Za-z0-9._-' '_' | cut -c1-60)-$(date +%Y%m%d-%H%M%S).log"
echo "로그: $log"
# 단계마다 20분 제한: 모델·도구가 멈추면 무한정 기다리지 않음 (REVIEW_TIMEOUT 으로 바꿀 수 있음)
# --standalone: 백그라운드 opencode 서비스를 거치면 도구 실행 뒤 다음 요청을 보내지 않고 멈추는 일이 두 번 있었음
#   (2026-10-24, 세션 기록·네트워크로 확인 — docs/setup-log.md). 실행마다 따로 서버를 띄우고 상세 로그를 logs/ 에 남김
run() {
  timeout "${REVIEW_TIMEOUT:-30m}" opencode run --standalone --print-logs --log-level "${REVIEW_LOG_LEVEL:-info}" \
    --agent "$1" "$2" 2>>"${log%.log}.debug.log" | tee -a "$log"
}
case $agent in
  spec)
    [[ -e $target/spec-review.md ]] && { echo "이미 $target/spec-review.md 가 있습니다 (스펙 검토는 한 번만)" >&2; exit 1; }
    run spec-review "대상 미션 폴더: $target
지시문의 1차 검토를 진행해."
    run spec-compare "대상 미션 폴더: $target
지시문의 2차 검토를 진행해." ;;
  spec-review)  run spec-review "대상 미션 폴더: $target
지시문의 1차 검토를 진행해." ;;
  spec-compare) run spec-compare "대상 미션 폴더: $target
지시문의 2차 검토를 진행해." ;;
  pr-check)     run pr-check "대상 PR 번호: $target
PR 크로스체크를 진행하고 PR에 댓글을 남겨." ;;
  fact-check)   run fact-check "대상 Issue 번호: $target
팩트체크를 진행하고 Issue에 댓글을 남겨." ;;
  *) echo "알 수 없는 agent: $agent" >&2; exit 2 ;;
esac
