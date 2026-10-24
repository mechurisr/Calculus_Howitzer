import { load, save } from '../ui/storage';

export type Lang = 'ko' | 'en';
export type Text = { ko: string; en: string } | string | (() => string);

// 시리즈 전체가 언어 설정을 공유 (한 에피소드에서 English로 바꾸면 다른 에피소드도 English)
const KEY = 'lang';
let lang: Lang = load(KEY) === 'en' ? 'en' : 'ko';
const applyHooks: (() => void)[] = [], changeHooks: (() => void)[] = [];
let dict: Record<string, Text> = {};

// tr(ko, en): 지금 언어의 문자열. 동적으로 만드는 문자열은 모두 이걸로 감싸 그릴 때마다 다시 고름
export const tr = (ko: string, en: string) => lang === 'en' ? en : ko;
// P(ko, en): 나중에 tx()로 꺼낼 문자열 쌍 (튜토리얼 정의처럼 미리 만들어 두는 값용)
export const P = (ko: string, en: string) => ({ ko, en });
export const tx = (v: Text | undefined): string =>
  typeof v === 'function' ? v() : v && typeof v === 'object' ? v[lang] : v ?? '';
export const getLang = () => lang;

// 엔진 공통 문구. 에피소드 사전과 합쳐서 씀
const COMMON: Record<string, Text> = { skip: P('건너뛰기', 'Skip'), prev: P('이전', 'Back') };

// HTML에 고정된 문구 사전 등록. data-i18n = 내용(innerHTML), data-i18n-aria = aria-label, docTitle = <title>
export function defineStrings(d: Record<string, Text>) { dict = { ...COMMON, ...d }; }
export const onApply = (f: () => void) => applyHooks.push(f);
export const onLangChange = (f: () => void) => changeHooks.push(f);

export function applyLang() {
  document.documentElement.lang = lang;
  if (dict.docTitle) document.title = tx(dict.docTitle);
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => el.innerHTML = tx(dict[el.dataset.i18n!]));
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', tx(dict[el.dataset.i18nAria!])));
  applyHooks.forEach(f => f());
  // 언어 버튼은 "바꿀 언어"를 보여 줌
  document.querySelectorAll<HTMLElement>('.lang-btn').forEach(b => {
    b.textContent = tr('English', '한국어'); b.setAttribute('aria-label', tr('Switch to English', '한국어로 보기'));
  });
}
export function setLang(l: Lang) { lang = l; save(KEY, l); applyLang(); changeHooks.forEach(f => f()); }
export function bindLangButton(b: HTMLElement) { b.addEventListener('click', () => setLang(lang === 'ko' ? 'en' : 'ko')); }
