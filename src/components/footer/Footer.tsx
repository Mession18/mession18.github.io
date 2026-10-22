import { setting, settingStyle } from '../../shared/site-settings'
/** 全站页脚的署名、说明和链接；在这里修改所有页面共同的底部内容。 */
export function Footer() {
  return (
    <footer>
      <div className="footer-wave" />
      <div className="footer-inner">
        <div className="brand">
          <span className="brand-leaf">
            <img src="/images/common/icons/icon-home.svg" alt="" />
          </span>
          <span style={settingStyle('footer.brand')}>{setting('footer.brand')}</span>
        </div>
        <p style={settingStyle('footer.description')}>{setting('footer.description')}</p>
        <small style={settingStyle('footer.copyright')}>
          {setting('footer.copyright')}{' '}
          {setting('footer.linkUrl') ? (
            <a href={setting('footer.linkUrl')} style={settingStyle('footer.linkLabel')}>
              {setting('footer.linkLabel')}
            </a>
          ) : (
            <span>{setting('footer.linkLabel')}</span>
          )}
        </small>
      </div>
    </footer>
  )
}
