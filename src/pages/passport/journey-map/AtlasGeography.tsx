import { lazy, Suspense } from 'react'
import {
  atlasCountries,
  atlasLabels,
  chinaProvinces,
  chinaInset,
  worldMapTransform,
  type AtlasVariant,
} from './journey-map.data'

const ChinaCityBoundaries = lazy(() => import('./ChinaCityBoundaries'))

/** 底图与放大镜共用真实轮廓；标签是单独的交互层。 */
export function AtlasGeography({
  variant,
  visited,
  detailed = false,
}: {
  variant: AtlasVariant
  visited: Set<string>
  detailed?: boolean
}) {
  return (
    <g transform={variant === 'world' ? worldMapTransform : undefined}>
      <g className={'journey-atlas-land' + (detailed ? ' is-detailed' : '')}>
        {variant === 'world'
          ? atlasCountries.map((country) => (
              <path
                key={country.id}
                d={country.path ?? undefined}
                className={visited.has(country.code) ? 'is-visited' : undefined}
              >
                <title>{country.name}</title>
              </path>
            ))
          : chinaProvinces.map((province) => (
              <path
                key={province.id}
                d={province.path ?? undefined}
                className={
                  (visited.has(province.shortName) ? 'is-visited ' : '') +
                  (!province.shortName ? 'is-maritime-boundary' : '')
                }
                data-province={province.shortName}
              >
                <title>{province.name}</title>
              </path>
            ))}
      </g>
      {variant === 'china' && (
        <g className="journey-atlas-south-sea" aria-label="南海诸岛附图">
          <rect
            x={chinaInset.x}
            y={chinaInset.y}
            width={chinaInset.width}
            height={chinaInset.height}
            rx="5"
          />
          <text x={chinaInset.x + chinaInset.width / 2} y={chinaInset.y + 24}>
            南海诸岛
          </text>
          <g className="journey-atlas-land">
            {chinaInset.paths.map((entry) => (
              <path
                key={entry.id}
                d={entry.path ?? undefined}
                className={entry.maritime ? 'is-maritime-boundary' : undefined}
              />
            ))}
          </g>
        </g>
      )}
      {variant === 'china' && detailed && (
        <Suspense fallback={null}>
          <ChinaCityBoundaries />
        </Suspense>
      )}
      <g className="journey-atlas-labels" aria-hidden="true">
        {variant === 'world'
          ? atlasLabels.map((label) => (
              <text
                key={label.x + '-' + label.y}
                x={label.x}
                y={label.y}
                className={label.ocean ? 'is-ocean' : undefined}
              >
                {label.lines.map((line, index) => (
                  <tspan key={line} x={label.x} dy={index ? 23 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            ))
          : detailed
            ? null
            : chinaProvinces.map((province) =>
                province.position && province.shortName ? (
                  <text
                    key={province.id}
                    x={province.position[0]}
                    y={province.position[1] + 20}
                    className="journey-atlas-province-name"
                  >
                    {province.shortName}
                  </text>
                ) : null,
              )}
      </g>
    </g>
  )
}
