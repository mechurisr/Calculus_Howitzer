import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import './style.css';
import { applyLang, bindLangButton, defineStrings, onApply, onLangChange } from '@series/engine/i18n';
import { byId as $, bindInfoTips, fitCanvas, onThemeChange, type CanvasSize } from '@series/engine/ui';
import { startFixedStepLoop } from '@series/engine/sim';
import { createTutorial, type StepState } from '@series/engine/tutorial';
import { DT } from './model/constants';
import { STRINGS } from './strings';
import {
  S, hooks, chargeName, fire, newTarget, setAngle, setCharge, setMode, setPaused, showBanner,
  stepOnce, stepSim, updateFlightBtns, updateStats,
} from './game';
import { TUT } from './missions';
import { refreshColors } from './view/colors';
import { drawField } from './view/field';
import { drawChart } from './view/chart';
import { drawEq, drawHud } from './view/panels';
import { showHint } from './view/hint';
import { refreshAngleNote, renderTicks } from './view/ticks';

// 재생 속도: 실제 1초에 시뮬레이션 2.6초 (보기 좋게 고른 연출값)
const SPEED = 2.6;

const field = $<HTMLCanvasElement>('field'), chart = $<HTMLCanvasElement>('chart');
const fx = field.getContext('2d')!, cx = chart.getContext('2d')!;
let F: CanvasSize | undefined, CH: CanvasSize | undefined;
function drawAll() { drawField(fx, F); drawHud(); drawEq(); drawChart(cx, CH); }
function resize() { F = fitCanvas(field); CH = fitCanvas(chart); drawAll(); }

refreshColors();
onThemeChange(() => { refreshColors(); drawAll(); });
window.addEventListener('resize', resize);

// 튜토리얼 15단계 각도 버튼을 누르면 카드가 다시 그려져 초점이 사라짐 → 누른 버튼에 되돌림 (kitty-specs/howitzer-tutorial-angle-buttons-01M5RDY7 research R-4)
// 각도 버튼 클릭은 다시 그리기가 두 번이라(input → emit('angle'), 클릭 처리) 값을 지우지 않고, 초점이 사라졌을 때만 되돌림 — 사용자가 옮긴 초점은 그대로
let focusAng: string | undefined;
function restoreAngFocus() {
  if (!focusAng || (document.activeElement && document.activeElement !== document.body)) return;
  const b = document.querySelector<HTMLButtonElement>(`#tutBody .exp-angs [data-v="${focusAng}"]`);
  if (b && !b.disabled) b.focus({ preventScroll: true });
}
const tut = createTutorial({
  steps: TUT, episode: 'howitzer', ctrl: $('tutCtrl'), openButton: $('tutOpen'),
  onEnd: refreshAngleNote,
  onRender: () => { updateFlightBtns(); restoreAngFocus(); },
  onAction: a => {
    if (a.dataset.act === 'seta') { focusAng = a.closest('.exp-angs') ? a.dataset.v : undefined; setAngle(+a.dataset.v!); }
    else if (a.dataset.act === 'setc') setCharge(+a.dataset.v!);
  },
});
hooks.redraw = drawAll;
hooks.emit = tut.emit;
// 튜토리얼 단계가 lockResume으로 '계속'을 막고 있는지 (예: 0.5초 진행을 다 눌러 볼 때까지)
hooks.resumeLocked = () => {
  const c = tut.current(), lock = c?.step.lockResume as ((s: StepState) => boolean) | undefined;
  return S.paused && !!lock && lock(c!.state);
};

bindInfoTips($('hint'));
$('fire').onclick = fire; $('newT').onclick = newTarget;
$('hintBtn').onclick = () => { if ($('hint').hidden) showHint(); else $('hint').hidden = true; };
['ang', 'vel'].forEach(id => $(id).addEventListener('input', () => { updateStats(); if (!$('hint').hidden) showHint(); }));
// 슬라이더 드래그·± 버튼·키보드·각도 버튼 모두 이 input 을 거침. on.angle 이 있는 단계(15단계)만 스크롤 없이 다시 그려짐 (research R-3)
$('ang').addEventListener('input', () => tut.emit('angle'));
document.querySelectorAll<HTMLElement>('#charges button').forEach(b => b.onclick = () => setCharge(+b.dataset.v!));
document.querySelectorAll<HTMLElement>('.nudge').forEach(b => b.onclick = () => {
  const el = $<HTMLInputElement>(b.dataset.t!);
  el.value = String(Math.min(+el.max, Math.max(+el.min, +el.value + +b.dataset.d!))); el.dispatchEvent(new Event('input'));
});
$('mVac').onclick = () => setMode(false); $('mAir').onclick = () => setMode(true);
$('pauseBtn').onclick = $('tPause').onclick = () => setPaused(!S.paused);
$('stepBtn').onclick = $('tStep').onclick = stepOnce;
$('tFire').onclick = fire;

defineStrings(STRINGS);
bindLangButton($('langBtn'));
onApply(() => document.querySelectorAll<HTMLElement>('#charges button').forEach(b => b.textContent = chargeName(+b.dataset.v!)));
onLangChange(() => {
  updateStats(); updateFlightBtns();
  if (S.lastResult && !$('banner').hidden) showBanner(S.lastResult);
  if (!$('hint').hidden) showHint();
  if (tut.index >= 0) tut.render(false);
  drawAll();
});

// 슬라이더 눈금: 주석 문구(data-i18n)를 applyLang 이 채우도록 먼저 만듦
renderTicks(document.querySelector<HTMLElement>('.ang-ticks')!);
applyLang(); updateFlightBtns(); updateStats(); resize();
refreshAngleNote();
startFixedStepLoop({
  dt: DT, speed: SPEED, maxFrame: 0.05,
  active: () => !!S.shot && !S.paused,
  step: stepSim,
  frame: d => { if (S.boom) { S.boom.age += d; if (S.boom.age > 1.2) S.boom.age = 1.2; } drawAll(); },
});
tut.autoStart();
