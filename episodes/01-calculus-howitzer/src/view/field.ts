import type { CanvasSize } from '@series/engine/ui';
import { GUN_X, HIT_R, W } from '../model/constants';
import { vacuumPoint } from '../model/ballistics';
import { toRad } from '@series/engine/math';
import { S, angle, ground, hintOpen, muzzle, neededAngles, speed } from '../game';
import { C } from './colors';

// 전장: 100 m 격자, 지형, 진공 힌트 궤적, 깃발, 자주포, 궤적, 포탄과 접선, 정점, 폭발, 바람 화살표
export function drawField(fx: CanvasRenderingContext2D, F: CanvasSize | undefined) {
  if (!F) return; const { w, h, d } = F, sc = w / W, H = h / sc;
  fx.setTransform(d, 0, 0, d, 0, 0); fx.clearRect(0, 0, w, h);
  const X = (x: number) => x * sc, Y = (y: number) => h - y * sc;
  fx.fillStyle = C.sky; fx.fillRect(0, 0, w, h);
  // range grid every 100 m
  fx.strokeStyle = C.line; fx.lineWidth = 1; fx.fillStyle = C.muted; fx.font = '10px "IBM Plex Mono",monospace';
  for (let gx = 100; gx < W; gx += 100) { fx.beginPath(); fx.moveTo(X(gx), 0); fx.lineTo(X(gx), h); fx.stroke(); fx.fillText(gx - GUN_X > 0 ? (gx) + '' : '', X(gx) + 3, 12); }
  for (let gy = 100; gy < H; gy += 100) { fx.beginPath(); fx.moveTo(0, Y(gy)); fx.lineTo(w, Y(gy)); fx.stroke(); }
  // terrain
  fx.beginPath(); fx.moveTo(0, h); for (let x = 0; x <= W; x += 5) fx.lineTo(X(x), Y(ground(x))); fx.lineTo(w, h); fx.closePath();
  fx.fillStyle = C.ground; fx.fill(); fx.strokeStyle = C.ground2; fx.lineWidth = 2; fx.stroke();
  // vacuum ghost hint
  if (hintOpen() && !S.airMode) {
    const ans = neededAngles(); if (ans) {
      const cur = angle(), best = Math.abs(ans[0] - cur) <= Math.abs(ans[1] - cur) ? ans[0] : ans[1];
      const v = speed(), a = toRad(best), m = muzzle();
      fx.setLineDash([2, 5]); fx.strokeStyle = C.blue; fx.lineWidth = 1.5; fx.beginPath();
      for (let t = 0; t < 40; t += 0.05) { const { x, y } = vacuumPoint(m.x, m.y, v, a, t); if (t === 0) fx.moveTo(X(x), Y(y)); else fx.lineTo(X(x), Y(y)); if (y < ground(x) && t > 0.5) break; }
      fx.stroke(); fx.setLineDash([]);
    }
  }
  // target flag
  const tX = S.targetX, ty = ground(tX); fx.strokeStyle = C.ink; fx.lineWidth = 1.5; fx.beginPath(); fx.moveTo(X(tX), Y(ty)); fx.lineTo(X(tX), Y(ty + 28)); fx.stroke();
  fx.fillStyle = C.accent; fx.beginPath(); fx.moveTo(X(tX), Y(ty + 28)); fx.lineTo(X(tX) + 14, Y(ty + 23)); fx.lineTo(X(tX), Y(ty + 18)); fx.fill();
  fx.strokeStyle = C.accent; fx.globalAlpha = .5; fx.beginPath(); fx.moveTo(X(tX - HIT_R), Y(ty) + 2); fx.lineTo(X(tX + HIT_R), Y(ty) + 2); fx.lineWidth = 3; fx.stroke(); fx.globalAlpha = 1;
  // howitzer
  const gy = ground(GUN_X), a = toRad(angle());
  fx.fillStyle = C.ink; fx.save(); fx.translate(X(GUN_X), Y(gy + 6)); fx.rotate(-a); fx.fillRect(0, -2.5, Math.max(14, 12 * sc * 1.4), 5); fx.restore();
  fx.beginPath(); fx.roundRect ? fx.roundRect(X(GUN_X) - 13, Y(gy + 9), 26, 10, 3) : fx.rect(X(GUN_X) - 13, Y(gy + 9), 26, 10); fx.fill();
  fx.fillStyle = C.ground2; for (let i = -1; i <= 1; i++) { fx.beginPath(); fx.arc(X(GUN_X) + i * 8, Y(gy) - 1, 3.5, 0, 7); fx.fill(); }
  // trail
  const { trail, shot } = S;
  if (trail.length > 1) {
    fx.strokeStyle = C.accent; fx.lineWidth = 2; fx.beginPath(); trail.forEach((p, i) => i ? fx.lineTo(X(p[0]), Y(p[1])) : fx.moveTo(X(p[0]), Y(p[1])));
    if (shot) fx.lineTo(X(shot.x), Y(shot.y)); fx.stroke();
  }
  // shell + tangent: 점선 방향 = 속도 벡터 방향, 기울기 dy/dx = vy/vx
  if (shot) {
    const px = X(shot.x), py = Math.max(6, Y(shot.y)), sp = Math.hypot(shot.vx, shot.vy), L = 70;
    fx.setLineDash([5, 4]); fx.strokeStyle = C.blue; fx.lineWidth = 1.5; fx.beginPath();
    fx.moveTo(px - shot.vx / sp * L * .6, py + shot.vy / sp * L * .6); fx.lineTo(px + shot.vx / sp * L, py - shot.vy / sp * L); fx.stroke(); fx.setLineDash([]);
    fx.fillStyle = C.ink; fx.beginPath(); fx.arc(px, py, 4, 0, 7); fx.fill();
    fx.fillStyle = C.blue; fx.font = '11px "IBM Plex Mono",monospace';
    fx.fillText('dy/dx=' + (shot.vy / shot.vx).toFixed(2), Math.min(px + 8, w - 90), Math.max(py - 10, 24));
    if (Y(shot.y) < 0) { fx.fillStyle = C.ink; fx.fillText('▲ ' + shot.y.toFixed(0) + ' m', Math.min(px - 10, w - 70), 14); }
  }
  // apex marker
  if (S.samples.length > 2) {
    const ap = trail.reduce((b, p) => p[1] > b[1] ? p : b, trail[0]);
    if (ap && ap[1] < H) { fx.fillStyle = C.blue; fx.beginPath(); fx.arc(X(ap[0]), Y(ap[1]), 3, 0, 7); fx.fill(); }
  }
  // explosion
  const { boom } = S;
  if (boom) {
    const r = 6 + boom.age * 40, al = Math.max(0, 1 - boom.age / 1.2); fx.globalAlpha = al; fx.strokeStyle = boom.hit ? C.good : C.bad; fx.lineWidth = 3;
    fx.beginPath(); fx.arc(X(boom.x), Y(boom.y), r, 0, 7); fx.stroke(); fx.globalAlpha = 1;
  }
  // wind arrow
  if (S.airMode && S.wind) {
    const x0 = w - 70, y0 = h - 14, len = Math.abs(S.wind) * 4, dir = Math.sign(S.wind); fx.strokeStyle = C.ink; fx.fillStyle = C.ink; fx.lineWidth = 2;
    fx.beginPath(); fx.moveTo(x0 - dir * len / 2, y0); fx.lineTo(x0 + dir * len / 2, y0); fx.stroke();
    fx.beginPath(); fx.moveTo(x0 + dir * len / 2, y0); fx.lineTo(x0 + dir * (len / 2 - 6), y0 - 4); fx.lineTo(x0 + dir * (len / 2 - 6), y0 + 4); fx.fill();
  }
}
