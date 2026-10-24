import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const LEGACY = pathToFileURL(resolve('e2e/legacy/howitzer.html')).href;
export const CURRENT = '/episodes/01-calculus-howitzer/';

// Math.random을 고정 시드(mulberry32)로 바꾸고 시계를 가짜로 바꿔, 두 페이지가 같은 입력에서 같은 결과를 내는지 비교할 수 있게 함
export async function open(page: Page, url: string, o: { seed?: number; tutorial?: boolean } = {}) {
  // 시계를 멈춰 둠: 실제 시간이 흐르면 클릭 타이밍에 따라 비행 중 정지 시점이 프레임 단위로 달라짐. 시간은 advance로만 진행
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(([seed, tutorial]) => {
    let a = seed >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // requestAnimationFrame은 테스트가 직접 한 장씩 돌림 (advance). 가짜 시계의 rAF는 실제 렌더링에 따라 프레임이 합쳐져 결과가 흔들림
    const queue: FrameRequestCallback[] = [];
    window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
    (window as unknown as { __frame: () => void }).__frame = () => { const q = queue.splice(0); q.forEach(cb => cb(performance.now())); };
    if (!tutorial) { localStorage.setItem('supojaTutDone', '1'); localStorage.setItem('series:howitzer:tutDone', '1'); }
    // 원본 비교는 눈금 추가 전 배치로 한다 (C-005, research R-6): 페이지 스크립트가 돌기 전에 data-ticks 를 지워
    // 새 손잡이·눈금 줄을 끈다. 눈금 줄이 아래 내용을 41px 밀어 스크린샷·튜토리얼 스크롤 위치가 달라지기 때문. 눈금 자체는 ticks.spec.ts 가 검사
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') document.querySelector('.ang-track')?.removeAttribute('data-ticks');
    });
  }, [o.seed ?? 12345, !!o.tutorial] as const);
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await advance(page, 100);
}

// 시간 진행: 16 ms마다 타이머를 돌리고 프레임 한 장을 그림 (60 Hz 화면과 같은 간격)
export async function advance(page: Page, ms: number) {
  for (let t = 0; t < ms; t += 16) {
    await page.clock.runFor(16);
    await page.evaluate(() => (window as unknown as { __frame: () => void }).__frame());
  }
}

// 화면에 보이는 상태 전부: 문구·버튼 상태·캔버스 픽셀
// 한글 폰트는 유니코드 구간별로 나뉘어 새 글자가 처음 나올 때 비동기로 받아짐. 다 받은 뒤 한 프레임 다시 그리고 읽음
export async function snapshot(page: Page) {
  await page.evaluate(() => document.fonts.ready); await advance(page, 16);
  return page.evaluate(() => {
    const q = (id: string) => document.getElementById(id) as HTMLElement & { disabled?: boolean };
    // 의도한 차이는 지우고 비교: 버튼 클래스 이름(fire→btn-primary, sec→btn-sec), 엔진이 만든 DOM의 태그 사이 공백,
    // 빌드 때 CSS 압축이 소문자로 바꾼 색 코드(#C5CEC6 → #c5cec6, SVG에 그대로 들어감)
    const norm = (h: string) => h.replace(/#[0-9A-Fa-f]{6}\b/g, c => c.toLowerCase()).replace(/\bbtn-primary\b/g, 'fire').replace(/\bbtn-sec\b/g, 'sec').replace(/>\s+</g, '><').trim();
    const el = (id: string) => { const e = q(id); return e ? [norm(e.innerHTML), e.hidden, !!e.disabled, norm(e.className)] : null; };
    const ids = ['hud', 'banner', 'log', 'hint', 'eq', 'angV', 'velV', 'sDist', 'sDh', 'sWind', 'sScore', 'fire', 'pauseBtn', 'stepBtn',
      'tutStep', 'tutTitle', 'tutBody', 'tutNext', 'tutPrev', 'tutCtrl', 'tFire', 'tPause', 'tStep', 'tut', 'tutDim'];
    return {
      title: document.title, lang: document.documentElement.lang,
      els: Object.fromEntries(ids.map(i => [i, el(i)])),
      charges: [...document.querySelectorAll('#charges button')].map(b => b.textContent + b.getAttribute('aria-pressed')),
      field: (q('field') as unknown as HTMLCanvasElement).toDataURL(),
      chart: (q('chart') as unknown as HTMLCanvasElement).toDataURL(),
      scrollY: Math.round(scrollY), bodyClass: document.body.className,
    };
  });
}

// Playwright click은 클릭 전에 스크롤·안정화 대기를 해서 실행마다 결과가 미세하게 달라짐. 요소의 click()을 직접 호출
export async function tap(page: Page, sel: string, nth = 0) {
  await page.evaluate(([sel, nth]) => (document.querySelectorAll(sel)[nth] as HTMLElement).click(), [sel, nth] as const);
}
export async function setAngle(page: Page, v: number) {
  await page.evaluate(v => { const e = document.getElementById('ang') as HTMLInputElement; e.value = String(v); e.dispatchEvent(new Event('input')); }, v);
}
// 발사하고 착탄할 때까지(최대 60초) 진행, 명중 뒤 새 목표 타이머(1.6초)까지 넘김
export async function fireAndLand(page: Page) {
  await tap(page, '#fire');
  for (let i = 0; i < 120 && await page.locator('#fire').isDisabled(); i++) await advance(page, 500);
  await advance(page, 2000);
}
