// 엔진 이전 회귀 검사: 기존 단일 파일(e2e/legacy/howitzer.html)과 새 빌드를 같은 시드·같은 조작으로 돌려
// 문구, 버튼 상태, 캔버스 픽셀이 모두 같은지 비교
import { expect, test, type Page } from '@playwright/test';
import { CURRENT, LEGACY, advance, fireAndLand, open, setAngle, snapshot, tap, walkTutorial } from './helpers';

// 프레임을 한 장씩 돌려 느림 (한 테스트에 수 분)
test.describe.configure({ timeout: 900_000 });

type Snap = Awaited<ReturnType<typeof snapshot>>;
async function freePlay(page: Page) {
  const out: [string, Snap][] = [];
  const snap = async (label: string) => out.push([label, await snapshot(page)]);
  await snap('initial');
  for (const mode of ['#mVac', '#mAir']) {
    await page.click(mode); await advance(page, 100); await snap(mode);
    for (const charge of [60, 75, 93, 115]) {
      await tap(page, `#charges button[data-v="${charge}"]`);
      for (const a of [20, 45, 62.5]) { await setAngle(page, a); await fireAndLand(page); await snap(`${mode} ${charge} ${a}°`); }
    }
    await tap(page, '#hintBtn'); await advance(page, 100); await snap(`${mode} hint`);
    await tap(page, '.nudge[data-d="0.5"]'); await tap(page, '.nudge[data-d="0.5"]'); await advance(page, 100); await snap(`${mode} nudge`);
    // 비행 중 정지 → 0.5초씩 진행 → 계속
    await tap(page, '#fire'); await advance(page, 800); await tap(page, '#pauseBtn'); await advance(page, 300); await snap(`${mode} paused`);
    await tap(page, '#stepBtn'); await tap(page, '#stepBtn'); await advance(page, 100); await snap(`${mode} stepped`);
    await tap(page, '#pauseBtn'); for (let i = 0; i < 120 && await page.locator('#fire').isDisabled(); i++) await advance(page, 500);
    await snap(`${mode} resumed`);
    await tap(page, '#langBtn'); await advance(page, 100); await snap(`${mode} en`);
    await tap(page, '#langBtn'); await tap(page, '#newT'); await advance(page, 100); await snap(`${mode} newT`);
  }
  return out;
}

async function tutorialWalk(page: Page) {
  const out: [string, Snap][] = [];
  await walkTutorial(page, async (i, step) => { out.push([`${i} ${step}`, await snapshot(page)]); });
  out.push(['end', await snapshot(page)]);
  return out;
}

function compare(a: [string, Snap][], b: [string, Snap][]) {
  expect(b.map(x => x[0])).toEqual(a.map(x => x[0]));
  for (let i = 0; i < a.length; i++) {
    // 다르면 첫 번째로 다른 글자 주변을 같이 보여 줌 (긴 HTML·data URL에서 차이를 찾기 쉽게)
    const ea = JSON.stringify(a[i][1]), eb = JSON.stringify(b[i][1]);
    if (ea !== eb) { let k = 0; while (ea[k] === eb[k]) k++; console.log(`[${a[i][0]}] legacy: …${ea.slice(k - 120, k + 60)}\n           current: …${eb.slice(k - 120, k + 60)}`); }
    expect(b[i][1], a[i][0]).toEqual(a[i][1]);
  }
}

for (const scheme of ['light', 'dark'] as const) {
  test(`free play matches legacy (${scheme})`, async ({ browser }) => {
    const run = async (url: string) => { const ctx = await browser.newContext({ colorScheme: scheme }); const p = await ctx.newPage(); await open(p, url); const r = await freePlay(p); await ctx.close(); return r; };
    const [legacy, current] = await Promise.all([run(LEGACY), run(CURRENT)]);
    compare(legacy, current);
  });
}

// 부드러운 스크롤은 가짜 시계와 상관없이 실제 시간으로 움직여서 끔 (튜토리얼이 prefers-reduced-motion이면 즉시 스크롤)
test('tutorial walkthrough matches legacy', async ({ browser }) => {
  const run = async (url: string) => { const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const p = await ctx.newPage(); await open(p, url, { tutorial: true }); const r = await tutorialWalk(p); await ctx.close(); return r; };
  const [legacy, current] = await Promise.all([run(LEGACY), run(CURRENT)]);
  expect(legacy.at(-2)?.[0]).toContain('22 / 22');
  compare(legacy, current);
});

for (const vp of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
  test(`screenshots match legacy (${vp.name})`, async ({ browser }) => {
    const run = async (url: string) => {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await open(p, url);
      const shots: Buffer[] = [await p.screenshot({ fullPage: true })];
      await tap(p, '#mAir'); await setAngle(p, 35); await tap(p, '#fire'); await advance(p, 1200); await tap(p, '#pauseBtn'); await tap(p, '#hintBtn'); await advance(p, 100);
      shots.push(await p.screenshot({ fullPage: true }));
      await ctx.close(); return shots;
    };
    const [legacy, current] = await Promise.all([run(LEGACY), run(CURRENT)]);
    legacy.forEach((buf, i) => expect(current[i].equals(buf), `screenshot ${i}`).toBe(true));
  });
}
