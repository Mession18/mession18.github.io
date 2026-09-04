import { useState } from 'react'

/** 读取图片自然宽高，为横图和竖图选择展示类；失败事件交回页面显示缺图状态。 */
export function AdaptivePreviewImage({
  src,
  alt,
  className = '',
  onError,
}: {
  src: string
  alt: string
  className?: string
  onError?: () => void
}) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')

  return (
    <img
      className={`adaptive-preview-image is-${orientation} ${className}`}
      src={src}
      onError={onError}
      alt={alt}
      onLoad={(event) => {
        const image = event.currentTarget
        setOrientation(image.naturalHeight > image.naturalWidth ? 'portrait' : 'landscape')
      }}
    />
  )
}
