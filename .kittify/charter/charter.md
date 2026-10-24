# 프로젝트 헌장 — 역할 기반 수학 교육 시뮬레이션 시리즈

<!--
사람이 읽는 요약본. 실제 정책은 .kittify/charter/charter.yaml 의 governance / directives 섹션이 기준이다.
"## Policy Summary" 아래 항목(최대 8개)은 각 작업 단계(specify/plan/implement/review) 첫 로드 때 프롬프트에 요약으로 들어간다.
이 파일을 고칠 때는 charter.yaml 도 같이 고칠 것.
-->

## Policy Summary

- 수학·물리가 틀리게 가르쳐지는 것이 가장 큰 실패다. 모든 수식·물리값 옆 주석에 공식과 출처를 적고, 게임용 값은 [game value], 확인 못 한 수치는 [needs verification]으로 표시한다 (PRJ-001)
- 핵심 계산 함수(episodes/*/src/model/, engine/src/math/)는 해석해·손계산·수치미분 같은 독립 기준과 비교하는 단위 테스트가 필수다. model 코드는 DOM을 건드리지 않는다 (PRJ-002)
- 에피소드는 @series/engine 만 import 한다. 에피소드끼리 의존 금지, pnpm check:boundaries 로 검사한다 (PRJ-003)
- 모든 에피소드는 360px 폭·터치로 끝까지 플레이할 수 있어야 하고, 가로 스크롤이 없으며, 조작 요소는 44×44 CSS px 이상이다 (PRJ-004)
- 스펙에 수학적 오류나 모호함이 있으면 구현하지 말고 사람에게 질문하고 Issue 에 needs-clarification 라벨을 단다 (PRJ-005)
- 에피소드 스펙 필수 항목: 역할 설정, 수학 개념, 학습 목표(3개 이내), 핵심 인터랙션, 단계별 미션, 정답·검증 공식(answers.md 로 분리), 참고 자료, 난이도 (PRJ-006)
- 학습자에게 보이는 문구는 한국어·영어 둘 다 제공한다 (PRJ-007)
- PR 로만 main 에 들어간다. CI(pnpm check, pnpm test:e2e) 통과와 검토 에이전트 크로스체크의 미해결 [치명적] 지적 없음이 머지 조건이고, 머지는 사람이 한다. 비밀값은 커밋하지 않는다 (PRJ-008, PRJ-009)

## 역할

| 역할 | 하는 일 | 하지 않는 일 |
|---|---|---|
| 리서치 세션 | 아이디어·수학 개념·실제 데이터를 조사해 Issue(idea) 등록 | 코드 수정 |
| 메인 세션 | 스펙, 계획, 구현, 테스트, PR | 머지 |
| 검토 에이전트 | 스펙 검토(spec-review.md, 스펙당 한 번), PR 크로스체크 댓글, 채택 전 Issue 팩트체크 | 코드 수정 |
| 사람 | 아이디어 채택, 반영할 검토 의견 선택, 최종 확인과 머지 | — |

지적 분류: [치명적] [권장] [사소함] (charter.yaml 에서는 [critical] [recommended] [minor]).

## 품질 기준

- `pnpm check` = 타입 검사(TypeScript strict) + 의존 규칙 + 단위 테스트
- `pnpm test:e2e` = 브라우저 테스트(모바일 포함). 테스트는 결정적이어야 한다(고정 시드 난수, 제어된 시계)
- 커밋 메시지: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` …). 에이전트는 역할로 표기
- 도구·CI·배포·에이전트 설정 변경은 docs/setup-log.md 에 기록

## 개정과 예외

- 헌장 변경은 에이전트가 채팅이나 PR 로 제안하고, 사람이 승인해야 효력이 생긴다
- 예외(예: 이전 검증을 위해 작은 터치 대상을 잠시 유지)는 PR 설명과 docs/setup-log.md 에 후속 조치와 함께 적고 사람의 승인을 받는다
- 현재 승인된 예외: 자주포의 44px 미만 조작 요소(언어 버튼, ± 버튼, 각도 슬라이더, 장약·모드 버튼) — 별도 작업으로 수정 예정
