import { useState } from 'react'

export function AdaptivePreviewImage({ src, alt }: { src: string; alt: string }) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')

  return (
    <img
      className={`adaptive-preview-image is-${orientation}`}
      src={src}
      alt={alt}
      onLoad={(event) => {
        const image = event.currentTarget
        setOrientation(image.naturalHeight > image.naturalWidth ? 'portrait' : 'landscape')
      }}
    />
  )
}
