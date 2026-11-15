import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  InfoBox,
  RadiobuttonCircleEmpty,
  RadiobuttonCircleFilled,
  TextTag,
  Typography,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {Array, Effect, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useState} from 'react'
import {TouchableOpacity} from 'react-native'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../state/contacts/domain'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {areThereUpdatesToBeSentAtom} from '../../../../state/tradeChecklist/atoms/updatesToBeSentAtom'
import {type FriendCheck} from '../../../../state/tradeChecklist/utils/friendCheck'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import CommonFriendRow from '../../../CommonFriends/CommonFriendRow'
import {friendFirstName} from '../../../CommonFriends/friendFirstName'
import {useCommonFriends} from '../../../CommonFriends/useCommonFriends'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'

function AskedFriendTag({
  check,
}: {
  readonly check: FriendCheck
}): React.ReactElement {
  const {t} = useTranslation()

  if (check.vouchedByMe)
    return (
      <TextTag
        label={t('tradeChecklist.friendCheck.status.vouched')}
        variant="accepted"
      />
    )
  if (check.refusal)
    return (
      <TextTag
        label={t('tradeChecklist.friendCheck.status.notVouched')}
        variant="paused"
      />
    )
  return (
    <TextTag
      label={t('tradeChecklist.friendCheck.status.asked')}
      variant="waiting"
    />
  )
}

function FriendsSection({
  title,
  description,
  friends,
  trusted = false,
  checks,
  selected,
  onSelect,
}: {
  readonly title: string
  readonly description: string
  readonly friends: readonly StoredContactWithComputedValues[]
  readonly trusted?: boolean
  readonly checks: readonly FriendCheck[]
  readonly selected: HashedPhoneNumber | undefined
  readonly onSelect: (friend: HashedPhoneNumber) => void
}): React.ReactElement | null {
  const theme = useTheme()

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
        Array.map((friend) => {
          const hash = friend.computedValues.hash
          const check = Array.findFirst(checks, (one) => one.friend === hash)

          if (Option.isSome(check))
            return (
              <CommonFriendRow
                key={hash}
                friend={friend}
                trusted={trusted}
                trailing={<AskedFriendTag check={check.value} />}
              />
            )

          const isSelected = selected === hash
          return (
            <TouchableOpacity
              key={hash}
              accessibilityRole="radio"
              accessibilityState={{selected: isSelected}}
              onPress={() => {
                onSelect(hash)
              }}
            >
              <CommonFriendRow
                friend={friend}
                trusted={trusted}
                backgroundColor={
                  isSelected ? '$accentYellowSecondary' : '$backgroundSecondary'
                }
                trailing={
                  isSelected ? (
                    <RadiobuttonCircleFilled
                      color={theme.accentHighlightPrimary.get()}
                      size={24}
                    />
                  ) : (
                    <RadiobuttonCircleEmpty
                      color={theme.foregroundPrimary.get()}
                      size={24}
                    />
                  )
                }
              />
            </TouchableOpacity>
          )
        })
      )}
    </YStack>
  )
}

type Props = TradeChecklistStackScreenProps<'FriendCheck'>

export default function FriendCheckScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const checks = useAtomValue(fromChatAtoms.friendChecksAtom)
  const {trustedFriends, otherCommonFriends, sortedFriends} = useCommonFriends(
    useAtomValue(fromChatAtoms.commonConnectionsHashesAtom),
    useAtomValue(fromChatAtoms.verifiedConnectionsHashesAtom)
  )
  const startFriendCheck = useSetAtom(fromChatAtoms.startFriendCheckActionAtom)
  const [picked, setPicked] = useState<HashedPhoneNumber>()

  const friendsToAsk = Array.filter(
    sortedFriends,
    (friend) =>
      !Array.some(
        checks,
        (check) => check.friend === friend.computedValues.hash
      )
  )
  const selectedFriend = pipe(
    friendsToAsk,
    Array.findFirst((friend) => friend.computedValues.hash === picked),
    Option.orElse(() => Array.head(friendsToAsk)),
    Option.getOrUndefined
  )
  const selectedName = selectedFriend ? friendFirstName(selectedFriend) : ''

  const sectionProps = {
    checks,
    selected: selectedFriend?.computedValues.hash,
    onSelect: setPicked,
  }

  return (
    <TradeChecklistItemPageLayout
      header={{title: t('tradeChecklist.friendCheck.title')}}
      footer={
        selectedFriend ? (
          <InfoBox variant="yellow">
            {t('tradeChecklist.friendCheck.picker.privacyNotice', {
              name: selectedName,
            })}
          </InfoBox>
        ) : undefined
      }
      bottomButton={{
        disabled: !selectedFriend,
        text: selectedFriend
          ? t('tradeChecklist.friendCheck.picker.checkWith', {
              name: selectedName,
            })
          : t('tradeChecklist.friendCheck.picker.everyoneAsked'),
        onPress: () => {
          if (!selectedFriend) return
          void Effect.runPromise(
            startFriendCheck(selectedFriend.computedValues.hash)
          ).then((started) => {
            if (!started) return
            // Leaving for the chat would discard unsent checklist changes
            if (store.get(areThereUpdatesToBeSentAtom)) navigation.goBack()
            else
              navigation.popTo(
                'ChatDetail',
                store.get(fromChatAtoms.chatWithMessagesKeys)
              )
          })
        },
      }}
    >
      <YStack gap="$6">
        <Typography color="$foregroundSecondary" variant="description">
          {t('tradeChecklist.friendCheck.picker.description')}
        </Typography>
        <FriendsSection
          {...sectionProps}
          title={t('commonFriends.trustedFriends')}
          description={t('commonFriends.trustedFriendsDescription')}
          friends={trustedFriends}
          trusted
        />
        <FriendsSection
          {...sectionProps}
          title={t(
            Array.isNonEmptyReadonlyArray(trustedFriends)
              ? 'commonFriends.otherCommonFriends'
              : 'commonFriends.commonFriends'
          )}
          description={t(
            'commonFriends.otherCommonFriendsDescriptionOtherSide'
          )}
          friends={otherCommonFriends}
        />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}
