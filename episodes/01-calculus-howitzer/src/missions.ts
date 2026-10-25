// 튜토리얼 "미적분 배우기": 쏴 보기 → 적분 → 미분 → 발사각의 비밀 → 미분으로 조준 → 실전 → 마무리
import { P, tr, tx } from '@series/engine/i18n';
import { quizStep, type StepState, type TutStep } from '@series/engine/tutorial';
import { byId as $ } from '@series/engine/ui';
import { CHARGES, G, GUN_X } from './model/constants';
import { rangeSlopePerDeg, rangeVacuum } from './model/ballistics';
import { correctedAngle } from './model/aim';
import { exactRise, leftRiemannRise, trapezoidPiece } from './model/riemann';
import { EXP_ANGLES, angleButtonState, observationKind, type ObservationKind } from './model/angle-buttons';
import { S, aimSetup, angle, chargeName, clampAng, measureRate, setCharge, setMode, type Result } from './game';
import { C } from './view/colors';
import { markAngleNoteSeen } from './view/ticks';

const chart = $('chart');
const ang = () => +$<HTMLInputElement>('ang').value, vel = () => +$<HTMLInputElement>('vel').value;
const FIELD = () => $('field').parentElement;
const sg = (n: number, p = 0) => (n >= 0 ? '+' : '') + n.toFixed(p);

// "0.5초 진행" 한 번의 기록 (game.stepOnce가 보냄)
interface StepRec { t0: number; t1: number; vy0: number; vy1: number; dy: number; ytot: number }
// 0.5초 조각 표: 조각(vy·Δt)을 더해 높이가 쌓이는 과정 = 리만 합
// 6줄이 넘으면 첫 줄(0→0.5초)은 비교용으로 남기고 중간을 ⋮로 접음
function stepTable(s: StepState) {
  const r: StepRec[] = s.recs || []; if (!r.length) return '';
  const row = (x: StepRec) => `<tr><td>${x.t0.toFixed(1)}→${x.t1.toFixed(1)}s</td><td>${x.vy0.toFixed(1)} → ${x.vy1.toFixed(1)}</td><td>${sg(x.dy, 1)} m</td><td><b>${sg(x.ytot, 1)} m</b></td></tr>`;
  const rows = r.length > 6 ? [row(r[0]), '<tr><td colspan="4" style="text-align:center">⋮</td></tr>', ...r.slice(-5).map(row)] : r.map(row);
  return '<table class="steps"><tr><td>' + tr('시간', 'Time') + '</td><td>' + tr('위로 빠르기 vy', 'Upward speed vy') + '</td><td>' + tr('이번 조각<br>= 평균 vy × 0.5초', 'This piece<br>= avg vy × 0.5 s') + '</td><td>' + tr('쌓인 높이', 'Stacked height') + '</td></tr>' + rows.join('') + '</table>';
}
// "손으로 쌓아 보기"에서 잰 첫 조각(0→0.5초). 뒤 단계의 문제와 오차 표가 이 숫자를 씀
let stepRec0: StepRec | null = null;
// "실험: 각도만 바꿔 보기"의 결과 {ang, dist}. 다음 단계의 사거리 그래프에 점으로 찍음
let angleExp: { ang: number; dist: number }[] = [];
// 실험 단계 각도 버튼 5개: 지금 슬라이더 각도면 '현재'(aria-pressed), 이미 기록된 각도면 '쏜 각도'(비활성 + 이유를 담은 이름)
// 모양은 style.css .exp-angs (공용 .act 는 그대로 — spec C-002). 버튼 사이 간격은 CSS gap 이라 공백 없이 붙임
function expAngleButtons(recorded: number[]) {
  const th = angle();
  return '<p class="exp-angs">' + EXP_ANGLES.map(a => {
    const st = angleButtonState(a, th, recorded);
    const attr = st === 'fired' ? ` disabled aria-label="${tr(`${a}°, 이미 쏨`, `${a}°, already fired`)}"` : st === 'current' ? ' aria-pressed="true"' : '';
    return `<button class="act" data-act="seta" data-v="${a}"${attr}>${a}°</button>`;
  }).join('') + '</p>';
}
// 4발 뒤 관찰 문장: 기록에 있는 각도만 말함 (spec §4 "관찰 문장" 표, FR-007). both 는 원래 문장 그대로
const EXP_OBSERVATION: Record<ObservationKind, () => string> = {
  both: () => tr('40°·45°·50°는 거리가 <b>거의 같고</b>, 30°와 60°도 서로 <b>비슷하죠?</b> (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.',
    '40°, 45° and 50° land <b>almost the same</b> distance, and 30° and 60° are <b>similar</b> too, right? (Uneven ground makes them differ a little.) We’ll see why next.'),
  mid: () => tr('40°·45°·50°는 거리가 <b>거의 같죠?</b> (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.',
    '40°, 45° and 50° land <b>almost the same</b> distance, right? (Uneven ground makes them differ a little.) We’ll see why next.'),
  pair: () => tr('30°와 60°는 거리가 서로 <b>비슷하죠?</b> (땅 높낮이 때문에 조금씩 달라요) 왜 그런지 다음 단계에서 봐요.',
    '30° and 60° land a <b>similar</b> distance, right? (Uneven ground makes them differ a little.) We’ll see why next.'),
  none: () => tr('각도에 따라 날아간 거리가 어떻게 달라졌는지 표에서 비교해 보세요. 왜 그런지 다음 단계에서 봐요.',
    'Compare in the table how the distance changed with the angle. We’ll see why next.'),
};
// 기록이 없으면 지금 장약·각도로 첫 0.5초를 계산한 값 (진공에서는 vy가 0.5초에 4.9씩 일정하게 줄어듦)
const rec0 = () => {
  if (stepRec0) return stepRec0;
  const vy0 = vel() * Math.sin(ang() * Math.PI / 180), vy1 = vy0 - G * 0.5; return { vy0, vy1, dy: trapezoidPiece(vy0, vy1) };
};

// 변화율(할선 기울기)로 조준: 같은 장약에서 각도만 다른 두 발로 Δ탄착/Δ각도를 재고 필요한 보정을 계산
function aimOnLand(s: StepState, r: Result) { (s.shots = s.shots || []).push(r); if (r.hit) s.hit = true; }
const setaBtn = (na: number) => `<p><button class="act" data-act="seta" data-v="${na}">${tr('θ = ' + na.toFixed(1) + '° 넣기', 'Set θ = ' + na.toFixed(1) + '°')}</button> ${tr('그리고 <b>발사!</b>', 'then <b>FIRE!</b>')}</p>`;
function aimBody(s: StepState) {
  if (s.hit) return '<p class="fb good">' + tr('🎯 명중! 감이 아니라 <b>변화율(미분)로 계산해서</b> 맞혔어요.', '🎯 Hit! Not by feel: you <b>calculated it with the rate of change (the derivative)</b>.') + '</p>';
  const { b, a, k } = measureRate(s.shots || []), v = vel(), i = (CHARGES as readonly number[]).indexOf(v);
  if (!b) return '<p>' + tr(`먼저 <b>지금 설정(${ang().toFixed(1)}° · ${chargeName(v)})</b>으로 한 발 쏘세요.`, `First, fire once with the <b>current settings (${ang().toFixed(1)}° · ${chargeName(v)})</b>.`) + '</p>';
  let h = '<p>' + tr(`방금 탄착: 깃발보다 <b>${Math.abs(b.err).toFixed(0)} m ${b.err > 0 ? '멀리' : '짧게'}</b> (${b.ang.toFixed(1)}°)`, `Last impact: <b>${Math.abs(b.err).toFixed(0)} m ${b.err > 0 ? 'long' : 'short'}</b> of the flag (${b.ang.toFixed(1)}°)`) + '</p>';
  if (!a || k == null) {// 멀면 45°에서 멀어지는 쪽, 짧으면 45° 쪽으로 3° (둘 다 오차를 줄이는 방향)
    const away = b.ang < 45 ? -3 : 3, na = clampAng(b.ang + (b.err > 0 ? away : -away));
    return h + '<p>' + tr('이번엔 <b>장약은 그대로</b> 두고 각도만 살짝 바꿔 한 발 더 쏘세요. 그래야 "각도를 바꾸면 탄착점이 얼마나 움직이나"를 <b>잴</b> 수 있어요.',
      'Now keep the <b>charge the same</b>, change only the angle a little, and fire again. That way you can <b>measure</b> “how far the impact moves when the angle changes.”') + '</p>' + setaBtn(na);
  }
  const da = b.ang - a.ang, dx = b.x - a.x;
  if (Math.abs(k) < 3) return h + '<div class="ex">' + tr(`각도를 ${sg(da, 1)}° 바꿨는데 탄착점은 ${sg(dx, 0)} m밖에 안 움직였어요 (1°당 ${Math.abs(k).toFixed(1)} m).`, `You changed the angle by ${sg(da, 1)}°, but the impact moved only ${sg(dx, 0)} m (${Math.abs(k).toFixed(1)} m per 1°).`) + '</div>' +
    '<p>' + tr('<b>45° 근처</b>라서 그래요. 사거리 그래프의 꼭대기라 기울기가 거의 0이거든요. 45°에서 멀리 떨어진 각도로 다시 재 보세요.',
      'That’s because you’re <b>near 45°</b>, the top of the range graph, where the slope is almost 0. Measure again from an angle far from 45°.') + '</p>' +
    `<p><button class="act" data-act="seta" data-v="30">${tr('θ = 30° 넣기', 'Set θ = 30°')}</button></p>`;
  const rem = S.targetX - b.x, { need, next: na } = correctedAngle(b.ang, rem, k);
  h+='<div class="ex">'+tr(
    `① 각도를 <b>${sg(da,1)}°</b> 바꿨더니 탄착점이 <b>${sg(dx,0)} m</b> 움직였어요<br>`+
    `② 변화율 = ${sg(dx,0)} ÷ ${sg(da,1)} = <b>1°당 ${k.toFixed(1)} m</b> <span class="o">← 이게 미분</span><br>`+
    `③ 깃발까지: <b>${sg(rem,0)} m</b> (${rem<0?'지나쳤으니 덜 가야 해요':'더 가야 해요'})<br>`+
    `④ 필요한 각도 변화 = ${sg(rem,0)} ÷ ${k.toFixed(1)} = <b>${sg(need,1)}°</b><br>→ θ ≈ <b>${na.toFixed(1)}°</b>`,
    `① Changing the angle by <b>${sg(da,1)}°</b> moved the impact <b>${sg(dx,0)} m</b><br>`+
    `② Rate of change = ${sg(dx,0)} ÷ ${sg(da,1)} = <b>${k.toFixed(1)} m per 1°</b> <span class="o">← that’s the derivative</span><br>`+
    `③ To the flag: <b>${sg(rem,0)} m</b> (${rem<0?'overshot, so go shorter':'need to go farther'})<br>`+
    `④ Angle change needed = ${sg(rem,0)} ÷ ${k.toFixed(1)} = <b>${sg(need,1)}°</b><br>→ θ ≈ <b>${na.toFixed(1)}°</b>`)+'</div>';
  // 45°를 넘어가면 변화율의 부호가 바뀌어 직선 어림이 안 통함 = 이 장약의 최대 사거리로도 모자람
  if((b.ang<45)!==(na<45)||na>80){const up=CHARGES[i+1];
    return h+'<p>'+tr('필요한 각도가 45°를 넘어가요. 이 장약은 <b>45°로 쏴도 모자란다</b>는 뜻이에요. 장약을 올리고 다시 두 발로 재 보세요.',
      'The needed angle goes past 45°. That means this charge <b>falls short even at 45°</b>. Raise the charge and measure again with two shots.')+'</p>'+
      (up?`<p><button class="act" data-act="setc" data-v="${up}">${tr(chargeName(up)+'로 올리기','Raise to '+chargeName(up))}</button></p>`:'');}
  if(na<10){const down=CHARGES[i-1];
    return h+'<p>'+tr('그만큼 각도를 낮출 수는 없어요. 이 장약이 너무 세다는 뜻이에요. 장약을 내리고 다시 두 발로 재 보세요.',
      'You can’t lower the angle that much. This charge is too strong. Lower the charge and measure again with two shots.')+'</p>'+
      (down?`<p><button class="act" data-act="setc" data-v="${down}">${tr(chargeName(down)+'로 내리기','Lower to '+chargeName(down))}</button></p>`:'');}
  return h+setaBtn(na)+'<p class="small">'+tr('빗나가도 괜찮아요. 최근 두 발로 다시 재면 더 정확해져요. 진짜 포병의 "수정 사격"이 이 방법이에요.',
    'Missing is okay. Measuring again with your last two shots makes it more accurate. This is how real artillery “adjusts fire.”')+'</p>';}

// 사거리 그래프 R(θ) = v₀²·sin2θ / g (진공·평지). 실험한 점과 30°·45°의 접선을 같이 그림
function rangeSvg(pts: { ang: number; dist: number }[]) {
  const v = vel(), R = (t: number) => rangeVacuum(v, t), Rm = v * v / G * 1.12;
  const X = (t: number) => 30 + (t - 10) / 70 * 260, Y = (r: number) => 130 - r / Rm * 118, slope = (t: number) => rangeSlopePerDeg(v, t);
  let p = ''; for (let t = 10; t <= 80; t += 1) p += (t === 10 ? 'M' : 'L') + X(t).toFixed(1) + ' ' + Y(R(t)).toFixed(1);
  const tan = (t0: number, col: string) => { const y0 = R(t0), k = slope(t0); return `<line x1="${X(t0 - 9)}" y1="${Y(y0 - k * 9)}" x2="${X(t0 + 9)}" y2="${Y(y0 + k * 9)}" stroke="${col}" stroke-width="1.5" stroke-dasharray="4 3"/>`; };
  const dots = pts.map(q => `<circle cx="${X(q.ang)}" cy="${Y(q.dist)}" r="3.5" fill="${C.accent}"/>`).join('');
  return `<svg viewBox="0 0 300 150" style="width:100%;max-width:420px;display:block;margin:0 0 8px" role="img" aria-label="${tr('발사각에 따른 사거리 그래프','Range vs. launch angle graph')}">
    <line x1="30" y1="130" x2="292" y2="130" stroke="${C.line}"/><line x1="30" y1="8" x2="30" y2="130" stroke="${C.line}"/>
    ${[10,30,45,60,80].map(t=>`<text x="${X(t)}" y="144" font-size="9" text-anchor="middle" fill="${C.muted}">${t}°</text>`).join('')}
    <text x="4" y="14" font-size="9" fill="${C.muted}">${tr('거리','Range')}</text>
    <path d="${p}" fill="none" stroke="${C.blue}" stroke-width="2"/>${tan(45,C.ink)}${tan(30,C.ink)}${dots}
    <text x="${X(45)}" y="${Y(R(45))-8}" font-size="9" text-anchor="middle" fill="${C.ink}">${tr('45°: 기울기 0','45°: slope 0')}</text>
    <text x="${X(30)-4}" y="${Y(R(30))+16}" font-size="9" text-anchor="end" fill="${C.ink}">${tr('30°: 1°당 '+slope(30).toFixed(0)+' m','30°: '+slope(30).toFixed(0)+' m per 1°')}</text></svg>`;}

const CH1=P('1장 · 쏴 보기','Ch.1 · First shot'),CH2=P('2장 · 적분','Ch.2 · Integrals'),CH3=P('3장 · 미분','Ch.3 · Derivatives'),
  CH4=P('4장 · 발사각의 비밀','Ch.4 · Secret of the angle'),CH5=P('5장 · 미분으로 조준','Ch.5 · Aim with derivatives'),
  CH6=P('6장 · 실전','Ch.6 · For real'),CHE=P('마무리','Wrap-up'),QC=P('확인 문제','Quick check');

export const TUT: TutStep[] = [
  {ch:P('시작','Start'),title:P('미적분은 딱 두 가지 질문','Calculus is just two questions'),body:()=>tr(`
    <p>미적분이라는 말은 무섭지만, 사실 질문은 두 개뿐이에요.</p>
    <table><tr><td><span class="o">미분</span></td><td>"<b>지금 이 순간</b> 얼마나 빨리 변하고 있지?"<br><span class="small">예) 자동차 속도계: 지금 시속 60 km</span></td></tr>
    <tr><td><span class="o">적분</span></td><td>"<b>조금씩 변한 걸 다 모으면</b> 얼마나 되지?"<br><span class="small">예) 주행거리계: 지금까지 총 120 km</span></td></tr></table>
    <p>두 질문은 서로 <b>반대 방향</b>이에요. 포탄을 쏘면서 둘 다 <b>직접 손으로</b> 해 볼 거예요. 공식은 외우지 않아도 돼요.</p>`,`
    <p>“Calculus” sounds scary, but it really asks just two questions.</p>
    <table><tr><td><span class="o">Derivative</span></td><td>“<b>Right now</b>, how fast is it changing?”<br><span class="small">e.g. a car’s speedometer: 60 km/h right now</span></td></tr>
    <tr><td><span class="o">Integral</span></td><td>“<b>Add up all the little changes</b>: how much is that?”<br><span class="small">e.g. the odometer: 120 km so far</span></td></tr></table>
    <p>The two questions point in <b>opposite directions</b>. You’ll do both <b>with your own hands</b> while firing shells. No formulas to memorize.</p>`)},

  {ch:CH1,target:()=>[FIELD()],dim:true,title:P('전장 살펴보기','Look around the battlefield'),body:()=>tr(`
    <p>왼쪽 검은 물체가 <b>대포</b>, 오른쪽 <span class="o">주황 깃발</span>이 <b>목표</b>예요 (${Math.round(S.targetX-GUN_X)} m 앞). 깃발 아래 흐린 줄 안에 떨어지면 명중이에요.</p>
    <p>조절할 건 두 개뿐이에요.<br><b>장약</b>: 화약을 얼마나 넣을지. 진짜 자주포처럼 <b>1~4호 중에서만</b> 골라요 (셀수록 멀리)<br><b>발사각</b>: 대포를 얼마나 들지. 장약으로 대충 거리를 정하고, <b>세밀한 조준은 각도로</b> 해요</p>`,`
    <p>The black thing on the left is <b>your gun</b>; the <span class="o">orange flag</span> on the right is the <b>target</b> (${Math.round(S.targetX-GUN_X)} m away). Land inside the faint strip under the flag to hit it.</p>
    <p>You control just two things.<br><b>Charge</b>: how much powder. Like a real howitzer, you can only pick <b>Charge 1–4</b> (bigger = farther)<br><b>Launch angle</b>: how high to raise the barrel. Use the charge for rough distance and <b>fine-tune with the angle</b></p>`)},
  {ch:CH1,target:()=>[FIELD()],ctrl:true,waitLabel:P('발사해 보세요','Fire a shot'),gate:s=>s.landed,auto:s=>s.landed,
    on:{land:s=>{s.landed=true;}},title:P('일단 한 발!','Just fire one!'),body:s=>s.landed?
    '<p class="fb good">'+tr('좋아요! 이제 이 포탄이 <b>어떻게</b> 날아가는지 들여다볼게요.','Nice! Now let’s look at <b>how</b> that shell flies.')+'</p>':
    '<p>'+tr('계산은 나중에. 지금 설정 그대로 아래 <span class="o">발사</span>를 눌러 보세요. 빗나가도 괜찮아요.','Math can wait. Press <span class="o">FIRE</span> below with the current settings. Missing is fine.')+'</p>'},

  {ch:CH2,target:()=>[$('eq')],dim:true,title:P('컴퓨터는 공식을 모른다','The computer doesn’t know the formula'),body:()=>tr(`
    <p>놀랍게도 이 게임은 포물선 공식을 쓰지 않아요. <b>0.01초마다</b> 아래 두 가지만 반복해요.</p>
    <div class="ex">① 중력이 <b>위로 빠르기(vy)</b>를 조금 깎는다<br>② 지금 빠르기만큼 포탄을 <b>한 걸음</b> 옮긴다</div>
    <p>작은 걸음을 <b>계속 더해서</b> 전체 궤적을 만드는 것, 이게 <span class="o">적분</span>이에요. 다음 단계에서 직접 해 봐요.</p>`,`
    <p>Surprisingly, this game doesn’t use the parabola formula. <b>Every 0.01 s</b> it just repeats two things.</p>
    <div class="ex">① Gravity trims the <b>upward speed (vy)</b> a little<br>② Move the shell <b>one small step</b> at its current speed</div>
    <p>Building the whole path by <b>adding up</b> tiny steps: that’s an <span class="o">integral</span>. You’ll try it yourself next.</p>`)},
  {ch:CH2,target:()=>[FIELD()],ctrl:true,
    // 평균 계산이 딱 맞는 건 vy가 일정하게 줄 때(진공)뿐이라 진공으로 고정
    enter:()=>{S.stepMode=true;if(S.airMode)setMode(false);},exit:()=>{S.stepMode=false;},
    waitLabel:P('0.5초 진행을 4번 눌러 보세요','Press “Step 0.5 s” 4 times'),gate:s=>(s.recs||[]).length>=4,lockResume:(s:StepState)=>(s.recs||[]).length<4,
    on:{fire:s=>{s.recs=[];s.fired=true;},step:(s,r)=>{(s.recs=s.recs||[]).push(r);if(s.recs.length===1)stepRec0=r;}},title:P('손으로 쌓아 보기','Stack it by hand'),body:s=>{
      const r=s.recs||[];let h;
      if(!s.fired)h='<p>'+tr('<span class="o">발사</span>를 누르세요. 이번엔 포탄이 <b>출발 직후 멈춰</b> 있어요. 그다음 <b>0.5초 진행 ⏭</b>을 눌러 포탄을 0.5초씩 앞으로 보내 보세요.',
        'Press <span class="o">FIRE</span>. This time the shell <b>freezes right after launch</b>. Then press <b>Step 0.5 s ⏭</b> to send the shell forward 0.5 s at a time.')+'</p>';
      else if(!r.length)h='<p>'+tr('이제 <b>0.5초 진행 ⏭</b>을 눌러 보세요.','Now press <b>Step 0.5 s ⏭</b>.')+'</p>';
      else{const x=r[r.length-1];h='<p>'+tr(`방금 0.5초 동안 높이 조각 <b>${sg(x.dy,1)} m</b>를 더해서, 지금까지 쌓인 높이는 <b>${sg(x.ytot,1)} m</b>예요.`,
        `In the last 0.5 s we added a height piece of <b>${sg(x.dy,1)} m</b>, so the stacked height is now <b>${sg(x.ytot,1)} m</b>.`)+'</p>';}
      h+=stepTable(s);
      if(r.length){
        // 표 → 표 설명 → 🤔 의문 → 이유 순서 (kitty-specs/howitzer-tutorial-step5-text-01M5S15W FR-001)
        h+='<p class="small">'+tr('vy가 매번 약 <b>4.9씩</b> 줄어요 (중력 9.8 × 0.5초). 맨 오른쪽 칸은 조각들을 <b>전부 더한 값</b>이에요. 이게 적분이에요.',
          'vy drops by about <b>4.9</b> each time (gravity 9.8 × 0.5 s). The right-most column is <b>all the pieces added up</b>. That’s an integral.')+'</p>';
        const f0=r[0];
        h+='<p>'+tr(`🤔 그런데 첫 줄을 보세요. ${f0.vy0.toFixed(1)} × 0.5 = <b>${(f0.vy0*0.5).toFixed(1)}</b> 아닌가요? 표에는 <b>${f0.dy.toFixed(1)} m</b>예요. 아래에서 이유를 볼게요.`,
          `🤔 But look at the first row. Isn’t ${f0.vy0.toFixed(1)} × 0.5 = <b>${(f0.vy0*0.5).toFixed(1)}</b>? The table says <b>${f0.dy.toFixed(1)} m</b>. Here’s why.`)+'</p>';
        // 표에 보이는 반올림된 숫자로 계산해서, 학생이 직접 따라 계산해도 같은 값이 나오게 함
        const x=r[r.length-1],a=+x.vy0.toFixed(1),b=+x.vy1.toFixed(1),dt=x.t1-x.t0,dts=Math.abs(dt-0.5)<0.005?'0.5':dt.toFixed(2);
        h+=`<div class="ex">${tr('방금 조각','Last piece')}: (${a.toFixed(1)} + ${b.toFixed(1)}) ÷ 2 × ${dts} = <b>${sg((a+b)/2*dt,1)} m</b><br>`+
          '<span class="small">'+tr('0.5초 동안에도 vy가 계속 줄어서, 시작값 대신 시작과 끝의 <b>평균</b>을 써요.','vy keeps dropping during the 0.5 s, so we use the <b>average</b> of start and end instead of the start value.')+'</span></div>';}
      if(r.some((x:StepRec)=>x.dy<0))h+='<p class="fb">'+tr('조각이 <b>음수</b>가 됐어요! vy가 0 아래로 내려가서, 이제는 <b>더할수록 높이가 줄어요</b>.','A piece went <b>negative</b>! vy dropped below 0, so now <b>adding makes the height go down</b>.')+'</p>';
      if(r.length>=4)h+='<p class="small">'+tr('더 눌러 봐도 되고, <b>계속 ▶</b>을 누르면 끝까지 날아가요.','Keep pressing if you like, or press <b>Resume ▶</b> to let it fly.')+'</p>';
      return h;}},
  quizStep({ch:CH2,title:QC,quiz:{
    q:()=>{const x=rec0();return tr(`처음 vy는 <b>${x.vy0.toFixed(1)}</b>이었어요. 그런데 첫 조각은 ${x.vy0.toFixed(1)} × 0.5 = ${(x.vy0*0.5).toFixed(1)}가 아니라 <b>${x.dy.toFixed(1)} m</b>였죠. 왜일까요?`,
      `The starting vy was <b>${x.vy0.toFixed(1)}</b>. But the first piece was <b>${x.dy.toFixed(1)} m</b>, not ${x.vy0.toFixed(1)} × 0.5 = ${(x.vy0*0.5).toFixed(1)}. Why?`);},
    options:[P('0.5초 동안에도 vy가 계속 줄어들어서','vy keeps dropping even during the 0.5 s'),P('반올림하다 생긴 오류라서','It’s a rounding error'),P('공기저항 때문에','Because of air drag')],answer:0,
    explain:P('시작 빠르기로 0.5초 내내 날아간다고 치면 너무 많이 올라간 걸로 계산돼요. 실제로는 점점 느려지니까 시작과 끝의 <b>평균</b>으로 계산해야 맞아요.',
      'If you pretend it flies at the starting speed for the whole 0.5 s, you overcount the climb. It actually keeps slowing, so you need the <b>average</b> of start and end.'),
    hint:P('지금은 진공 모드라 공기가 없어요. 표의 vy 칸에서 0.5초 동안 무슨 일이 있었나요?','This is vacuum mode, so there’s no air. What happened to vy during the 0.5 s in the table?')}}),
  {ch:CH2,title:P('잘게 쪼갤수록 정확해진다','Finer pieces, smaller error'),body:()=>{
    // 같은 0.5초 구간을 조각 크기 h로 나눠, 조각마다 그 시작 vy로 계산한 합과 실제 값(평균 계산)을 비교
    const v=rec0().vy0,exact=exactRise(v);
    const rows=([[0.5,tr('0.5초 × 1번','0.5 s × 1')],[0.1,tr('0.1초 × 5번','0.1 s × 5')],[0.01,tr('0.01초 × 50번<br><b>(게임의 조각 크기)</b>','0.01 s × 50<br><b>(the game’s piece size)</b>')]] as [number,string][]).map(([h,l])=>{
      const sum=leftRiemannRise(v,h);
      return `<tr><td>${l}</td><td>${sum.toFixed(1)} m</td><td><b>${(sum-exact).toFixed(2)} m</b></td></tr>`;}).join('');
    return tr(`<p>"조각 하나 동안은 빠르기가 그대로"라고 치고 계산하면 조금씩 틀려요. 그런데 조각을 <b>잘게 쪼갤수록</b> 그 오차가 줄어들어요. 아까 그 0.5초 구간으로 볼게요.</p>
      <table class="steps"><tr><td>조각 크기</td><td>조각마다<br>시작 vy로 계산</td><td>실제(${exact.toFixed(1)} m)와<br>오차</td></tr>${rows}</table>
      <p>게임이 0.01초씩 쪼개는 이유가 이거예요. 조각을 <b>무한히 잘게</b> 쪼개면 오차가 0이 되는데, 이게 수학에서 말하는 <span class="o">적분</span>이에요.</p>
      <p class="small">실제 값 ${exact.toFixed(1)} m는 (시작 + 끝) ÷ 2 × 0.5로 구했어요. 진공에서는 vy가 일정하게 줄어서 평균 계산이 정확히 맞아요.</p>`,
      `<p>If you pretend “the speed stays the same during each piece,” you’re a little off. But the <b>finer you chop</b>, the smaller the error. Let’s use that same 0.5 s stretch.</p>
      <table class="steps"><tr><td>Piece size</td><td>Using each piece’s<br>starting vy</td><td>Error vs.<br>actual (${exact.toFixed(1)} m)</td></tr>${rows}</table>
      <p>That’s why the game chops time into 0.01 s. Chop <b>infinitely fine</b> and the error becomes 0. That’s what mathematicians call an <span class="o">integral</span>.</p>
      <p class="small">The actual value ${exact.toFixed(1)} m comes from (start + end) ÷ 2 × 0.5. In a vacuum vy drops at a steady rate, so the average is exact.</p>`);}},
  quizStep({ch:CH2,title:QC,quiz:{q:P('진공 모드에는 공기도, 연료도 없어요. 그런데 포탄은 왜 결국 떨어질까요?','In vacuum mode there’s no air and no fuel. So why does the shell eventually fall?'),
    options:[P('중력이 "위로 빠르기"를 매 순간 조금씩 깎아서','Gravity trims the “upward speed” a little every moment'),P('포탄이 무거워서 갑자기 꺾여서','The shell is heavy, so it suddenly turns'),P('꼭대기에서 공기가 아래로 눌러서','Air pushes it down at the top')],answer:0,
    explain:P('조금씩 깎인 게 <b>쌓여서</b> vy가 결국 0 아래로 내려가요.','The small trims <b>pile up</b> until vy drops below 0.'),
    hint:P('표에서 vy 칸이 어떻게 변했는지 떠올려 보세요.','Remember how the vy column changed in the table.')}}),
  {ch:CH2,target:()=>[chart],dim:true,title:P('적분 = 그래프 아래 넓이','Integral = area under the graph'),body:()=>tr(`
    <p>아래쪽 <span class="bl">파란 그래프</span>는 위로 빠르기 vy예요. 0.5초 조각 하나는 <b>빠르기(세로) × 시간(가로)</b>, 곧 얇은 <b>직사각형의 넓이</b>죠.</p>
    <p>직사각형을 아주 얇게 만들어 전부 붙이면 <b>색칠된 넓이</b>가 돼요. 그래서 <span class="o">적분 = 그래프 아래 넓이</span>라고 해요.</p>
    <div class="ex"><span class="bl">위쪽 넓이 +${S.areaUp.toFixed(0)} m</span> = 올라간 높이<br><span class="o">아래쪽 넓이 ${S.areaDown.toFixed(0)} m</span> = 내려온 높이<br>합 <b>${sg(S.areaUp+S.areaDown,0)} m</b> = 출발점보다 높아진(−면 낮아진) 만큼</div>`,`
    <p>The lower <span class="bl">blue graph</span> is the upward speed vy. One 0.5 s piece is <b>speed (height) × time (width)</b>: the area of a thin <b>rectangle</b>.</p>
    <p>Make the rectangles super thin and glue them all together, and you get the <b>shaded area</b>. That’s why we say <span class="o">integral = area under the graph</span>.</p>
    <div class="ex"><span class="bl">Area above +${S.areaUp.toFixed(0)} m</span> = how much it rose<br><span class="o">Area below ${S.areaDown.toFixed(0)} m</span> = how much it fell<br>Sum <b>${sg(S.areaUp+S.areaDown,0)} m</b> = how much higher (lower, if −) it ended than it started</div>`)},
  quizStep({ch:CH2,title:QC,quiz:{q:P('위쪽(파란) 넓이와 아래쪽(주황) 넓이가 <b>똑같다면</b>, 포탄은 어디에 있을까요?','If the upper (blue) and lower (orange) areas are <b>exactly equal</b>, where is the shell?'),
    options:[P('출발했던 높이','Back at its starting height'),P('가장 높은 곳','At its highest point'),P('땅속 깊은 곳','Deep underground')],answer:0,
    explain:P('올라간 만큼 내려왔으니 합이 0, 즉 높이 변화가 0이에요.','It came down as much as it went up, so the sum is 0: no change in height.'),
    hint:P('위 넓이는 "올라간 만큼", 아래 넓이는 "내려온 만큼"이에요.','Upper area = “how much it rose,” lower area = “how much it fell.”')}}),

  {ch:CH3,target:()=>[FIELD()],ctrl:true,waitLabel:P('날아가는 중에 일시정지','Pause mid-flight'),gate:s=>!!s.p,
    on:{pause:(s,p)=>{s.p=p;}},title:P('순간을 멈춰 보기','Freeze a moment'),body:s=>{
      if(!s.p)return tr(`<p>이제 반대 방향, <span class="o">미분</span>이에요. 발사한 뒤 날아가는 도중에 <b>일시정지 ⏸</b>를 눌러 보세요.</p>
        <p>포탄 옆 <span class="bl">파란 점선</span>은 포탄이 <b>바로 그 순간</b> 향하는 방향이에요.</p>`,`<p>Now the opposite direction: the <span class="o">derivative</span>. Fire, then press <b>Pause ⏸</b> while the shell is flying.</p>
        <p>The <span class="bl">blue dashed line</span> next to the shell is the direction it’s heading <b>at that very moment</b>.</p>`);
      const p=s.p,k=p.vy/p.vx;
      return tr(`<div class="ex">멈춘 순간: 옆으로 <b>${p.vx.toFixed(1)}</b> m/s, 위로 <b>${p.vy.toFixed(1)}</b> m/s<br>파란 점선의 기울기 dy/dx = ${p.vy.toFixed(1)} ÷ ${p.vx.toFixed(1)} = <b>${k.toFixed(2)}</b></div>
        <p>뜻: 이 순간 옆으로 1 m 갈 때 위로 <b>${k.toFixed(2)} m</b> → <b>${k>0.05?'올라가는 중':k<-0.05?'내려가는 중':'거의 꼭대기'}</b>!</p>
        <p>속도계처럼 평균이 아니라 <b>"딱 지금"</b>의 변화를 재는 것, 이게 <span class="o">미분</span>이에요. 다른 순간에도 멈춰 보세요.</p>`,
        `<div class="ex">Frozen moment: sideways <b>${p.vx.toFixed(1)}</b> m/s, up <b>${p.vy.toFixed(1)}</b> m/s<br>Slope of the blue line dy/dx = ${p.vy.toFixed(1)} ÷ ${p.vx.toFixed(1)} = <b>${k.toFixed(2)}</b></div>
        <p>Meaning: right now, for every 1 m sideways it goes <b>${k.toFixed(2)} m</b> up → <b>${k>0.05?'climbing':k<-0.05?'falling':'almost at the top'}</b>!</p>
        <p>Like a speedometer, it measures change <b>“right now,”</b> not an average. That’s a <span class="o">derivative</span>. Try pausing at other moments too.</p>`);}},
  quizStep({ch:CH3,title:QC,quiz:{q:P('날아가는 포탄 옆에 <span class="bl">dy/dx = −0.80</span>이 떠 있어요. 지금 포탄은?','Next to the flying shell you see <span class="bl">dy/dx = −0.80</span>. What is the shell doing?'),
    options:[P('올라가는 중','Climbing'),P('딱 꼭대기','Exactly at the top'),P('내려가는 중','Falling')],answer:2,
    explain:P('기울기가 음수 = 옆으로 갈수록 높이가 줄어든다 = 내려가는 중.','A negative slope = the height drops as it moves sideways = falling.'),
    hint:P('+는 오르막, −는 내리막이에요.','+ means uphill, − means downhill.')}}),
  {ch:CH3,target:()=>[FIELD()],ctrl:true,waitLabel:P('꼭대기에서 일시정지','Pause at the top'),gate:s=>s.ok||(s.tries||0)>=4,
    on:{pause:(s,p)=>{s.tries=(s.tries||0)+1;s.vy=p.vy;if(Math.abs(p.vy)<4)s.ok=true;},
        step:(s,r)=>{s.vy=r.vy1;if(Math.abs(r.vy1)<4)s.ok=true;}},
    title:P('미션: 꼭대기를 잡아라','Mission: catch the top'),body:s=>{
      let h=tr(`<p>꼭대기에서는 올라가지도 내려가지도 않아요. <b>위로 빠르기 vy = 0</b>, 기울기 = 0인 순간이죠.</p>
        <p>발사하고, 포탄이 <b>가장 높은 순간</b>에 <b>일시정지 ⏸</b>를 누르세요. (조금 일찍 멈추고 <b>0.5초 진행</b>으로 다가가도 돼요.)</p>`,
        `<p>At the top, the shell is neither rising nor falling: <b>upward speed vy = 0</b>, slope = 0.</p>
        <p>Fire, and press <b>Pause ⏸</b> at the shell’s <b>highest moment</b>. (You can also stop a bit early and creep up with <b>Step 0.5 s</b>.)</p>`);
      if(s.vy!=null){
        if(s.ok)h+='<p class="fb good">'+tr(`🎯 성공! vy = ${s.vy.toFixed(1)}, 거의 0이에요. "<b>변화가 0인 곳 = 가장 높은 곳</b>". 수학 시험 단골 문제를 직접 잡아냈어요.`,
          `🎯 Got it! vy = ${s.vy.toFixed(1)}, almost 0. “<b>Where the change is 0 = the highest point.</b>” You just caught a classic exam question yourself.`)+'</p>';
        else h+=`<p class="fb bad">vy = ${sg(s.vy,1)} → `+(s.vy>0?tr('아직 <b>올라가는 중</b>이에요. 조금 더 기다리세요.','still <b>climbing</b>. Wait a bit longer.'):tr('이미 <b>내려오는 중</b>이에요. 조금 더 일찍!','already <b>falling</b>. A bit earlier!'))+'</p>';
        if(!s.ok&&s.tries>=4)h+='<p class="small">'+tr('어려우면 넘어가도 괜찮아요. 꼭대기 = vy가 0인 곳, 이것만 기억하세요.','It’s okay to move on if this is tricky. Just remember: the top = where vy is 0.')+'</p>';}
      return h;}},
  {ch:CH3,target:()=>[chart],dim:true,title:P('기울기를 모은 그래프','A graph made of slopes'),body:()=>tr(`
    <p>위쪽 <span class="o">주황 그래프</span>는 높이, 아래쪽 <span class="bl">파란 그래프</span>는 위로 빠르기예요.</p>
    <p>주황이 <b>가파르게 오를 때</b> 파랑은 크고, <b>꼭대기에서 평평할 때</b> 파랑은 0, <b>내려갈 때</b> 파랑은 음수예요.</p>
    <div class="ex">파란 그래프 = 주황 그래프의 <b>매 순간 기울기</b>를 모아 그린 것.<br>이걸 <span class="o">도함수</span>(미분해서 나온 함수)라고 불러요.</div>
    <p>거꾸로, 파란 그래프의 넓이를 쌓으면 주황 그래프가 나와요. <b>미분과 적분은 서로를 되돌리는 관계</b>예요.</p>`,`
    <p>The upper <span class="o">orange graph</span> is height; the lower <span class="bl">blue graph</span> is upward speed.</p>
    <p>When orange <b>climbs steeply</b>, blue is large; when it’s <b>flat at the top</b>, blue is 0; when it <b>goes down</b>, blue is negative.</p>
    <div class="ex">Blue graph = the orange graph’s <b>slope at every moment</b>, collected into one graph.<br>That’s called the <span class="o">derivative</span> (the function you get by differentiating).</div>
    <p>Going backwards, stacking up the blue graph’s area gives you the orange graph. <b>Derivatives and integrals undo each other.</b></p>`)},

  {ch:CH4,target:()=>[FIELD()],ctrl:true,enter:()=>{if(S.airMode)setMode(false);setCharge(75);},
    waitLabel:P('서로 다른 각도로 4발 쏘기','Fire at 4 different angles'),gate:s=>new Set((s.exp||[]).map((q:{ang:number})=>q.ang)).size>=4,
    // angle: 슬라이더가 움직이면 main.ts 가 보냄. 핸들러가 있어야 엔진이 이 단계를 스크롤 없이 다시 그려 버튼 '현재' 표시가 따라감 (research R-3)
    on:{land:(s,r)=>{if(!r.out&&r.v0===75)(s.exp=s.exp||[]).push({ang:r.ang,dist:r.x-GUN_X});},angle:()=>{}},title:P('실험: 각도만 바꿔 보기','Experiment: change only the angle'),body:s=>{
      const e:{ang:number;dist:number}[]=s.exp||[],by:Record<number,number>={};e.forEach(q=>by[q.ang]=q.dist);const angs=Object.keys(by).map(Number).sort((a,b)=>a-b);
      let h='<p>'+tr(`장약을 <b>${chargeName(75)}</b>로 고정했어요. 이제 <b>각도만</b> 바꿔 가며 쏘고, 포탄이 얼마나 멀리 가는지 비교해 봐요. 깃발은 신경 쓰지 마세요.`,
        `The charge is locked at <b>${chargeName(75)}</b>. Now change <b>only the angle</b>, fire, and compare how far the shell goes. Ignore the flag.`)+'</p>'+
        expAngleButtons(angs);
      if(angs.length)h+='<table class="steps"><tr><td>'+tr('발사각','Launch angle')+'</td><td>'+tr('날아간 거리','Distance flown')+'</td></tr>'+angs.map(a=>`<tr><td>${a.toFixed(1)}°</td><td><b>${by[a].toFixed(0)} m</b></td></tr>`).join('')+'</table>';
      if(angs.length>=4)h+='<p class="fb">'+EXP_OBSERVATION[observationKind(angs)]()+'</p>';
      else h+='<p class="small">'+tr('각도 버튼을 누르고 발사! 서로 다른 각도로 4발 쏘면 넘어갈 수 있어요.','Pick an angle and fire! Fire at 4 different angles to move on.')+'</p>';
      // 다음 단계 그래프에 실험 점을 찍기 위해 저장
      angleExp=angs.map(a=>({ang:a,dist:by[a]}));
      return h;}},
  // enter: 이 단계에 들어오면 슬라이더 45° 주석을 켬 (kitty-specs/howitzer-angle-ticks-01M5Q3M8 FR-006). 문구·순서는 그대로
  {ch:CH4,enter:()=>markAngleNoteSeen(),title:P('45°는 사거리 그래프의 꼭대기','45° is the top of the range graph'),body:()=>tr(`
    <p>가로는 발사각, 세로는 날아간 거리예요. <span class="o">주황 점</span>이 방금 실험한 결과예요.</p>
    ${rangeSvg(angleExp)}
    <p>이 그래프에도 <b>꼭대기</b>가 있죠? 3장에서 포탄의 꼭대기를 잡았을 때처럼, 꼭대기에서는 <b>기울기가 0</b>이에요.</p>
    <div class="ex">① 그래서 <b>45°가 가장 멀리</b> 가요. "변화가 0인 곳 = 가장 높은 곳"이 여기서도 통해요.<br>
    ② 45° 근처에서는 각도를 바꿔도 거리가 <b>거의 안 변해요</b>. 기울기가 0에 가까우니까요.<br>
    ③ 30°처럼 꼭대기에서 먼 곳은 기울기가 커서, <b>1°만 바꿔도 많이</b> 움직여요.</div>
    <p>그리고 그래프가 45°를 중심으로 <b>좌우 대칭</b>이라, 같은 거리를 맞히는 각도가 <b>두 개</b>(낮게 30°, 높게 60°) 있어요.</p>`,`
    <p>Across: launch angle. Up: distance flown. The <span class="o">orange dots</span> are your experiment.</p>
    ${rangeSvg(angleExp)}
    <p>This graph has a <b>top</b> too, right? Just like when you caught the shell’s top in Chapter 3, the <b>slope is 0</b> at the top.</p>
    <div class="ex">① That’s why <b>45° goes farthest</b>. “Where the change is 0 = the highest point” works here too.<br>
    ② Near 45°, changing the angle <b>barely changes</b> the distance, because the slope is almost 0.<br>
    ③ Far from the top, like at 30°, the slope is steep, so <b>even 1° moves it a lot</b>.</div>
    <p>And since the graph is <b>symmetric</b> around 45°, there are <b>two angles</b> that hit the same distance (low 30°, high 60°).</p>`)},
  quizStep({ch:CH4,title:QC,quiz:{q:P('45°로 쐈더니 깃발보다 <b>10 m 짧았어요</b>. 각도를 바꿔서 맞힐 수 있을까요?','You fired at 45° and landed <b>10 m short</b>. Can you hit by changing the angle?'),
    options:[P('아니요. 45°가 이 장약의 최대 사거리라 각도로는 더 멀리 못 가요','No. 45° is this charge’s max range, so no angle sends it farther'),P('네. 46°로 올리면 돼요','Yes. Raise it to 46°'),P('네. 30°로 내리면 돼요','Yes. Lower it to 30°')],answer:0,
    explain:P('45°는 꼭대기라 어느 쪽으로 바꿔도 거리가 <b>줄어요</b>. 더 멀리 보내려면 <b>장약을 올려야</b> 해요.','45° is the top, so changing it either way makes the shot <b>shorter</b>. To go farther you need a <b>bigger charge</b>.'),
    hint:P('사거리 그래프에서 45°보다 높은 점이 있었나요?','Was any point on the range graph higher than 45°?')}}),

  quizStep({ch:CH5,title:P('미분은 조준에도 쓰여요','Derivatives help you aim'),
    intro:()=>'<p>'+tr('미분은 "조금 바꾸면 결과가 <b>얼마나</b> 바뀌나?"를 재는 도구이기도 해요. 진짜 포병도 이걸로 조준을 고쳐요.',
      'A derivative also measures “if I change it a little, <b>how much</b> does the result change?” Real artillery crews correct their aim this way.')+'</p>',
    quiz:{q:P('각도를 <b>2°</b> 올렸더니 탄착점이 <b>30 m</b> 더 멀리 갔어요. 1°당 몇 m 움직일까요?','You raised the angle by <b>2°</b> and the impact moved <b>30 m</b> farther. How many metres per 1°?'),
    options:[P('15 m','15 m'),P('30 m','30 m'),P('60 m','60 m')],answer:0,
    explain:P('30 ÷ 2 = 15. 이 "1°당 15 m"가 <b>변화율</b>, 곧 미분값이에요.','30 ÷ 2 = 15. That “15 m per 1°” is the <b>rate of change</b>, i.e. the derivative.'),
    hint:P('30 m를 2로 나눠 보세요.','Divide 30 m by 2.')}}),
  {ch:CH5,target:()=>[FIELD()],ctrl:true,enter:()=>{if(S.airMode)setMode(false);aimSetup();},waitLabel:P('계산으로 명중시키기','Hit it using the math'),
    gate:s=>s.hit||(s.shots||[]).length>=6,auto:s=>s.hit,on:{land:aimOnLand},title:P('미션: 두 발로 재고, 계산으로 명중','Mission: measure with two shots, hit with math'),
    body:s=>'<p class="small">'+tr(`깃발까지 거리에 맞춰 <b>${chargeName(vel())}</b>, 30°로 맞춰 뒀어요. 장약은 그대로 두고 <b>각도로만</b> 조준해요.`,
      `Set to <b>${chargeName(vel())}</b> and 30° to suit the flag’s distance. Keep the charge and aim <b>with the angle only</b>.`)+'</p>'+
      aimBody(s)+((s.shots||[]).length>=6&&!s.hit?'<p class="small">'+tr('충분히 연습했어요. 다음으로 넘어가도 돼요.','You’ve practised plenty. Feel free to move on.')+'</p>':'')},

  {ch:CH6,target:()=>[FIELD()],ctrl:true,enter:()=>{if(!S.airMode)setMode(true);aimSetup();},on:{land:aimOnLand},title:P('공식이 통하지 않는 세상','When formulas break'),body:s=>tr(`
    <p><b>공기저항 + 바람</b> 모드로 바꿨어요. 공기는 빠를수록 세게 붙잡아서 포물선 공식이 <b>깨져요</b>. 힌트 버튼 숫자도 이제 틀려요.</p>
    <p>그래도 괜찮아요. 게임은 여전히 <b>0.01초씩 쌓아서(적분)</b> 포탄을 날리고, 우리는 <b>변화율(미분)</b>로 조준하면 되니까요. 진짜 사격통제 장치도 이렇게 해요.</p>`,`
    <p>Switched to <b>Air drag + wind</b> mode. Air grips the shell harder the faster it goes, which <b>breaks</b> the parabola formula. The hint numbers are off now, too.</p>
    <p>No problem. The game still flies the shell by <b>stacking 0.01 s pieces (integral)</b>, and we aim with the <b>rate of change (derivative)</b>. Real fire-control computers work the same way.</p>`)+aimBody(s)},

  quizStep({ch:CHE,title:P('마지막 문제','Last question'),quiz:{q:P('자동차 계기판의 <b>주행거리계</b>(지금까지 총 몇 km 달렸나)는 미분일까요, 적분일까요?','Is a car’s <b>odometer</b> (total km driven so far) a derivative or an integral?'),
    options:[P('미분','Derivative'),P('적분','Integral')],answer:1,
    explain:P('매 순간의 속도를 <b>쌓아서</b> 총 거리를 구하니 적분! 반대로 속도계는 미분이에요.','It <b>adds up</b> the speed at every moment to get the total distance, so it’s an integral! The speedometer is the derivative.'),
    hint:P('"지금 이 순간"일까요, "지금까지 모은 것"일까요?','Is it “right now” or “everything so far”?')}}),
  {ch:CHE,title:P('이제 미적분을 아는 포병','Now you’re a gunner who knows calculus'),body:()=>tr(`
    <table><tr><td><span class="o">미분</span></td><td><b>지금 이 순간</b> 얼마나 변하나<br><span class="small">파란 점선의 기울기 · 꼭대기에서 0 · 조준 수정</span></td></tr>
    <tr><td><span class="o">적분</span></td><td>작은 조각을 <b>쌓아서</b> 전체 구하기<br><span class="small">0.01초씩 쌓은 궤적 · 그래프 아래 넓이</span></td></tr></table>
    <p>둘은 <b>서로를 되돌리는 관계</b>예요. 높이를 미분하면 빠르기, 빠르기를 적분하면 높이.</p>
    <p>이제 자유롭게 쏴 보세요. 맨 위 버튼으로 언제든 다시 배울 수 있어요.</p>`,`
    <table><tr><td><span class="o">Derivative</span></td><td>How much it’s changing <b>right now</b><br><span class="small">slope of the blue dashed line · 0 at the top · aim correction</span></td></tr>
    <tr><td><span class="o">Integral</span></td><td><b>Stack up</b> small pieces to get the whole<br><span class="small">path built from 0.01 s pieces · area under the graph</span></td></tr></table>
    <p>They <b>undo each other</b>. Differentiate height to get speed; integrate speed to get height.</p>
    <p>Now fire freely. You can come back to the lessons anytime with the button at the top.</p>`)}
];
