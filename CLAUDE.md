# 역할 기반 수학 교육 시뮬레이션 시리즈

각 에피소드에서 학습자가 역할(자주포 포수, F1 레이스 엔지니어 …)을 맡아 수학을 직접 조작하며 배우는 웹 시뮬레이션 시리즈.

## 역할

- **기본 역할은 메인 세션**(기획·구현)이다. 지시: @docs/agents/main.md
- 시스템 프롬프트에 리서치 세션 지시(`docs/agents/research.md`)가 추가되어 있으면 너는 **리서치 세션**이고, 그 지시가 이 파일의 메인 세션 지시보다 우선한다
- 검토 에이전트는 OpenCode에서 돈다 (`opencode.json`, `docs/agents/review-*.md`). 역할 전체 표: `docs/agents/README.md`

## 헌장

`.kittify/charter/charter.md` (정책 기준은 `charter.yaml`의 PRJ-001~010). 특히:
수식·물리값 출처 주석, 핵심 계산 단위 테스트, 에피소드는 엔진만 import, 360px·44px 모바일, 스펙의 수학 오류·모호함은 구현하지 말고 질문, 한/영 문구.

## 명령

```bash
pnpm dev            # 랜딩 /, 에피소드 /episodes/<slug>/, 템플릿 /episodes/_template/
pnpm check          # 타입 검사 + 의존 규칙 + 단위 테스트
pnpm test:e2e       # 브라우저 테스트 (이전 비교는 약 8분)
pnpm build          # dist/
scripts/review-agent.sh spec|pr-check|fact-check <대상>   # 검토 에이전트 실행
```

## 구조

`engine/`(공통 엔진) · `episodes/NN-slug/`(src/model = 순수 계산 + tests) · `episodes/_template/` · `site/`(랜딩) · `e2e/` · `kitty-specs/`(Spec Kitty 미션) · `docs/setup-log.md`(설정 기록)
