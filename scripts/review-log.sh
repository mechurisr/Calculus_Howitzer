#!/usr/bin/env bash
# 검토 에이전트 진행 보기: logs/ 의 가장 최근 검토 로그를 따라가며 도구 사용·이어받기만 보여 줌.
# 새 검토가 시작되면(더 새 로그 파일) 자동으로 넘어감. 검토는 --standalone 으로 돌아 OpenCode 화면에는 안 보이기 때문
#   scripts/review-log.sh          (Ctrl+C 로 종료)
# 30초마다 진행 상태 한 줄(단계·경과/제한·도구 호출·마지막 활동)을 끼워 넣음 — 자세히는 scripts/review-status.sh --watch
set -uo pipefail
cd "$(dirname "$0")/.." && mkdir -p logs
newest() { ls -t logs/review-*.debug.log 2>/dev/null | head -1; }
show() {  # ANSI 색 제거 후 도구 줄(→ 읽기, $ 명령, % 웹, ✗ 거부, ← 편집, ⚙ 실행)과 에이전트 단계만
  sed -u 's/\x1b\[[0-9;]*m//g' | grep --line-buffered -E '^(→|←|✗|%|⚙|\$ |> )|Error|이어받음|결과물이 없음' | awk '{ print substr($0, 1, 160); fflush() }'
}
cur=""; tick=0
while true; do
  f=$(newest)
  if [[ -n $f && $f != "$cur" ]]; then
    [[ -n ${pid:-} ]] && kill "$pid" 2>/dev/null
    cur=$f; printf '\n\033[1m== %s ==\033[0m\n' "${cur#logs/}"
    # 같은 이름의 .log(실행 결과·이어받기 알림)도 함께
    tail -n 30 -F "$cur" "${cur%.debug.log}.log" 2>/dev/null | show & pid=$!
  fi
  [[ -z $f ]] && { echo "검토 로그 없음 — scripts/review-agent.sh 실행을 기다리는 중"; sleep 10; continue; }
  (( tick++ % 10 == 0 )) && printf '\033[36m%s\033[0m\n' "$(scripts/review-status.sh --line "$cur")"
  sleep 3
done
