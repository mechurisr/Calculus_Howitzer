import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import './style.css';
import { P, applyLang, bindLangButton, defineStrings, getLang, onApply, tr } from '@series/engine/i18n';
import { byId as $ } from '@series/engine/ui';

interface Episode {
  id: string; number: number; slug: string; status: 'published' | 'draft';
  title: { ko: string; en: string }; role: { ko: string; en: string }; summary: { ko: string; en: string };
  concepts: string[]; difficulty: number;
}
// 각 에피소드의 episode.json을 빌드 때 모아 목록을 만듦. 공개(published)만, 번호순
const all = import.meta.glob<Episode>('../../episodes/*/episode.json', { eager: true, import: 'default' });
const episodes = Object.values(all).filter(e => e.status === 'published').sort((a, b) => a.number - b.number);

defineStrings({
  docTitle: P('수학 역할 시뮬레이션', 'Math Role Simulations'),
  title: P('수학 <span>역할</span> 시뮬레이션', 'Math <span>Role</span> Simulations'),
  lead: P('직접 역할을 맡아 수학 이론을 조작하며 배우는 웹 시뮬레이션 시리즈입니다.', 'A series of web simulations where you take on a role and learn math by working it with your own hands.'),
});
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
onApply(() => {
  const l = getLang();
  $('eps').innerHTML = episodes.map(e => `<li><a class="ep" href="/episodes/${e.slug}/">
    <span class="ep-no">${tr('에피소드', 'Episode')} ${String(e.number).padStart(2, '0')} · ${tr('난이도', 'Difficulty')} ${'●'.repeat(e.difficulty)}${'○'.repeat(5 - e.difficulty)}</span>
    <h2>${esc(e.title[l])}</h2><span class="ep-role">${esc(e.role[l])}</span><p>${esc(e.summary[l])}</p>
    <span class="tags">${e.concepts.map(c => `<span>${esc(c)}</span>`).join('')}</span></a></li>`).join('');
});
bindLangButton($('langBtn'));
applyLang();
