import { useState } from 'react'

/** 图片加载失败后使用页面自己的缺图展示；切换地址时自动允许重试。 */
export function useImageSource(source?: string) {
  /** 记住加载失败的具体地址，切换到新地址后自动允许再次加载。 */
  const [failedSource, setFailedSource] = useState<string>()
  return {
    image: source && source !== failedSource ? source : undefined,
    onError: () => setFailedSource(source),
  }
}
