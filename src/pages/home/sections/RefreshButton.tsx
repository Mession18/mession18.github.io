export function RefreshButton({
  className,
  icon,
  children,
  disabled,
  onRefresh,
}: {
  className: string
  icon: string
  children: string
  disabled: boolean
  onRefresh: () => void
}) {
  return (
    <button
      className={`item-refresh ${className}`}
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.currentTarget
          .querySelector('img')
          ?.animate(
            [
              { transform: 'rotate(0deg) scale(1)' },
              { transform: 'rotate(-12deg) scale(1.08)' },
              { transform: 'rotate(11deg) scale(1.08)' },
              { transform: 'rotate(-7deg) scale(1.04)' },
              { transform: 'rotate(0deg) scale(1)' },
            ],
            { duration: 420, easing: 'ease-in-out' },
          )
        // 在摇摆动画中途替换内容，与图标反馈同步。
        window.setTimeout(onRefresh, 180)
      }}
    >
      <img src={icon} alt="" /> <span>{children}</span>
    </button>
  )
}
