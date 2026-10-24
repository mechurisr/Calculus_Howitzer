// 발사각 슬라이더 눈금 (kitty-specs/howitzer-angle-ticks-01M5Q3M8): 배치·겹침·언어·표시 시점·손잡이 위치
// CI 에서는 chromium·firefox·webkit 세 엔진으로 실행 (playwright.config.ts)
import { expect, test, type Page } from '@playwright/test';

const URL = '/episodes/01-calculus-howitzer/';
type Box = { x: number; y: number; w: number; h: number };

async function openPage(page: Page, width: number, storage: Record<string, string>) {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(s => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  await page.goto(URL);
  await page.evaluate(() => document.fonts.ready);
}
const DONE = { 'series:howitzer:tutDone': '1' };
const boxes = (page: Page, sel: string) => page.locator(sel).evaluateAll(es => es.map(e => {
  const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
}));
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
async function setAngle(page: Page, deg: number) {
  await page.evaluate(d => { const e = document.getElementById('ang') as HTMLInputElement; e.value = String(d); e.dispatchEvent(new Event('input')); }, deg);
}

test('슬라이더 범위가 모델 상수(10~80°)와 같음', async ({ page }) => {
  await openPage(page, 1280, DONE);
  expect(await page.locator('#ang').evaluate((e: HTMLInputElement) => [e.min, e.max])).toEqual(['10', '80']);
});

for (const width of [360, 768, 1280]) {
  test(`${width}px: 가로 스크롤 없음, 숫자 8개·주석이 겹치지 않고 화면 안 (NFR-001)`, async ({ page }) => {
    await openPage(page, width, DONE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const labels = await boxes(page, '.tick-label'), note = (await boxes(page, '.tick-note'))[0];
    expect(labels).toHaveLength(8);
    expect(await page.locator('.tick').count()).toBe(15);
    const all = [...labels, note];
    for (let i = 0; i < all.length; i++) {
      expect(all[i].x).toBeGreaterThanOrEqual(0);
      expect(all[i].x + all[i].w).toBeLessThanOrEqual(width);
      for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j]), `${i}·${j} 겹침`).toBe(false);
    }
  });
}

test('주석 문구: 한국어·영어, 조건 없는 "최대"·대칭 표시 없음 (FR-005, SC-003, C-006)', async ({ page }) => {
  await openPage(page, 1280, DONE);
  const note = page.locator('.tick-note');
  await expect(note).toHaveText('45° · 같은 높이에서 사거리 최대');
  await page.click('#langBtn');
  await expect(note).toHaveText('45° · longest range on level ground');
  const text = await page.locator('.ang-ticks').innerText();
  expect(text).not.toMatch(/같은 거리|same distance/);
});

test.describe('주석 표시 시점 (FR-006)', () => {
  test('첫 방문: 튜토리얼 중에는 숨김, 건너뛰면 바로 보임', async ({ page }) => {
    await openPage(page, 1280, {});
    await expect(page.locator('#tut')).toBeVisible();
    await expect(page.locator('.tick-note')).toBeHidden();
    await expect(page.locator('.tick-emphasis')).toBeVisible();
    await page.click('#tutSkip');
    await expect(page.locator('.tick-note')).toBeVisible();
  });
  test('4장 단계를 본 기록이 있으면 보임', async ({ page }) => {
    await openPage(page, 1280, { 'series:howitzer:angleNoteSeen': '1' });
    await expect(page.locator('.tick-note')).toBeVisible();
  });
  // 4장 "45°는 사거리 그래프의 꼭대기" 단계 진입 자체는 앞 단계 gate(발사·일시정지 등) 때문에 자동화가 무거워 수동 확인 (quickstart.md 2, analysis C1)
});

// 손잡이는 의사요소라 DOM 좌표가 없다 → 스크린샷에서 손잡이 색(--accent) 픽셀의 가로 중심을 재서 눈금 중심과 비교 (research R-4)
async function thumbCenterX(page: Page): Promise<number> {
  const track = page.locator('#ang');
  const box = (await track.boundingBox())!;
  const png = (await track.screenshot({ scale: 'css' })).toString('base64');
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  const xInImage = await page.evaluate(async ([b64, hex]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const t = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    let sum = 0, n = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (Math.abs(d[i] - t[0]) < 40 && Math.abs(d[i + 1] - t[1]) < 40 && Math.abs(d[i + 2] - t[2]) < 40) { sum += x; n++; }
    }
    return n ? sum / n : NaN;
  }, [png, accent] as const);
  return box.x + xInImage;
}
async function tickCenterX(page: Page, deg: number) {
  const sel = deg === 45 ? '.tick-emphasis' : `.tick-major >> nth=${(deg - 10) / 10}`;
  const b = (await page.locator(sel).boundingBox())!;
  return b.x + b.width / 2;
}

test('손잡이 중심과 눈금 차이 ≤ 2px: 360·768·1280px, 창 크기 변경 뒤 (NFR-002)', async ({ page }) => {
  await openPage(page, 1280, DONE);
  for (const width of [1280, 768, 360]) {   // 마지막 두 번은 창 크기를 바꾼 뒤 측정
    await page.setViewportSize({ width, height: 900 });
    for (const deg of [10, 45, 80]) {
      await setAngle(page, deg);
      const diff = Math.abs(await thumbCenterX(page) - await tickCenterX(page, deg));
      expect(diff, `${width}px ${deg}°: ${diff.toFixed(2)}px`).toBeLessThanOrEqual(2);
    }
  }
});
