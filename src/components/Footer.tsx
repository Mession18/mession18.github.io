export function Footer() {
  return (
    <footer>
      <div className="footer-wave" />
      <div className="footer-inner">
        <div className="brand">
          <span className="brand-leaf">
            <img src="/images/nav/icon-home.svg" alt="" />
          </span>
          <span>风铃岛通信</span>
        </div>
        <p>一个关于生活、游戏与慢慢长大的个人博客。</p>
        <small>
          © 2026 风铃岛 · 非官方原创海岛主题 · 部分界面组件来自{' '}
          <a href="https://github.com/guokaigdg/animal-island-ui">Animal-Island-UI</a>
        </small>
      </div>
    </footer>
  )
}
