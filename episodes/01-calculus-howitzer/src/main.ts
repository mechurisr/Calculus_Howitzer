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

const tut = createTutorial({
  steps: TUT, episode: 'howitzer', ctrl: $('tutCtrl'), openButton: $('tutOpen'),
  onRender: updateFlightBtns,
  onAction: a => { if (a.dataset.act === 'seta') setAngle(+a.dataset.v!); else if (a.dataset.act === 'setc') setCharge(+a.dataset.v!); },
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

applyLang(); updateFlightBtns(); updateStats(); resize();
startFixedStepLoop({
  dt: DT, speed: SPEED, maxFrame: 0.05,
  active: () => !!S.shot && !S.paused,
  step: stepSim,
  frame: d => { if (S.boom) { S.boom.age += d; if (S.boom.age > 1.2) S.boom.age = 1.2; } drawAll(); },
});
tut.autoStart();
