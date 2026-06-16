import {Option} from 'effect'
import {getContactByIdAsync} from 'expo-contacts'
import React, {useEffect, useState} from 'react'
import {Platform} from 'react-native'
import {FilterImage} from 'react-native-svg/filter-image'
import {getTokens} from 'tamagui'
import {type NonUniqueContactId} from '../state/contacts/domain'

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

interface ImageDetails {
  uri: string
  isABImageOnIos: boolean
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
  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null)

  useEffect(() => {
    if (Option.isNone(contactId)) return

    setImageDetails(null)

    void getContactByIdAsync(contactId.value)
      .then((contact) => {
        const contactImageUri = contact?.image?.uri

        if (contactImageUri) {
          setImageDetails({
            uri: contactImageUri,
            isABImageOnIos: !!(
              Platform.OS === 'ios' && contact.id?.includes(':ABPerson')
            ),
          })
        }
      })
      .catch((err) => {
        console.debug('Error loading image', err)
      })
  }, [contactId])

  // TODO: lets monitor this issue in https://github.com/vexl-it/vexl/issues/1984
  // and then change back to previous behaviour once fixed
  if (!imageDetails || imageDetails?.isABImageOnIos) {
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
      source={{uri: imageDetails.uri}}
    />
  )
}
