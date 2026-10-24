// (i) 버튼 + 해설 팝업. 가로 스크롤이 있는 상자 안에서도 잘리지 않게 position:fixed로 아이콘 옆에 띄움
export function infoTip(ariaLabel: string, html: string): string {
  return `<span class="info-wrap"><button class="info" type="button" aria-label="${ariaLabel}" aria-expanded="false">i</button>` +
    `<span class="tip" role="tooltip" hidden>${html}</span></span>`;
}
function tipShow(w: Element) {
  const b = w.querySelector<HTMLElement>('.info')!, t = w.querySelector<HTMLElement>('.tip')!;
  t.hidden = false; b.setAttribute('aria-expanded', 'true');
  // 화면 밖으로 나가지 않게: 가로는 화면 안으로 맞추고, 아래 공간이 모자라면 아이콘 위에 띄움
  const r = b.getBoundingClientRect(), wd = Math.min(340, innerWidth - 16); t.style.width = wd + 'px';
  t.style.left = Math.min(Math.max(8, r.left + r.width / 2 - wd / 2), innerWidth - wd - 8) + 'px';
  const ht = t.offsetHeight; t.style.top = (r.bottom + 8 + ht > innerHeight && r.top - 8 - ht > 0 ? r.top - 8 - ht : r.bottom + 8) + 'px';
}
function tipHide(w: Element) {
  w.querySelector<HTMLElement>('.tip')!.hidden = true; w.querySelector('.info')!.setAttribute('aria-expanded', 'false');
}
// container 안의 infoTip들을 마우스·키보드·터치로 열고 닫게 함
export function bindInfoTips(container: HTMLElement): void {
  const wrapOf = (e: Event) => (e.target as Element).closest('.info-wrap');
  const hideAll = () => document.querySelectorAll('.info-wrap').forEach(tipHide);
  container.addEventListener('mouseover', e => { const w = wrapOf(e); if (w) tipShow(w); });
  container.addEventListener('mouseout', e => { const w = wrapOf(e); if (w && !w.contains(e.relatedTarget as Node) && !w.contains(document.activeElement)) tipHide(w); });
  container.addEventListener('focusin', e => { const w = wrapOf(e); if (w) tipShow(w); });
  container.addEventListener('focusout', e => { const w = wrapOf(e); if (w && !w.contains(e.relatedTarget as Node)) tipHide(w); });
  // 터치 기기: 탭하면 열리고(포커스), 다른 곳을 탭하면 닫힘(포커스 해제)
  container.addEventListener('click', e => { const w = wrapOf(e); if (w) { (e.target as Element).closest<HTMLElement>('.info')?.focus(); tipShow(w); } });
  window.addEventListener('scroll', hideAll, { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideAll(); });
}
