import {TrustedFriendExplanation, UserImagePlaceholder} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {userDataRealOrAnonymizedAtom} from '../../state/session/userDataAtoms'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {showVerifiedContactsAtom} from '../../utils/preferences'
import {RandomSeed} from '../../utils/RandomSeed'
import {AnonymousAvatarOrClubImage} from '../AnonymousAvatar'
import ContactPictureImage from '../ContactPictureImage'
import {globalDialogAtom} from '../GlobalDialog'
import UserAvatar from '../UserAvatar'

const fallbackSeed = Schema.decodeSync(RandomSeed)('trusted-friend-explanation')

export const showTrustedFriendExplanationActionAtom = atom(
  null,
  (
    get,
    set,
    {
      friend,
      otherSide,
    }: {
      readonly friend: StoredContactWithComputedValues
      readonly otherSide: RootStackScreenProps<'CommonFriends'>['route']['params']['otherSide']
    }
  ) => {
    if (!get(showVerifiedContactsAtom)) return

    const {t} = get(translationAtom)
    const user = get(userDataRealOrAnonymizedAtom)
    const name = friend.info.name.trim().split(/\s+/)[0] || friend.info.name
    const role = otherSide?.role ?? 'otherSide'
    const roleCopy = {
      seller: {
        label: t('commonFriends.trustedFriendsExplanation.seller'),
        caption: t('commonFriends.trustedFriendsExplanation.captionSeller', {
          name,
        }),
        description: t('commonFriends.otherCommonFriendsDescriptionSeller'),
      },
      buyer: {
        label: t('commonFriends.trustedFriendsExplanation.buyer'),
        caption: t('commonFriends.trustedFriendsExplanation.captionBuyer', {
          name,
        }),
        description: t('commonFriends.otherCommonFriendsDescriptionBuyer'),
      },
      otherSide: {
        label: t('common.otherSide'),
        caption: t('commonFriends.trustedFriendsExplanation.captionOtherSide', {
          name,
        }),
        description: t('commonFriends.otherCommonFriendsDescriptionOtherSide'),
      },
    }[role]

    Effect.runFork(
      set(globalDialogAtom, {
        title: t('commonFriends.trustedFriendsExplanation.title'),
        positiveButtonText: t('common.gotIt'),
        children: React.createElement(TrustedFriendExplanation, {
          you: {
            label: t('common.you'),
            avatar: React.createElement(UserAvatar, {
              userImage: user.image,
              width: 44,
              height: 44,
            }),
          },
          trustedFriend: {
            label: name,
            avatar: {
              children: React.createElement(ContactPictureImage, {
                width: 44,
                height: 44,
                objectFit: 'cover',
                contactId: friend.info.nonUniqueContactId,
                fallback: React.createElement(UserImagePlaceholder, {size: 44}),
              }),
            },
          },
          otherSide: {
            label: roleCopy.label,
            avatar: React.createElement(AnonymousAvatarOrClubImage, {
              seed: otherSide?.avatarSeed ?? fallbackSeed,
              clubImageUrl: otherSide?.clubImageUrl,
              customSize: 44,
              grayScale: false,
            }),
          },
          caption: roleCopy.caption,
          commonFriendTitle: t(
            'commonFriends.trustedFriendsExplanation.commonFriend'
          ),
          commonFriendDescription: roleCopy.description,
          trustedFriendTitle: t(
            'commonFriends.trustedFriendsExplanation.trustedFriend'
          ),
          trustedFriendDescription: t(
            'commonFriends.trustedFriendsDescription'
          ),
          caution: t('offer.beCautiousWeCannotVerify'),
        }),
      })
    )
  }
)
