// 튜토리얼 15단계 각도 버튼 상태·관찰 문장 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7)
// CI 에서는 chromium·firefox·webkit 세 엔진으로 실행 (playwright.config.ts). 15단계까지 자동 진행하느라 테스트마다 수십 초
import { expect, test, type Page } from '@playwright/test';
import { advance, gotoExperimentStep, setAngle, tap, tutFire } from './helpers';

test.describe.configure({ timeout: 300_000 });

const BTN = '#tutBody .exp-angs .act';
const btn = (page: Page, a: number) => page.locator(`${BTN}[data-v="${a}"]`);
const angleValue = (page: Page) => page.locator('#ang').evaluate((e: HTMLInputElement) => +e.value);
// 버튼 5개 상태: 'fired' | 'current' | 'normal'
const states = (page: Page) => page.locator(BTN).evaluateAll(bs => bs.map(b =>
  (b as HTMLButtonElement).disabled ? 'fired' : b.getAttribute('aria-pressed') === 'true' ? 'current' : 'normal'));
async function shoot(page: Page, a: number) { await tap(page, `${BTN}[data-v="${a}"]`); await advance(page, 50); await tutFire(page); }
const observation = (page: Page) => page.locator('#tutBody p.fb').innerText();

test('버튼 상태·비활성·갱신 경로·초점·관찰 문장·언어 (US1·US2, FR-001~FR-007)', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoExperimentStep(page);
  await expect(page.locator('#tutTitle')).toHaveText('실험: 각도만 바꿔 보기');

  // US1-1·US2-1: 처음엔 모두 누를 수 있고 슬라이더 각도 버튼만 현재
  const th = await angleValue(page);
  expect(await states(page)).toEqual([30, 40, 45, 50, 60].map(a => a === th ? 'current' : 'normal'));

  // US2-2 → US1-2: 30° 누르면 현재, 쏘고 기록되면 쏜 각도(현재보다 우선, FR-004)
  await tap(page, `${BTN}[data-v="30"]`); await advance(page, 50);
  expect(await states(page)).toEqual(['current', 'normal', 'normal', 'normal', 'normal']);
  await tutFire(page);
  expect(await states(page)).toEqual(['fired', 'normal', 'normal', 'normal', 'normal']);
  await expect(btn(page, 30)).toHaveAttribute('aria-label', '30°, 이미 쏨');
  await expect(page.locator('#tutBody table.steps')).toContainText('30.0°');

  // US1-3: 비활성 버튼은 눌러도 무반응, 탭 순서에서 빠짐
  await setAngle(page, 45); await advance(page, 50);
  await tap(page, `${BTN}[data-v="30"]`); await advance(page, 50);
  expect(await angleValue(page)).toBe(45);
  // WebKit 은 기본 설정에서 Tab 이 버튼으로 가지 않아 Chromium·Firefox 에서만 확인 (WebKit 은 disabled 속성으로 충분)
  if (browserName !== 'webkit') {
    await btn(page, 40).focus(); await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.v)).not.toBe('30');
  }

  // FR-003·US2-3: ± 버튼, 키보드, 값 입력(드래그와 같은 input 경로) 모두 곧바로 갱신, 화면은 그대로
  await setAngle(page, 50); await advance(page, 50);
  const scroll = async () => page.evaluate(() => [Math.round(scrollY), Math.round(document.getElementById('tut')!.scrollTop)]);
  const before = await scroll();
  await tap(page, '.nudge[data-t="ang"][data-d="0.5"]');
  expect(await states(page)).not.toContain('current');
  await tap(page, '.nudge[data-t="ang"][data-d="-0.5"]');
  expect((await states(page))[3]).toBe('current');
  await page.locator('#ang').focus(); await page.keyboard.press('ArrowRight');
  expect(await angleValue(page)).toBe(50.5);
  expect(await states(page)).not.toContain('current');
  await page.keyboard.press('ArrowLeft');
  expect((await states(page))[3]).toBe('current');
  await setAngle(page, 50.5);
  expect(await states(page)).not.toContain('current');
  expect(await scroll()).toEqual(before);

  // research R-4: 키보드로 각도 버튼을 누르면 다시 그려진 뒤에도 초점이 그 버튼에
  await btn(page, 40).focus(); await page.keyboard.press('Enter'); await advance(page, 50);
  expect(await angleValue(page)).toBe(40);
  expect(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.v)).toBe('40');

  // FR-007: 30·40·45·50 → 60°를 말하지 않는 문장, 60까지 쏘면 원래 문장
  await tutFire(page); await shoot(page, 45); await shoot(page, 50);
  expect(await states(page)).toEqual(['fired', 'fired', 'fired', 'fired', 'normal']);
  await expect(page.locator('#tutNext')).toBeEnabled();
  expect(await observation(page)).toBe('40°·45°·50°는 거리가 거의 같죠? (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.');
  await shoot(page, 60);
  expect(await observation(page)).toBe('40°·45°·50°는 거리가 거의 같고, 30°와 60°도 서로 비슷하죠? (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.');

  // 언어 전환: 상태 유지, 문장·접근성 이름 영어
  await page.click('#langBtn'); await advance(page, 50);
  expect(await states(page)).toEqual(['fired', 'fired', 'fired', 'fired', 'fired']);
  await expect(btn(page, 30)).toHaveAttribute('aria-label', '30°, already fired');
  expect(await observation(page)).toContain('and 30° and 60° are similar too, right?');
});

test('관찰 문장: 30·40·50·60 → 30°·60°만, 37.5° 섞이면 표 비교, 다른 장약은 기록 안 됨 (FR-007, SC-005, Edge Cases)', async ({ page }) => {
  await gotoExperimentStep(page);
  // 다른 장약으로 쏜 30°는 기록되지 않아 버튼이 그대로 (2호는 버튼 각도 모두 화면 안에 떨어져 '화면 밖' 대신 이 경우로 확인 — 검토 R3 2차)
  await tap(page, '#charges button[data-v="93"]'); await advance(page, 50);
  await shoot(page, 30);
  await expect(btn(page, 30)).toBeEnabled();
  await tap(page, '#charges button[data-v="75"]'); await advance(page, 50);

  await shoot(page, 30); await shoot(page, 40); await shoot(page, 50); await shoot(page, 60);
  expect(await observation(page)).toBe('30°와 60°는 거리가 서로 비슷하죠? (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.');

  await page.click('#tutPrev'); await advance(page, 100); await page.click('#tutNext'); await advance(page, 100);
  // 다시 들어오면 기록이 비워져 모두 다시 켜짐
  expect(await states(page)).not.toContain('fired');
  await setAngle(page, 37.5); await advance(page, 50); await tutFire(page);
  await shoot(page, 30); await shoot(page, 45); await shoot(page, 50);
  await expect(page.locator('#tutNext')).toBeEnabled();
  expect(await observation(page)).toBe('각도에 따라 날아간 거리가 어떻게 달라졌는지 표에서 비교해 보세요. 왜 그런지 다음 단계에서 봐요.');
});

type Box = { x: number; y: number; w: number; h: number };
const boxes = (page: Page) => page.locator(BTN).evaluateAll(es => es.map(e => {
  const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
}));
function expectRow(bs: Box[]) {
  expect(bs).toHaveLength(5);
  for (const b of bs) { expect(b.w).toBeGreaterThanOrEqual(44); expect(b.h).toBeGreaterThanOrEqual(44); expect(Math.abs(b.y - bs[0].y)).toBeLessThan(0.5); }
  for (let i = 1; i < 5; i++) expect(bs[i].x - (bs[i - 1].x + bs[i - 1].w)).toBeGreaterThanOrEqual(7.5);
}
// WCAG 상대휘도 대비 (sRGB 선형화)
const contrast = (page: Page, sel: string) => page.locator(sel).evaluate(e => {
  const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const lum = ([r, g, b]: number[]) => [r, g, b].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const cs = getComputedStyle(e), a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor));
  return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), bg: cs.backgroundColor, opacity: +cs.opacity };
});

test('360px: 한 줄·44px·간격 8px·가로 스크롤 없음, 내용 폭 287px 에서도 한 줄, 두 테마 대비 (NFR-001, NFR-002)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoExperimentStep(page);
  await shoot(page, 30); await setAngle(page, 45); await advance(page, 50);
  expectRow(await boxes(page));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  expect(await page.locator('#tut').evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);

  // answers.md V1: 클래식 스크롤바면 내용 폭 287px. 실행 환경과 상관없이 그 폭을 만들어 한 줄 확인 (analysis C1)
  await page.addStyleTag({ content: '#tut{width:321px!important;overflow-y:scroll}' });
  const inner = await page.locator('#tutBody').evaluate(e => e.clientWidth);
  expect(inner).toBeLessThanOrEqual(302);
  expectRow(await boxes(page));
  await page.addStyleTag({ content: '#tut{width:min(560px,calc(100% - 24px))!important;overflow-y:auto}' });

  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme }); await advance(page, 50);
    const n = await contrast(page, `${BTN}[data-v="40"]`), c = await contrast(page, `${BTN}[data-v="45"]`), f = await contrast(page, `${BTN}[data-v="30"]`);
    expect(n.ratio, `${scheme} 보통`).toBeGreaterThanOrEqual(4.5);
    expect(c.ratio, `${scheme} 현재`).toBeGreaterThanOrEqual(4.5);
    expect(f.ratio, `${scheme} 쏜 각도`).toBeGreaterThanOrEqual(3);
    expect(new Set([n.bg, c.bg, f.bg]).size, `${scheme} 채움으로 구분`).toBe(3);
    expect(f.opacity).toBe(1);
  }
});

test.describe('휴대폰 터치 390px', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  test('버튼 5개 한 줄·44px·간격, 터치로 눌러 쏜 각도 비활성 (US3-1, NFR-001)', async ({ page }) => {
    await gotoExperimentStep(page);
    expectRow(await boxes(page));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await btn(page, 40).tap(); await advance(page, 50);
    expect(await angleValue(page)).toBe(40);
    await tutFire(page);
    await expect(btn(page, 40)).toBeDisabled();
  });
});
