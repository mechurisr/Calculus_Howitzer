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
# 단계마다 30분 제한: 모델·도구가 멈추면 무한정 기다리지 않음 (REVIEW_TIMEOUT 으로 바꿀 수 있음)
#   제한에 걸려도(exit 124) 스크립트를 끝내지 않고 아래 결과물 확인·이어받기로 넘어간다
# stdin 은 /dev/null: opencode run 은 stdin 이 터미널이 아니면 EOF 까지 읽어 메시지에 붙이므로, 열린 stdin
#   (에이전트 도구의 백그라운드 실행 등)에서는 서버에 요청을 보내지 않고 계속 기다린다 (2026-10-25 확인)
# --standalone: 백그라운드 opencode 서비스를 거치면 도구 실행 뒤 다음 요청을 보내지 않고 멈추는 일이 두 번 있었음
#   (2026-10-24, 세션 기록·네트워크로 확인 — docs/setup-log.md). 실행마다 따로 서버를 띄우고 상세 로그를 logs/ 에 남김
# 실행이 결과물을 남기기 전에 조용히 끝나는 일이 있음 (OpenCode 2.1.4 — 도구 실행 뒤 다음 응답 없이 종료/멈춤,
#   docs/setup-log.md 7단계). 끝난 뒤 결과물이 있는지 확인하고, 없으면 같은 세션을 이어받아 마무리를 요청한다 (최대 3번)
count_marker() {  # PR·Issue 에 검토 에이전트 댓글이 몇 개인지
  gh "$1" view "$target" --json comments -q "[.comments[].body | select(test(\"$2\"))] | length"
}
done_check() {
  case $1 in
    # 1차가 일부만 쓰고 끊기면 파일은 있어도 뒤 절이 비어 있음 (2026-10-25) — 마지막 절과 자리표시 주석까지 확인
    spec-review)  [[ -e $target/spec-review.md ]] && grep -q '^## 4\. 구현 가능성' "$target/spec-review.md" &&
                  grep -q '^## 반영 결과' "$target/spec-review.md" && ! grep -qE '<!-- *(PART|TODO)' "$target/spec-review.md" ;;
    spec-compare) [[ -e $target/spec-review.md ]] && ! grep -q '(2차에서 작성)' "$target/spec-review.md" ;;
    pr-check)     (( $(count_marker pr '크로스체크 \\(검토 에이전트\\)') > before )) ;;
    fact-check)   (( $(count_marker issue '팩트체크 \\(검토 에이전트\\)') > before )) ;;
  esac
}
oc() { timeout "${REVIEW_TIMEOUT:-30m}" opencode run --standalone --print-logs --log-level "${REVIEW_LOG_LEVEL:-info}" "$@" </dev/null 2>>"${log%.log}.debug.log" | tee -a "$log"; }
oc_try() { oc "$@" || echo "실행이 코드 $? 로 끝남 (124 = 시간 제한)" | tee -a "$log"; }
run() {
  local a=$1 title="review $1 $target $(date +%s)"
  case $a in pr-check) before=$(count_marker pr '크로스체크 \\(검토 에이전트\\)') ;; fact-check) before=$(count_marker issue '팩트체크 \\(검토 에이전트\\)') ;; esac
  oc_try --title "$title" --agent "$a" "$2"
  for try in 1 2 3; do
    done_check "$a" && return 0
    local sid
    sid=$(opencode session list -n 30 --format json | jq -r --arg t "$title" '[.[] | select(.title == $t)][0].id // empty')
    [[ -z $sid ]] && { echo "세션을 찾지 못함: $title" >&2; return 1; }
    echo "결과물이 없어 세션을 이어받음 ($try/3): $sid" | tee -a "$log"
    oc_try --session "$sid" --agent "$a" "실행이 중간에 끊겼다. 지금까지 조사한 내용으로 지시문대로 마무리하고, 결과물(댓글 또는 spec-review.md)을 반드시 남겨."
  done
  done_check "$a" || { echo "3번 이어받아도 결과물이 없음: $a $target (로그: $log)" >&2; return 1; }
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
