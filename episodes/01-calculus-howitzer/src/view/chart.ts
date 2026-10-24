import type { CanvasSize } from '@series/engine/ui';
import { tr } from '@series/engine/i18n';
import { S } from '../game';
import { C } from './colors';

const f = (n: number, p = 1) => (n >= 0 ? ' ' : '') + n.toFixed(p);

// 위: 높이 y(t), 아래: 세로속도 vy(t) = dy/dt와 그 아래 넓이(= 높이 변화, 미적분학의 기본정리)
export function drawChart(cx: CanvasRenderingContext2D, CH: CanvasSize | undefined) {
  if (!CH) return; const { w, h, d } = CH; cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, w, h);
  const pad = 36, mid = h / 2, top = [10, mid - 12], bot = [mid + 12, h - 18], samples = S.samples;
  cx.font = '10.5px "IBM Plex Mono",monospace';
  if (samples.length < 2) { cx.fillStyle = C.muted; cx.fillText(tr('발사하면 그래프가 그려집니다', 'Fire to draw the graph'), pad, mid); return; }
  const tMax = Math.max(samples[samples.length - 1][0], 1), ys = samples.map(s => s[1]), vys = samples.map(s => s[2]);
  const yMin = Math.min(...ys), yMax = Math.max(...ys), vMax = Math.max(...vys.map(Math.abs), 1);
  const tx_ = (t: number) => pad + (t / tMax) * (w - pad - 10);
  const yy = (y: number) => top[1] - (y - yMin) / (yMax - yMin || 1) * (top[1] - top[0]);
  const vy = (v: number) => (bot[0] + bot[1]) / 2 - v / vMax * (bot[1] - bot[0]) / 2;
  // axes
  cx.strokeStyle = C.line; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(pad, top[0]); cx.lineTo(pad, top[1]); cx.lineTo(w - 10, top[1]);
  cx.moveTo(pad, bot[0]); cx.lineTo(pad, bot[1]); cx.moveTo(pad, vy(0)); cx.lineTo(w - 10, vy(0)); cx.stroke();
  cx.fillStyle = C.muted; cx.fillText('y', 8, top[0] + 10); cx.fillText(yMax.toFixed(0), 2, top[0] + 22);
  cx.fillText('vy', 6, bot[0] + 10); cx.fillText('0', 20, vy(0) + 4); cx.fillText(tMax.toFixed(1) + ' s', w - 48, h - 4);
  // area under vy(t): 0선 위(올라간 높이)는 파랑, 아래(내려온 높이)는 주황으로 칠함
  const z = vy(0), end = samples[samples.length - 1];
  cx.save(); cx.beginPath(); cx.moveTo(tx_(samples[0][0]), z); samples.forEach(s => cx.lineTo(tx_(s[0]), vy(s[2]))); cx.lineTo(tx_(end[0]), z); cx.closePath(); cx.clip();
  cx.globalAlpha = .22; cx.fillStyle = C.blue; cx.fillRect(pad, bot[0], w, z - bot[0]); cx.fillStyle = C.accent; cx.fillRect(pad, z, w, bot[1] - z); cx.restore();
  cx.fillStyle = C.ink; cx.fillText(tr('넓이: 위 +', 'Area: up +') + S.areaUp.toFixed(0) + tr('  아래 ', '  down ') + S.areaDown.toFixed(0) + tr('  합 ', '  sum ') + f(S.areaUp + S.areaDown, 0).trim() + ' m', pad + 4, h - 4);
  // apex time: vy 부호가 +에서 0 이하로 바뀌는 첫 표본
  let apex: number | null = null; for (let i = 1; i < samples.length; i++) if (samples[i - 1][2] > 0 && samples[i][2] <= 0) { apex = samples[i][0]; break; }
  if (apex !== null) {
    cx.setLineDash([3, 4]); cx.strokeStyle = C.muted; cx.beginPath(); cx.moveTo(tx_(apex), top[0]); cx.lineTo(tx_(apex), bot[1]); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = C.ink; cx.fillText(tr('vy=0 → 정점 t=', 'vy=0 → apex t=') + apex.toFixed(2) + 's', Math.min(tx_(apex) + 4, w - 150), vy(0) - 6);
  }
  cx.lineWidth = 2; cx.strokeStyle = C.accent; cx.beginPath(); samples.forEach((s, i) => i ? cx.lineTo(tx_(s[0]), yy(s[1])) : cx.moveTo(tx_(s[0]), yy(s[1]))); cx.stroke();
  cx.strokeStyle = C.blue; cx.beginPath(); samples.forEach((s, i) => i ? cx.lineTo(tx_(s[0]), vy(s[2])) : cx.moveTo(tx_(s[0]), vy(s[2]))); cx.stroke();
  cx.fillStyle = C.accent; cx.beginPath(); cx.arc(tx_(end[0]), yy(end[1]), 3, 0, 7); cx.fill();
  cx.fillStyle = C.blue; cx.beginPath(); cx.arc(tx_(end[0]), vy(end[2]), 3, 0, 7); cx.fill();
}
