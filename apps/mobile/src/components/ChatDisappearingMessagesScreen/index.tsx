import {
  DISAPPEARING_TIMER_OPTIONS,
  DisappearingTimerSeconds,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  NavigationBar,
  Screen,
  SelectableItem,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {Array, Schema, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {focusChatWithMessagesByKeysAtom} from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {dummyChatWithMessages} from '../../state/chat/domain'
import {MINIMAL_VERSION_SUPPORTING_DISAPPEARING_MESSAGES} from '../../state/chat/utils/disappearingMessages'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {formatDisappearingTimer} from '../../utils/chat/disappearingTimerText'
import {enableHiddenFeatures, version} from '../../utils/environment'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {ChatScope, chatMolecule} from '../ChatDetailScreen/atoms'

const DEBUG_TIMER = Schema.decodeSync(DisappearingTimerSeconds)(30)
const TIMER_OPTIONS = enableHiddenFeatures
  ? [DEBUG_TIMER, ...DISAPPEARING_TIMER_OPTIONS]
  : DISAPPEARING_TIMER_OPTIONS

function TimerOptions(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const {chatAtom, sendMessageAtom, publicKeyPemBase64Atom} =
    useMolecule(chatMolecule)
  const currentTimer = useAtomValue(chatAtom).disappearingTimer
  const myPublicKey = useAtomValue(publicKeyPemBase64Atom)
  const sendMessage = useSetAtom(sendMessageAtom)

  const selectTimer = (timer: DisappearingTimerSeconds | undefined): void => {
    if (timer !== currentTimer)
      sendMessage({
        uuid: generateChatMessageId(),
        messageType: 'DISAPPEARING_MESSAGES_UPDATE',
        text: '',
        time: now(),
        senderPublicKey: myPublicKey,
        myVersion: version,
        minimalRequiredVersion:
          MINIMAL_VERSION_SUPPORTING_DISAPPEARING_MESSAGES,
        disappearingTimer: timer,
      })
    safeGoBack()
  }

  return (
    <YStack>
      <Typography
        px="$5"
        pb="$5"
        color="$foregroundSecondary"
        variant="description"
      >
        {t('messages.disappearing.description')}
      </Typography>
      {pipe(
        [undefined, ...TIMER_OPTIONS],
        Array.map((timer) => (
          <SelectableItem
            key={timer ?? 'off'}
            px="$5"
            label={formatDisappearingTimer(timer, t)}
            selected={timer === currentTimer}
            onPress={() => {
              selectTimer(timer)
            }}
          />
        ))
      )}
    </YStack>
  )
}

type Props = RootStackScreenProps<'ChatDisappearingMessages'>

export default function ChatDisappearingMessagesScreen({
  route: {
    params: {otherSideKey, inboxKey},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const chatWithMessagesAtom = useMemo(
    () =>
      valueOrDefaultAtom({
        nullableAtom: focusChatWithMessagesByKeysAtom({otherSideKey, inboxKey}),
        dummyValue: dummyChatWithMessages,
      }),
    [inboxKey, otherSideKey]
  )

  return (
    <ScopeProvider scope={ChatScope} value={chatWithMessagesAtom}>
      <Screen
        scrollable
        noHorizontalPadding
        navigationBar={
          <NavigationBar
            style="back"
            title={t('messages.disappearing.title')}
            rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
          />
        }
      >
        <TimerOptions />
      </Screen>
    </ScopeProvider>
  )
}
