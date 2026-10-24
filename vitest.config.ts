import { defineConfig } from 'vitest/config';

// 단위 테스트: 엔진과 각 에피소드의 순수 계산. 브라우저 테스트(e2e/)는 Playwright가 따로 돌림
export default defineConfig({
  test: { include: ['engine/tests/**/*.test.ts', 'episodes/*/tests/**/*.test.ts'] },
});
