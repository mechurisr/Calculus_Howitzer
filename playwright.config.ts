import { defineConfig } from '@playwright/test';

// 시스템에 설치된 Chrome을 씀 (Arch는 Playwright 번들 브라우저를 공식 지원하지 않음). CI에서는 PW_CHANNEL을 비워 번들 Chromium 사용
const channel = process.env.PW_CHANNEL ?? 'chrome';
export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4173', ...(channel ? { channel } : {}) },
  webServer: { command: 'pnpm build && pnpm preview', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
});
