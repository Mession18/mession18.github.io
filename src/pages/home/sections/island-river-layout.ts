export const RIVER_HALF_WIDTH = 1.15

export const riverCenter = (z: number, riverX: number) => riverX + Math.sin((z + 2) * 0.25)

export const clearOfRiver = (x: number, z: number, riverX: number, margin = 0.5) =>
  Math.abs(x - riverCenter(z, riverX)) > RIVER_HALF_WIDTH + margin
