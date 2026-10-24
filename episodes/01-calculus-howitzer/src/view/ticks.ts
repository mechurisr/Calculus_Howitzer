// 발사각 슬라이더 아래 눈금 3줄: ① 눈금 ② 숫자(10~80) ③ 45° 주석 (kitty-specs/howitzer-angle-ticks-01M5Q3M8)
// 가로 위치는 CSS 가 계산: left = calc(var(--thumb)/2 + var(--f) * (100% − var(--thumb))) — answers.md V1.
// 여기서는 각 요소에 비율 --f 만 넣는다 (창 크기가 바뀌어도 브라우저가 다시 계산)
import { load, save } from '@series/engine/ui';
import { ANGLE_NOTE_SEEN_KEY, EMPHASIS_ANGLE, angleFraction, angleNoteVisible, tickMarks } from '../model/ticks';

let note: HTMLElement | null = null;

function el(cls: string, f: number, text?: string) {
  const e = document.createElement('span');
  e.className = cls; e.style.setProperty('--f', String(f));
  if (text) e.textContent = text;
  return e;
}

// applyLang() 보다 먼저 호출할 것 — 주석의 data-i18n 문구를 applyLang 이 채움
export function renderTicks(root: HTMLElement) {
  const marks = tickMarks();
  const row = (cls: string) => { const r = document.createElement('div'); r.className = cls; root.append(r); return r; };
  const ticks = row('tick-row'), labels = row('tick-labels'), notes = row('tick-notes');
  marks.forEach(t => ticks.append(el(`tick tick-${t.kind}`, t.f)));
  marks.filter(t => t.label).forEach(t => labels.append(el('tick-label', t.f, t.label!)));
  note = el('tick-note', angleFraction(EMPHASIS_ANGLE));
  note.dataset.i18n = 'angNote';
  notes.append(note);
}

// 주석 표시: 튜토리얼 4장 해당 단계를 봤거나 튜토리얼을 끝냈/건너뛰었으면 보임 (FR-006)
export function refreshAngleNote() {
  if (note) note.hidden = !angleNoteVisible({ seen: load(ANGLE_NOTE_SEEN_KEY) === '1', tutDone: load('howitzer:tutDone') === '1' });
}

// 튜토리얼 4장 "45°는 사거리 그래프의 꼭대기" 단계에 들어가면 호출 (missions.ts)
export function markAngleNoteSeen() { save(ANGLE_NOTE_SEEN_KEY, '1'); refreshAngleNote(); }
