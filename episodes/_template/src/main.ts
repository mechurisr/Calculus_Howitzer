// 새 에피소드 시작점. 구조: model/ 순수 계산(테스트 대상) · main.ts 화면 연결 · strings 문구 · TUT 미션
// 엔진만 import 할 것 (다른 에피소드 import 금지 — pnpm check:boundaries 가 막음)
import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import { P, applyLang, bindLangButton, defineStrings, tr } from '@series/engine/i18n';
import { byId as $, fitCanvas, onThemeChange, readCssVars, THEME_KEYS, type CanvasSize } from '@series/engine/ui';
import { startFixedStepLoop } from '@series/engine/sim';
import { createTutorial, quizStep, type TutStep } from '@series/engine/tutorial';
import { apexTime, heightAt } from './model/motion';
import './style.css';

defineStrings({
  docTitle: P('에피소드', 'Episode'),
  title: P('에피소드 <span>제목</span>', 'Episode <span>title</span>'),
  lead: P('역할 소개 한두 줄.', 'One or two lines about the role.'),
  tutOpen: P('미션 시작', 'Start missions'),
  v0L: P('처음 속도 v₀', 'Initial speed v₀'),
  run: P('실행', 'Run'),
});

const DT = 0.01;  // 수치적분 한 걸음 (s)
const stage = $<HTMLCanvasElement>('stage'), ctx = stage.getContext('2d')!, v0 = $<HTMLInputElement>('v0');
let C = readCssVars(THEME_KEYS), size: CanvasSize | undefined, t: number | null = null;

function draw() {
  if (!size) return; const { w, h, d } = size, v = +v0.value, top = heightAt(v, apexTime(v)) * 1.1 || 1;
  ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = C.sky; ctx.fillRect(0, 0, w, h);
  const y = t === null ? 0 : Math.max(0, heightAt(v, t));
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(w / 2, h - 10 - y / top * (h - 20), 6, 0, 7); ctx.fill();
  $('v0V').textContent = v + ' m/s';
}
const run = () => { t = 0; tut.emit('run'); };

const TUT: TutStep[] = [
  { ch: P('1장', 'Ch.1'), title: P('던져 보기', 'Throw it'), ctrl: true, gate: s => !!s.ran, waitLabel: P('실행을 눌러 보세요', 'Press Run'),
    on: { run: s => { s.ran = true; } }, body: () => '<p>' + tr('실행을 누르세요.', 'Press Run.') + '</p>' },
  quizStep({ ch: P('1장', 'Ch.1'), title: P('확인 문제', 'Quick check'), quiz: {
    q: P('꼭대기에서 속도는?', 'What is the speed at the top?'), options: [P('0', '0'), P('v₀', 'v₀')], answer: 0,
    explain: P('올라가지도 내려가지도 않아요.', 'Neither rising nor falling.'), hint: P('꼭대기에서 방향이 바뀌어요.', 'The direction flips at the top.') } }),
];
const tut = createTutorial({ steps: TUT, episode: 'template', ctrl: $('tutCtrl'), openButton: $('tutOpen') });

$('run').onclick = run; $('tRun').onclick = run;
v0.addEventListener('input', draw);
onThemeChange(() => { C = readCssVars(THEME_KEYS); draw(); });
window.addEventListener('resize', () => { size = fitCanvas(stage); draw(); });
bindLangButton($('langBtn'));
applyLang(); size = fitCanvas(stage);
startFixedStepLoop({
  dt: DT, active: () => t !== null,
  step: () => { t! += DT; if (t! > 2 * apexTime(+v0.value)) { t = null; return false; } return true; },
  frame: draw,
});
tut.autoStart();
