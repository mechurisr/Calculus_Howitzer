import { tr } from '@series/engine/i18n';
import { byId as $, infoTip } from '@series/engine/ui';
import { S, chargeName, muzzle, neededAngles, ground, speed } from '../game';

// 궤적 식 해설 팝업 내용
const eqInfo = () => infoTip(tr('식 해설 보기', 'Explain this formula'), tr(
  '<b>포탄이 옆으로 x m 갔을 때, 높이 y는?</b>' +
  '<span class="tp"><span class="ta">x·tanθ</span> 중력이 없다면 포탄은 대포가 향한 방향으로 <b>곧게</b> 날아가요. ' +
  'tanθ는 그 직선의 기울기(옆으로 1 m 갈 때 위로 몇 m)라서, x·tanθ는 <b>"곧게 갔을 때의 높이"</b>예요.</span>' +
  '<span class="tp"><span class="tb">− g·x² / (2v₀²cos²θ)</span> 중력 때문에 <b>떨어진 만큼</b>이에요. ' +
  '옆으로 x m 가는 데 걸린 시간은 t = x ÷ (v₀cosθ)이고, 그동안 떨어진 거리 ½·g·t²에 이 t를 넣으면 이 모양이 돼요.</span>' +
  '<span class="tp"><b>곧게 간 높이 − 떨어진 만큼 = 실제 높이.</b> 떨어지는 양이 x²으로 커져서 궤적이 포물선으로 휘어요.</span>' +
  '<span class="tp small">왜 제곱일까요? 중력이 빠르기를 쌓고(적분 1번), 그 빠르기가 떨어진 거리를 쌓아요(적분 2번). ' +
  '그래서 시간이 2배면 4배 떨어져요. 2장에서 손으로 쌓아 본 바로 그거예요.</span>' +
  '<span class="tp small">힌트는 깃발 위치(x = Δx)에서 높이가 깃발 높이(Δh)와 같아지는 θ를 찾은 거예요.</span>',
  '<b>When the shell has gone x m sideways, how high is it?</b>' +
  '<span class="tp"><span class="ta">x·tanθ</span> Without gravity the shell would fly <b>straight</b> along the barrel. ' +
  'tanθ is that line’s slope (metres up per metre sideways), so x·tanθ is <b>“the height if it flew straight.”</b></span>' +
  '<span class="tp"><span class="tb">− g·x² / (2v₀²cos²θ)</span> How far it has <b>fallen</b> because of gravity. ' +
  'Reaching x m sideways takes t = x ÷ (v₀cosθ). Put that t into the fall distance ½·g·t² and you get this.</span>' +
  '<span class="tp"><b>Straight-line height − fall = actual height.</b> The fall grows with x², which bends the path into a parabola.</span>' +
  '<span class="tp small">Why squared? Gravity piles up speed (integrate once), and that speed piles up fall distance (integrate twice). ' +
  'So twice the time means four times the fall. That’s exactly what you stacked by hand in Chapter 2.</span>' +
  '<span class="tp small">The hint finds the θ where the height at the flag (x = Δx) equals the flag’s height (Δh).</span>'));

// 계산 힌트: 진공 궤적 식으로 필요한 발사각 두 개를 보여 줌. 공기저항 모드에서는 출발점으로만 쓰라고 안내
export function showHint() {
  const v = speed(), m = muzzle(), dx = S.targetX - m.x, dh = ground(S.targetX) - m.y, ans = neededAngles();
  let t = 'y(x) = x·tanθ − g·x² / (2v₀²cos²θ)' + eqInfo() + tr('  ← 시간 t를 소거한 궤적 식', '  ← trajectory with time t eliminated') + '\n' +
    tr('y(Δx) = Δh 로 놓고 tanθ에 대한 이차방정식을 풀면 각도가 두 개 나와요', 'Set y(Δx) = Δh and solve the quadratic in tanθ: you get two angles') + '\n\n' +
    'Δx = ' + dx.toFixed(1) + ' m,  Δh = ' + dh.toFixed(1) + ' m,  v₀ = ' + v.toFixed(0) + ' m/s (' + chargeName(v) + ')\n';
  t += ans ? tr('→ 진공 기준 θ ≈ ' + ans[0].toFixed(1) + '° (낮게) 또는 ' + ans[1].toFixed(1) + '° (높게)', '→ In vacuum, θ ≈ ' + ans[0].toFixed(1) + '° (low) or ' + ans[1].toFixed(1) + '° (high)')
    : tr('→ 이 장약으로는 닿지 않아요. 장약을 올려 보세요.', '→ This charge can’t reach. Try a bigger charge.');
  if (S.airMode) t += '\n\n' + tr('공기저항이 있으면 닫힌 식이 없어요. 공기가 붙잡아서 덜 날아가니 진공 값을 출발점으로 삼고, 한 발 쏘고 오차를 보며 고쳐 가세요.',
    'With air drag there’s no closed-form formula. The air holds the shell back, so it flies shorter. Use the vacuum value as a starting point, fire, and correct from the miss.');
  $('hint').innerHTML = t; $('hint').hidden = false;
}
