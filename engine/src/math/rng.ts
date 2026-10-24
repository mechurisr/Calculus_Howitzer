export type Rng = () => number;

// mulberry32: 32비트 시드 의사난수, [0, 1) 균등. 출처: Tommy Ettinger, https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
// 테스트·재현용. 시드가 없으면 매번 Math.random을 호출 (브라우저 테스트가 Math.random을 고정 시드로 바꿔 끼울 수 있게)
export function createRng(seed?: number): Rng {
  if (seed === undefined) return () => Math.random();
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
