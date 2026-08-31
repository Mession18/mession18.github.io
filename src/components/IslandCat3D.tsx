import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react'
import { X } from 'lucide-react'
import * as THREE from 'three'

const MODEL_URL = '/models/jinzi-rigged.glb'

const CAT_LINES = [
  '你来啦！今天也要慢慢生活呀。',
  '刚才我一直在偷偷看你，喵。',
  '要不要先听一首喜欢的歌？',
  '累了就休息一下，我会陪着你的。',
  '风铃岛今天也很漂亮呢！',
  '摸摸头的话，我会很开心哦。',
]

type LookTarget = { x: number; y: number }
type CatPosition = { x: number; y: number }

type TrackedBone = {
  bone: THREE.Bone
  rest: THREE.Quaternion
  weight: number
}

function CatModel({ look }: { look: MutableRefObject<LookTarget> }) {
  const { scene } = useGLTF(MODEL_URL)
  const trackedBones = useMemo<TrackedBone[]>(() => {
    const weights: Record<string, number> = {
      CC_Base_NeckTwist01: 0.18,
      CC_Base_NeckTwist02: 0.3,
      CC_Base_Head: 0.52,
    }

    const bones: TrackedBone[] = []
    const standingPose: Record<string, [number, number, number]> = {
      CC_Base_L_Upperarm: [0, 0, -1.02],
      CC_Base_R_Upperarm: [0, 0, 1.02],
      CC_Base_L_Forearm: [0, 0, -0.12],
      CC_Base_R_Forearm: [0, 0, 0.12],
    }
    scene.traverse((object) => {
      object.frustumCulled = false
      if (
        !scene.userData.webStandingPoseApplied &&
        object instanceof THREE.Bone &&
        standingPose[object.name]
      ) {
        const [x, y, z] = standingPose[object.name]
        object.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)))
      }
      if (object instanceof THREE.Bone && weights[object.name]) {
        bones.push({ bone: object, rest: object.quaternion.clone(), weight: weights[object.name] })
      }
    })
    scene.userData.webStandingPoseApplied = true
    return bones
  }, [scene])

  const offset = useMemo(() => new THREE.Quaternion(), [])
  const target = useMemo(() => new THREE.Quaternion(), [])
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), [])

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

function CatLoading() {
  return (
    <div className="island-cat-3d-loading" aria-hidden="true">
      <span />
    </div>
  )
}

export function IslandCat3D() {
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
  const [position, setPosition] = useState<CatPosition>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jinzi-screen-position') ?? '{}')
      return typeof saved.x === 'number' && typeof saved.y === 'number' ? saved : { x: 0, y: 0 }
    } catch {
      return { x: 0, y: 0 }
    }
  })

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

useGLTF.preload(MODEL_URL)
