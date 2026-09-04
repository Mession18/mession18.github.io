import { useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { X } from 'lucide-react'
import {
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import * as THREE from 'three'

/** 互动猫模型地址；替换模型时需确认骨骼命名和动画名称仍兼容。 */
const MODEL_URL = '/models/jinzi-rigged.glb?v=1.0.0'

/** 点击猫时随机抽取的对话内容；在数组中增删句子即可。 */
const CAT_LINES = [
  '你来啦！今天也要慢慢生活呀。',
  '刚才我一直在偷偷看你，喵。',
  '要不要先听一首喜欢的歌？',
  '累了就休息一下，我会陪着你的。',
  '风铃岛今天也很漂亮呢！',
  '摸摸头的话，我会很开心哦。',
]

/** 鼠标相对猫头的水平、垂直目标方向，数值限制在 -1 到 1。 */
type LookTarget = { x: number; y: number }
/** 记录猫相对初始位置的屏幕偏移量，供拖动和本地保存使用。 */
type CatPosition = { x: number; y: number }

/** 保存可跟随鼠标的骨骼及初始姿态，防止逐帧旋转累积。 */
type TrackedBone = {
  bone: THREE.Bone
  rest: THREE.Quaternion
  weight: number
}

/** 加载场景和动画，识别头部骨骼，并逐帧平滑转向鼠标。 */
function CatModel({ look }: { look: MutableRefObject<LookTarget> }) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions } = useAnimations(animations, scene)
  /** 遍历模型寻找头部相关骨骼并记录初始姿态，供逐帧旋转时恢复基准。 */
  const trackedBones = useMemo<TrackedBone[]>(() => {
    const weights: Record<string, number> = {
      CC_Base_NeckTwist01: 0.18,
      CC_Base_NeckTwist02: 0.3,
      CC_Base_Head: 0.52,
    }

    const bones: TrackedBone[] = []
    scene.traverse((object) => {
      object.frustumCulled = false
      if (object instanceof THREE.Bone && weights[object.name]) {
        bones.push({ bone: object, rest: object.quaternion.clone(), weight: weights[object.name] })
      }
    })
    return bones
  }, [scene])

  // 播放模型待机动画，组件退出时淡出并停止。
  useEffect(() => {
    const idle = actions['Idle_贴身手臂_耳尾轻动'] ?? Object.values(actions)[0]
    if (!idle) return

    idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play()
    return () => {
      idle.fadeOut(0.2)
      idle.stop()
    }
  }, [actions])

  /** 复用四元数和欧拉角对象，避免动画每帧创建新对象。 */
  const offset = useMemo(() => new THREE.Quaternion(), [])
  const target = useMemo(() => new THREE.Quaternion(), [])
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

  // 每帧按时间差平滑转动骨骼，帧率变化时仍保持近似相同的跟随速度。
  useFrame((_, delta) => {
    const smoothing = 1 - Math.exp(-delta * 8.5)
    const yaw = THREE.MathUtils.clamp(look.current.x, -1, 1) * 0.42
    const pitch = THREE.MathUtils.clamp(look.current.y, -1, 1) * -0.24

    trackedBones.forEach(({ bone, rest, weight }) => {
      euler.set(pitch * weight, yaw * weight, 0)
      offset.setFromEuler(euler)
      target.copy(rest).multiply(offset)
      bone.quaternion.slerp(target, smoothing)
    })
  })

  return <primitive object={scene} scale={1.38} position={[0, -0.78, 0]} />
}

/** 模型尚未加载完成时显示的轻量占位内容。 */
function CatLoading() {
  return (
    <div className="island-cat-3d-loading" aria-hidden="true">
      <span />
    </div>
  )
}

/** 全站互动猫入口：按需加载 3D 模型，处理拖动、对话、隐藏和位置记忆。 */
export function IslandCat3D() {
  /** 保存猫容器、注视方向和计时器引用；高频指针更新不触发整页重绘。 */
  const container = useRef<HTMLElement>(null)
  const look = useRef<LookTarget>({ x: 0, y: 0 })
  const speechTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const lastLine = useRef(-1)
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    origin: CatPosition
    rect: DOMRect
    moved: boolean
  } | null>(null)
  const [speech, setSpeech] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  /** 从本地保存坐标恢复猫的位置，记录无法解析时回到初始位置。 */
  const [position, setPosition] = useState<CatPosition>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jinzi-screen-position') ?? '{}')
      return typeof saved.x === 'number' && typeof saved.y === 'number' ? saved : { x: 0, y: 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  })

  /** 用短音色序列模拟猫说话，按文本长度安排音符并释放音频资源。 */
  const playAnimalese = useCallback((line: string) => {
    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const gain = context.createGain()
    gain.gain.value = 0.045
    gain.connect(context.destination)

    Array.from(line.replace(/[，。！？、s]/g, ''))
      .slice(0, 13)
      .forEach((character, index) => {
        /** 把开始和结束日期拆成台历需要的年份与月日；没有完工日期则不显示完工台历。 */
        const start = context.currentTime + index * 0.055
        const oscillator = context.createOscillator()
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(410 + (character.charCodeAt(0) % 9) * 32, start)
        oscillator.frequency.exponentialRampToValueAtTime(
          520 + (character.charCodeAt(0) % 7) * 26,
          start + 0.04,
        )
        oscillator.connect(gain)
        oscillator.start(start)
        oscillator.stop(start + 0.045)
      })

    window.setTimeout(() => void context.close(), 1100)
  }, [])

  /** 抽取一条不连续重复的猫台词，播放声音并设置自动消失时间。 */
  const talk = useCallback(() => {
    let next = Math.floor(Math.random() * CAT_LINES.length)
    if (next === lastLine.current) next = (next + 1) % CAT_LINES.length
    lastLine.current = next
    const line = CAT_LINES[next]
    setSpeech(line)
    playAnimalese(line)

    if (speechTimer.current) window.clearTimeout(speechTimer.current)
    speechTimer.current = window.setTimeout(() => setSpeech(null), 4200)
  }, [playAnimalese])

  /** 记录指针起点与猫的位置，捕获指针以便拖出按钮范围仍可继续移动。 */
  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = container.current?.getBoundingClientRect()
    if (!rect) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      rect,
      moved: false,
    }
  }

  /** 把拖动位移限制在视口范围内，并区分点击与拖动。 */
  const moveCat = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    const deltaX = event.clientX - active.startX
    const deltaY = event.clientY - active.startY
    if (Math.hypot(deltaX, deltaY) > 5) active.moved = true

    const left = THREE.MathUtils.clamp(
      active.rect.left + deltaX,
      6,
      Math.max(6, window.innerWidth - active.rect.width - 6),
    )
    const top = THREE.MathUtils.clamp(
      active.rect.top + deltaY,
      6,
      Math.max(6, window.innerHeight - active.rect.height - 6),
    )
    setPosition({
      x: active.origin.x + left - active.rect.left,
      y: active.origin.y + top - active.rect.top,
    })
  }

  /** 释放指针；真正拖动后保存坐标，单击则触发对话。 */
  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    if (active.moved) {
      setPosition((current) => {
        localStorage.setItem('jinzi-screen-position', JSON.stringify(current))
        return current
      })
    } else {
      talk()
    }
  }

  // 监听鼠标位置更新注视方向，离开窗口恢复正视；卸载时移除监听和对话计时器。
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = container.current?.getBoundingClientRect()
      if (!bounds) return

      const headX = bounds.left + bounds.width * 0.5
      const headY = bounds.top + bounds.height * 0.28
      look.current.x = THREE.MathUtils.clamp(
        (event.clientX - headX) / Math.max(window.innerWidth * 0.42, 1),
        -1,
        1,
      )
      look.current.y = THREE.MathUtils.clamp(
        (headY - event.clientY) / Math.max(window.innerHeight * 0.42, 1),
        -1,
        1,
      )
    }

    const resetLook = () => {
      look.current.x = 0
      look.current.y = 0
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', resetLook)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.documentElement.removeEventListener('mouseleave', resetLook)
      if (speechTimer.current) window.clearTimeout(speechTimer.current)
    }
  }, [])

  if (hidden) {
    return (
      <button
        className="cat-return"
        type="button"
        aria-label="叫金子回来"
        title="叫金子回来"
        onClick={() => setHidden(false)}
      >
        <span aria-hidden="true">🐾</span>
      </button>
    )
  }

  return (
    <aside
      ref={container}
      className="island-cat island-cat-3d"
      aria-label="跟随鼠标看向你的金子"
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      <Suspense fallback={<CatLoading />}>
        <Canvas
          orthographic
          dpr={[1, 1.6]}
          camera={{ position: [0, 0, 5], zoom: 128, near: 0.1, far: 100 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={1.7} />
          <directionalLight position={[-3, 4, 5]} intensity={2.8} />
          <directionalLight position={[3, 1, 4]} intensity={1.2} />
          <Suspense fallback={null}>
            <CatModel look={look} />
          </Suspense>
        </Canvas>
      </Suspense>
      {/* 透明交互按钮覆盖猫模型，统一处理点击说话和指针拖动。 */}
      <button
        className="cat-model-hit-area"
        type="button"
        aria-label="点击和金子说话，拖动可以移动金子"
        onPointerDown={beginDrag}
        onPointerMove={moveCat}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          drag.current = null
        }}
      />
      {/* 临时隐藏猫的按钮，阻止拖动事件冒泡。 */}
      <button
        className="cat-close"
        type="button"
        aria-label="隐藏金子"
        title="暂时隐藏金子"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          setSpeech(null)
          setHidden(true)
        }}
      >
        <X size={14} />
      </button>
      {speech && (
        <div className="cat-dialog cat-model-dialog" role="status" aria-live="polite">
          {speech}
        </div>
      )}
    </aside>
  )
}

/** 提前请求猫模型，让互动区域挂载时尽量复用已缓存的资源。 */
useGLTF.preload(MODEL_URL)
