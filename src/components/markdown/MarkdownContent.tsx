import { Icon, Image, Typewriter, type IconName } from 'animal-island-ui'
import { icons } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { countryFlags } from '../../shared/data'
import { resolveMarkdownImage } from '../../shared/utils'

/** 正文渲染器：支持 GFM 表格、图片预览、国旗及图标链接，并解析栏目相对图片路径。 */
export function MarkdownContent({ children, sourceDir }: { children: string; sourceDir?: string }) {
  /** 将 Markdown 图片地址中的空格编码，避免带空格的文件名被解析成错误链接。 */
  const normalizedMarkdown = children.replace(
    /!\[([^\]]*)\]\(([^)\r\n]+)\)/g,
    (_match, alt: string, path: string) => `![${alt}](${path.trim().replaceAll(' ', '%20')})`,
  )
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img({ src = '', alt = '' }) {
          return (
            <Image
              src={resolveMarkdownImage(src, sourceDir)}
              alt={alt}
              preview
              className="markdown-preview-image detail-preview-image"
            />
          )
        },
        a({ href = '', children: label }) {
          if (href.startsWith('flag:')) {
            const code = href.slice(5).toLowerCase()
            const flag = countryFlags[code]
            return flag ? (
              <img className="markdown-flag-icon" src={flag} alt={code.toUpperCase()} />
            ) : (
              <>{label}</>
            )
          }
          if (href.startsWith('lucide:')) {
            const name = href.slice(7) as keyof typeof icons
            const LucideIcon = icons[name]
            return LucideIcon ? (
              <LucideIcon className="markdown-inline-icon" size={20} />
            ) : (
              <>{label}</>
            )
          }
          if (href.startsWith('island:'))
            return (
              <Icon name={href.slice(7) as IconName} size={24} className="markdown-inline-icon" />
            )
          if (href.startsWith('typewriter:')) return <Typewriter speed={65}>{label}</Typewriter>
          return <a href={href}>{label}</a>
        },
        blockquote({ children }) {
          return <aside className="markdown-island-panel">{children}</aside>
        },
      }}
    >
      {normalizedMarkdown}
    </ReactMarkdown>
  )
}
