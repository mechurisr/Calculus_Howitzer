// 게임 상태와 동작: 목표 만들기, 발사, Δt 진행, 착탄, 일시정지, 패널 갱신.
// 그리기(view/)와 튜토리얼(missions.ts)은 hooks로 연결해 이 모듈이 그쪽을 import하지 않게 함
import { createRng, toRad } from '@series/engine/math';
import { byId as $ } from '@series/engine/ui';
import { tr } from '@series/engine/i18n';
import { CHARGES, DT, G, GUN_X, HIT_R, W } from './model/constants';
import { groundHeight } from './model/terrain';
import { advance, checkImpact, muzzlePos, neededAngles as solveAngles, type Body } from './model/ballistics';
import { measureRate as rate, pickCharge, type ShotRecord } from './model/aim';
import { clampAngle } from './model/ticks';

export interface Shot extends Body { v0: number; ang: number; y0: number; tid: number; air: boolean }
export interface Result extends ShotRecord { t: number; err: number; hit: boolean; n?: number }

const rnd = createRng();
// paused: 비행 중 정지, stepMode: 발사 직후 정지(한 걸음씩 진행), areaUp/areaDown: vy·Δt 조각의 누적합(그래프 아래 넓이)
export const S = {
  seed: rnd() * 10, targetX: 600, airMode: false, wind: 0,
  shot: null as Shot | null, trail: [] as [number, number][], samples: [] as [number, number, number][],
  boom: null as { x: number; y: number; age: number; hit: boolean } | null,
  shots: 0, hits: 0, lastResult: null as Result | null,
  paused: false, stepMode: false, targetId: 0, areaUp: 0, areaDown: 0, shotLog: [] as Result[],
};

export const hooks = {
  redraw: () => {},
  emit: (_type: string, _data?: unknown) => {},
  resumeLocked: () => false,
};

const ang = $<HTMLInputElement>('ang'), vel = $<HTMLInputElement>('vel');
export const angle = () => +ang.value;
export const speed = () => +vel.value;
export const ground = (x: number) => groundHeight(x, S.seed);
export const muzzle = () => muzzlePos(angle(), GUN_X, ground);
export const hintOpen = () => !$('hint').hidden;

export function newTarget() {
  S.seed = rnd() * 10; S.targetX = Math.round(330 + rnd() * 580);
  S.wind = S.airMode ? Math.round((rnd() * 16 - 8) * 10) / 10 : 0; S.targetId++;
  S.shot = null; S.paused = false; S.trail = []; S.samples = []; S.boom = null; S.lastResult = null; S.areaUp = S.areaDown = 0;
  $('banner').hidden = true; $('hint').hidden = true; $<HTMLButtonElement>('fire').disabled = false;
  updateFlightBtns(); updateStats(); hooks.redraw();
}

// 장약: 실제 자주포처럼 포구속도는 몇 단계로만 고르고, 세밀한 조준은 발사각으로 함
export const chargeName = (v: number) => { const n = (CHARGES as readonly number[]).indexOf(v) + 1; return tr(n + '호', 'Charge ' + n); };
export function setCharge(v: number) { vel.value = String(v); vel.dispatchEvent(new Event('input')); }
export const clampAng = clampAngle;
export function setAngle(a: number) { ang.value = String(clampAng(a)); ang.dispatchEvent(new Event('input')); }

// 탄착 결과 문구: 배너("+40 m 멀다")와 사격 기록("40 m 멀다")이 같이 씀
const missText = (err: number, signed: boolean) => (signed && err > 0 ? '+' : '') + (signed ? err : Math.abs(err)).toFixed(0) + ' m ' + (err > 0 ? tr('멀다', 'long') : tr('짧다', 'short'));
const resultText = (r: Result) => r.hit ? tr('명중', 'Hit') : r.out ? tr('화면 밖', 'Off screen') : missText(r.err, false);

export function updateStats() {
  $('sDist').textContent = Math.round(S.targetX - GUN_X) + ' m';
  const dh = ground(S.targetX) - ground(GUN_X); $('sDh').textContent = (dh >= 0 ? '+' : '') + dh.toFixed(0) + ' m';
  $('sWind').textContent = S.airMode ? (S.wind > 0 ? '→ ' : '← ') + Math.abs(S.wind).toFixed(1) + ' m/s' : tr('없음', 'none');
  $('sScore').textContent = S.hits + ' / ' + S.shots;
  $('angV').textContent = angle().toFixed(1) + '°';
  $('velV').textContent = chargeName(speed()) + ' · ' + speed().toFixed(0) + ' m/s';
  document.querySelectorAll<HTMLElement>('#charges button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v! === speed())));
  renderLog();
}

export function fire() {
  if (S.shot) return;
  const a = toRad(angle()), v = speed(), m = muzzle();
  S.shot = { x: m.x, y: m.y, vx: v * Math.cos(a), vy: v * Math.sin(a), t: 0, ax: 0, ay: -G, v0: v, ang: angle(), y0: m.y, tid: S.targetId, air: S.airMode };
  S.trail = [[m.x, m.y]]; S.samples = [[0, m.y, S.shot.vy]]; S.boom = null; S.areaUp = S.areaDown = 0;
  $('banner').hidden = true; $<HTMLButtonElement>('fire').disabled = true; S.shots++;
  S.paused = S.stepMode; updateFlightBtns(); updateStats(); hooks.emit('fire');
}

export function stepSim(): boolean {
  const s = S.shot!; advance(s, { air: S.airMode, wind: S.wind }, DT);
  const dy = s.vy * DT; if (dy > 0) S.areaUp += dy; else S.areaDown += dy;
  if (Math.round(s.t / DT) % 3 === 0) { S.trail.push([s.x, s.y]); S.samples.push([s.t, s.y, s.vy]); }
  const imp = checkImpact(s, ground, W);
  if (imp === 'out') { land(false, true); return false; }
  if (imp === 'ground') { land(Math.abs(s.x - S.targetX) <= HIT_R, false); return false; }
  return true;
}

export function showBanner(r: Result) {
  const b = $('banner'); b.hidden = false; b.className = 'banner ' + (r.hit ? 'hit' : 'miss');
  b.textContent = r.hit ? tr('명중!', 'Hit!') : r.out ? tr('화면 밖', 'Off screen') : missText(r.err, true);
}
function land(hit: boolean, out: boolean) {
  const s = S.shot!; S.samples.push([s.t, s.y, s.vy]);
  const err = s.x - S.targetX;
  S.lastResult = { x: s.x, t: s.t, err, out, hit, v0: s.v0, ang: s.ang, tid: s.tid, air: s.air };
  if (hit) S.hits++;
  S.shotLog.push({ ...S.lastResult, n: S.shots }); if (S.shotLog.length > 40) S.shotLog.shift();
  const bx = Math.min(Math.max(s.x, 0), W);
  S.boom = { x: bx, y: ground(bx), age: 0, hit };
  showBanner(S.lastResult);
  S.shot = null; S.paused = false; $<HTMLButtonElement>('fire').disabled = false; updateFlightBtns(); updateStats();
  hooks.emit('land', S.lastResult);
  if (hit) { const tid = S.targetId; setTimeout(() => { if (S.targetId === tid && !S.shot) newTarget(); }, 1600); }
}

// 지금 목표·모드·장약 기준 변화율 (튜토리얼 조준 미션용)
export const measureRate = (list: Result[]) => rate(list, { tid: S.targetId, air: S.airMode, v0: speed() });

// 자유 플레이 사격 기록: 이 목표에 쏜 최근 4발. 변화율 계산은 사용자 몫
function renderLog() {
  const el = $('log'), mine = S.shotLog.filter(r => r.tid === S.targetId && r.air === S.airMode);
  if (!mine.length) { el.hidden = true; return; } el.hidden = false;
  const rows = mine.slice(-4).map(r => `<div>${tr(r.n + '번째', '#' + r.n)}  ${r.ang.toFixed(1)}° · ${chargeName(r.v0)} → <b>${resultText(r)}</b></div>`).join('');
  el.innerHTML = `<div class="log-h">${tr('사격 기록 · 이 목표', 'Shot log · this target')}</div>${rows}`;
}

export function updateFlightBtns() {
  const label = S.paused ? tr('계속 ▶', 'Resume ▶') : tr('일시정지 ⏸', 'Pause ⏸'), lock = hooks.resumeLocked();
  const pb = $<HTMLButtonElement>('pauseBtn');
  pb.hidden = !S.shot; pb.textContent = label; pb.disabled = lock; $('stepBtn').hidden = !(S.shot && S.paused);
  // 튜토리얼 카드 안의 같은 버튼들은 숨기지 않고 비활성화만 (자리 고정)
  $<HTMLButtonElement>('tFire').disabled = !!S.shot; const tp = $<HTMLButtonElement>('tPause'); tp.disabled = !S.shot || lock; tp.textContent = label;
  $<HTMLButtonElement>('tStep').disabled = !(S.shot && S.paused);
}
export function setPaused(p: boolean) {
  if (!S.shot || (!p && hooks.resumeLocked())) return;
  S.paused = p; updateFlightBtns(); if (p) hooks.emit('pause', { ...S.shot });
}
// 0.5초(= Δt 50번)만큼 진행하고, 그동안 쌓인 높이 조각을 튜토리얼에 알림
export function stepOnce() {
  if (!S.shot) return; const s = S.shot, t0 = s.t, vy0 = s.vy, y0 = s.y;
  for (let i = 0; i < 50 && S.shot; i++) { if (!stepSim()) break; }
  hooks.emit('step', { t0, t1: s.t, vy0, vy1: s.vy, dy: s.y - y0, ytot: s.y - s.y0 });
}

export function setMode(air: boolean) {
  S.airMode = air; $('mVac').setAttribute('aria-pressed', String(!air)); $('mAir').setAttribute('aria-pressed', String(air)); newTarget();
}

// 포구 위치가 각도에 따라 조금 바뀌는 건 무시하고 현재 포구 기준으로 계산
export function neededAngles() {
  const m = muzzle(); return solveAngles(speed(), S.targetX - m.x, ground(S.targetX) - m.y);
}

// 조준 미션 시작 설정: 목표에 맞는 가장 약한 장약 + 30°.
// 45°에서 멀리 떨어진 각도에서 시작해야 각도 변화율이 커서 조준이 잘 됨
export function aimSetup() { setCharge(pickCharge(S.targetX - GUN_X, S.airMode)); setAngle(30); }
