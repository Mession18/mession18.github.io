import boundaries from './china-cities.generated.json'

/** 仅在中国地图的放大镜打开时加载市级边界。 */
export default function ChinaCityBoundaries() {
  return (
    <g className="journey-atlas-city-boundaries" aria-hidden="true">
      {boundaries.cities.map((city) => (
        <path
          key={city.id}
          d={(city.path ?? '') + (city.insetPath ?? '')}
          data-city-boundary={city.name}
        />
      ))}
    </g>
  )
}
