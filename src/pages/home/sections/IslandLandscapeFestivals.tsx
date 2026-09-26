import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { groundHeight } from './island-layout'
import { clearOfRiver, riverCenter } from './island-river-layout'
import type { islandFestival } from './island-festivals'
import {
  Chrysanthemums,
  FlowerLantern,
  GiftBox,
  Hanging,
  Herbs,
  Lantern,
  Pumpkin,
  Rabbit,
} from './IslandFestivalDecor'

type Wind = { x: number; z: number; strength: number }

function LanternPost({
  lamps,
  moving,
  wind,
  flower = false,
  red = false,
}: {
  lamps: number
  moving: boolean
  wind: Wind
  flower?: boolean
  red?: boolean
}) {
  return (
    <>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.047, 0.07, 1.9, 7]} />
        <meshStandardMaterial color="#946d47" />
      </mesh>
      <mesh position={[0.17, 1.83, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.034, 0.034, 0.46, 7]} />
        <meshStandardMaterial color="#ad8455" />
      </mesh>
      <Hanging position={[0.32, 1.85, 0]} moving={moving} wind={wind}>
        {flower ? <FlowerLantern night={lamps} /> : <Lantern night={lamps} red={red} />}
      </Hanging>
    </>
  )
}

function Firecrackers({ moving, wind, seed }: { moving: boolean; wind: Wind; seed: number }) {
  const spark = useRef<THREE.Mesh>(null)
  const paper = useRef<THREE.InstancedMesh>(null)
  const time = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, delta) => {
    if (!moving || !spark.current || !paper.current) return
    time.current += Math.min(delta, 0.05)
    const phase = (time.current + seed) % 8
    const burning = phase < 2.4
    const sourceY = 1.61 - Math.min(1, phase / 2.4) * 0.95
    spark.current.visible = burning
    spark.current.position.set(0, sourceY, 0.08)
    spark.current.scale.setScalar(0.022 + Math.sin(phase * 23) ** 2 * 0.016)
    for (let i = 0; i < 12; i++) {
      const age = (phase + i * 0.137) % 0.9
      const side = i % 2 ? -1 : 1
      dummy.position.set(
        side * age * (0.3 + (i % 3) * 0.12) + wind.x * wind.strength * age * 0.3,
        sourceY + age * (0.25 + (i % 4) * 0.12) - age * age * 1.4,
        Math.sin(i * 2.7) * age * 0.28 + wind.z * wind.strength * age * 0.3,
      )
      dummy.rotation.set(age * 8 + i, age * 4, i)
      dummy.scale.setScalar(burning ? 0.4 + (1 - age / 0.9) * 0.6 : 0)
      dummy.updateMatrix()
      paper.current.setMatrixAt(i, dummy.matrix)
    }
    paper.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[-0.42, 0, 0]}>
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.12, 5]} />
        <meshStandardMaterial color="#c6aa76" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          position={[(i % 2 ? -1 : 1) * 0.047, 1.62 - i * 0.083, 0]}
          rotation={[0, 0, (i % 2 ? -1 : 1) * 0.5]}
          castShadow
        >
          <cylinderGeometry args={[0.03, 0.03, 0.125, 7]} />
          <meshStandardMaterial color={i % 2 ? '#ba4032' : '#d25336'} />
        </mesh>
      ))}
      <mesh position={[0.1, 1.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.023, 0.023, 0.62, 6]} />
        <meshStandardMaterial color="#946d47" />
      </mesh>
      <group visible={moving}>
        <mesh ref={spark}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#ffe8a1" toneMapped={false} />
        </mesh>
        <instancedMesh ref={paper} args={[undefined, undefined, 12]} frustumCulled={false}>
          <planeGeometry args={[0.065, 0.035]} />
          <meshStandardMaterial color="#d7593d" roughness={1} side={THREE.DoubleSide} />
        </instancedMesh>
      </group>
    </group>
  )
}

function CandyCane() {
  return (
    <group position={[-0.14, 0, -0.05]} rotation={[0, 0, -0.1]}>
      <mesh position={[-0.12, 0.49, 0]} castShadow>
        <cylinderGeometry args={[0.051, 0.051, 0.8, 9]} />
        <meshStandardMaterial color="#eee9d7" />
      </mesh>
      <mesh position={[0, 0.89, 0]} castShadow>
        <torusGeometry args={[0.12, 0.051, 7, 14, Math.PI]} />
        <meshStandardMaterial color="#eee9d7" />
      </mesh>
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((y) => (
        <mesh key={y} position={[-0.12, y, 0]}>
          <cylinderGeometry args={[0.053, 0.053, 0.064, 9]} />
          <meshStandardMaterial color="#bc4d40" />
        </mesh>
      ))}
    </group>
  )
}

function Bunting({ moving, wind }: { moving: boolean; wind: Wind }) {
  return (
    <>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.78, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.048, 1.56, 6]} />
          <meshStandardMaterial color="#a4865a" />
        </mesh>
      ))}
      <mesh position={[0, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 1.7, 5]} />
        <meshStandardMaterial color="#b8a27d" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <Hanging key={i} position={[-0.65 + i * 0.325, 1.48, 0]} moving={moving} wind={wind}>
          <mesh
            position={[0, -0.14, 0]}
            rotation={[0, 0, Math.PI]}
            scale={[1, 1, 0.065]}
            castShadow
          >
            <coneGeometry args={[0.13, 0.27, 3]} />
            <meshStandardMaterial color={['#d78476', '#c8b075', '#8cab9c'][i % 3]} />
          </mesh>
        </Hanging>
      ))}
    </>
  )
}

export function IslandLandscapeFestivals({
  festival,
  houseX,
  riverX,
  lamps,
  moving,
  wind,
}: {
  festival: ReturnType<typeof islandFestival>
  houseX: number
  riverX: number
  lamps: number
  moving: boolean
  wind: Wind
}) {
  if (!festival) return null
  const points = [
    [houseX - 12.4, -4.5],
    [houseX - 7.2, -2.8],
    [houseX + 3.7, -2.8],
    [houseX + 8.1, -4.5],
    [riverCenter(1.1, riverX) - 2.7, 1.1],
  ].filter(([x, z]) => clearOfRiver(x, z, riverX, 1.05))
  return (
    <group>
      {points.map(([x, z], i) => (
        <group
          key={`${x}-${z}`}
          position={[x, groundHeight(x, z), z]}
          rotation={[0, i % 2 ? -0.2 : 0.15, 0]}
        >
          {festival.id === 'spring-festival' && (
            <>
              <LanternPost lamps={lamps} moving={moving} wind={wind} red />
              {(i === 0 || i === points.length - 1) && (
                <Firecrackers moving={moving} wind={wind} seed={i * 0.8} />
              )}
            </>
          )}
          {festival.id === 'lantern-festival' && (
            <LanternPost lamps={lamps} moving={moving} wind={wind} flower />
          )}
          {festival.id === 'mid-autumn' && (
            <>
              <LanternPost lamps={lamps} moving={moving} wind={wind} />
              {i % 2 === 0 && <Rabbit position={[-0.45, 0.03, 0.22]} />}
            </>
          )}
          {(festival.id === 'qingming' || festival.id === 'dragon-boat') && (
            <group>
              <mesh position={[0, 0.59, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.055, 1.18, 6]} />
                <meshStandardMaterial color="#8c8c5c" />
              </mesh>
              <Hanging position={[0, 1.1, 0.04]} moving={moving} wind={wind}>
                <Herbs sachet={festival.id === 'dragon-boat'} />
              </Hanging>
            </group>
          )}
          {festival.id === 'christmas' && (
            <>
              <CandyCane />
              <group position={[0.26, 0.23, 0.19]} scale={1.2}>
                <GiftBox color={i % 2 ? '#af5144' : '#63886c'} />
              </group>
              <group position={[-0.37, 0.13, 0.25]} scale={0.7}>
                <GiftBox color="#c4a761" />
              </group>
            </>
          )}
          {festival.id === 'halloween' && (
            <>
              <Pumpkin night={lamps} />
              <group position={[0.48, 0.01, 0.2]} scale={0.6}>
                <Pumpkin night={lamps} />
              </group>
            </>
          )}
          {festival.id === 'double-ninth' && (
            <group scale={1.25}>
              <Chrysanthemums positions={[-0.24, 0.3]} z={0} />
            </group>
          )}
          {festival.id === 'new-year' && <Bunting moving={moving} wind={wind} />}
        </group>
      ))}
    </group>
  )
}
