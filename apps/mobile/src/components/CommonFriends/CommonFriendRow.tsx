import {EditRow, UserImagePlaceholder} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import React from 'react'
import {type ColorTokens} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import ContactPictureImage from '../ContactPictureImage'

function CommonFriendRow({
  friend,
  trusted = false,
  backgroundColor = '$backgroundSecondary',
  trailing,
}: {
  readonly friend: StoredContactWithComputedValues
  readonly trusted?: boolean
  readonly backgroundColor?: ColorTokens
  readonly trailing?: React.ReactNode
}): React.ReactElement {
  const internationalNumber = parsePhoneNumber(
    friend.computedValues.normalizedNumber
  ).number?.international

  return (
    <EditRow
      state="profile"
      headline={friend.info.name}
      overline={internationalNumber ?? friend.computedValues.normalizedNumber}
      showEditButton={false}
      backgroundColor={backgroundColor}
      trailing={trailing}
      avatar={{
        trusted,
        trustBadgeRingColor: backgroundColor,
        children: (
          <ContactPictureImage
            width={40}
            height={40}
            objectFit="cover"
            contactId={friend.info.nonUniqueContactId}
            fallback={<UserImagePlaceholder size={40} />}
          />
        ),
      }}
    />
  )
}

export default React.memo(CommonFriendRow)
