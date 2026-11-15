import {
  Button,
  PhoneCall,
  Share as ShareIcon,
  Typography,
  XStack,
  YStack,
  type TextTagVariant,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Share} from 'react-native'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import createImportedContactsForHashesAtom from '../../../../../state/contacts/atom/createImportedContactsForHashesAtom'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {
  type FriendCheck,
  type FriendCheckStatus,
} from '../../../../../state/tradeChecklist/utils/friendCheck'
import {
  useTranslation,
  type TFunction,
} from '../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../utils/openUrl'
import CommonFriendRow from '../../../../CommonFriends/CommonFriendRow'
import {friendFirstName} from '../../../../CommonFriends/friendFirstName'
import {chatMolecule} from '../../../atoms'
import useOpenFriendCheck from '../../useOpenFriendCheck'
import VexlbotActionCard from './VexlbotActionCard'

function statusTag(
  status: FriendCheckStatus,
  t: TFunction
): {statusLabel: string; statusVariant: TextTagVariant} {
  switch (status) {
    case 'waitingForMe':
      return {
        statusLabel: t('tradeChecklist.friendCheck.status.waitingForYou'),
        statusVariant: 'waitingForConfirmation',
      }
    case 'pending':
      return {
        statusLabel: t('tradeChecklist.friendCheck.status.pending'),
        statusVariant: 'waiting',
      }
    case 'waitingForThem':
      return {
        statusLabel: t('vexlbot.waitingFor', {username: t('common.otherSide')}),
        statusVariant: 'waiting',
      }
    case 'vouched':
      return {
        statusLabel: t('tradeChecklist.friendCheck.status.vouched'),
        statusVariant: 'accepted',
      }
    case 'notVouched':
      return {
        statusLabel: t('tradeChecklist.friendCheck.status.notVouched'),
        statusVariant: 'paused',
      }
  }
}

function CodePhrase({phrase}: {readonly phrase: string}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack
      alignItems="center"
      backgroundColor="$backgroundTertiary"
      borderRadius="$4"
      gap="$1"
      padding="$4"
    >
      <Typography color="$foregroundSecondary" variant="micro">
        {t('tradeChecklist.friendCheck.codePhrase')}
      </Typography>
      <Typography
        color="$foregroundPrimary"
        textAlign="center"
        variant="heading3"
      >
        {phrase}
      </Typography>
    </YStack>
  )
}

function FriendCheckCard({
  check,
  friend,
}: {
  readonly check: FriendCheck
  readonly friend: StoredContactWithComputedValues
}): React.ReactElement {
  const {t} = useTranslation()
  const {
    canSendMessagesAtom,
    confirmFriendVouchedActionAtom,
    deleteChatWithUiFeedbackAtom,
    friendCheckAvailableAtom,
    updateFriendCheckLocalStateActionAtom,
  } = useMolecule(chatMolecule)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const friendCheckAvailable = useAtomValue(friendCheckAvailableAtom)
  const confirmFriendVouched = useSetAtom(confirmFriendVouchedActionAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const updateLocalState = useSetAtom(updateFriendCheckLocalStateActionAtom)
  const openFriendCheck = useOpenFriendCheck()

  const name = friendFirstName(friend)
  const tag = statusTag(check.status, t)

  const markContacted = (): void => {
    updateLocalState({friend: check.friend, update: {contacted: true}})
  }
  const messageFriend = (): void => {
    void Share.share({
      message: t('tradeChecklist.friendCheck.messageToFriend', {
        name,
        phrase: check.phrase,
      }),
    }).then(({action}) => {
      if (action !== Share.dismissedAction) markContacted()
    })
  }
  const callFriend = (): void => {
    openUrl(`tel:${friend.computedValues.normalizedNumber}`)()
    markContacted()
  }

  const checkWithAnotherFriend = friendCheckAvailable ? (
    <Button onPress={openFriendCheck} size="medium" variant="secondary">
      {t('tradeChecklist.friendCheck.checkWithAnotherFriend')}
    </Button>
  ) : null

  if (check.vouchedByMe)
    return (
      <VexlbotActionCard
        mt="$2"
        {...tag}
        title={t('tradeChecklist.friendCheck.vouched.title', {name})}
      >
        <CommonFriendRow
          backgroundColor="$backgroundTertiary"
          friend={friend}
        />
        {checkWithAnotherFriend}
      </VexlbotActionCard>
    )

  if (check.refusal)
    return (
      <VexlbotActionCard
        mt="$2"
        {...tag}
        title={t('tradeChecklist.friendCheck.notVouched.title')}
        description={t(
          `tradeChecklist.friendCheck.notVouched.${check.refusal}`,
          {name}
        )}
      >
        {checkWithAnotherFriend}
        <Button
          onPress={() => {
            void Effect.runFork(deleteChat({skipAsk: false}))
          }}
          size="medium"
          variant="destructive"
        >
          {t('messages.deleteConversation')}
        </Button>
      </VexlbotActionCard>
    )

  if (check.contacted)
    return (
      <VexlbotActionCard
        mt="$2"
        {...tag}
        title={t('tradeChecklist.friendCheck.answer.title', {name})}
        description={t('tradeChecklist.friendCheck.answer.description', {
          name,
        })}
      >
        <CodePhrase phrase={check.phrase} />
        <Button
          disabled={!canSendMessages}
          onPress={() => {
            void Effect.runFork(confirmFriendVouched(check.friend))
          }}
          size="medium"
          variant="primary"
        >
          {t('tradeChecklist.friendCheck.answer.vouches', {name})}
        </Button>
        {pipe(
          ['doesNotKnowThem', 'neverHeardFromThem'] as const,
          Array.map((refusal) => (
            <Button
              key={refusal}
              onPress={() => {
                updateLocalState({friend: check.friend, update: {refusal}})
              }}
              size="medium"
              variant="secondary"
            >
              {t(`tradeChecklist.friendCheck.answer.${refusal}`, {name})}
            </Button>
          ))
        )}
        <XStack gap="$3">
          <Button
            f={1}
            icon={ShareIcon}
            onPress={messageFriend}
            size="small"
            variant="secondary"
          >
            {t('tradeChecklist.friendCheck.messageFriend', {name})}
          </Button>
          <Button
            f={1}
            icon={PhoneCall}
            onPress={callFriend}
            size="small"
            variant="secondary"
          >
            {t('tradeChecklist.friendCheck.callFriend', {name})}
          </Button>
        </XStack>
      </VexlbotActionCard>
    )

  return (
    <VexlbotActionCard
      mt="$2"
      {...tag}
      title={t(
        check.startedBy === 'me'
          ? 'tradeChecklist.friendCheck.request.titleByMe'
          : 'tradeChecklist.friendCheck.request.titleByThem',
        {name: friend.info.name}
      )}
      description={t(
        check.startedBy === 'me'
          ? 'tradeChecklist.friendCheck.request.descriptionByMe'
          : 'tradeChecklist.friendCheck.request.descriptionByThem',
        {name}
      )}
    >
      <CodePhrase phrase={check.phrase} />
      <Button
        icon={ShareIcon}
        onPress={messageFriend}
        size="medium"
        variant="primary"
      >
        {t('tradeChecklist.friendCheck.messageFriend', {name})}
      </Button>
      <Button
        icon={PhoneCall}
        onPress={callFriend}
        size="medium"
        variant="secondary"
      >
        {t('tradeChecklist.friendCheck.callFriend', {name})}
      </Button>
    </VexlbotActionCard>
  )
}

export default function FriendCheckView({
  message,
}: {
  readonly message: ChatMessageWithState
}): React.ReactElement | null {
  const {friendChecksAtom} = useMolecule(chatMolecule)
  const check = pipe(
    useAtomValue(friendChecksAtom),
    Array.findFirst((one) => one.requestMessageId === message.message.uuid),
    Option.getOrUndefined
  )
  const friendHash = check?.friend
  const friend = pipe(
    useAtomValue(
      useMemo(
        () =>
          createImportedContactsForHashesAtom(friendHash ? [friendHash] : []),
        [friendHash]
      )
    ),
    Array.head,
    Option.getOrUndefined
  )

  if (!check || !friend) return null
  return <FriendCheckCard check={check} friend={friend} />
}
