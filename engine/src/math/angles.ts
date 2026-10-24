// 도(°) ↔ 라디안. 1° = π/180 rad (정의)
// 곱하고 나누는 순서는 기존 박격포 코드(deg*Math.PI/180)와 같게 유지해 부동소수점 결과가 비트 단위로 같음
export const toRad = (deg: number) => deg * Math.PI / 180;
export const toDeg = (rad: number) => rad * 180 / Math.PI;
