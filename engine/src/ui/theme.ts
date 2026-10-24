// 캔버스는 CSS 변수를 직접 못 쓰므로 --이름 값을 읽어 와 색 문자열로 씀
export function readCssVars<K extends string>(keys: readonly K[]): Record<K, string> {
  const s = getComputedStyle(document.documentElement), out = {} as Record<K, string>;
  keys.forEach(k => out[k] = s.getPropertyValue('--' + k).trim());
  return out;
}
// 시스템 다크 모드 전환과 <html data-theme> 변경을 모두 감지
export function onThemeChange(cb: () => void): void {
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', cb); } catch { /* 구형 브라우저 */ }
  new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
export const THEME_KEYS = ['bg', 'panel', 'ink', 'muted', 'line', 'accent', 'blue', 'ground', 'ground2', 'sky', 'good', 'bad'] as const;
export type ThemeColors = Record<typeof THEME_KEYS[number], string>;
