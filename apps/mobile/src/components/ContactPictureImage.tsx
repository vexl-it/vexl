import {Option} from 'effect'
import React, {useEffect, useState} from 'react'
import {FilterImage} from 'react-native-svg/filter-image'
import {getTokens} from 'tamagui'
import {type NonUniqueContactId} from '../state/contacts/domain'
import {getContactImageUri} from '../state/contacts/getContactImageUri'

const GRAYSCALE_FILTER = [
  {name: 'feColorMatrix', type: 'saturate', values: 0},
] satisfies React.ComponentProps<typeof FilterImage>['filters']

type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

interface Props {
  // undefined to make it easier to use with ContactInfo. TODO remove once nonUniqueContactId is required
  readonly contactId: Option.Option<NonUniqueContactId>
  readonly fallback?: React.ReactNode
  readonly grayscale?: boolean
  readonly width?: number
  readonly height?: number
  readonly borderRadius?: number | string
  readonly br?: number | string
  readonly objectFit?: ObjectFit
}

function buildRadiusTokenMap(): Record<string, number> {
  const tokens = getTokens()

  return {
    $0: tokens.radius[0].val,
    $1: tokens.radius[1].val,
    $2: tokens.radius[2].val,
    '$2.5': tokens.radius[2.5].val,
    $3: tokens.radius[3].val,
    $4: tokens.radius[4].val,
    $5: tokens.radius[5].val,
    $6: tokens.radius[6].val,
    $7: tokens.radius[7].val,
    $8: tokens.radius[8].val,
    $9: tokens.radius[9].val,
    $10: tokens.radius[10].val,
    $11: tokens.radius[11].val,
    $true: tokens.radius.true.val,
  }
}

const RADIUS_TOKEN_MAP = buildRadiusTokenMap()

function resolveBorderRadius(
  borderRadius: Props['borderRadius']
): number | undefined {
  if (typeof borderRadius === 'number') return borderRadius
  if (typeof borderRadius !== 'string') return undefined

  return RADIUS_TOKEN_MAP[borderRadius]
}

function resolveResizeMode(
  objectFit: ObjectFit | undefined
): React.ComponentProps<typeof FilterImage>['resizeMode'] {
  if (objectFit === 'contain') return 'contain'
  if (objectFit === 'fill') return 'stretch'
  if (objectFit === 'none' || objectFit === 'scale-down') return 'center'

  return 'cover'
}

export default function ContactPictureImage({
  contactId,
  fallback,
  grayscale = false,
  width,
  height,
  borderRadius,
  br,
  objectFit,
}: Props): React.ReactElement | null {
  const [imageUri, setImageUri] = useState<string | null>(null)

  useEffect(() => {
    setImageUri(null)
    if (Option.isNone(contactId)) return

    let cancelled = false

    void getContactImageUri(contactId.value)
      .then((uri) => {
        if (!cancelled) setImageUri(uri)
      })
      .catch((err) => {
        if (!cancelled) console.debug('Error loading image', err)
      })

    return () => {
      cancelled = true
    }
  }, [contactId])

  if (!imageUri) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <FilterImage
      style={{
        width,
        height,
        borderRadius: resolveBorderRadius(borderRadius ?? br),
      }}
      resizeMode={resolveResizeMode(objectFit)}
      filters={grayscale ? GRAYSCALE_FILTER : undefined}
      width={width}
      height={height}
      source={{uri: imageUri}}
    />
  )
}
