import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { islandFestival } from './island-festivals'

type Wind = { x: number; z: number; strength: number }
type Point = [number, number, number]

export function Hanging({
  position,
  moving,
  wind,
  children,
}: {
  position: Point
  moving: boolean
  wind: Wind
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const phase = useRef(0)
  useFrame((_, delta) => {
    if (!group.current || !moving) return
    phase.current += Math.min(delta, 0.05)
    const sway = (0.05 + Math.sin(phase.current * 2 + position[0]) * 0.12) * wind.strength
    group.current.rotation.z = -wind.x * sway
    group.current.rotation.x = wind.z * sway
  })
  return (
    <group ref={group} position={position}>
      {children}
    </group>
  )
}

export function Lantern({ night, red = false }: { night: number; red?: boolean }) {
  return (
    <>
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 5]} />
        <meshStandardMaterial color="#8a6740" />
      </mesh>
      <mesh position={[0, -0.3, 0]} scale={[0.24, 0.22, 0.21]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial
          color={red ? '#cc4435' : '#ffe0a0'}
          emissive={red ? '#ff592f' : '#ffc86d'}
          emissiveIntensity={night * 0.9}
          roughness={0.85}
        />
      </mesh>
      {[-0.12, -0.48].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.045, 12]} />
          <meshStandardMaterial color="#c9a357" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, -0.57, 0]}>
        <cylinderGeometry args={[0.016, 0.035, 0.16, 7]} />
        <meshStandardMaterial color={red ? '#e3b251' : '#bb6250'} />
      </mesh>
    </>
  )
}

export function Herbs({ sachet }: { sachet: boolean }) {
  return (
    <>
      {[-0.5, -0.25, 0, 0.25, 0.5].map((tilt, i) => (
        <group key={tilt} rotation={[0, i * 1.9, tilt]}>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.009, 0.013, 0.52, 5]} />
            <meshStandardMaterial color="#6f8050" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.048, -0.25 - i * 0.02, 0]}
              rotation={[0, 0, side * 0.5]}
              scale={[0.055, 0.22, 0.025]}
            >
              <sphereGeometry args={[1, 7, 5]} />
              <meshStandardMaterial color={i % 2 ? '#8da275' : '#677f55'} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, -0.09, 0]}>
        <torusGeometry args={[0.063, 0.016, 5, 12]} />
        <meshStandardMaterial color="#b75946" />
      </mesh>
      {sachet && (
        <group position={[0, -0.42, 0.075]}>
          <mesh rotation={[0, 0, Math.PI / 4]} scale={[0.13, 0.16, 0.075]} castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#b287ad" roughness={1} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <coneGeometry args={[0.028, 0.14, 6]} />
            <meshStandardMaterial color="#d1a753" />
          </mesh>
        </group>
      )}
    </>
  )
}

export function Rabbit({ position = [1.32, 0.03, 2.06] }: { position?: Point }) {
  return (
    <group position={position} rotation={[0, -0.22, 0]}>
      <mesh position={[0, 0.24, 0]} scale={[0.23, 0.28, 0.22]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#f3ead3" />
      </mesh>
      <mesh position={[0, 0.5, 0.025]} scale={[0.19, 0.19, 0.18]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#fff3da" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.087, 0.73, 0.01]} rotation={[0, 0, -side * 0.12]}>
          <mesh scale={[0.065, 0.2, 0.07]} castShadow>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#fff3da" />
          </mesh>
          <mesh position={[0, 0.018, 0.053]} scale={[0.031, 0.135, 0.018]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#e9bdaf" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.075, 0.52, 0.186]}>
          <sphereGeometry args={[0.021, 8, 6]} />
          <meshStandardMaterial color="#5e5144" />
        </mesh>
      ))}
      <mesh position={[0, 0.462, 0.201]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color="#c98782" />
      </mesh>
    </group>
  )
}

export function Chrysanthemums({
  positions = [-1.42, 1.42],
  z = 2.06,
}: {
  positions?: number[]
  z?: number
}) {
  return (
    <>
      {positions.map((x) => (
        <group key={x} position={[x, 0, z]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.32, 12]} />
            <meshStandardMaterial color="#ac7758" roughness={1} />
          </mesh>
          <mesh position={[0, 0.4, 0]} scale={[0.27, 0.2, 0.25]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#72824b" />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 2.4) * 0.18,
                0.48 + Math.cos(i * 2.4) * 0.1,
                Math.cos(i * 2.4) * 0.16,
              ]}
              rotation={[Math.PI / 2, 0, i]}
              castShadow
            >
              <torusGeometry args={[0.069, 0.05, 5, 10]} />
              <meshStandardMaterial color={i % 2 ? '#eec85b' : '#f4e2aa'} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

export function GiftBox({ color = '#b94c3b' }: { color?: string }) {
  return (
    <>
      <mesh castShadow>
        <boxGeometry args={[0.36, 0.36, 0.34]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.06, 0.37, 0.35]} />
        <meshStandardMaterial color="#eddda6" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.37, 0.37, 0.055]} />
        <meshStandardMaterial color="#eddda6" />
      </mesh>
      <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.066, 0.019, 5, 12]} />
        <meshStandardMaterial color="#eddda6" />
      </mesh>
    </>
  )
}

function Christmas() {
  return (
    <>
      <group position={[0, 1.88, 1.78]}>
        <mesh castShadow>
          <torusGeometry args={[0.28, 0.075, 8, 20]} />
          <meshStandardMaterial color="#567450" roughness={1} />
        </mesh>
        {[0.4, 2.2, 3.5, 5.2].map((angle) => (
          <mesh key={angle} position={[Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, 0.06]}>
            <sphereGeometry args={[0.047, 8, 6]} />
            <meshStandardMaterial color="#cb5944" />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.07, 0.29, 0.07]}
            rotation={[0, 0, (side * Math.PI) / 2]}
          >
            <coneGeometry args={[0.095, 0.16, 3]} />
            <meshStandardMaterial color="#c74d40" />
          </mesh>
        ))}
      </group>
      {[0, 1].map((i) => (
        <group
          key={i}
          position={[1.25 + i * 0.4, 0.19 - i * 0.03, 2 + i * 0.15]}
          rotation={[0, i * 0.3, 0]}
          scale={1 - i * 0.17}
        >
          <GiftBox color={i ? '#d9bd77' : '#b94c3b'} />
        </group>
      ))}
    </>
  )
}

function NewYear({ moving, wind, night }: { moving: boolean; wind: Wind; night: number }) {
  const star = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5
      const radius = i % 2 ? 0.09 : 0.19
      if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    shape.closePath()
    return shape
  }, [])
  return (
    <>
      {[-1, 1].map((side) => (
        <Hanging key={side} position={[side * 1.4, 2.6, 1.85]} moving={moving} wind={wind}>
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.28, 5]} />
            <meshStandardMaterial color="#be975a" />
          </mesh>
          <mesh position={[0, -0.38, 0]} castShadow>
            <extrudeGeometry args={[star, { depth: 0.045, bevelEnabled: false }]} />
            <meshStandardMaterial
              color="#f0cb70"
              emissive="#f3c66d"
              emissiveIntensity={night * 0.45}
            />
          </mesh>
          {[-1, 1].map((flag) => (
            <mesh
              key={flag}
              position={[flag * 0.26, -0.22, 0]}
              rotation={[0, 0, Math.PI]}
              scale={[1, 1, 0.08]}
            >
              <coneGeometry args={[0.1, 0.22, 3]} />
              <meshStandardMaterial color={flag < 0 ? '#cd7c73' : '#94b6b2'} />
            </mesh>
          ))}
        </Hanging>
      ))}
    </>
  )
}

export function Pumpkin({ night }: { night: number }) {
  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i * Math.PI * 2) / 7) * 0.14,
            0.32,
            Math.cos((i * Math.PI * 2) / 7) * 0.14,
          ]}
          scale={[0.23, 0.29, 0.23]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? '#d87e39' : '#e29243'} roughness={0.91} />
        </mesh>
      ))}
      <mesh position={[0.025, 0.64, 0]} rotation={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.043, 0.055, 0.17, 7]} />
        <meshStandardMaterial color="#768049" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.115, 0.4, 0.348]} scale={[1, 1, 0.12]}>
          <coneGeometry args={[0.064, 0.105, 3]} />
          <meshStandardMaterial
            color="#493725"
            emissive="#ffbd55"
            emissiveIntensity={night * 1.8}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.285, 0.369]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.12, 0.025, 5, 12, Math.PI]} />
        <meshStandardMaterial color="#493725" emissive="#ffbd55" emissiveIntensity={night * 1.8} />
      </mesh>
    </group>
  )
}

export function FlowerLantern({ night }: { night: number }) {
  return (
    <>
      <Lantern night={night} />
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.sin((i * Math.PI) / 3) * 0.19, -0.45, Math.cos((i * Math.PI) / 3) * 0.19]}
          rotation={[Math.sin((i * Math.PI) / 3) * 0.3, 0, Math.cos((i * Math.PI) / 3) * 0.3]}
          scale={[0.105, 0.13, 0.105]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={i % 2 ? '#e9a7ad' : '#efd4ac'}
            emissive="#ebad89"
            emissiveIntensity={night * 0.4}
          />
        </mesh>
      ))}
    </>
  )
}

function Dumplings() {
  return (
    <group position={[1.3, 0.1, 2.12]}>
      <mesh position={[0, 0.16, 0]} scale={[1, 0.6, 1]} castShadow>
        <sphereGeometry args={[0.27, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#9eaea4" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.264, 0.019, 5, 20]} />
        <meshStandardMaterial color="#e7dfbf" />
      </mesh>
      {[
        [0, 0.14, 0],
        [-0.12, 0.15, 0.07],
        [0.09, 0.16, 0.09],
        [0.08, 0.14, -0.12],
      ].map((p, i) => (
        <mesh key={i} position={p as Point} castShadow>
          <sphereGeometry args={[0.081, 10, 8]} />
          <meshStandardMaterial color={i === 1 ? '#ebc5c2' : '#f2e8d3'} roughness={0.52} />
        </mesh>
      ))}
    </group>
  )
}

export function IslandFestivalDecor({
  festival,
  night,
  moving,
  wind,
}: {
  festival: ReturnType<typeof islandFestival>
  night: number
  moving: boolean
  wind: Wind
}) {
  if (!festival) return null
  const spring = festival.id === 'spring-festival'
  const autumn = festival.id === 'mid-autumn'
  const lanternFestival = festival.id === 'lantern-festival'
  return (
    <group>
      {(spring || autumn) &&
        [-1, 1].map((side) => (
          <Hanging key={side} position={[side * 1.45, 2.62, 1.88]} moving={moving} wind={wind}>
            <Lantern night={night} red={spring} />
          </Hanging>
        ))}
      {spring &&
        [-1, 1].map((side) => (
          <group key={side} position={[side * 0.85, 1.4, 1.61]}>
            <mesh>
              <boxGeometry args={[0.095, 1.6, 0.018]} />
              <meshStandardMaterial color="#b63b2d" />
            </mesh>
            {[-0.5, -0.25, 0, 0.25, 0.5].map((y) => (
              <mesh key={y} position={[0, y, 0.013]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.043, 0.043, 0.01]} />
                <meshStandardMaterial color="#e7bd63" />
              </mesh>
            ))}
          </group>
        ))}
      {(festival.id === 'qingming' || festival.id === 'dragon-boat') &&
        [-1, 1].map((side) => (
          <Hanging key={side} position={[side * 0.98, 2.45, 1.74]} moving={moving} wind={wind}>
            <Herbs sachet={festival.id === 'dragon-boat'} />
          </Hanging>
        ))}
      {autumn && <Rabbit />}
      {lanternFestival && (
        <>
          {[-1, 1].map((side) => (
            <Hanging key={side} position={[side * 1.45, 2.62, 1.88]} moving={moving} wind={wind}>
              <FlowerLantern night={night} />
            </Hanging>
          ))}
          <Dumplings />
        </>
      )}
      {festival.id === 'halloween' &&
        [-1.4, 1.4].map((x, i) => (
          <group
            key={x}
            position={[x, 0.02, 2.06]}
            rotation={[0, (i ? -1 : 1) * 0.18, 0]}
            scale={i ? 0.8 : 1}
          >
            <Pumpkin night={night} />
          </group>
        ))}
      {festival.id === 'double-ninth' && <Chrysanthemums />}
      {festival.id === 'christmas' && <Christmas />}
      {festival.id === 'new-year' && <NewYear moving={moving} wind={wind} night={night} />}
    </group>
  )
}
