import { lazy, Suspense, useState, useSyncExternalStore } from 'react'

const IslandCat3D = lazy(() =>
  import('./IslandCat3D').then((module) => ({ default: module.IslandCat3D })),
)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const subscribe = (notify: () => void) => {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}

/** 默认轻量陪伴；仅主动开启时下载 3D 模型，减少手机流量和持续渲染。 */
export function IslandCompanion() {
  const reduced = useSyncExternalStore(subscribe, reducedMotion, () => true)
  const [enabled, setEnabled] = useState(false)
  const active = enabled && !reduced
  return (
    <>
      {active && (
        <Suspense fallback={null}>
          <IslandCat3D />
        </Suspense>
      )}
      <button
        className="cat-mode-toggle"
        type="button"
        aria-pressed={active}
        disabled={reduced}
        title={reduced ? '已根据减少动态效果偏好启用轻量模式' : '按需开启或关闭 3D 小猫'}
        onClick={() => setEnabled((value) => !value)}
      >
        {active ? '🐾 切换轻量模式' : reduced ? '🐾 轻量陪伴' : '🐾 唤醒小猫'}
      </button>
    </>
  )
}
