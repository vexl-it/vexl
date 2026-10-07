import {
  Avatar,
  TrustedFriendsExplanation,
  UserImagePlaceholder,
} from '@vexl-next/ui'
import {avatarsSvg} from '@vexl-next/ui/src/assets/anonymousAvatars'
import {Array} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {anonymizedUserDataAtom} from '../../state/session/userDataAtoms'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {type OtherPersonRole} from '../../utils/otherPersonRole'
import {
  otherCommonFriendsDescription,
  otherPersonRoleLabel,
  trustedFriendsDescription,
  trustedFriendsExplanationCaption,
} from '../../utils/trustedFriendsText'
import ContactPictureImage from '../ContactPictureImage'
import UserAvatar from '../UserAvatar'

export interface TrustedFriendsExplanationParams {
  readonly friend: StoredContactWithComputedValues
  readonly role: OtherPersonRole
}

const OtherPersonAvatar = Array.unsafeGet(avatarsSvg, 1)
const AVATAR_SIZE = 44

export default function TrustedFriendsExplanationContent({
  friend,
  role,
}: TrustedFriendsExplanationParams): React.ReactElement {
  const {t} = useTranslation()
  const anonymizedUserData = useAtomValue(anonymizedUserDataAtom)

  return (
    <TrustedFriendsExplanation
      you={{
        avatar: (
          <Avatar customSize={AVATAR_SIZE}>
            <UserAvatar
              userImage={anonymizedUserData.image}
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              grayScale={false}
            />
          </Avatar>
        ),
        label: t('common.you'),
      }}
      trustedFriend={{
        avatar: (
          <Avatar customSize={AVATAR_SIZE}>
            <ContactPictureImage
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              objectFit="cover"
              contactId={friend.info.nonUniqueContactId}
              fallback={<UserImagePlaceholder size={AVATAR_SIZE} />}
            />
          </Avatar>
        ),
        label: friend.info.name,
      }}
      otherPerson={{
        avatar: (
          <Avatar customSize={AVATAR_SIZE}>
            <OtherPersonAvatar size={AVATAR_SIZE} />
          </Avatar>
        ),
        label: otherPersonRoleLabel(role, t),
      }}
      caption={trustedFriendsExplanationCaption({
        name: friend.info.name,
        role,
        t,
      })}
      commonFriendComparison={{
        title: t('commonFriends.commonFriend'),
        description: otherCommonFriendsDescription(role, t),
      }}
      trustedFriendComparison={{
        title: t('commonFriends.trustedFriend'),
        description: trustedFriendsDescription(role, t),
      }}
      caution={t('offer.beCautiousWeCannotVerify')}
    />
  )
}
