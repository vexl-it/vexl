import {
  IconButton,
  InfoBox,
  PhoneCall,
  Share as ShareIcon,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Share} from 'react-native'
import {type StoredContactWithComputedValues} from '../../../../state/contacts/domain'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  friendCheckMessage,
  type FriendCheckSubject,
} from '../../../../state/tradeChecklist/utils/friendCheck'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import openUrl from '../../../../utils/openUrl'
import CommonFriendRow from '../../../CommonFriends/CommonFriendRow'
import {friendFirstName} from '../../../CommonFriends/friendFirstName'
import {useCommonFriends} from '../../../CommonFriends/useCommonFriends'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'
import IdentityCard from './IdentityCard'

const ICON_SIZE = 20

function FriendActions({
  friend,
  subject,
}: {
  readonly friend: StoredContactWithComputedValues
  readonly subject: FriendCheckSubject
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const name = friendFirstName(friend)

  return (
    <XStack gap="$2">
      <IconButton
        aria-label={t('tradeChecklist.friendCheck.callFriend', {name})}
        backgroundColor="$backgroundTertiary"
        onPress={openUrl(`tel:${friend.computedValues.normalizedNumber}`)}
      >
        <PhoneCall color={theme.foregroundPrimary.get()} size={ICON_SIZE} />
      </IconButton>
      <IconButton
        aria-label={t('tradeChecklist.friendCheck.messageFriend', {
          name,
        })}
        backgroundColor="$accentYellowSecondary"
        onPress={() => {
          void Share.share({
            message: friendCheckMessage({t, friend: name, subject}),
          })
        }}
      >
        <ShareIcon
          color={theme.accentHighlightSecondary.get()}
          size={ICON_SIZE}
        />
      </IconButton>
    </XStack>
  )
}

function FriendsSection({
  title,
  description,
  friends,
  trusted = false,
  subject,
}: {
  readonly title: string
  readonly description: string
  readonly friends: readonly StoredContactWithComputedValues[]
  readonly trusted?: boolean
  readonly subject: FriendCheckSubject
}): React.ReactElement | null {
  if (!Array.isNonEmptyReadonlyArray(friends)) return null

  return (
    <YStack gap="$3">
      <YStack gap="$1">
        <Typography color="$foregroundPrimary" variant="paragraphSmall">
          {title}
        </Typography>
        <Typography color="$foregroundSecondary" variant="micro">
          {description}
        </Typography>
      </YStack>
      {pipe(
        friends,
        Array.map((friend) => (
          <CommonFriendRow
            key={friend.computedValues.hash}
            friend={friend}
            trusted={trusted}
            trailing={<FriendActions friend={friend} subject={subject} />}
          />
        ))
      )}
    </YStack>
  )
}

export default function AskCommonFriend({
  subject,
}: {
  readonly subject: FriendCheckSubject
}): React.ReactElement {
  const {t} = useTranslation()
  const {trustedFriends, otherCommonFriends} = useCommonFriends(
    useAtomValue(fromChatAtoms.commonConnectionsHashesAtom),
    useAtomValue(fromChatAtoms.verifiedConnectionsHashesAtom)
  )

  return (
    <TradeChecklistItemPageLayout header={{title: ''}}>
      <YStack gap="$6">
        <YStack gap="$3">
          <Typography variant="heading3" color="$foregroundPrimary">
            {t('tradeChecklist.friendCheck.title')}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {subject.nickname
              ? t('tradeChecklist.friendCheck.ask.description', {
                  name: subject.nickname,
                })
              : t('tradeChecklist.friendCheck.ask.descriptionUnnamed')}
          </Typography>
        </YStack>
        <IdentityCard subject={subject} />
        <FriendsSection
          title={t('commonFriends.trustedFriends')}
          description={t('commonFriends.trustedFriendsDescription')}
          friends={trustedFriends}
          trusted
          subject={subject}
        />
        <FriendsSection
          title={t(
            Array.isNonEmptyReadonlyArray(trustedFriends)
              ? 'commonFriends.otherCommonFriends'
              : 'commonFriends.commonFriends'
          )}
          description={t(
            'commonFriends.otherCommonFriendsDescriptionOtherSide'
          )}
          friends={otherCommonFriends}
          subject={subject}
        />
        <InfoBox>{t('tradeChecklist.friendCheck.ask.privacyNotice')}</InfoBox>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}
