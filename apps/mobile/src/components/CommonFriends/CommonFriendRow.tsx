import {EditRow, UserImagePlaceholder} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import ContactPictureImage from '../ContactPictureImage'

function CommonFriendRow({
  friend,
  trusted = false,
  trailing,
}: {
  readonly friend: StoredContactWithComputedValues
  readonly trusted?: boolean
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
      trailing={trailing}
      avatar={{
        trusted,
        trustBadgeRingColor: '$backgroundSecondary',
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
