import {Stack, Typography, UserImagePlaceholder, XStack} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import ContactPictureImage from '../../ContactPictureImage'

function VexlOnlyContactItem({
  contact,
}: {
  readonly contact: StoredContactWithComputedValues
}): React.ReactElement {
  const avatarSize = getTokens().size.$9.val
  const {
    info: {nonUniqueContactId, name},
    computedValues: {normalizedNumber},
  } = contact

  return (
    <XStack ai="center" gap="$3" py="$4" px="$2">
      <Stack
        width="$9"
        height="$9"
        borderRadius="$2.5"
        borderWidth="$0.5"
        borderColor="$backgroundSecondary"
        overflow="hidden"
      >
        <ContactPictureImage
          contactId={nonUniqueContactId}
          width={avatarSize}
          height={avatarSize}
          borderRadius="$2.5"
          objectFit="cover"
          fallback={<UserImagePlaceholder size={avatarSize} borderRadius={0} />}
        />
      </Stack>
      <Stack f={1} gap="$1" minWidth={0}>
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {name}
        </Typography>
        <Typography
          variant="micro"
          color="$foregroundSecondary"
          numberOfLines={1}
        >
          {getInternationalPhoneNumber(normalizedNumber)}
        </Typography>
      </Stack>
    </XStack>
  )
}

export default React.memo(VexlOnlyContactItem)
