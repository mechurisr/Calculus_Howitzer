import { tr } from '@series/engine/i18n';
import { byId as $ } from '@series/engine/ui';
import { toRad } from '@series/engine/math';
import { G } from '../model/constants';
import { accel } from '../model/ballistics';
import { S, angle, muzzle, speed } from '../game';

const f = (n: number, p = 1) => (n >= 0 ? ' ' : '') + n.toFixed(p);
const env = () => ({ air: S.airMode, wind: S.wind });

// 전장 왼쪽 위 숫자판: 비행 중엔 t·x·y·vx·vy, 끝나면 비행시간·탄착점
export function drawHud() {
  const s = S.shot, hud = $('hud');
  if (s) hud.innerHTML = 't  ' + s.t.toFixed(2) + ' s<br>x  ' + s.x.toFixed(1) + ' m<br>y  ' + s.y.toFixed(1) + ' m<br>vx ' + s.vx.toFixed(1) + '<br>vy ' + s.vy.toFixed(1);
  else if (S.lastResult) hud.innerHTML = tr('비행 ', 'Flight ') + S.lastResult.t.toFixed(2) + ' s<br>' + tr('탄착 ', 'Impact ') + S.lastResult.x.toFixed(0) + ' m<br>' + tr('목표 ', 'Target ') + S.targetX + ' m';
  else hud.innerHTML = tr('목표 ', 'Target ') + S.targetX + ' m<br>' + tr('준비 완료', 'Ready');
}

// "지금 돌아가는 계산": 이번 Δt의 가속도 → 속도 → 위치, 그리고 접선 기울기. 발사 전엔 포구에서의 값
export function drawEq() {
  const a0 = toRad(angle()), m = muzzle();
  const s = S.shot || { x: m.x, y: m.y, vx: speed() * Math.cos(a0), vy: speed() * Math.sin(a0), ax: accel(0, 0, env())[0], ay: -G, t: 0 };
  const [ax, ay] = S.shot ? [s.ax, s.ay] : accel(s.vx, s.vy, env());
  const c = (t: string) => '<span class="c">' + t + '</span>';
  const line1 = S.airMode ? c(tr('// 가속도: 중력 + 공기저항 −k|v−w|(v−w)', '// acceleration: gravity + drag −k|v−w|(v−w)')) : c(tr('// 가속도: 중력만 있음', '// acceleration: gravity only'));
  $('eq').innerHTML = line1 + '\n' +
    '<span class="a">a</span>  = (' + f(ax, 2) + ', ' + f(ay, 2) + ') m/s²\n' +
    c(tr('// 속도 ← 속도 + 가속도·Δt   (가속도를 적분)', '// velocity ← velocity + accel·Δt   (integrate accel)')) + '\n' +
    '<span class="b">v</span>  = (' + f(s.vx) + ', ' + f(s.vy) + ') m/s\n' +
    c(tr('// 위치 ← 위치 + 속도·Δt     (속도를 적분)', '// position ← position + velocity·Δt   (integrate velocity)')) + '\n' +
    'p  = (' + f(s.x) + ', ' + f(s.y) + ') m\n' +
    c(tr('// 접선 기울기 (미분)', '// tangent slope (derivative)')) + '\n' +
    'dy/dx = vy / vx = ' + (s.vy / s.vx).toFixed(3);
}
