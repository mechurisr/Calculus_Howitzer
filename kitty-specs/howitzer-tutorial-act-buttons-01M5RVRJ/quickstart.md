# Quickstart: 튜토리얼 조작 버튼 44px 확인

## 자동 확인

```bash
pnpm check                                          # 타입 검사 + 의존 규칙 + 단위 테스트
pnpm exec playwright test e2e/touch-targets.spec.ts # 360px 전 단계 측정
pnpm test:e2e                                       # 전체 (이전 비교 포함)
```

`pnpm preview`를 따로 띄웠다면 끝낼 때 4173 포트의 node 프로세스까지 종료한다.

## 손으로 확인

1. `pnpm dev` → 개발자 도구 360px → http://localhost:5173/episodes/01-calculus-howitzer/
2. 머리말 "튜토리얼" 버튼 높이 44px 이상
3. 튜토리얼 5장 조준(19/22) "θ = …° 넣기" 버튼 높이 44px 이상, 모양(파랑 테두리·글자)은 그대로
4. 19·20단계에서 카드를 끝까지 내려 "다음" 버튼이 보이고 눌림
5. 영어로 바꿔 같은 확인
