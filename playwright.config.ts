import { defineConfig } from '@playwright/test';

// 시스템에 설치된 Chrome을 씀 (Arch는 Playwright 번들 브라우저를 공식 지원하지 않음). CI에서는 PW_CHANNEL을 비워 번들 Chromium 사용
const channel = process.env.PW_CHANNEL ?? 'chrome';
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4173' },
  // chromium: 모든 테스트. firefox·webkit: 눈금·모바일·튜토리얼 각도 버튼·터치 크기만, CI 에서만 (로컬 Arch 는 Playwright WebKit 미지원) — 원본 비교(수 분)는 한 엔진이면 충분
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', ...(channel ? { channel } : {}) } },
    ...(process.env.CI ? (['firefox', 'webkit'] as const).map(b => ({ name: b, use: { browserName: b }, testMatch: /(ticks|mobile|angle-buttons|touch-targets)\.spec\.ts/ })) : []),
  ],
  webServer: { command: 'pnpm build && pnpm preview', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
});
