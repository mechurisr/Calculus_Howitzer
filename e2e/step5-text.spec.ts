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
  expect(await body(page)).not.toContain('one step at a time');
  await switchLang(page);

  // US1-1: 한 번 진행한 뒤 순서
  await tap(page, '#tFire'); await advance(page, 100);
  await stepOnce(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason']);
  // US1-3: 영어도 같은 순서 (검토 S3)
  await switchLang(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason']);
  await switchLang(page);

  // US1-2: 4번 진행하면 "더 눌러 보기"가 맨 끝
  for (let i = 0; i < 3; i++) await stepOnce(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason', 'more']);
  // 조각이 음수가 되면 그 안내가 이유 상자와 "더 눌러 보기" 사이. 기본 설정(vy0 = 75·sin45° ≈ 53.0, 0.5초마다 4.9 감소)에서
  // vy 는 11번째 진행 끝(5.5초)에 −0.9 로 처음 음수지만 조각 = (시작 + 끝)/2 × 0.5 = (4.0 − 0.9)/2 × 0.5 > 0 이라 아직 양수,
  // 조각은 12번째 진행에 처음 음수 → 12번까지 누름 (PR #17 크로스체크: 9번까지만 눌러 이 단언이 돌지 않던 문제)
  for (let i = 4; i < 12; i++) await stepOnce(page);
  expect(await blocks(page)).toEqual(['piece', 'table', 'explain', 'question', 'reason', 'negative', 'more']);
});
