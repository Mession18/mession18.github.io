import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from '../../../context/useTheme'
import { IslandCottage } from './IslandCottage'
import { islandSceneState } from './island-scene-state'
import {
  COTTAGE_YAW,
  gardenPath,
  groundHeight,
  pathAtZ,
  connectingPaths,
  onConnectingPath,
  pathEdge,
} from './island-layout'
import { IslandRiver } from './IslandRiver'
import { clearOfRiver, riverCenter } from './island-river-layout'
import { IslandFestivalDecor } from './IslandFestivalDecor'
import { IslandPineCrown } from './IslandPineCrown'
import { IslandLandscapeFestivals } from './IslandLandscapeFestivals'

type SceneState = ReturnType<typeof islandSceneState>
type Point = [number, number, number]

function Tree({
  position,
  scale = 1,
  seed,
  snow,
  wind,
  moving,
  flora,
  pine = false,
  christmas = false,
  lamps,
}: {
  position: Point
  scale?: number
  seed: number
  snow: number
  wind: SceneState['wind']
  moving: boolean
  flora: SceneState['flora']
  pine?: boolean
  christmas?: boolean
  lamps: number
}) {
  const crown = useRef<THREE.Group>(null)
  const trunk = useRef<THREE.Group>(null)
  const time = useRef(0)
  useFrame((_, delta) => {
    if (!crown.current || !trunk.current || !moving) return
    time.current += Math.min(delta, 0.05)
    const t = time.current * (1 + wind.strength * 1.8)
    const gust = 0.6 + Math.sin(t * 1.15 + seed) * 0.28 + Math.sin(t * 2.3 + seed) * 0.12
    const ease = -Math.expm1(-4 * Math.min(delta, 0.05))
    for (const [group, amount] of [
      [crown.current, wind.canopy],
      [trunk.current, wind.trunk],
    ] as const) {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -wind.x * amount * gust, ease)
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, wind.z * amount * gust, ease)
    }
  })
  const lobes: Point[] = [
    [0, 2.85, 0],
    [-0.7, 2.15, 0],
    [0.67, 2.2, -0.12],
    [0, 2.05, 0.65],
    [0.12, 2.2, -0.63],
  ]
  return (
    <group position={position} scale={scale}>
      <group ref={trunk}>
        <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.15, 0.24, 1.9, 9]} />
          <meshStandardMaterial color="#96704b" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0.28, 1.52, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.075, 0.12, 0.9, 7]} />
          <meshStandardMaterial color="#96704b" />
        </mesh>
        <group ref={crown} position={[0, 1.5, 0]}>
          <group position={[0, -1.5, 0]}>
            {pine ? (
              <IslandPineCrown snow={snow} color={flora.pine} christmas={christmas} lamps={lamps} />
            ) : (
              lobes.map((position, i) => (
                <group
                  key={i}
                  position={position}
                  scale={i === 0 ? [0.95, 1, 0.9] : [0.9, 0.85, 0.86]}
                >
                  <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.94, 16, 12]} />
                    <meshStandardMaterial color={flora.foliage[i]} roughness={0.85} />
                  </mesh>
                  {snow > 0 && (
                    <mesh castShadow receiveShadow position={[0, 0.015 + snow * 0.025, 0]}>
                      <sphereGeometry args={[0.97, 16, 8, 0, Math.PI * 2, 0, 0.65 + snow * 0.7]} />
                      <meshStandardMaterial
                        color="#f3fafb"
                        roughness={0.95}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  )}
                </group>
              ))
            )}
          </group>
        </group>
      </group>
    </group>
  )
}

function Cloud({
  position,
  scale = 1,
  moving,
  storm,
  wind,
}: {
  position: Point
  scale?: number
  moving: boolean
  storm: boolean
  wind: SceneState['wind']
}) {
  const cloud = useRef<THREE.Group>(null)
  const travel = useRef(new THREE.Vector2())
  useFrame((_, delta) => {
    if (!cloud.current || !moving) return
    const speed = Math.min(delta, 0.05) * wind.strength * 1.2
    travel.current.x += wind.x * speed
    travel.current.y += wind.z * speed
    const distance = travel.current.length()
    // 在不可见时回到上风处，避免正弦往返让云周期性逆风。
    if (distance > 20) travel.current.multiplyScalar(-0.99)
    cloud.current.position.x = position[0] + travel.current.x
    cloud.current.position.z = position[2] + travel.current.y
    cloud.current.children.forEach((child) => {
      ;((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = Math.max(
        0,
        Math.min(1, (18 - distance) / 2),
      )
    })
  })
  return (
    <group ref={cloud} position={position} scale={scale}>
      {([-1, -0.35, 0.45, 1.15] as const).map((x, i) => (
        <mesh
          key={x}
          position={[x, [0, 0.23, 0.46, 0.06][i], 0]}
          scale={[1, [0.6, 0.88, 1.02, 0.64][i], 0.65]}
        >
          <sphereGeometry args={[0.85, 16, 12]} />
          <meshStandardMaterial
            color={storm ? '#9eafb7' : '#fffef3'}
            roughness={1}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Terrain({
  snow,
  wet,
  houseX,
  riverX,
  flora,
}: {
  snow: number
  wet: number
  houseX: number
  riverX: number
  flora: SceneState['flora']
}) {
  const land = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 40, 200, 120)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, 0, 12)
    const vertices = geometry.attributes.position
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),
        z = vertices.getZ(i)
      const bank = THREE.MathUtils.smoothstep(Math.abs(x - riverCenter(z, riverX)), 1.1, 1.55)
      vertices.setY(i, groundHeight(x, z) - 0.28 * (1 - bank))
    }
    geometry.computeVertexNormals()
    return geometry
  }, [riverX])
  const path = useMemo(() => {
    const vertices: number[] = [],
      indices: number[] = []
    for (let i = 0; i <= 36; i++) {
      const { x, z, halfWidth } = gardenPath(i / 36, houseX)
      for (const side of [-1, 1]) {
        const px = x + side * halfWidth
        vertices.push(px, groundHeight(px, z) + 0.035, z)
      }
      if (i < 36) {
        const n = i * 2
        indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3)
      }
    }
    for (const route of connectingPaths(houseX, riverX)) {
      const start = vertices.length / 3
      route.forEach((point, i) => {
        for (const side of [1, -1]) {
          const edge = pathEdge(route, i, side)
          const slope =
            (groundHeight(edge.x, edge.z) - groundHeight(point.x, point.z)) * Math.min(1, i / 3)
          vertices.push(edge.x, point.y + slope, edge.z)
        }
        if (i < route.length - 1) {
          const n = start + i * 2
          indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3)
        }
      })
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [houseX, riverX])
  useEffect(() => () => land.dispose(), [land])
  useEffect(() => () => path.dispose(), [path])
  const grassColor = new THREE.Color(flora.grass)
    .multiplyScalar(1 - wet * 0.17)
    .lerp(new THREE.Color('#e9f2ef'), snow)
  const pathColor = new THREE.Color(wet ? '#ae956e' : '#e2c899').lerp(
    new THREE.Color('#dce8e6'),
    snow * 0.85,
  )
  return (
    <>
      <mesh geometry={land} receiveShadow>
        <meshStandardMaterial color={grassColor} roughness={1 - wet * 0.4} />
      </mesh>
      <mesh geometry={path} receiveShadow>
        <meshStandardMaterial color={pathColor} roughness={0.95 - wet * 0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 22, -2.2, -8]} scale={[19, 2.1, 6]} receiveShadow>
          <sphereGeometry args={[1, 32, 16]} />
          <meshStandardMaterial color={grassColor} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

// 同一批几何实例绘制草丛，避免每根草各占一次 draw call。
function Meadow({
  snow,
  houseX,
  riverX,
  flora,
}: {
  snow: number
  houseX: number
  riverX: number
  flora: SceneState['flora']
}) {
  const grass = useRef<THREE.InstancedMesh>(null)
  const connections = useMemo(() => connectingPaths(houseX, riverX), [houseX, riverX])
  useEffect(() => {
    if (!grass.current) return
    const dummy = new THREE.Object3D(),
      color = new THREE.Color()
    for (let i = 0; i < 360; i++) {
      const x = Math.sin(i * 127.1) * 24,
        z = Math.cos(i * 311.7) * 11 + 3
      const path = pathAtZ(z, houseX)
      const hidden =
        (z > 2 && Math.abs(x - path.x) < path.halfWidth + 0.15) ||
        onConnectingPath(x, z, connections, 0.15) ||
        (Math.abs(x - houseX) < 2.5 && Math.abs(z) < 2.4) ||
        !clearOfRiver(x, z, riverX, 0.6)
      dummy.position.set(x, groundHeight(x, z) + 0.09, z)
      dummy.scale.setScalar(hidden ? 0 : 0.65 + (i % 5) * 0.15)
      dummy.rotation.set(0, i * 1.4, 0.12)
      dummy.updateMatrix()
      grass.current.setMatrixAt(i, dummy.matrix)
      color
        .set(flora.grass)
        .multiplyScalar(0.8 + (i % 3) * 0.16)
        .lerp(new THREE.Color('#edf4ef'), snow)
      grass.current.setColorAt(i, color)
    }
    grass.current.instanceMatrix.needsUpdate = true
    if (grass.current.instanceColor) grass.current.instanceColor.needsUpdate = true
  }, [snow, houseX, riverX, flora.grass, connections])
  return (
    <instancedMesh ref={grass} args={[undefined, undefined, 360]} receiveShadow>
      <coneGeometry args={[0.075, 0.22, 3]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  )
}

function FlowerBeds({
  houseX,
  riverX,
  flora,
  snow,
  wind,
  moving,
}: {
  houseX: number
  riverX: number
  flora: SceneState['flora']
  snow: number
  wind: SceneState['wind']
  moving: boolean
}) {
  const connections = useMemo(() => connectingPaths(houseX, riverX), [houseX, riverX])
  const stems = useRef<THREE.InstancedMesh>(null)
  const petals = useRef<THREE.InstancedMesh>(null)
  const hearts = useRef<THREE.InstancedMesh>(null)
  const stones = useRef<THREE.InstancedMesh>(null)
  const flying = useRef<THREE.InstancedMesh>(null)
  const bases = useRef<{ roots: THREE.Vector3[]; matrices: THREE.Matrix4[][] } | null>(null)
  const time = useRef(0)
  const scratch = useMemo(
    () => ({
      pivot: new THREE.Object3D(),
      particle: new THREE.Object3D(),
      transform: new THREE.Matrix4(),
      local: new THREE.Matrix4(),
    }),
    [],
  )
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    if (!stems.current || !petals.current || !hearts.current || !stones.current) return
    const dummy = new THREE.Object3D(),
      color = new THREE.Color()
    const roots: THREE.Vector3[] = []
    for (let i = 0; i < 160; i++) {
      const side = i % 2 ? 1 : -1
      const path = gardenPath(0.012 + (Math.floor(i / 2) % 18) * 0.024, houseX)
      let x =
        i < 64
          ? path.x + side * (path.halfWidth + 0.35 + Math.sin(i * 1.8) ** 2 * 0.7)
          : houseX + Math.sin(i * 31.7) * 7
      let z = i < 64 ? path.z : Math.cos(i * 27.1) * 3.4 + 1.8
      let sparse = false
      if (i >= 96) {
        const route = connections[Math.floor((i - 96) / 32)]
        const pairs = Math.min(
          16,
          Math.max(
            2,
            Math.round(Math.hypot(route[40].x - route[0].x, route[40].z - route[0].z) * 3),
          ),
        )
        const pair = Math.floor(((i - 96) % 32) / 2)
        sparse = pair >= pairs
        const index = Math.min(38, Math.round(6 + (pair / Math.max(1, pairs - 1)) * 29))
        const edge = pathEdge(route, index, side, 0.3 + (i % 3) * 0.12)
        x = edge.x
        z = edge.z
      }
      const blocked =
        sparse ||
        !clearOfRiver(x, z, riverX, 0.55) ||
        (Math.abs(x - houseX) < 2.5 && z < 2.6) ||
        onConnectingPath(x, z, connections, 0.15) ||
        (z > 2 && Math.abs(x - pathAtZ(z, houseX).x) < pathAtZ(z, houseX).halfWidth + 0.15)
      const scale = blocked ? 0 : (0.8 + (i % 4) * 0.12) * (1 - snow * 0.4)
      const y = groundHeight(x, z),
        height = flora.season === 'winter' ? 0.24 : 0.35 + (i % 3) * 0.08
      roots.push(new THREE.Vector3(x, y, z))
      dummy.position.set(x, y + (height * scale) / 2, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(0.018 * scale, height * scale, 0.018 * scale)
      dummy.updateMatrix()
      stems.current.setMatrixAt(i, dummy.matrix)
      const cup = flora.season === 'spring' && !flora.blossom
      color
        .set(flora.flowers[i % flora.flowers.length])
        .lerp(new THREE.Color('#f3f5ed'), snow * 0.6)
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2,
          radius = cup ? 0.065 : 0.13
        dummy.position.set(
          x + Math.cos(angle) * radius * scale,
          y + height * scale + (cup ? 0.065 : 0),
          z + Math.sin(angle) * radius * scale,
        )
        dummy.rotation.set(0, -angle, cup ? -0.22 : 0)
        dummy.scale.set((cup ? 0.065 : 0.115) * scale, (cup ? 0.13 : 0.045) * scale, 0.06 * scale)
        dummy.updateMatrix()
        petals.current.setMatrixAt(i * 8 + j, dummy.matrix)
        petals.current.setColorAt(i * 8 + j, color)
      }
      dummy.position.set(x, y + height * scale + 0.025, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.07 * scale)
      dummy.updateMatrix()
      hearts.current.setMatrixAt(i, dummy.matrix)
      if (i < 64 && flying.current) {
        flying.current.setColorAt(i, color)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        flying.current.setMatrixAt(i, dummy.matrix)
      }
    }
    for (let i = 0; i < 152; i++) {
      const path = gardenPath(Math.floor(i / 2) * 0.023, houseX),
        side = i % 2 ? 1 : -1
      let x = path.x + side * (path.halfWidth + 0.06),
        z = path.z
      let hidden = onConnectingPath(x, z, connections, 0.08)
      if (i >= 56) {
        const route = connections[Math.floor((i - 56) / 48)]
        const pairs = Math.min(
          24,
          Math.max(
            3,
            Math.round(Math.hypot(route[40].x - route[0].x, route[40].z - route[0].z) * 4),
          ),
        )
        const pair = Math.floor(((i - 56) % 48) / 2)
        const index = Math.min(38, 2 + Math.round((pair / (pairs - 1)) * 36))
        const edge = pathEdge(route, index, side, 0.04)
        x = edge.x
        z = edge.z
        const main = pathAtZ(z, houseX)
        hidden = pair >= pairs || (z > 2 && Math.abs(x - main.x) < main.halfWidth + 0.15)
      }
      dummy.position.set(x, groundHeight(x, z) + 0.045, z)
      dummy.rotation.set(0, i * 1.3, 0)
      dummy.scale.set(0.13 + (i % 3) * 0.025, 0.085, 0.17)
      if (hidden) dummy.scale.setScalar(0)
      dummy.updateMatrix()
      stones.current.setMatrixAt(i, dummy.matrix)
    }
    for (const mesh of [stems.current, petals.current, hearts.current, stones.current]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    bases.current = {
      roots,
      matrices: [stems.current, petals.current, hearts.current].map((mesh) =>
        Array.from({ length: mesh.count }, (_, i) => {
          const matrix = new THREE.Matrix4()
          mesh.getMatrixAt(i, matrix)
          return matrix
        }),
      ),
    }
    if (flying.current) {
      flying.current.instanceMatrix.needsUpdate = true
      if (flying.current.instanceColor) flying.current.instanceColor.needsUpdate = true
    }
    invalidate()
  }, [houseX, riverX, flora, snow, invalidate, connections])
  // 共用花根作为旋转支点：花瓣、花心、茎一起弯，不把整片花坛平移。
  useFrame((_, delta) => {
    const base = bases.current
    if (!base || !moving || !stems.current || !petals.current || !hearts.current) return
    time.current += Math.min(delta, 0.05)
    const t = time.current
    const { pivot, particle, transform, local } = scratch
    const meshes = [stems.current, petals.current, hearts.current]
    for (let i = 0; i < 160; i++) {
      const root = base.roots[i]
      const bend = wind.canopy * 1.8 * (0.6 + 0.25 * Math.sin(t * (1.4 + wind.strength * 2) + i))
      pivot.position.copy(root)
      pivot.rotation.set(wind.z * bend, 0, -wind.x * bend)
      pivot.updateMatrix()
      transform.makeTranslation(-root.x, -root.y, -root.z).premultiply(pivot.matrix)
      for (let part = 0; part < 3; part++) {
        const count = part === 1 ? 8 : 1
        for (let j = 0; j < count; j++) {
          const index = i * count + j
          local.multiplyMatrices(transform, base.matrices[part][index])
          meshes[part].setMatrixAt(index, local)
        }
      }
    }
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true
    if (!flying.current) return
    for (let i = 0; i < 64; i++) {
      const root = base.roots[i]
      const phase = (t * (0.12 + wind.strength * 0.18) + i * 0.618) % 1
      const travel = phase * (3 + wind.strength * 8)
      particle.position.set(
        root.x + wind.x * travel,
        root.y + 0.4 + Math.sin(phase * Math.PI) * (0.4 + wind.strength * 1.7),
        root.z + wind.z * travel,
      )
      particle.rotation.set(t * 2 + i, i + phase * 9, t + i)
      const alive = i < Math.ceil(wind.debris * 64) && base.matrices[0][i].elements[0] !== 0
      const scale = alive ? Math.sin(Math.PI * phase) * wind.debris * (1 - snow * 0.8) : 0
      particle.scale.set(0.115 * scale, 0.027 * scale, 0.07 * scale)
      particle.updateMatrix()
      flying.current.setMatrixAt(i, particle.matrix)
    }
    flying.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={stems} args={[undefined, undefined, 160]}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#547848" />
      </instancedMesh>
      <instancedMesh ref={petals} args={[undefined, undefined, 1280]} castShadow receiveShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={hearts} args={[undefined, undefined, 160]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={flora.season === 'summer' ? '#b98634' : '#e7c46a'} />
      </instancedMesh>
      <instancedMesh ref={stones} args={[undefined, undefined, 152]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={snow ? '#e8eeeb' : '#cbbd9f'} roughness={0.94 - snow * 0.1} />
      </instancedMesh>
      <instancedMesh ref={flying} args={[undefined, undefined, 64]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </>
  )
}

function GardenLamp({ position, night, lit }: { position: Point; night: number; lit: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.1, 8]} />
        <meshStandardMaterial color="#514d3c" />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#514d3c" />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.24, 4]} />
        <meshStandardMaterial
          color="#eadab1"
          emissive="#ffbc59"
          emissiveIntensity={night * 2.4}
          roughness={0.4}
        />
      </mesh>
      <mesh castShadow position={[0, 0.81, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.21, 0.16, 4]} />
        <meshStandardMaterial color="#514d3c" />
      </mesh>
      {lit && (
        <pointLight
          position={[0, 0.6, 0]}
          color="#ffc575"
          intensity={night * 1.4}
          distance={2.8}
          decay={2}
        />
      )}
    </group>
  )
}

function Garden({
  houseX,
  riverX,
  snow,
  wet,
  night,
  flora,
  wind,
  moving,
}: {
  houseX: number
  riverX: number
  snow: number
  wet: number
  night: number
  flora: SceneState['flora']
  wind: SceneState['wind']
  moving: boolean
}) {
  const connections = useMemo(() => connectingPaths(houseX, riverX), [houseX, riverX])
  return (
    <>
      <FlowerBeds
        houseX={houseX}
        riverX={riverX}
        flora={flora}
        snow={snow}
        wind={wind}
        moving={moving}
      />
      {Array.from({ length: 6 }, (_, i) => {
        const path = gardenPath(0.04 + Math.floor(i / 2) * 0.11, houseX)
        const x = path.x + (i % 2 ? 1 : -1) * (path.halfWidth + 0.3)
        if (onConnectingPath(x, path.z, connections, 0.22)) return null
        return (
          <GardenLamp
            key={i}
            position={[x, groundHeight(x, path.z), path.z]}
            night={night}
            lit={i < 2}
          />
        )
      })}
      {connections.flatMap((route, routeIndex) =>
        (routeIndex === 0 ? [20] : [8, 18, 29]).flatMap((index, station) =>
          [-1, 1].map((side) => {
            const { x, z } = pathEdge(route, index, side, 0.34)
            const main = pathAtZ(z, houseX)
            if (
              !clearOfRiver(x, z, riverX, 0.35) ||
              (z > 2 && Math.abs(x - main.x) < main.halfWidth + 0.2)
            )
              return null
            return (
              <GardenLamp
                key={`${routeIndex}-${index}-${side}`}
                position={[x, groundHeight(x, z), z]}
                night={night}
                lit={side === -1 && station < 2}
              />
            )
          }),
        ),
      )}
      {[-1, 1]
        .filter((side) =>
          [3.15, 4.35, 5.55].every((offset) => clearOfRiver(houseX + side * offset, -2.1, riverX)),
        )
        .map((side) => (
          <group
            key={side}
            position={[houseX + side * 3.15, groundHeight(houseX + side * 3.15, -2.1), -2.1]}
            rotation={[0, 0, -0.004 * (houseX + side * 4.35)]}
          >
            {[0, 0.8, 1.6, 2.4].map((x) => (
              <RoundedBox
                key={x}
                args={[0.15, 0.85, 0.16]}
                radius={0.055}
                smoothness={2}
                position={[side * x, 0.28, 0]}
                castShadow
              >
                <meshStandardMaterial color="#b88651" />
              </RoundedBox>
            ))}
            {[0.2, 0.55].map((y) => (
              <RoundedBox
                key={y}
                args={[2.65, 0.14, 0.12]}
                radius={0.03}
                smoothness={2}
                position={[side * 1.2, y, 0.07]}
                castShadow
              >
                <meshStandardMaterial color={snow ? '#f2f8f6' : '#c5965d'} />
              </RoundedBox>
            ))}
          </group>
        ))}
      {wet > 0 &&
        [0, 1, 2]
          .filter((i) => clearOfRiver(houseX - 2.8 + i * 3, 4 + i, riverX, 0.85))
          .map((i) => (
            <mesh
              key={i}
              position={[
                houseX - 2.8 + i * 3,
                groundHeight(houseX - 2.8 + i * 3, 4 + i) + 0.045,
                4 + i,
              ]}
              rotation={[-Math.PI / 2, 0, i]}
              scale={[0.7 + i * 0.12, 0.35, 1]}
            >
              <circleGeometry args={[1, 32]} />
              <meshPhysicalMaterial
                color="#b5d2cb"
                transparent
                opacity={wet * 0.52}
                roughness={0.08}
                metalness={0.15}
              />
            </mesh>
          ))}
    </>
  )
}

function World({ state, moving }: { state: SceneState; moving: boolean }) {
  const { size } = useThree()
  const compact = size.width < 850
  const height = compact ? 10.6 : 13.8
  const width = (height * size.width) / size.height
  const houseX = compact ? 0.8 : width * 0.23
  const riverX = houseX - (compact ? 4.4 : 7.3)
  const localWind = {
    ...state.wind,
    x: state.wind.x * Math.cos(COTTAGE_YAW) - state.wind.z * Math.sin(COTTAGE_YAW),
    z: state.wind.x * Math.sin(COTTAGE_YAW) + state.wind.z * Math.cos(COTTAGE_YAW),
  }
  const light = useRef<THREE.DirectionalLight>(null)
  useFrame(({ clock }) => {
    if (light.current)
      light.current.intensity =
        state.directIntensity +
        (moving && state.thunder && Math.sin(clock.elapsedTime * 0.9) > 0.997 ? 1.8 : 0)
  })
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 24]}
        rotation={[-Math.atan((10 - (compact ? 2.2 : 4.1)) / 24), 0, 0]}
        zoom={size.height / height}
        near={0.1}
        far={100}
      />
      <fogExp2
        attach="fog"
        args={[
          new THREE.Color('#182837').lerp(new THREE.Color('#c7dbd2'), state.day),
          state.fogDensity,
        ]}
      />
      <ambientLight intensity={state.ambientIntensity * 0.4} />
      <hemisphereLight
        color={new THREE.Color('#8bace0').lerp(new THREE.Color('#d7efff'), state.day)}
        groundColor={new THREE.Color('#243950').lerp(new THREE.Color('#b7ac72'), state.day)}
        intensity={state.ambientIntensity}
      />
      <directionalLight
        ref={light}
        position={state.lightPosition}
        color={state.lightColor}
        intensity={state.directIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
        shadow-normalBias={0.045}
        shadow-radius={4}
      />
      <directionalLight position={[0, 5, 12]} color="#c5dcfa" intensity={0.08 + state.day * 0.17} />
      <Terrain
        snow={state.snow}
        wet={state.wet}
        houseX={houseX}
        riverX={riverX}
        flora={state.flora}
      />
      <Meadow snow={state.snow} houseX={houseX} riverX={riverX} flora={state.flora} />
      <IslandRiver
        riverX={riverX}
        snow={state.snow}
        wet={state.wet}
        night={state.night}
        moving={moving}
      />
      <group position={[houseX, groundHeight(houseX, 0), 0]} rotation={[0, COTTAGE_YAW, 0]}>
        <IslandCottage
          snow={state.snow}
          wet={state.wet}
          night={state.lamps}
          smoke={state.smoke}
          moving={moving}
          wind={localWind}
        />
        <IslandFestivalDecor
          festival={state.festival}
          night={state.lamps}
          moving={moving}
          wind={localWind}
        />
      </group>
      <Garden
        houseX={houseX}
        riverX={riverX}
        snow={state.snow}
        wet={state.wet}
        night={state.lamps}
        flora={state.flora}
        wind={state.wind}
        moving={moving}
      />
      <IslandLandscapeFestivals
        festival={state.festival}
        houseX={houseX}
        riverX={riverX}
        lamps={state.lamps}
        moving={moving}
        wind={state.wind}
      />
      {(compact
        ? [
            [-2.8, -3.2, 0.72],
            [3.4, -1.2, 0.86],
            [5.3, -5, 0.95],
            [-6.6, -2.3, 0.83],
          ]
        : [
            [-3.8, -0.8, 0.92],
            [4.2, 0.3, 1.05],
            [6, -4.8, 0.95],
            [-10.3, -2.8, 0.95],
          ]
      ).map(([x, z, scale], i) => (
        <Tree
          key={i}
          position={[houseX + x, groundHeight(houseX + x, z), z]}
          scale={scale}
          seed={i * 2.1}
          snow={state.snow}
          wind={state.wind}
          moving={moving}
          flora={state.flora}
          pine={i > 1}
          christmas={state.festival?.id === 'christmas'}
          lamps={state.lamps}
        />
      ))}
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i - 6) * 4.1,
          z = -6.2 + Math.sin(i * 3) * 0.65
        if (!clearOfRiver(x, z, riverX, 0.65)) return null
        return (
          <Tree
            key={i}
            position={[x, groundHeight(x, z), z]}
            scale={0.38 + (i % 3) * 0.075}
            seed={i}
            snow={state.snow}
            wind={state.wind}
            moving={moving}
            flora={state.flora}
            pine={i % 3 === 0}
            christmas={state.festival?.id === 'christmas'}
            lamps={state.lamps}
          />
        )
      })}
      <Cloud
        position={[compact ? -4 : width * 0.02, compact ? 6.1 : 7.4, -6]}
        scale={0.75}
        moving={moving}
        storm={state.wet > 0}
        wind={state.wind}
      />
      <Cloud
        position={[width * 0.41, 6.4, -7]}
        scale={0.58}
        moving={moving}
        storm={state.wet > 0}
        wind={state.wind}
      />
    </>
  )
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <div className="island-scene-fallback" /> : this.props.children
  }
}

export default function IslandScene() {
  const { sky, weather } = useTheme()
  const container = useRef<HTMLDivElement>(null)
  const [moving, setMoving] = useState(false)
  const state = islandSceneState(sky, weather)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    const update = () => setMoving(visible && !document.hidden && !media.matches)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    if (container.current) observer.observe(container.current)
    media.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return (
    <div
      className="island-scene-3d"
      ref={container}
      aria-hidden="true"
      data-motion={moving ? 'playing' : 'paused'}
      data-season={state.flora.season}
      data-blossom={state.flora.blossom}
      data-festival={state.festival?.id ?? 'none'}
      data-smoke={state.smoke}
      data-wind={state.wind.label}
      data-lamps={state.lamps.toFixed(2)}
    >
      <SceneBoundary>
        <Canvas
          orthographic
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 1.5]}
          frameloop={moving ? 'always' : 'demand'}
          camera={{ position: [0, 10, 24], zoom: 50, near: 0.1, far: 100 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          fallback={<div className="island-scene-fallback" />}
        >
          <World state={state} moving={moving} />
        </Canvas>
      </SceneBoundary>
    </div>
  )
}
