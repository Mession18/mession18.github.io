import { riverCenter } from './island-river-layout'

export const COTTAGE_YAW = -0.18
export const groundHeight = (x: number, z: number) => -0.002 * x * x - 0.004 * z * z

/** 起点是小屋最外一级台阶；起始切线与旋转后的门朝向相同。 */
export function gardenPath(t: number, houseX: number) {
  const distance = 2.35 + t * 16
  return {
    x: houseX + Math.sin(COTTAGE_YAW) * distance + Math.sin(t * Math.PI) ** 2 * 1.1 + t * t * 1.4,
    z: Math.cos(COTTAGE_YAW) * distance,
    halfWidth: 0.72 + t * 0.55,
  }
}

export function pathAtZ(z: number, houseX: number) {
  return gardenPath(Math.max(0, Math.min(1, (z / Math.cos(COTTAGE_YAW) - 2.35) / 16)), houseX)
}

/** 桥与两岸道路共用端点，桥面高度包含厚木板的上表面。 */
export function bridgeLayout(riverX: number) {
  const z = 3.8,
    halfLength = 1.85
  const x = riverCenter(z, riverX)
  const y = Math.max(groundHeight(x - halfLength, z), groundHeight(x + halfLength, z)) + 0.035
  return { x, y, z, halfLength, deckY: y + 0.1 }
}

export type PathPoint = { x: number; y: number; z: number; halfWidth: number }

/** 一条接门前主路，一条向左岸延伸；桥口切线水平，靠岸的一段顺着桥面缓坡落地。 */
export function connectingPaths(houseX: number, riverX: number): PathPoint[][] {
  const bridge = bridgeLayout(riverX)
  const join = pathAtZ(bridge.z + 1, houseX)
  return [1, -1].map((side) => {
    const start = { x: bridge.x + side * (bridge.halfLength + 0.025), z: bridge.z }
    const handle = Math.min(0.75, Math.max(0.1, (join.x - start.x) * 0.4))
    const controls =
      side === 1
        ? [start, { x: start.x + handle, z: start.z }, { x: join.x - handle, z: join.z }, join]
        : [
            start,
            { x: start.x - 1.5, z: start.z },
            { x: start.x - 6.5, z: 6.3 },
            { x: start.x - 8.5, z: 14 },
          ]
    const lift = bridge.deckY - groundHeight(start.x, start.z) - 0.038
    const end = controls[3]
    const rampLength = Math.min(1.6, Math.hypot(end.x - start.x, end.z - start.z))
    return Array.from({ length: 41 }, (_, i) => {
      const t = i / 40,
        s = 1 - t
      const weights = [s ** 3, 3 * s * s * t, 3 * s * t * t, t ** 3]
      const x = controls.reduce((value, p, j) => value + p.x * weights[j], 0)
      const z = controls.reduce((value, p, j) => value + p.z * weights[j], 0)
      const ramp = Math.min(1, Math.hypot(x - start.x, z - start.z) / rampLength)
      return {
        x,
        z,
        y: groundHeight(x, z) + 0.038 + lift * (1 - ramp * ramp * (3 - 2 * ramp)),
        halfWidth: 0.67,
      }
    })
  })
}

export function pathEdge(path: PathPoint[], index: number, side: number, margin = 0) {
  const point = path[index]
  const a = path[Math.max(0, index - 1)],
    b = path[Math.min(path.length - 1, index + 1)]
  const length = Math.hypot(b.x - a.x, b.z - a.z)
  const offset = side * (point.halfWidth + margin)
  return {
    x: point.x - ((b.z - a.z) / length) * offset,
    z: point.z + ((b.x - a.x) / length) * offset,
  }
}

/** 供花、灯、石沿与草共用，交叉路口不再长出挡路装饰。 */
export function onConnectingPath(x: number, z: number, paths: PathPoint[][], margin = 0) {
  return paths.some((path) =>
    path.slice(1).some((b, i) => {
      const a = path[i],
        dx = b.x - a.x,
        dz = b.z - a.z
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)))
      return Math.hypot(x - a.x - t * dx, z - a.z - t * dz) < b.halfWidth + margin
    }),
  )
}
