import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const LEGACY = pathToFileURL(resolve('e2e/legacy/howitzer.html')).href;
export const CURRENT = '/episodes/01-calculus-howitzer/';

// Math.random을 고정 시드(mulberry32)로 바꾸고 시계를 가짜로 바꿔, 두 페이지가 같은 입력에서 같은 결과를 내는지 비교할 수 있게 함
export async function open(page: Page, url: string, o: { seed?: number; tutorial?: boolean; ticks?: boolean; touch?: boolean } = {}) {
  // 시계를 멈춰 둠: 실제 시간이 흐르면 클릭 타이밍에 따라 비행 중 정지 시점이 프레임 단위로 달라짐. 시간은 advance로만 진행
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await page.addInitScript(([seed, tutorial, ticks, touch]) => {
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
    // ticks: true 면 눈금을 그대로 둠 (ticks.spec.ts 의 튜토리얼 4장 테스트)
    if (!ticks) document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') document.querySelector('.ang-track')?.removeAttribute('data-ticks');
    });
    // 원본 비교는 머리말 튜토리얼 버튼 44px 변경 전 배치로 (kitty-specs/howitzer-tutorial-act-buttons-01M5RVRJ C-002, research R-2):
    // 버튼이 2.75px 커지면 아래 내용이 밀려 스크린샷·스크롤 위치가 달라지기 때문. 44px 자체는 touch-targets.spec.ts 가 검사.
    // 카드 안 .act 는 고정 위치 카드 안이라 페이지 배치·HTML 스냅샷에 영향이 없어 끄지 않음. touch: true 면 그대로 둠
    if (!touch) document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return;
      const st = document.createElement('style'); st.textContent = '.tut-btn{min-height:0!important;min-width:0!important}'; document.head.append(st);
    });
  }, [o.seed ?? 12345, !!o.tutorial, !!o.ticks, !!o.touch] as const);
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

// 튜토리얼 자동 진행 (parity.spec.ts 와 ticks.spec.ts 가 같이 씀). 다음 버튼이 막혀 있으면: 퀴즈 보기 차례로 고르기 →
// (발사 가능하면) 각도 버튼과 발사 번갈아 → '계속'이 잠겼으면 0.5초 진행 → 단계가 일시정지를 원하면 정지, 아니면 이어서 날리기.
// onStep 이 true 를 돌려주면 그 단계에서 멈춤
export async function walkTutorial(page: Page, onStep: (i: number, step: string) => Promise<boolean | void>) {
  const text = async (sel: string) => (await page.locator(sel).textContent()) ?? '';
  let quizPick = 0, c = 0;
  for (let i = 0; i < 300 && await page.locator('#tut').isVisible(); i++) {
    if (await onStep(i, await text('#tutStep'))) return;
    if (await page.locator('#tutNext').isEnabled()) { await tap(page, '#tutNext'); quizPick = 0; c = 0; await advance(page, 100); continue; }
    const quiz = page.locator('#tutBody .quiz button');
    if (await quiz.count()) { await tap(page, '#tutBody .quiz button', quizPick++ % await quiz.count()); await advance(page, 100); continue; }
    const acts = page.locator('#tutBody .act'), wantPause = (await text('#tutNext')).includes('일시정지');
    const paused = (await text('#tPause')).includes('계속');
    if (await page.locator('#tFire').isEnabled()) {
      if (await acts.count() && c % 2 === 0) {
        // 15단계는 이미 쏜 각도 버튼이 비활성 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7). 원본은 그 버튼을 눌러 같은 각도로 다시 쏘므로,
        // 같은 발사가 되도록 비활성 버튼의 각도는 슬라이더로 맞춤 (버튼을 누른 것과 같은 input 경로)
        const n = (c >> 1) % await acts.count(), b = acts.nth(n);
        if (await b.isDisabled()) await setAngle(page, +(await b.getAttribute('data-v'))!);
        else await tap(page, '#tutBody .act', n);
      }
      else await tap(page, '#tFire');
      c++;
    } else if (await page.locator('#tStep').isEnabled() && await page.locator('#tPause').isDisabled()) await tap(page, '#tStep');
    else if (await page.locator('#tPause').isEnabled() && (paused || wantPause)) await tap(page, '#tPause');
    await advance(page, 1200);
  }
}

// 튜토리얼 15단계 "실험: 각도만 바꿔 보기"까지 자동 진행 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7, e2e/angle-buttons.spec.ts)
export async function gotoExperimentStep(page: Page) {
  await open(page, CURRENT, { tutorial: true, ticks: true, touch: true });
  // 앞 단계에서 일시정지된 포탄이 남아 있으면 15단계에서 착탄해 기록에 들어감 → 14단계에서 먼저 떨어뜨려 빈 기록으로 시작
  let flushed = false;
  await walkTutorial(page, async (_i, step) => {
    if (!flushed && step.includes('14 / 22')) { flushed = true; await landPending(page); }
    return step.includes('15 / 22');
  });
}
async function landPending(page: Page) {
  for (let i = 0; i < 120 && await page.locator('#tFire').isDisabled(); i++) {
    if (((await page.locator('#tPause').textContent()) ?? '').match(/계속|Resume/)) await tap(page, '#tPause');
    await advance(page, 500);
  }
}
// 튜토리얼 카드의 발사 버튼으로 쏘고 착탄(기록)까지 진행
export async function tutFire(page: Page) {
  // 발사 버튼은 다음 프레임에 꺼짐 → 한 프레임 넘긴 뒤 다시 켜질 때(착탄)까지 진행.
  // 앞 단계에서 일시정지된 채 들어오면 포탄이 멈춰 있으므로 '계속'을 누름 (walkTutorial 과 같은 처리)
  await tap(page, '#tFire'); await advance(page, 50);
  await landPending(page);
  await advance(page, 200);
}
// 이전 비교에서 15단계 카드 본문의 허용 차이 두 가지만 자리표시로 바꿈 (spec C-003, research R-7):
// ① 각도 버튼 5개 줄 — 원본은 <p><button …>30°</button> …</p>, 새 버전은 <p class="exp-angs"> + 상태 속성
// ② 4발 뒤 관찰 문장 <p class="fb"> — 15단계 본문의 fb 는 이 문장 하나뿐
// snapshot() 의 norm() 을 거친 HTML(태그 사이 공백 제거)에 씀
export function maskExperimentStep(html: string) {
  return html
    .replace(/<p[^>]*>(?:<button class="act" data-act="seta"[^>]*>[^<]*<\/button>){5}<\/p>/, '<p>[angle-buttons]</p>')
    .replace(/<p class="fb">.*?<\/p>/, '<p class="fb">[observation]</p>');
}

// 튜토리얼 5단계 "손으로 쌓아 보기" (kitty-specs/howitzer-tutorial-step5-text-01M5S15W NFR-001): 원본 카드 HTML 에 이번 두 변경을
// 같은 규칙으로 적용해 새 버전과 글자까지 비교함 (가리지 않음). snapshot() 의 norm() 을 거친 HTML(태그 사이 공백 제거)에 씀
// ① 발사 전 안내 마지막 문장 치환 ② 표 설명 문단을 "🤔 그런데…" 앞으로. 이유 상자 안 <span class="small"> 과 섞이지 않게 문단 시작을 고정
// replaced·reordered 로 실제 적용 여부를 돌려줌 — 정규식이 안 맞아 조용히 비교가 통과·실패하지 않게 (스펙 검토 R1)
export function legacyStep5(html: string) {
  const a = html.replace('한 걸음씩 날려 보세요.', '포탄을 0.5초씩 앞으로 보내 보세요.');
  const b = a.replace(/(<p>🤔 그런데[\s\S]*?<\/p>)(<div class="ex">[\s\S]*?<\/div>)(<p class="small">vy가 매번 약[\s\S]*?<\/p>)/, '$3$1$2');
  return { html: b, replaced: a !== html, reordered: b !== a };
}
