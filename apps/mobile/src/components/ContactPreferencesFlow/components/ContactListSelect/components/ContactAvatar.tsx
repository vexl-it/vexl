import {Stack, UserImagePlaceholder} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import ContactPictureImage from '../../../../ContactPictureImage'

export default function ContactAvatar({
  contact,
  selected = true,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly selected?: boolean
}): React.JSX.Element {
  const size = getTokens().size.$9.val
  return (
    <Stack
      width="$9"
      height="$9"
      borderRadius="$2.5"
      borderWidth="$0.5"
      borderColor="$backgroundSecondary"
      overflow="hidden"
    >
      <ContactPictureImage
        contactId={contact.info.nonUniqueContactId}
        width={size}
        height={size}
        borderRadius="$2.5"
        objectFit="cover"
        grayscale={!selected}
        fallback={
          <UserImagePlaceholder
            size={size}
            borderRadius={0}
            grayscale={!selected}
          />
        }
      />
    </Stack>
  )
}
