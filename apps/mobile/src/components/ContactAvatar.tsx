import {
  Avatar,
  resolveSizePx,
  UserImagePlaceholder,
  type AvatarProps,
} from '@vexl-next/ui'
import {Option} from 'effect'
import React, {useEffect, useState} from 'react'
import {type NonUniqueContactId} from '../state/contacts/domain'
import {getContactImageUri} from '../state/contacts/getContactImageUri'

export function useContactImageUri(
  contactId: Option.Option<NonUniqueContactId>
): string | undefined {
  const [imageUri, setImageUri] = useState<string>()

  useEffect(() => {
    setImageUri(undefined)
    if (Option.isNone(contactId)) return

    let cancelled = false

    void getContactImageUri(contactId.value)
      .then((uri) => {
        if (!cancelled) setImageUri(uri ?? undefined)
      })
      .catch((err) => {
        if (!cancelled) console.debug('Error loading image', err)
      })

    return () => {
      cancelled = true
    }
  }, [contactId])

  return imageUri
}

type Props = Omit<AvatarProps, 'source' | 'svgXml' | 'children'> & {
  readonly contactId: Option.Option<NonUniqueContactId>
}

export function ContactAvatar({
  contactId,
  grayscale = false,
  ...avatarProps
}: Props): React.JSX.Element {
  const imageUri = useContactImageUri(contactId)

  if (imageUri)
    return (
      <Avatar {...avatarProps} grayscale={grayscale} source={{uri: imageUri}} />
    )

  return (
    <Avatar {...avatarProps}>
      <UserImagePlaceholder
        size={resolveSizePx(
          avatarProps.size ?? 'medium',
          avatarProps.customSize
        )}
        borderRadius={0}
        grayscale={grayscale}
      />
    </Avatar>
  )
}
