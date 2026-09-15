/** 只取原图的纸页范围；主地图和放大镜共用同一取景，保留页内装饰。 */
export function AtlasPaper({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="22 10 1492 1000"
      width="1536"
      height="1024"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <image href="/images/passport/旅行地图书页.webp" width="1536" height="1024" />
    </svg>
  )
}
