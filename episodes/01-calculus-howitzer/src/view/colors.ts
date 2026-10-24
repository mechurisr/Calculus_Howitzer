import { readCssVars, THEME_KEYS, type ThemeColors } from '@series/engine/ui';

// 캔버스·SVG가 쓰는 현재 테마 색. 테마가 바뀌면 refreshColors()로 다시 읽음
export const C = {} as ThemeColors;
export const refreshColors = () => { Object.assign(C, readCssVars(THEME_KEYS)); };
