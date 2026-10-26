// 튜토리얼 5단계 "손으로 쌓아 보기" 발사 전 문구 (kitty-specs/howitzer-tutorial-step5-text-01M5S15W)와
// 누를 때마다 설명 하나씩 (kitty-specs/howitzer-tutorial-step5-reveal-01M5VXMQ)
// CI 에서는 chromium·firefox·webkit 세 엔진으로 실행 (playwright.config.ts)
import { expect, test, type Page } from '@playwright/test';
import { CURRENT, advance, open, tap, walkTutorial } from './helpers';

test.describe.configure({ timeout: 120_000 });

const body = (page: Page) => page.locator('#tutBody').innerText();
// 본문 최상위 덩어리를 종류로: 방금 조각 / 표 / vy 감소 / 적분 / 의문 / 이유 상자 / 음수 안내 / 더 눌러 보기
const blocks = (page: Page) => page.locator('#tutBody > *').evaluateAll(es => es.map(e => {
  const t = (e.textContent ?? '').trim();
  if (e.matches('table.steps')) return 'table';
  if (e.matches('div.ex')) return 'reason';
  if (e.matches('p.small') && /4\.9/.test(t)) return 'drop';
  if (e.matches('p.small') && /적분|integral/.test(t)) return 'sum';
  if (e.matches('p.small')) return 'more';
  if (e.matches('p.fb')) return 'negative';
  if (t.startsWith('🤔')) return 'question';
  return 'piece';
}));
async function stepOnce(page: Page) { await tap(page, '#tStep'); await advance(page, 600); }
async function switchLang(page: Page) { await page.click('#langBtn'); await advance(page, 50); }

// 누른 횟수 → 보여야 할 덩어리 (스펙 US1). 음수 안내는 기본 설정에서 12번째에 처음 나옴 (아래 설명)
const expected: Record<number, string[]> = {
  1: ['piece', 'table', 'question', 'reason'],
  2: ['piece', 'table', 'drop'],
  3: ['piece', 'table', 'sum'],
  4: ['piece', 'table', 'more'],
  11: ['piece', 'table', 'more'],
  12: ['piece', 'table', 'negative', 'more'],
};

test('발사 전 안내 문구, 누를 때마다 설명 하나씩 (한/영) (FR-001~003, NFR-001)', async ({ page }) => {
  await open(page, CURRENT, { tutorial: true });
  await walkTutorial(page, async (_i, step) => / · 5 \/ 22$/.test(step));
  await expect(page.locator('#tutTitle')).toHaveText('손으로 쌓아 보기');

  // 발사 전 문구 (step5-text US2, 그대로)
  expect(await body(page)).toContain('그다음 0.5초 진행 ⏭을 눌러 포탄을 0.5초씩 앞으로 보내 보세요.');
  expect(await body(page)).not.toContain('한 걸음씩');
  await switchLang(page);
  expect(await body(page)).toContain('Then press Step 0.5 s ⏭ to send the shell forward 0.5 s at a time.');
  expect(await body(page)).not.toContain('one step at a time');
  await switchLang(page);

  // 기본 설정(vy0 = 75·sin45° ≈ 53.0, 0.5초마다 4.9 감소)에서 vy 는 11번째 진행 끝(5.5초)에 −0.9 로 처음 음수지만
  // 조각 = (시작 + 끝)/2 × 0.5 = (4.0 − 0.9)/2 × 0.5 > 0 이라 아직 양수, 조각은 12번째 진행에 처음 음수 (PR #17 크로스체크)
  await tap(page, '#tFire'); await advance(page, 100);
  const checked: number[] = [];
  for (let n = 1; n <= 12; n++) {
    await stepOnce(page);
    const want = expected[n]; if (!want) continue;
    // 표는 6줄을 넘으면 첫 줄 · ⋮ · 마지막 5줄로 줄어서 4번까지만 줄 수 = 누른 횟수 (+ 머리글)
    if (n <= 4) expect(await page.locator('#tutBody table.steps tr').count(), `${n}번 누름: 표 줄 수`).toBe(n + 1);
    expect(await blocks(page), `${n}번 누름 (한국어)`).toEqual(want);
    await switchLang(page);
    expect(await blocks(page), `${n}번 누름 (영어)`).toEqual(want);
    await switchLang(page);
    checked.push(n);
  }
  // 위 단언이 모든 횟수에서 실제로 돌았는지
  expect(checked).toEqual([1, 2, 3, 4, 11, 12]);
});
