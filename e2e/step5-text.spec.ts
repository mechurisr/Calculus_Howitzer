// 튜토리얼 5단계 "손으로 쌓아 보기" 설명 순서와 발사 전 문구 (kitty-specs/howitzer-tutorial-step5-text-01M5S15W)
// CI 에서는 chromium·firefox·webkit 세 엔진으로 실행 (playwright.config.ts)
import { expect, test, type Page } from '@playwright/test';
import { CURRENT, advance, open, tap, walkTutorial } from './helpers';

test.describe.configure({ timeout: 120_000 });

const body = (page: Page) => page.locator('#tutBody').innerText();
// 본문 최상위 덩어리를 종류로: 방금 조각 / 표 / 표 설명 / 의문 / 이유 상자 / 음수 안내 / 더 눌러 보기
const blocks = (page: Page) => page.locator('#tutBody > *').evaluateAll(es => es.map(e => {
  const t = (e.textContent ?? '').trim();
  if (e.matches('table.steps')) return 'table';
  if (e.matches('div.ex')) return 'reason';
  if (e.matches('p.small') && /4\.9/.test(t)) return 'explain';
  if (e.matches('p.small')) return 'more';
  if (e.matches('p.fb')) return 'negative';
  if (t.startsWith('🤔')) return 'question';
  return 'piece';
}));
async function stepOnce(page: Page) { await tap(page, '#tStep'); await advance(page, 600); }
async function switchLang(page: Page) { await page.click('#langBtn'); await advance(page, 50); }

test('발사 전 안내 문구, 진행 뒤 표 → 표 설명 → 의문 → 이유 순서 (한/영) (FR-001, FR-002, SC-001)', async ({ page }) => {
  await open(page, CURRENT, { tutorial: true });
  await walkTutorial(page, async (_i, step) => / · 5 \/ 22$/.test(step));
  await expect(page.locator('#tutTitle')).toHaveText('손으로 쌓아 보기');

  // US2: 발사 전 문구
  expect(await body(page)).toContain('그다음 0.5초 진행 ⏭을 눌러 포탄을 0.5초씩 앞으로 보내 보세요.');
  expect(await body(page)).not.toContain('한 걸음씩');
  await switchLang(page);
  expect(await body(page)).toContain('Then press Step 0.5 s ⏭ to send the shell forward 0.5 s at a time.');
  await switchLang(page);

  // US1-1: 한 번 진행한 뒤 순서
  await tap(page, '#tFire'); await advance(page, 100);
  await stepOnce(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason']);
  // US1-3: 영어도 같은 순서 (검토 S3)
  await switchLang(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason']);
  await switchLang(page);

  // US1-2: 4번 이상 진행하면 "더 눌러 보기"가 맨 끝, 음수 안내는 그 앞
  for (let i = 0; i < 3; i++) await stepOnce(page);
  for (let i = 0; i < 6 && !(await blocks(page)).includes('negative'); i++) await stepOnce(page);
  const b = await blocks(page);
  expect(b.slice(0, 5)).toEqual(['piece', 'table', 'explain', 'question', 'reason']);
  expect(b.at(-1)).toBe('more');
  if (b.includes('negative')) expect(b.slice(-2)).toEqual(['negative', 'more']);
});
