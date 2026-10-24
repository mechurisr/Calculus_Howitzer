// 헌장 규칙 "모바일 화면에서도 조작 가능": 휴대폰 크기·터치로 실제로 쏴 보고, 가로 스크롤이 없는지 확인
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });

for (const url of ['/', '/episodes/01-calculus-howitzer/']) {
  test(`가로 스크롤 없음: ${url}`, async ({ page }) => {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
}

test('터치로 장약·각도를 바꾸고 발사해 착탄', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('series:howitzer:tutDone', '1'));
  await page.goto('/episodes/01-calculus-howitzer/');
  await page.tap('#charges button[data-v="93"]');
  await expect(page.locator('#velV')).toContainText('93 m/s');
  await page.tap('.nudge[data-d="0.5"]');
  await expect(page.locator('#angV')).toHaveText('45.5°');
  await page.tap('#fire');
  await expect(page.locator('#banner')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#sScore')).toHaveText(/\/ 1$/);
});

test('튜토리얼 카드가 화면 안에 있고 버튼을 누를 수 있음', async ({ page }) => {
  await page.goto('/episodes/01-calculus-howitzer/');
  const card = page.locator('#tut');
  await expect(card).toBeVisible();
  const box = (await card.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.tap('#tutNext'); await page.tap('#tutNext');
  await page.tap('#tFire');
  await expect(page.locator('#tutStep')).toContainText('4 / 22', { timeout: 20_000 });
});

// 정보용: 권장 터치 크기(44×44 CSS px, WCAG 2.5.5)보다 작은 조작 요소 목록을 보고서에 남김 (실패 처리는 하지 않음)
test('작은 터치 대상 보고', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem('series:howitzer:tutDone', '1'));
  await page.goto('/episodes/01-calculus-howitzer/');
  const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, input')].filter(e => e.offsetParent)
    .map(e => { const r = e.getBoundingClientRect(); return { id: e.id || e.className || e.tagName, w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter(r => r.w < 44 || r.h < 44));
  info.annotations.push({ type: 'small-touch-targets', description: JSON.stringify(small) });
  console.log('small touch targets:', JSON.stringify(small));
});
