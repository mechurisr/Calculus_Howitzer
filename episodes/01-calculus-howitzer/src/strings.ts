import { P } from '@series/engine/i18n';

// HTML에 고정된 문구 (data-i18n = 내용, data-i18n-aria = aria-label)
export const STRINGS = {
  docTitle:P('미적분 자주포','Calculus Howitzer'),
  title:P('미적분 <span>자주포</span>','Calculus <span>Howitzer</span>'),
  lead:P('장약으로 거리를 대충 정하고, 발사각으로 세밀하게 맞춰 깃발을 맞히세요. 포탄은 매 순간 <b>속도를 적분해 위치</b>를, <b>가속도를 적분해 속도</b>를 구하며 날아갑니다.',
    'Use the charge to set a rough distance, then fine-tune the launch angle to hit the flag. Every moment, the shell <b>integrates velocity to get position</b> and <b>integrates acceleration to get velocity</b>.'),
  tutOpen:P('수학이 무섭다면? 미적분 배우기','Scared of math? Learn calculus here'),
  aField:P('포격 전장','Battlefield'),aPanel:P('사격 통제','Fire control'),aEnv:P('환경','Environment'),
  mVac:P('진공 (식으로 풀림)','Vacuum (formula)'),mAir:P('공기저항 + 바람','Air drag + wind'),
  angL:P('발사각 θ','Launch angle θ'),
  // 45° 주석: 진공·발사점과 착탄점 높이가 같을 때 사거리 최대 (answers.md V3)
  angNote:P('45° · 같은 높이에서 사거리 최대','45° · longest range on level ground'),
  aAngDown:P('각도 줄이기','Lower angle'),aAngUp:P('각도 늘리기','Raise angle'),
  chgL:P('장약 (포구속도 v₀)','Charge (muzzle speed v₀)'),
  fire:P('발사','FIRE'),step05:P('0.5초 진행 ⏭','Step 0.5 s ⏭'),hintBtn:P('계산 힌트','Hint'),newT:P('새 목표','New target'),
  sDistL:P('거리','Distance'),sDhL:P('고저차','Height diff'),sWindL:P('바람','Wind'),sScoreL:P('명중','Hits'),
  eqH:P('지금 돌아가는 계산','The math running right now'),
  eqNote:P('Δt = 0.01초마다 위 두 줄을 반복합니다. 작은 조각을 계속 더하는 것, 이것이 적분(오일러 방법)이에요.',
    'Every Δt = 0.01 s the two lines above repeat. Adding up tiny pieces over and over: that’s integration (Euler’s method).'),
  chartH:P('높이와 그 도함수','Height and its derivative'),aChart:P('높이 y(t)와 세로속도 vy(t) 그래프','Graph of height y(t) and vertical speed vy(t)'),
  chartNote:P('위: 높이 y(t). 아래: 세로속도 vy(t) = dy/dt. vy가 0이 되는 순간이 정점입니다. 미분값이 0인 곳에서 최댓값이 나오는 걸 눈으로 확인해 보세요. 아래 그래프의 색칠된 넓이를 더하면 높이가 얼마나 변했는지가 나와요. 이게 적분입니다.',
    'Top: height y(t). Bottom: vertical speed vy(t) = dy/dt. The moment vy hits 0 is the apex. See for yourself that the maximum is where the derivative is 0. Add up the shaded area in the lower graph and you get how much the height changed. That’s integration.'),
  notesH:P('게임 속 미적분','Calculus in the game'),
  n1:P('<strong>미분</strong> 포탄 옆의 점선은 접선이에요. 기울기 dy/dx = vy ÷ vx로, 궤적이 그 순간 어느 쪽으로 향하는지 알려줍니다.',
    '<strong>Derivative</strong> The dashed line by the shell is the tangent. Its slope dy/dx = vy ÷ vx tells you which way the path is heading at that instant.'),
  n2:P('<strong>적분</strong> 중력 가속도 −g를 시간에 대해 적분하면 vy = v₀sinθ − gt, 한 번 더 적분하면 y = v₀sinθ·t − ½gt². 진공에서는 여기서 사거리 공식 R = v₀²sin2θ / g가 나옵니다.',
    '<strong>Integral</strong> Integrate gravity’s acceleration −g over time and you get vy = v₀sinθ − gt; integrate again and y = v₀sinθ·t − ½gt². In a vacuum this leads to the range formula R = v₀²sin2θ / g.'),
  n3:P('<strong>수치적분</strong> 공기저항은 속도에 따라 힘이 바뀌어 깔끔한 식으로 풀리지 않아요. 그래서 컴퓨터는 아주 작은 Δt로 잘게 쪼개 더합니다. 진짜 사격통제 장치도 같은 원리를 씁니다.',
    '<strong>Numerical integration</strong> Air drag changes with speed, so it can’t be solved with a neat formula. So the computer chops time into tiny Δt steps and adds them up. Real fire-control systems use the same idea.'),
};
