#!/usr/bin/env bash
# 검토 에이전트 진행 상태: 가장 최근 검토(또는 지정한 로그)의 단계·시간·도구 호출·마지막 활동·결과물을 막대로 보여 줌
#   scripts/review-status.sh            한 번 출력
#   scripts/review-status.sh --watch    5초마다 다시 그림 (Ctrl+C 로 종료)
#   scripts/review-status.sh --line [로그]  한 줄 요약 (review-log.sh 가 보고 있는 로그를 넘김)
# 검토 에이전트는 남은 양을 알려 주지 않으므로 퍼센트는 없음. 시간은 단계별 제한(REVIEW_TIMEOUT, 기본 30분) 대비,
# 도구 호출은 크로스체크 지시문의 약 40회 대비(docs/agents/review-pr.md). 상태 기록은 scripts/review-agent.sh 가 logs/*.meta 에 남김
set -uo pipefail
cd "$(dirname "$0")/.."
mode=${1:-once} want=${2:-}
STALL=${REVIEW_STALL:-300}   # 이만큼(초) 상세 로그가 안 바뀌면 멈춤 의심

bar() {  # bar <현재> <최대> [폭]
  local cur=$1 max=$2 w=${3:-20} n i out=''
  (( max > 0 )) || max=1
  n=$(( cur * w / max )); (( n > w )) && n=$w
  for (( i = 0; i < w; i++ )); do (( i < n )) && out+='█' || out+='░'; done
  printf '%s' "$out"
}
secs() { local v=$1; case $v in *m) echo $(( ${v%m} * 60 )) ;; *h) echo $(( ${v%h} * 3600 )) ;; *s) echo "${v%s}" ;; *) echo "$v" ;; esac; }
ago() { local s=$1; (( s < 60 )) && echo "${s}초 전" || echo "$((s/60))분 $((s%60))초 전"; }

status() {
  local meta; if [[ -n $want ]]; then meta="${want%.debug.log}"; meta="${meta%.log}.meta"; else meta=$(ls -t logs/review-*.meta 2>/dev/null | head -1); fi
  [[ -z $meta || ! -e $meta ]] && { echo "[상태] 진행 기록 없음 (상태 기록 기능 전의 검토이거나 아직 시작 전)"; return; }
  local dbg="${meta%.meta}.debug.log" now; now=$(date +%s)
  local kind target stages limit
  kind=$(awk '$1=="kind"{print $2}' "$meta"); target=$(awk '$1=="target"{$1="";print substr($0,2)}' "$meta")
  stages=$(awk '$1=="stages"{print $2}' "$meta"); limit=$(secs "$(awk '$1=="limit"{print $2}' "$meta")")
  # 마지막 시작 기록 = 지금 단계
  local st t0 agent rest label='' off=0; st=$(grep '^start ' "$meta" | tail -1)
  read -r _ t0 agent rest <<<"$st"
  if [[ $rest == resume* ]]; then label="이어받기 $(awk '{print $2}' <<<"$rest")/3"; off=$(awk '{print $3}' <<<"$rest")
  else off=$(awk '{print $2}' <<<"$rest"); fi
  local stage=$(( $(grep -c '^done ' "$meta") + 1 )); local ended; ended=$(awk '$1=="end"{print $3}' "$meta")
  (( stage > stages )) && stage=$stages
  local name; case $agent in spec-review) name='1차 독립 풀이';; spec-compare) name='2차 정답 비교';; pr-check) name='크로스체크';; fact-check) name='팩트체크';; *) name=$agent;; esac
  # 지금 단계의 도구 호출 수 (상세 로그에서 시작 위치 이후의 도구 줄)
  local tools=0 last=0 el=0
  if [[ -e $dbg ]]; then
    tools=$(tail -c +$(( ${off:-0} + 1 )) "$dbg" | sed 's/\x1b\[[0-9;]*m//g' | grep -cE '^(→|←|✗|%|⚙|\$ )')
    last=$(( now - $(stat -c %Y "$dbg") ))
  fi
  # 끝났으면 마지막 멈춤(stop)·종료(end) 시각까지
  local tend; tend=$(awk '$1=="end"||$1=="stop"{t=$2} END{print t}' "$meta")
  if [[ -n $t0 ]]; then if [[ -n $ended ]]; then el=$(( tend - t0 )); else el=$(( now - t0 )); fi; fi
  # 결과물
  local out=''
  case $kind in
    spec*) local f="$target/spec-review.md"
      if [[ ! -e $f ]]; then out='spec-review.md 아직 없음'
      else out="spec-review.md 절: $(for k in 1 2 3 4; do grep -q "^## $k\." "$f" && printf '%s✓ ' "$k" || printf '%s· ' "$k"; done)"
        grep -q '(2차에서 작성)' "$f" && out+='· 2차 비교 전' || out+='· 2차 비교 끝'; fi ;;
    pr-check|fact-check) grep -q '^done ' "$meta" && out='댓글 남김' || out='댓글 대기' ;;
  esac
  local state
  if [[ -n $ended ]]; then state=$([[ $ended == 0 ]] && echo '✓ 끝남' || echo "✗ 끝남 (코드 $ended)")
  elif (( last > STALL )); then state="⚠ $(ago "$last") 마지막 활동 — 멈춤 의심"
  else state="진행 중 · 마지막 활동 $(ago "$last")"; fi
  local tmax=0; [[ $agent == pr-check ]] && tmax=40

  if [[ $mode == --line ]]; then
    printf '[상태] %s %s · 단계 %s/%s %s%s · %s/%s분 · 도구 %s%s · %s\n' "$kind" "$(basename "$target")" "$stage" "$stages" "$name" "${label:+ ($label)}" \
      "$((el/60))" "$((limit/60))" "$tools" "$( ((tmax)) && echo "/~$tmax")" "$state"
    return
  fi
  printf '\033[1m검토: %s %s\033[0m  (%s)\n' "$kind" "$target" "${meta#logs/}"
  printf '  단계   %s %s/%s  %s%s\n' "$(bar "$stage" "$stages" "$stages")" "$stage" "$stages" "$name" "${label:+ · $label}"
  printf '  시간   %s %s/%s분%s\n' "$(bar "$el" "$limit")" "$((el/60))" "$((limit/60))" "$( [[ -z $ended ]] && (( el > limit*8/10 )) && echo ' (제한 가까움 — 넘으면 이어받기)')"
  if ((tmax)); then printf '  도구   %s %s/~%s회\n' "$(bar "$tools" "$tmax")" "$tools" "$tmax"; else printf '  도구   %s회 (이 단계)\n' "$tools"; fi
  printf '  활동   %s\n' "$state"
  printf '  결과물 %s\n' "$out"
}

case $mode in
  --watch) while true; do clear; status; sleep 5; done ;;
  *) status ;;
esac
