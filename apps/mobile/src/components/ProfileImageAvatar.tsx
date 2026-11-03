import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Avatar, type AvatarProps} from '@vexl-next/ui'
import React from 'react'
import resolveLocalUri from '../utils/resolveLocalUri'

type Props = Omit<AvatarProps, 'source' | 'svgXml' | 'children'> & {
  readonly image: SvgStringOrImageUri
}

export function ProfileImageAvatar({
  image,
  ...avatarProps
}: Props): React.JSX.Element {
  return image.type === 'svgXml' ? (
    <Avatar {...avatarProps} svgXml={image.svgXml.xml} />
  ) : (
    <Avatar {...avatarProps} source={{uri: resolveLocalUri(image.imageUri)}} />
  )
}
