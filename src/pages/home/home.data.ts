/** 按 UTC 毫秒计算日期序号，用于首页每日推荐的稳定起点。 */
export const currentDayNumber = Math.floor(Date.now() / 86400000)

/** 先播放刷新图标摇摆动画，再延迟触发换内容，配合首页按钮反馈。 */
export function animateItemRefresh(button: HTMLButtonElement, action: () => void) {
  button
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
  window.setTimeout(action, 180)
}
