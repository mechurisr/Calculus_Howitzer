# Quickstart: 눈금 확인 방법

```bash
pnpm dev                       # http://localhost:5173/episodes/01-calculus-howitzer/
pnpm check                     # 단위 테스트 (눈금 비율·표시 조건 포함)
pnpm test:e2e e2e/ticks.spec.ts
```

수동 확인:

1. 처음 방문(브라우저 저장소 비움) → 튜토리얼 1~3장 동안 45° 굵은 눈금만 보이고 주석 없음
2. 4장 "45°는 사거리 그래프의 꼭대기" 단계 → 주석 "45° · 같은 높이에서 사거리 최대"가 나타남
3. English 전환 → "45° · longest range on level ground"
4. 개발자 도구 기기 모드 360px → 숫자 8개·주석 겹침 없음, 가로 스크롤 없음
5. 슬라이더를 10°·45°·80°에 두고 손잡이 중심이 눈금 바로 위인지 확인, 창 크기 바꾼 뒤 다시 확인
6. 다크 모드에서 눈금·숫자가 보이는지
