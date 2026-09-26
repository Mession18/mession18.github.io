import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type {} from '@react-three/fiber'
import * as THREE from 'three'

const LAYERS = [0, 1, 2].map((i) => ({
  y: 1.65 + i * 0.75,
  radius: 1.2 - i * 0.27,
  height: 1.65 - i * 0.17,
}))
const LIGHT_COLORS = ['#ef725e', '#ffe29b', '#8ad5c5', '#9cbcf4']
const STAR_EXTRUSION = {
  depth: 0.045,
  bevelEnabled: true,
  bevelSize: 0.012,
  bevelThickness: 0.012,
  bevelSegments: 2,
  steps: 1,
}

/** A slope-following snow shell with an uneven, rounded edge tucked into the needles. */
function snowShell(layer: (typeof LAYERS)[number], amount: number, seed: number) {
  const segments = 64
  const surfaceRings = 12
  const rimRings = 4
  const rings = surfaceRings + rimRings
  const thickness = 0.01 + amount * 0.045
  const positions: number[] = []
  const indices: number[] = []
  for (let ring = 0; ring <= rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2
      const coverage =
        0.69 +
        Math.sqrt(amount) * 0.22 +
        Math.sin(angle * 5 + seed * 1.8) * 0.023 +
        Math.cos(angle * 9 - seed) * 0.014
      const edgeRadius = layer.radius * coverage
      const edgeY = layer.height / 2 - layer.height * coverage
      let radius: number
      let y: number
      if (ring <= surfaceRings) {
        const t = ring / surfaceRings
        radius = edgeRadius * t + Math.sin((Math.min(1, t * 5) * Math.PI) / 2) * thickness * 0.5
        y = layer.height / 2 - layer.height * coverage * t + thickness * (1 - t * 0.3)
      } else {
        const t = (ring - surfaceRings) / rimRings
        // Roll the overhanging edge back into the solid crown instead of leaving an open cap.
        radius = edgeRadius + thickness * ((1 - t) ** 2 * 0.5 + 2 * (1 - t) * t - t * t * 0.1)
        y = edgeY + thickness * ((1 - t) ** 2 * 0.7 - 2 * (1 - t) * t * 0.35 - t * t * 0.08)
      }
      positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      if (ring === rings) continue
      const a = ring * segments + segment
      const b = ring * segments + ((segment + 1) % segments)
      indices.push(a, b, b + segments, a, b + segments, a + segments)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function crownRadius(y: number) {
  return Math.max(
    0,
    ...LAYERS.map((layer) => {
      const fromTop = (layer.y + layer.height / 2 - y) / layer.height
      return fromTop >= 0 && fromTop <= 1 ? layer.radius * fromTop : 0
    }),
  )
}

function ChristmasLights({ lamps }: { lamps: number }) {
  const bulbs = useRef<(THREE.InstancedMesh | null)[]>([])
  const ornaments = useRef<THREE.InstancedMesh>(null)
  const decorations = useMemo(() => {
    const lightPoints: THREE.Vector3[][] = LIGHT_COLORS.map(() => [])
    const ornaments: THREE.Vector3[] = []
    const wires = LAYERS.map((layer, layerIndex) => {
      function point(angle: number) {
        const y = layer.y - layer.height * 0.12 + Math.sin(angle * 2 + layerIndex) * 0.055
        // Clear even the thickest snow shell and follow the outermost overlapping layer.
        const radius = crownRadius(y) + 0.09
        return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      }
      for (let i = 0; i < 12; i++) {
        lightPoints[i % LIGHT_COLORS.length].push(point((i / 12) * Math.PI * 2))
      }
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + layerIndex * 0.55 + 0.3
        const y = layer.y - layer.height * 0.31 + (i % 2) * 0.055
        const radius = crownRadius(y) + 0.13
        ornaments.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
      }
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 48 }, (_, i) => point((i / 48) * Math.PI * 2)),
        true,
      )
      return new THREE.TubeGeometry(curve, 72, 0.011, 5, true)
    })
    const star = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + (i * Math.PI) / 5
      const radius = i % 2 ? 0.082 : 0.18
      if (i === 0) star.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
      else star.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    star.closePath()
    return { wires, lightPoints, ornaments, star }
  }, [])
  useEffect(() => () => decorations.wires.forEach((wire) => wire.dispose()), [decorations])
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    decorations.lightPoints.forEach((points, group) => {
      const mesh = bulbs.current[group]
      if (!mesh) return
      points.forEach((point, i) => {
        dummy.position.copy(point)
        dummy.scale.set(0.047, 0.062, 0.047)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    })
    if (!ornaments.current) return
    const color = new THREE.Color()
    decorations.ornaments.forEach((point, i) => {
      dummy.position.copy(point)
      dummy.scale.setScalar(0.091 - Math.floor(i / 4) * 0.013)
      dummy.updateMatrix()
      ornaments.current!.setMatrixAt(i, dummy.matrix)
      ornaments.current!.setColorAt(i, color.set(['#ba4741', '#e4ba61', '#7cbdb5'][i % 3]))
    })
    ornaments.current.instanceMatrix.needsUpdate = true
    if (ornaments.current.instanceColor) ornaments.current.instanceColor.needsUpdate = true
    ornaments.current.computeBoundingSphere()
  }, [decorations])
  return (
    <group>
      {decorations.wires.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial color="#405b45" roughness={0.9} />
        </mesh>
      ))}
      {LIGHT_COLORS.map((color, i) => (
        <instancedMesh
          key={color}
          ref={(mesh) => {
            bulbs.current[i] = mesh
          }}
          args={[undefined, undefined, decorations.lightPoints[i].length]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={lamps * 2.4}
            roughness={0.35}
          />
        </instancedMesh>
      ))}
      <instancedMesh
        ref={ornaments}
        args={[undefined, undefined, decorations.ornaments.length]}
        castShadow
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial metalness={0.3} roughness={0.3} />
      </instancedMesh>
      <mesh position={[0, 3.86, 0]}>
        <cylinderGeometry args={[0.018, 0.025, 0.14, 8]} />
        <meshStandardMaterial color="#bd9551" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0, 3.98, -0.023]} castShadow>
        <extrudeGeometry args={[decorations.star, STAR_EXTRUSION]} />
        <meshStandardMaterial
          color="#f3c967"
          emissive="#ffc867"
          emissiveIntensity={lamps * 1.4}
          metalness={0.25}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

export function IslandPineCrown({
  snow,
  color,
  christmas,
  lamps,
}: {
  snow: number
  color: string
  christmas: boolean
  lamps: number
}) {
  const amount = THREE.MathUtils.clamp(snow, 0, 1)
  const snowGeometries = useMemo(
    () => (amount > 0 ? LAYERS.map((layer, i) => snowShell(layer, amount, i)) : []),
    [amount],
  )
  useEffect(() => () => snowGeometries.forEach((geometry) => geometry.dispose()), [snowGeometries])
  return (
    <group>
      {LAYERS.map((layer, i) => (
        <group key={i} position={[0, layer.y, 0]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[layer.radius, layer.height, 32]} />
            <meshStandardMaterial color={color} roughness={0.94} />
          </mesh>
          {snowGeometries[i] && (
            <mesh geometry={snowGeometries[i]} castShadow receiveShadow>
              <meshStandardMaterial color="#eff5f2" roughness={0.97} />
            </mesh>
          )}
        </group>
      ))}
      {christmas && <ChristmasLights lamps={lamps} />}
    </group>
  )
}
