// localStorage는 사생활 보호 창 등에서 예외를 던질 수 있어 항상 감쌈.
// 시리즈 전체가 한 도메인을 쓰므로 키에 "series:" 접두어를 붙여 다른 사이트·에피소드와 겹치지 않게 함
const PREFIX = 'series:';
export function load(key: string): string | null {
  try { return localStorage.getItem(PREFIX + key); } catch { return null; }
}
export function save(key: string, value: string): void {
  try { localStorage.setItem(PREFIX + key, value); } catch { /* 저장 못 해도 동작에는 지장 없음 */ }
}
