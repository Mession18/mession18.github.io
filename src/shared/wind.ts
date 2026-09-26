/** 气象风向表示来向（北 0°、东 90°）；场景东在 -x、南在 +z，返回实际流向。
 * km/h 与阵风采用 Open-Meteo 10 m 数据；动画阈值是装饰效果分级，不是台风识别。
 */
export function sceneWind({
  windSpeed,
  windGusts,
  windDirection,
}: {
  windSpeed: number
  windGusts?: number
  windDirection?: number
}) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  const speed = Number.isFinite(windSpeed) ? Math.max(0, Math.min(250, windSpeed)) : 0
  const gusts = Number.isFinite(windGusts) ? Math.max(speed, Math.min(250, windGusts!)) : speed
  const direction = Number.isFinite(windDirection) ? ((windDirection! % 360) + 360) % 360 : 0
  const radians = (direction * Math.PI) / 180
  const effective = speed * 0.7 + gusts * 0.3
  const strength = clamp(effective / 110)
  return {
    speed,
    gusts,
    direction,
    x: Math.sin(radians),
    z: Math.cos(radians),
    strength,
    canopy: 0.018 * Math.sqrt(strength) + 0.28 * strength ** 1.5,
    trunk: 0.14 * clamp((effective - 28) / 90) ** 1.3,
    debris: clamp((effective - 40) / 65),
    label:
      effective < 2
        ? '静风'
        : effective < 20
          ? '微风'
          : effective < 39
            ? '有风'
            : effective < 62
              ? '强风'
              : effective < 90
                ? '暴风'
                : '极强风',
  }
}
