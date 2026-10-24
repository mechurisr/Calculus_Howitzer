import { describe, expect, it } from 'vitest';
import { G, apexTime, heightAt } from '../src/model/motion';

describe('연직 투사', () => {
  it('출발 시각 높이는 0', () => expect(heightAt(20, 0)).toBe(0));
  it('최고점에서 높이 = v₀²/2g', () => expect(heightAt(20, apexTime(20))).toBeCloseTo(400 / (2 * G), 12));
  it('2t* 에 다시 0', () => expect(heightAt(20, 2 * apexTime(20))).toBeCloseTo(0, 12));
});
