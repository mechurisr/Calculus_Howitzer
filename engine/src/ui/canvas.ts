export interface CanvasSize { w: number; h: number; d: number }
// 고해상도 화면에서 흐려지지 않게 캔버스 픽셀 수를 CSS 크기 × devicePixelRatio로 맞춤.
// 그릴 때는 ctx.setTransform(d,0,0,d,0,0) 뒤 CSS 픽셀 단위로 그림
export function fitCanvas(cv: HTMLCanvasElement): CanvasSize {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  return { w: r.width, h: r.height, d };
}
