import assert from 'node:assert/strict'
import { loadModule } from './load-module.mjs'

const { bridgeLayout, connectingPaths, pathAtZ, pathEdge, onConnectingPath } = await loadModule(
  '/src/pages/home/sections/island-layout.ts',
)
const { riverCenter, RIVER_HALF_WIDTH } = await loadModule(
  '/src/pages/home/sections/island-river-layout.ts',
)
for (const [houseX, gap] of [
  [0.8, 4.4],
  [4.5, 7.3],
  [7.5, 7.3],
]) {
  const riverX = houseX - gap
  const bridge = bridgeLayout(riverX)
  const routes = connectingPaths(houseX, riverX)
  for (const [index, route] of routes.entries()) {
    const side = index === 0 ? 1 : -1
    assert.equal(route[0].z, bridge.z)
    assert.equal(route[0].x, bridge.x + side * (bridge.halfLength + 0.025))
    assert(Math.abs(route[0].y - bridge.deckY) < 1e-10, '道路入口与桥板上表面相接')
    for (let i = 0; i < route.length; i++) {
      const point = route[i]
      assert(Object.values(point).every(Number.isFinite))
      assert(onConnectingPath(point.x, point.z, routes))
      if (i > 0) {
        const previous = route[i - 1]
        assert((point.x - previous.x) * side > 0, '窄屏连接路不回折')
        assert(
          Math.abs(point.y - previous.y) / Math.hypot(point.x - previous.x, point.z - previous.z) <
            0.35,
          '桥头缓坡不能变成陡坎',
        )
      }
      for (const edge of [-1, 1]) {
        const p = pathEdge(route, i, edge)
        assert(Math.abs(p.x - riverCenter(p.z, riverX)) > RIVER_HALF_WIDTH, '路面不得伸进河水')
      }
    }
  }
  const join = routes[0].at(-1)
  const main = pathAtZ(join.z, houseX)
  assert.equal(join.x, main.x, '右岸支路接入门前主路中线')
  assert(onConnectingPath(join.x - 0.2, join.z, routes, 0.15), '交叉口预留花草/灯的避让空间')
  assert(routes[1].at(-1).x < routes[1][0].x - 8, '左岸小路继续向岛内延伸')
}
console.log('通过：两岸道路与桥面连接、窄屏曲线不回折、不占河面、路口装饰避让。')
