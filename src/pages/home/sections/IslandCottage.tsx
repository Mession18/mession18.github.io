import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const WALL_EXTRUSION = { depth: 3.96, bevelEnabled: false, steps: 1 }
const ARCH_EXTRUSION = {
  depth: 0.12,
  bevelEnabled: true,
  bevelSize: 0.035,
  bevelThickness: 0.035,
  bevelSegments: 3,
  curveSegments: 24,
  steps: 1,
}
const DOOR_EXTRUSION = { ...ARCH_EXTRUSION, depth: 0.05, bevelSize: 0.02, bevelThickness: 0.02 }
const PANE_EXTRUSION = { ...DOOR_EXTRUSION, depth: 0.015, bevelSize: 0.009, bevelThickness: 0.009 }
const TILE_EXTRUSION = {
  ...DOOR_EXTRUSION,
  depth: 0.04,
  bevelSize: 0.012,
  bevelThickness: 0.012,
  curveSegments: 8,
  bevelSegments: 2,
}

function arch(width: number, height: number) {
  const shape = new THREE.Shape()
  const radius = width / 2
  shape.moveTo(-radius, 0)
  shape.lineTo(radius, 0)
  shape.lineTo(radius, height - radius)
  shape.absarc(0, height - radius, radius, 0, Math.PI, false)
  shape.closePath()
  return shape
}

const eaveHeight = (x: number) => 2.55 + 0.7 * Math.sqrt(Math.max(0, 1 - (x / 1.2) ** 2))

function roofPoint(x: number, t: number, front: boolean) {
  return new THREE.Vector3(
    x,
    THREE.MathUtils.lerp(3.9, front ? eaveHeight(x) : 2.65, t),
    THREE.MathUtils.lerp(-0.3, front ? 1.67 : -1.65, t),
  )
}

/** Closed roof slab, including the raised arch over the front door. */
function roofGeometry(front: boolean) {
  const columns = 48
  const rows = 8
  const points: number[] = []
  const indices: number[] = []
  const layerSize = (columns + 1) * (rows + 1)
  for (let layer = 0; layer < 2; layer++) {
    for (let row = 0; row <= rows; row++) {
      for (let column = 0; column <= columns; column++) {
        const point = roofPoint(-2.24 + (4.48 * column) / columns, row / rows, front)
        points.push(point.x, point.y - layer * 0.12, point.z)
      }
    }
  }
  function quad(a: number, b: number, c: number, d: number) {
    if (front) indices.push(a, c, b, a, d, c)
    else indices.push(a, b, c, a, c, d)
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column
      const b = a + 1
      const c = b + columns + 1
      const d = a + columns + 1
      quad(a, b, c, d)
      quad(d + layerSize, c + layerSize, b + layerSize, a + layerSize)
    }
  }
  for (let column = 0; column < columns; column++) {
    const end = rows * (columns + 1) + column
    quad(column + layerSize, column + 1 + layerSize, column + 1, column)
    quad(end, end + 1, end + 1 + layerSize, end + layerSize)
  }
  for (let row = 0; row < rows; row++) {
    const start = row * (columns + 1)
    const end = start + columns
    quad(start, start + columns + 1, start + columns + 1 + layerSize, start + layerSize)
    quad(end + layerSize, end + columns + 1 + layerSize, end + columns + 1, end)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function CottageWindow({ night }: { night: number }) {
  return (
    <group>
      <RoundedBox args={[0.81, 0.98, 0.14]} radius={0.055} smoothness={2} castShadow>
        <meshStandardMaterial color="#f3e9c6" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.65, 0.81, 0.05]} radius={0.025} smoothness={2} position={[0, 0, 0.09]}>
        <meshStandardMaterial
          color="#99a69b"
          emissive="#ffbc60"
          emissiveIntensity={night * 2.2}
          roughness={0.24}
          metalness={0.05}
        />
      </RoundedBox>
      <mesh position={[0, 0, 0.13]} castShadow>
        <boxGeometry args={[0.065, 0.83, 0.05]} />
        <meshStandardMaterial color="#9c8768" />
      </mesh>
      <mesh position={[0, 0, 0.13]} castShadow>
        <boxGeometry args={[0.67, 0.065, 0.05]} />
        <meshStandardMaterial color="#9c8768" />
      </mesh>
      <RoundedBox
        args={[0.96, 0.12, 0.3]}
        radius={0.04}
        smoothness={2}
        position={[0, -0.51, 0.07]}
        castShadow
      >
        <meshStandardMaterial color="#eee0b9" roughness={0.88} />
      </RoundedBox>
    </group>
  )
}

type CottageWind = { x: number; z: number; strength: number }

function ChimneySmoke({ moving, wind }: { moving: boolean; wind?: CottageWind }) {
  const puffs = useRef<THREE.Group>(null)
  const elapsed = useRef(0)
  const strength = THREE.MathUtils.clamp(wind?.strength ?? 0, 0, 1)
  const length = Math.hypot(wind?.x ?? 0, wind?.z ?? 0)
  const directionX = length > 0 ? (wind!.x / length) * strength : 0
  const directionZ = length > 0 ? (wind!.z / length) * strength : 0
  useFrame((_, delta) => {
    if (moving) elapsed.current += Math.min(delta, 0.05)
    puffs.current?.children.forEach((child, i) => {
      const phase = (elapsed.current / 5.4 + i / 7) % 1
      const drift = phase ** 1.6 * 2.7
      const spread = phase * (0.025 + strength * 0.11)
      const size = 0.12 + phase * (0.34 + strength * 0.16)
      child.position.set(
        directionX * drift + Math.sin(i * 2.4 + phase * 3) * spread,
        0.025 + phase * (2.25 - strength * 0.45),
        directionZ * drift + Math.cos(i * 2.1 + phase * 3) * spread,
      )
      child.rotation.y = Math.atan2(directionX, directionZ)
      child.scale.set(size, size * 0.86, size * (1 + strength * 0.7))
      ;((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity =
        Math.min(1, phase * 10) * (1 - phase) ** 1.35 * 0.52
    })
  })
  return (
    <group ref={puffs} position={[1.51, 4.4, -0.75]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color="#eeece6"
            roughness={1}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Ground y=0; door center x=0 faces +z; the bottom step ends at z=2.35. */
export function IslandCottage({
  snow,
  wet,
  night,
  smoke = false,
  moving = false,
  wind,
}: {
  snow: number
  wet: number
  night: number
  smoke?: boolean
  moving?: boolean
  wind?: CottageWind
}) {
  const tiles = useRef<THREE.InstancedMesh>(null)
  const model = useMemo(() => {
    const sideGable = new THREE.Shape()
    sideGable.moveTo(-1.4, 0)
    sideGable.lineTo(1.4, 0)
    sideGable.lineTo(1.4, 0.27)
    sideGable.lineTo(0.3, 1.28)
    sideGable.lineTo(-1.4, 0.13)
    sideGable.closePath()
    const frontArch = new THREE.Shape()
    frontArch.moveTo(-1.2, 2.43)
    frontArch.lineTo(1.2, 2.43)
    for (let i = 0; i <= 32; i++) {
      const x = 1.2 - (2.4 * i) / 32
      frontArch.lineTo(x, eaveHeight(x) + 0.06)
    }
    frontArch.closePath()
    const tile = new THREE.Shape()
    tile.moveTo(-0.237, 0)
    tile.lineTo(0.237, 0)
    tile.lineTo(0.237, -0.34)
    tile.quadraticCurveTo(0.237, -0.59, 0, -0.59)
    tile.quadraticCurveTo(-0.237, -0.59, -0.237, -0.34)
    tile.closePath()
    const eave = new THREE.CatmullRomCurve3(
      Array.from({ length: 49 }, (_, i) => roofPoint(-2.24 + (4.48 * i) / 48, 1, true)),
    )
    const scroll = new THREE.CatmullRomCurve3(
      Array.from({ length: 41 }, (_, i) => {
        const t = i / 40
        const angle = t * Math.PI * 2.45
        const radius = 0.15 * (1 - t) + 0.018
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      }),
    )
    const shingleMatrices: THREE.Matrix4[] = []
    for (const front of [true, false]) {
      const rows = front ? 5 : 4
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < 9; column++) {
          const x = -2 + column * 0.5
          const t = row / rows
          const point = roofPoint(x, t, front)
          const down = roofPoint(x, 1, front).sub(roofPoint(x, 0, front))
          const length = down.length() / rows
          const yAxis = down.clone().normalize().negate()
          const dx = roofPoint(x + 0.01, t, front).sub(roofPoint(x - 0.01, t, front))
          if (!front) dx.negate()
          const zAxis = dx.clone().cross(yAxis).normalize()
          const xAxis = yAxis.clone().cross(zAxis).normalize()
          const rotation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis),
          )
          point.addScaledVector(zAxis, 0.023 + (rows - row) * 0.009)
          shingleMatrices.push(
            new THREE.Matrix4().compose(
              point,
              rotation,
              new THREE.Vector3(1, (length / 0.59) * 1.11, 1),
            ),
          )
        }
      }
    }
    return {
      sideGable,
      frontArch,
      tile,
      shingleMatrices,
      doorFrame: arch(1.59, 2.43),
      door: arch(1.23, 2.15),
      transomFrame: arch(0.98, 1.08),
      transom: arch(0.84, 0.94),
      roofFront: roofGeometry(true),
      roofBack: roofGeometry(false),
      eave: new THREE.TubeGeometry(eave, 64, 0.075, 8, false),
      scroll: new THREE.TubeGeometry(scroll, 40, 0.017, 6, false),
      lamp: [
        new THREE.Vector2(0.022, 0.15),
        new THREE.Vector2(0.048, 0.13),
        new THREE.Vector2(0.055, 0.055),
        new THREE.Vector2(0.11, -0.025),
        new THREE.Vector2(0.17, -0.075),
        new THREE.Vector2(0.174, -0.1),
        new THREE.Vector2(0.151, -0.1),
      ],
    }
  }, [])
  useEffect(
    () => () => {
      model.roofFront.dispose()
      model.roofBack.dispose()
      model.eave.dispose()
      model.scroll.dispose()
    },
    [model],
  )
  useLayoutEffect(() => {
    if (!tiles.current) return
    const color = new THREE.Color()
    model.shingleMatrices.forEach((matrix, i) => {
      tiles.current!.setMatrixAt(i, matrix)
      tiles.current!.setColorAt(i, color.set(['#c8684c', '#c36346', '#cf7050', '#bd5943'][i % 4]))
    })
    tiles.current.instanceMatrix.needsUpdate = true
    if (tiles.current.instanceColor) tiles.current.instanceColor.needsUpdate = true
    tiles.current.computeBoundingSphere()
  }, [model])
  const roofRoughness = 0.9 - wet * 0.4

  return (
    <group>
      {smoke && <ChimneySmoke moving={moving} wind={wind} />}
      <RoundedBox
        args={[4.12, 0.25, 2.94]}
        radius={0.08}
        smoothness={2}
        position={[0, 0.125, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e6ddbc" roughness={0.95 - wet * 0.2} />
      </RoundedBox>
      <RoundedBox
        args={[4, 2.35, 2.8]}
        radius={0.075}
        smoothness={3}
        position={[0, 1.395, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e8dfbd" roughness={0.96} />
      </RoundedBox>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.43 + i * 0.285, 0]}>
          <boxGeometry args={[4.012, 0.016, 2.813]} />
          <meshStandardMaterial color="#c9bea0" roughness={0.95} />
        </mesh>
      ))}
      {[-1.93, 1.93].map((x) => (
        <RoundedBox
          key={x}
          args={[0.16, 2.37, 0.16]}
          radius={0.035}
          smoothness={2}
          position={[x, 1.4, 1.42]}
          castShadow
        >
          <meshStandardMaterial color="#f3e9c6" roughness={0.9} />
        </RoundedBox>
      ))}
      <mesh position={[-1.98, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[model.sideGable, WALL_EXTRUSION]} />
        <meshStandardMaterial color="#e8dfbd" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 1.29]} castShadow receiveShadow>
        <extrudeGeometry args={[model.frontArch, ARCH_EXTRUSION]} />
        <meshStandardMaterial color="#e8dfbd" roughness={0.95} />
      </mesh>

      {[model.roofFront, model.roofBack].map((geometry, i) => (
        <mesh key={i} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color="#a24a37" roughness={roofRoughness} />
        </mesh>
      ))}
      <instancedMesh
        ref={tiles}
        args={[undefined, undefined, model.shingleMatrices.length]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[model.tile, TILE_EXTRUSION]} />
        <meshStandardMaterial roughness={roofRoughness} />
      </instancedMesh>
      <mesh geometry={model.eave} position={[0, -0.105, -0.015]} castShadow>
        <meshStandardMaterial color="#eadfba" roughness={0.88} />
      </mesh>
      <mesh geometry={model.eave} position={[0, 0, 0.035]} castShadow>
        <meshStandardMaterial color="#b85740" roughness={roofRoughness} />
      </mesh>
      <mesh position={[0, 3.93, -0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 4.56, 12]} />
        <meshStandardMaterial
          color={snow > 0.01 ? '#f0f5f0' : '#b6533b'}
          roughness={roofRoughness}
        />
      </mesh>
      {snow > 0.01 &&
        [model.roofFront, model.roofBack].map((geometry, i) => (
          <mesh
            key={i}
            geometry={geometry}
            position={[0, 0.12 + snow * 0.08, 0]}
            scale={[1.015, 1, 1.015]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#f0f5f0" roughness={1} />
          </mesh>
        ))}
      <RoundedBox
        args={[0.47, 1.05, 0.54]}
        radius={0.035}
        smoothness={2}
        position={[1.51, 3.76, -0.75]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#b6a182" roughness={0.95} />
      </RoundedBox>
      <RoundedBox
        args={[0.59, 0.13, 0.66]}
        radius={0.025}
        smoothness={2}
        position={[1.51, 4.31, -0.75]}
        castShadow
      >
        <meshStandardMaterial color={snow > 0.01 ? '#f0f5f0' : '#b7a488'} roughness={0.93} />
      </RoundedBox>
      <mesh position={[1.51, 4.378, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.37, 0.43]} />
        <meshStandardMaterial color="#615747" roughness={1} />
      </mesh>

      <mesh position={[0, 0.28, 1.41]} castShadow receiveShadow>
        <extrudeGeometry args={[model.doorFrame, ARCH_EXTRUSION]} />
        <meshStandardMaterial color="#f5ebc8" roughness={0.89} />
      </mesh>
      <mesh position={[0, 0.31, 1.57]} castShadow receiveShadow>
        <extrudeGeometry args={[model.door, DOOR_EXTRUSION]} />
        <meshStandardMaterial color="#963735" roughness={0.82 - wet * 0.18} />
      </mesh>
      <mesh position={[0, 1.22, 1.632]}>
        <extrudeGeometry args={[model.transomFrame, PANE_EXTRUSION]} />
        <meshStandardMaterial color="#403e35" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.275, 1.656]}>
        <extrudeGeometry args={[model.transom, PANE_EXTRUSION]} />
        <meshStandardMaterial
          color="#bbad83"
          emissive="#ffd78e"
          emissiveIntensity={night * 1.6}
          roughness={0.3}
        />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [1.52, 1.97].map((y) => (
          <mesh
            key={`${side}-${y}`}
            geometry={model.scroll}
            position={[side * 0.21, y, 1.691]}
            scale={[side, y < 1.7 ? -1 : 1, 1]}
          >
            <meshStandardMaterial color="#373a32" roughness={0.7} metalness={0.3} />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.72, 1.69]}>
        <boxGeometry args={[0.035, 0.84, 0.035]} />
        <meshStandardMaterial color="#373a32" roughness={0.7} metalness={0.3} />
      </mesh>
      <RoundedBox
        args={[1.03, 0.65, 0.025]}
        radius={0.025}
        smoothness={2}
        position={[0, 0.75, 1.65]}
      >
        <meshStandardMaterial color="#7f2d2d" roughness={0.86} />
      </RoundedBox>
      <RoundedBox
        args={[0.9, 0.51, 0.024]}
        radius={0.015}
        smoothness={2}
        position={[0, 0.75, 1.669]}
      >
        <meshStandardMaterial color="#a1413b" roughness={0.86} />
      </RoundedBox>
      <RoundedBox
        args={[0.06, 0.3, 0.06]}
        radius={0.025}
        smoothness={2}
        position={[-0.51, 1.12, 1.705]}
        castShadow
      >
        <meshStandardMaterial color="#66573e" roughness={0.43} metalness={0.65} />
      </RoundedBox>

      <mesh position={[0, 3.085, 1.61]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.35, 8]} />
        <meshStandardMaterial color="#81714d" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.95, 1.78]} castShadow>
        <latheGeometry args={[model.lamp, 24]} />
        <meshStandardMaterial
          color="#9c8456"
          roughness={0.55 - wet * 0.15}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 2.849, 1.78]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 20]} />
        <meshStandardMaterial
          color="#ecdca4"
          emissive="#ffc76c"
          emissiveIntensity={night * 3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 2.837, 1.78]}>
        <sphereGeometry args={[0.057, 12, 8]} />
        <meshStandardMaterial color="#f6e7bd" emissive="#ffbf66" emissiveIntensity={night * 4} />
      </mesh>
      <pointLight
        position={[0, 2.8, 1.98]}
        intensity={night * 5}
        distance={6.5}
        decay={2}
        color="#ffcf80"
      />

      <RoundedBox
        args={[1.69, 0.2, 0.61]}
        radius={0.045}
        smoothness={2}
        position={[0, 0.24, 1.725]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#eee4c4" roughness={0.94 - wet * 0.3} />
      </RoundedBox>
      <RoundedBox
        args={[1.91, 0.14, 0.64]}
        radius={0.045}
        smoothness={2}
        position={[0, 0.07, 2.03]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e7dcbc" roughness={0.94 - wet * 0.3} />
      </RoundedBox>
      {[-1.37, 1.37].map((x) => (
        <group key={x} position={[x, 1.43, 1.43]}>
          <CottageWindow night={night} />
        </group>
      ))}
      <group position={[2.02, 1.43, -0.08]} rotation={[0, Math.PI / 2, 0]}>
        <CottageWindow night={night} />
      </group>
    </group>
  )
}
