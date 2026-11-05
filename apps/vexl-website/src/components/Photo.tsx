'use client'

import {YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {photos, type PhotoKey} from '../config/photos'

/** A rounded photo. With `flex` it fills its share of the parent instead of keeping its aspect ratio. */
export function Photo({
  photo,
  alt,
  sizes,
  aspectRatio,
  flex,
  priority,
}: {
  readonly photo: PhotoKey
  readonly alt: string
  readonly sizes: string
  readonly aspectRatio?: number
  readonly flex?: number
  readonly priority?: boolean
}): React.JSX.Element {
  const {src, width, height} = photos[photo]
  return (
    <YStack
      flex={flex}
      aspectRatio={flex ? undefined : (aspectRatio ?? width / height)}
      borderRadius="$8"
      overflow="hidden"
      backgroundColor="$backgroundSecondary"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{objectFit: 'cover'}}
      />
    </YStack>
  )
}
