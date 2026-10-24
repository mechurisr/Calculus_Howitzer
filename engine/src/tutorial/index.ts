import { P, tr, tx, type Text } from '../i18n';
import { load, save } from '../ui/storage';

// 단계 속성: ch 장 이름, target 강조할 요소, dim 나머지 어둡게, ctrl 카드 안에 에피소드 조작 버튼 표시,
// body(st) 내용, gate(st) 다음으로 넘어갈 조건, auto(st) 참이면 자동 진행, waitLabel 대기 중 버튼 문구,
// on.{이벤트}(st,data) 게임 이벤트 처리, enter/exit 단계 진입·이탈 시 실행.
// st는 단계마다 새로 만들어지는 상태 객체. 에피소드가 쓰는 다른 속성(예: lockResume)도 자유롭게 붙일 수 있음
export type StepState = Record<string, any>;
export interface TutStep {
  ch?: Text; title: Text;
  body: (s: StepState) => string;
  target?: () => (Element | null | undefined)[];
  dim?: boolean; ctrl?: boolean;
  gate?: (s: StepState) => boolean;
  auto?: (s: StepState) => boolean;
  waitLabel?: Text;
  on?: Record<string, (s: StepState, data?: any) => void>;
  enter?: (s: StepState) => void;
  exit?: (s: StepState) => void;
  [extra: string]: unknown;
}

export interface Quiz { q: Text; options: Text[]; answer: number; explain: Text; hint: Text }
// 객관식 확인 문제 단계. 맞혀야 다음으로 넘어감
export function quizStep(o: Partial<TutStep> & { title: Text; quiz: Quiz; intro?: (s: StepState) => string }): TutStep {
  const q = o.quiz;
  return { ...o, waitLabel: P('정답을 골라 보세요', 'Pick an answer'), gate: s => s.ok,
    on: { quiz: (s, i) => { s.picked = i; s.ok = i === q.answer; } },
    body: s => (o.intro ? o.intro(s) : '') + `<p><b>Q. ${tx(q.q)}</b></p><div class="quiz">` +
      q.options.map((t, i) => `<button data-q="${i}" class="${s.picked === i ? (s.ok ? 'right' : 'wrong') : ''}">${tx(t)}</button>`).join('') + '</div>' +
      (s.picked == null ? '' : s.ok ? `<p class="fb good">${tr('⭕ 정답!', '⭕ Correct!')} ${tx(q.explain)}</p>` : `<p class="fb bad">${tr('❌ 아쉬워요.', '❌ Not quite.')} ${tx(q.hint)}</p>`) };
}

export interface TutorialOptions {
  steps: TutStep[];
  episode: string;              // 완료 기록 저장 키에 씀
  ctrl?: HTMLElement | null;    // ctrl:true 단계에서 카드 안에 보일 에피소드 조작 버튼 묶음
  openButton?: HTMLElement | null;
  onRender?: () => void;        // 카드를 다시 그릴 때마다 (예: 카드 안 버튼 활성 상태 갱신)
  onAction?: (el: HTMLElement) => void;  // 카드 본문의 [data-act] 버튼
  onEnd?: () => void;           // 튜토리얼을 끝내거나 건너뛴 뒤 (완료 기록 저장 후)
}
export interface Tutorial {
  readonly index: number;       // 진행 중인 단계, 없으면 -1
  current(): { step: TutStep; state: StepState } | null;
  start(): void; end(): void;
  render(scroll?: boolean): void;
  emit(type: string, data?: unknown): void;  // 게임 이벤트를 현재 단계에 전달
  autoStart(): void;            // 처음 방문이면 시작
}

// 코치마크 카드: 화면 아래 고정, 강조할 요소만 어두운 막 위로 올림
export function createTutorial(o: TutorialOptions): Tutorial {
  const TUT = o.steps, doneKey = o.episode + ':tutDone';
  const el = (tag: string, cls?: string, id?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (id) e.id = id; return e; };
  const dim = el('div', 'tut-dim', 'tutDim'); dim.hidden = true;
  const card = el('div', 'tut', 'tut'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-labelledby', 'tutTitle');
  const stepEl = el('div', 'tut-step', 'tutStep'), titleEl = el('h3', undefined, 'tutTitle'), body = el('div', 'tut-body', 'tutBody');
  const nav = el('div', 'tut-nav'), skip = el('button', 'skip', 'tutSkip'), prev = el('button', undefined, 'tutPrev'), next = el('button', 'next', 'tutNext') as HTMLButtonElement;
  skip.dataset.i18n = 'skip'; prev.dataset.i18n = 'prev'; nav.append(skip, prev, next);
  card.append(stepEl, titleEl, body); if (o.ctrl) card.append(o.ctrl); card.append(nav);
  document.body.append(dim, card);

  let ti = -1, st: StepState = {}, hl: Element[] = [], timer: ReturnType<typeof setTimeout> | undefined;
  function clearHl() { hl.forEach(e => e.classList.remove('tut-hl', 'dim')); hl = []; }
  function render(scroll?: boolean) {
    const s = TUT[ti]; clearHl();
    stepEl.textContent = tx(s.ch) + ' · ' + (ti + 1) + ' / ' + TUT.length;
    titleEl.textContent = tx(s.title); body.innerHTML = s.body(st);
    if (o.ctrl) o.ctrl.hidden = !s.ctrl;
    o.onRender?.();
    const els = s.target ? s.target().filter((e): e is Element => !!e) : [];
    els.forEach(e => e.classList.add('tut-hl')); if (s.dim && els[0]) els[0].classList.add('dim'); hl = els;
    dim.hidden = els.length > 0;
    (prev as HTMLButtonElement).disabled = ti === 0;
    const waiting = !!s.gate && !s.gate(st);
    next.disabled = waiting;
    next.textContent = waiting ? (tx(s.waitLabel) || tr('진행해 보세요', 'Do the task')) : ti === TUT.length - 1 ? tr('끝내기', 'Finish') : tr('다음', 'Next');
    if (scroll === false) return;
    if (els[0]) els[0].scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0 });
  }
  function exit() { clearTimeout(timer); if (ti >= 0) TUT[ti].exit?.(st); }
  function go(i: number) { exit(); ti = i; st = {}; TUT[ti].enter?.(st); render(); card.scrollTop = 0; }
  function start() { document.body.classList.add('tut-open'); card.hidden = false; go(0); next.focus(); }
  function end() { exit(); clearHl(); ti = -1; card.hidden = true; dim.hidden = true; document.body.classList.remove('tut-open'); save(doneKey, '1'); o.onEnd?.(); }
  // 게임 이벤트를 현재 단계에 전달하고 카드 갱신 (스크롤은 하지 않음)
  function emit(type: string, data?: unknown) {
    if (ti < 0) return; const s = TUT[ti], h = s.on?.[type]; if (!h) return;
    h(st, data); render(false);
    if (s.auto && s.auto(st) && !st.adv) { st.adv = true; timer = setTimeout(() => go(ti + 1), 1500); }
  }
  body.addEventListener('click', e => {
    const t = e.target as Element, q = t.closest<HTMLElement>('[data-q]'); if (q) { emit('quiz', +q.dataset.q!); return; }
    const a = t.closest<HTMLElement>('[data-act]'); if (!a) return;
    o.onAction?.(a); render(false);
  });
  if (o.openButton) o.openButton.onclick = start;
  skip.onclick = end;
  prev.onclick = () => { if (ti > 0) go(ti - 1); };
  next.onclick = () => { if (ti >= TUT.length - 1) end(); else go(ti + 1); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ti >= 0) end(); });
  return {
    get index() { return ti; },
    current: () => ti >= 0 ? { step: TUT[ti], state: st } : null,
    start, end, render, emit,
    autoStart() { if (!load(doneKey)) start(); },
  };
}
