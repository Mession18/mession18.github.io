import { Image } from 'animal-island-ui'
import type { MouseEvent } from 'react'

export function PreviewableImage({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  const keepPreviewHere = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }
  return (
    <span className={`content-preview-image ${className}`} onClick={keepPreviewHere}>
      <Image src={src} alt={alt} preview />
    </span>
  )
}
