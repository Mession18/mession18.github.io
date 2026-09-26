import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bridgeLayout, groundHeight } from './island-layout'
import { RIVER_HALF_WIDTH, riverCenter } from './island-river-layout'

const bridgeZ = 3.8
const waterHeight = (z: number, riverX: number) => groundHeight(riverCenter(z, riverX), z) - 0.1

function RiverSurface({ riverX, snow, wet }: { riverX: number; snow: number; wet: number }) {
  const geometries = useMemo(() => {
    const water: number[] = [],
      banks: number[] = [],
      waterIndices: number[] = [],
      bankIndices: number[] = []
    for (let i = 0; i <= 120; i++) {
      const z = -8 + (i / 120) * 40
      const center = riverCenter(z, riverX)
      const y = waterHeight(z, riverX)
      for (const side of [-1, 1]) {
        water.push(center + side * (RIVER_HALF_WIDTH + 0.02), y, z)
        banks.push(center + side * (RIVER_HALF_WIDTH - 0.025), y - 0.025, z)
        const outerX = center + side * 1.55
        banks.push(outerX, groundHeight(outerX, z) + 0.006, z)
      }
      if (i === 120) continue
      const n = i * 2
      waterIndices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3)
      for (const side of [0, 2]) {
        const b = i * 4 + side
        bankIndices.push(b, b + 4, b + 1, b + 1, b + 4, b + 5)
      }
    }
    return [water, banks].map((vertices, i) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      geometry.setIndex(i === 0 ? waterIndices : bankIndices)
      geometry.computeVertexNormals()
      return geometry
    })
  }, [riverX])
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries])
  return (
    <>
      <mesh geometry={geometries[1]} receiveShadow>
        <meshStandardMaterial
          color={new THREE.Color('#c5b282').lerp(new THREE.Color('#edf2ef'), snow)}
          roughness={0.97 - wet * 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={geometries[0]} receiveShadow renderOrder={1}>
        <meshStandardMaterial
          color={snow > 0.5 ? '#80bbc2' : '#52b8bf'}
          transparent
          opacity={0.64}
          roughness={0.3 - wet * 0.17}
          metalness={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const z = -5 + i * 1.65
        const x = riverCenter(z, riverX) + (i % 2 ? 1 : -1) * 1.43
        return (
          <mesh
            key={i}
            position={[x, groundHeight(x, z) - 0.035, z]}
            rotation={[0, i * 2.1, 0]}
            scale={[0.19 + (i % 3) * 0.035, 0.095, 0.14]}
            receiveShadow
            castShadow
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={new THREE.Color(i % 2 ? '#b6b39c' : '#d2ceb3').lerp(
                new THREE.Color('#edf5f3'),
                snow,
              )}
              roughness={0.9 - wet * 0.35}
            />
          </mesh>
        )
      })}
    </>
  )
}

function Footbridge({ riverX, snow, wet }: { riverX: number; snow: number; wet: number }) {
  const { x, y } = bridgeLayout(riverX)
  const arch = (offset: number) => 0.48 * (1 - (offset / 1.85) ** 2)
  const rail = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        Array.from({ length: 13 }, (_, i) => {
          const offset = -1.85 + (i / 12) * 3.7
          return new THREE.Vector3(offset, 0.48 * (1 - (offset / 1.85) ** 2) + 0.81, 0)
        }),
      ),
    [],
  )
  const beam = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.14, -0.12)
    shape.lineTo(0.14, -0.12)
    shape.lineTo(0.14, 0.12)
    shape.lineTo(-0.14, 0.12)
    shape.closePath()
    const path = new THREE.CatmullRomCurve3(
      Array.from({ length: 17 }, (_, i) => {
        const offset = -1.9 + (i / 16) * 3.8
        return new THREE.Vector3(offset, 0.48 * (1 - (offset / 1.85) ** 2) - 0.21, 0)
      }),
    )
    return { shape, options: { steps: 32, bevelEnabled: false, extrudePath: path } }
  }, [])
  return (
    <group position={[x, y, bridgeZ]}>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, 0, z]} castShadow receiveShadow>
          <extrudeGeometry args={[beam.shape, beam.options]} />
          <meshStandardMaterial color="#745037" roughness={0.94 - wet * 0.3} />
        </mesh>
      ))}
      {[-1.45, 0, 1.45].map((offset) => (
        <mesh key={offset} position={[offset, arch(offset) - 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.17, 1.4]} />
          <meshStandardMaterial color="#835a3b" roughness={0.94 - wet * 0.3} />
        </mesh>
      ))}
      {[-1.79, 1.79].map((offset) => (
        <mesh key={offset} position={[offset, -0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.49, 0.4, 1.62]} />
          <meshStandardMaterial color="#a8a58d" roughness={0.98 - wet * 0.17} />
        </mesh>
      ))}
      {Array.from({ length: 21 }, (_, i) => {
        const offset = -1.85 + (i / 20) * 3.7
        return (
          <group
            key={i}
            position={[offset, arch(offset), 0]}
            rotation={[0, 0, Math.atan((-0.96 * offset) / 1.85 ** 2)]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.173, 0.2, 1.42]} />
              <meshStandardMaterial
                color={['#a97b4c', '#bd905a', '#b18453'][i % 3]}
                roughness={0.93 - wet * 0.38}
              />
            </mesh>
            {snow > 0 && (
              <mesh position={[0, 0.1 + snow * 0.018, 0]} receiveShadow>
                <boxGeometry args={[0.171, snow * 0.045, 1.41]} />
                <meshStandardMaterial color="#f0f6f3" roughness={1} />
              </mesh>
            )}
          </group>
        )
      })}
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * 0.75]}>
          {[0, -0.38].map((lower) => (
            <mesh key={lower} position={[0, lower, 0]} castShadow receiveShadow>
              <tubeGeometry args={[rail, 30, lower === 0 ? 0.105 : 0.065, 8, false]} />
              <meshStandardMaterial
                color={snow > 0.5 && lower === 0 ? '#e7efe9' : '#815b3b'}
                roughness={0.86 - wet * 0.3}
              />
            </mesh>
          ))}
          {[-1.85, -0.93, 0, 0.93, 1.85].map((offset) => (
            <group key={offset} position={[offset, arch(offset), 0]}>
              <mesh position={[0, 0.37, 0]} castShadow>
                <cylinderGeometry args={[0.105, 0.135, 0.95, 8]} />
                <meshStandardMaterial color="#926a43" roughness={0.92 - wet * 0.3} />
              </mesh>
              <mesh position={[0, 0.91, 0]} castShadow>
                <sphereGeometry args={[0.15, 10, 8]} />
                <meshStandardMaterial color={snow > 0.4 ? '#f0f6f3' : '#bf9866'} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

function RiverLife({ riverX, moving, night }: { riverX: number; moving: boolean; night: number }) {
  const fish = useRef<THREE.Group>(null)
  const ripples = useRef<THREE.Group>(null)
  const time = useRef(0)
  const tail = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, -0.22, -0.15, 0, -0.48, 0.15, 0, -0.48], 3),
    )
    return geometry
  }, [])
  useEffect(() => () => tail.dispose(), [tail])
  useFrame((_, delta) => {
    if (moving) time.current += Math.min(delta, 0.05)
    const t = time.current
    fish.current?.children.forEach((shadow, i) => {
      const phase = t * 0.16 + i * 2.3
      const z = [-1.6, 7.1, 12.3][i] + Math.sin(phase) * 2
      const center = riverCenter(z, riverX)
      shadow.position.set(center + Math.sin(t * 0.23 + i) * 0.3, waterHeight(z, riverX) - 0.085, z)
      const velocityZ = Math.cos(phase) * 0.32
      const velocityX = Math.cos((z + 2) * 0.25) * 0.25 * velocityZ + Math.cos(t * 0.23 + i) * 0.069
      const heading = Math.atan2(velocityX, velocityZ)
      const turn = heading - shadow.rotation.y
      if (t === 0) shadow.rotation.y = heading
      else if (moving)
        shadow.rotation.y +=
          Math.atan2(Math.sin(turn), Math.cos(turn)) * -Math.expm1(-3 * Math.min(delta, 0.05))
      shadow.children[1].rotation.y = Math.sin(t * 5 + i) * 0.21
    })
    ripples.current?.children.forEach((ripple, i) => {
      const phase = (t * 0.16 + i * 0.27) % 1
      const z = -4 + i * 3.2
      ripple.position.set(
        riverCenter(z, riverX) + Math.sin(i * 2.3) * 0.46,
        waterHeight(z, riverX) + 0.016,
        z,
      )
      ripple.scale.setScalar(0.15 + phase * 0.65)
      ;((ripple as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
        (1 - phase) * (0.28 - night * 0.13)
    })
  })
  return (
    <>
      <group ref={fish}>
        {[0.95, 0.72, 1.1].map((scale, i) => (
          <group key={i} scale={scale}>
            <mesh scale={[0.14, 0.008, 0.32]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#245b58" transparent opacity={0.75} depthWrite={false} />
            </mesh>
            <mesh geometry={tail}>
              <meshBasicMaterial
                color="#245b58"
                transparent
                opacity={0.7}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={ripples}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
            <ringGeometry args={[0.47, 0.485, 28]} />
            <meshBasicMaterial color="#e2f4e5" transparent opacity={0.18} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}

export function IslandRiver({
  riverX,
  snow,
  wet,
  night,
  moving,
}: {
  riverX: number
  snow: number
  wet: number
  night: number
  moving: boolean
}) {
  return (
    <>
      <RiverSurface riverX={riverX} snow={snow} wet={wet} />
      <Footbridge riverX={riverX} snow={snow} wet={wet} />
      <RiverLife riverX={riverX} moving={moving} night={night} />
    </>
  )
}
