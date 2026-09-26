import { useState } from 'react'

/** 图片加载失败后使用页面自己的缺图展示；切换地址时自动允许重试。 */
export function useImageSource(source?: string) {
  const [failedSource, setFailedSource] = useState<string>()
  return {
    image: source && source !== failedSource ? source : undefined,
    onError: () => setFailedSource(source),
  }
}
