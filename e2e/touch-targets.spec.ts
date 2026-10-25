// 튜토리얼 버튼 터치 크기 44px (kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ, 헌장 PRJ-004)
// CI 에서는 chromium·firefox·webkit 세 엔진으로 실행 (playwright.config.ts). 튜토리얼 22단계를 끝까지 진행해서 수십 초
import { expect, test, type Page } from '@playwright/test';
import { CURRENT, advance, open, tap, walkTutorial } from './helpers';

test.describe.configure({ timeout: 600_000 });
test.use({ viewport: { width: 360, height: 800 } });

type Btn = { w: number; h: number; text: string; act: boolean };
// 튜토리얼 카드 안에 지금 보이는 버튼들
const cardButtons = (page: Page) => page.locator('#tut button').evaluateAll(bs => bs
  .filter(b => (b as HTMLElement).offsetParent)
  .map(b => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, text: (b.textContent ?? '').trim(), act: b.classList.contains('act') }; }));
function expectTouchSize(bs: Btn[], where: string) {
  for (const b of bs) {
    expect(b.w, `${where} "${b.text}" 폭`).toBeGreaterThanOrEqual(44);
    expect(b.h, `${where} "${b.text}" 높이`).toBeGreaterThanOrEqual(44);
  }
}
const noHScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

test('튜토리얼 열기 버튼 44×44 이상, 가로 스크롤 없음 (FR-003, US1-4, NFR-002)', async ({ page }) => {
  await open(page, CURRENT, { touch: true, ticks: true });
  const b = await page.locator('#tutOpen').boundingBox();
  expect(b!.width).toBeGreaterThanOrEqual(44);
  expect(b!.height).toBeGreaterThanOrEqual(44);
  await noHScroll(page);
});

test('360px 튜토리얼 22단계: 카드 안 모든 버튼 44×44 이상, 긴 단계에서 "다음"이 보임 (FR-001, NFR-001, US1-1·2·5)', async ({ page }) => {
  await open(page, CURRENT, { tutorial: true, touch: true, ticks: true });
  let actsMeasured = 0, englishChecked = false;
  const deepChecked = new Set<string>();
  await walkTutorial(page, async (_i, step) => {
    const bs = await cardButtons(page);
    expectTouchSize(bs, step);
    actsMeasured += bs.filter(b => b.act).length;
    await noHScroll(page);

    // 검토 S5: 버튼이 커진 만큼만 카드 안 스크롤이 깊어지고, 끝까지 내리면 "다음"이 카드 안에 보임.
    // 19·20단계는 처음엔 "먼저 한 발 쏘세요"만 있고 조작 버튼이 없음 → 버튼이 나타난 뒤에 잼 (PR #14 크로스체크)
    const at = ['19 / 22', '20 / 22'].find(s => step.includes(s)), acts = bs.filter(b => b.act).length;
    if (!at || deepChecked.has(at) || acts === 0) return;
    deepChecked.add(at);
    const r = await page.evaluate(() => {
      const card = document.getElementById('tut')!, top = card.scrollTop;
      card.scrollTop = card.scrollHeight;
      const c = card.getBoundingClientRect(), n = document.getElementById('tutNext')!.getBoundingClientRect();
      const d1 = card.scrollHeight - card.clientHeight;
      const st = document.createElement('style'); st.textContent = '.tut-body .act{min-height:0!important;min-width:0!important}'; document.head.append(st);
      const d0 = card.scrollHeight - card.clientHeight;
      st.remove(); card.scrollTop = top;
      return { inside: n.top >= c.top - 0.5 && n.bottom <= c.bottom + 0.5, d1, d0 };
    });
    expect(r.inside, `${step} "다음" 버튼이 카드 안에 보임`).toBe(true);
    expect(r.d1 - r.d0, `${step} 카드 스크롤 깊이 증가`).toBeLessThanOrEqual(acts * 2.75 + 1);

    // 영어 문구에서도 같은 기준 (Edge Case): 19단계에서 한 번 바꿔 재고 되돌림
    if (!englishChecked) {
      englishChecked = true;
      await page.click('#langBtn');
      expectTouchSize(await cardButtons(page), `${step} (English)`);
      await page.click('#langBtn');
    }
  });
  expect(actsMeasured, '조작 버튼(.act)이 실제로 측정됨').toBeGreaterThan(0);
  // 자동 진행에서는 20단계가 조작 버튼 없이 넘어가므로(첫 발로 진행) 19단계는 반드시 재야 함
  expect(deepChecked.has('19 / 22'), '조작 버튼이 있는 19단계에서 스크롤 깊이를 잼').toBe(true);
  expect(englishChecked).toBe(true);
});

// 힌트 해설 (i) 버튼·404 링크 (kitty-specs/touch-targets-info-404-01M5S8E9, Issue #13·#15)
test('힌트 해설 (i) 버튼: 보이는 원 18px 그대로, 실제로 눌리는 영역 44×44 이상, 가장자리를 눌러도 열림 (FR-001, US1)', async ({ page }) => {
  await open(page, CURRENT, { touch: true, ticks: true });
  await tap(page, '#hintBtn'); await advance(page, 100);
  const r = await page.locator('#hint .info').evaluate(b => {
    b.scrollIntoView({ block: 'center' });   // 화면 밖 좌표는 elementFromPoint 가 아무것도 돌려주지 않음
    const box = b.getBoundingClientRect(), cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    // 중심에서 1px씩 바깥으로 밀어 이 버튼으로 눌리는 마지막 좌표를 찾음 → 실제 폭·높이 (힌트 상자 가장자리에서 잘리면 줄어듦)
    const reach = (dx: number, dy: number) => { let d = 0; while (d < 40 && document.elementFromPoint(cx + dx * (d + 1), cy + dy * (d + 1)) === b) d++; return d; };
    const [l, rt, u, dn] = [reach(-1, 0), reach(1, 0), reach(0, -1), reach(0, 1)];
    return { w: box.width, h: box.height, hitW: l + rt + 1, hitH: u + dn + 1, edge: [cx + rt, cy + dn] };
  });
  expect(r.w).toBe(18); expect(r.h).toBe(18);
  expect(r.hitW, '실제로 눌리는 폭').toBeGreaterThanOrEqual(44);
  expect(r.hitH, '실제로 눌리는 높이').toBeGreaterThanOrEqual(44);
  // 넓힌 영역의 오른쪽 아래 끝을 실제로 눌러 해설이 열리는지 (PR #20 크로스체크)
  await page.mouse.click(r.edge[0], r.edge[1]);
  await expect(page.locator('#hint .info')).toHaveAttribute('aria-expanded', 'true');
});

test('404 페이지 에피소드 목록 링크 44×44 이상, 가로 스크롤 없음 (FR-002, US2)', async ({ page }) => {
  await page.goto('/404.html');
  const b = (await page.locator('a.tut-btn').boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(44);
  expect(b.height).toBeGreaterThanOrEqual(44);
  // 글자가 세로 가운데 (FR-002): 링크 안 글자 범위의 중심과 링크 중심 차이 1px 이내
  const off = await page.locator('a.tut-btn').evaluate(a => {
    const rg = document.createRange(); rg.selectNodeContents(a);
    const t = rg.getBoundingClientRect(), o = a.getBoundingClientRect();
    return Math.abs((t.top + t.bottom) / 2 - (o.top + o.bottom) / 2);
  });
  expect(off).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
