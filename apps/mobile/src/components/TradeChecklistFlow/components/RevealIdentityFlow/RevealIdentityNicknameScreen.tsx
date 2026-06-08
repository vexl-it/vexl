import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {TextField, Typography, XmarkCancelClose} from '@vexl-next/ui'
import {Option, Schema} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {invalidUsernameUIFeedbackAtom} from '../../../../state/session/userDataAtoms'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  discardRevealIdentityDraftActionAtom,
  initializeEmptyRevealIdentityDraftFromProfileActionAtom,
  revealIdentityUsernameAtom,
} from '../../atoms/revealIdentityAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'

type Props = TradeChecklistStackScreenProps<'RevealIdentityNickname'>

function RevealIdentityNicknameScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const revealIdentityUsername = useAtomValue(revealIdentityUsernameAtom)
  const discardRevealIdentityDraft = useSetAtom(
    discardRevealIdentityDraftActionAtom
  )
  const initializeEmptyRevealIdentityDraftFromProfile = useSetAtom(
    initializeEmptyRevealIdentityDraftFromProfileActionAtom
  )
  const showInvalidUsernameUIFeedback = useSetAtom(
    invalidUsernameUIFeedbackAtom
  )

  useEffect(() => {
    initializeEmptyRevealIdentityDraftFromProfile()
  }, [initializeEmptyRevealIdentityDraftFromProfile])

  const closeFlow = useCallback(() => {
    discardRevealIdentityDraft()
    navigation.popTo('AgreeOnTradeDetails')
  }, [discardRevealIdentityDraft, navigation])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.revealIdentity.addNicknameTitle'),
        rightActions: [
          {
            icon: XmarkCancelClose,
            onPress: closeFlow,
          },
        ],
      }}
      bottomButton={{
        disabled: !revealIdentityUsername.trim(),
        text: t('common.next'),
        onPress: () => {
          const parsedUserName = Schema.decodeUnknownOption(UserName)(
            revealIdentityUsername.trim()
          )

          if (Option.isNone(parsedUserName)) {
            void showInvalidUsernameUIFeedback()
            return
          }

          navigation.navigate('RevealIdentitySummary')
        },
      }}
      scrollable={false}
    >
      <Stack f={1} gap="$7" pt="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {t('tradeChecklist.revealIdentity.addNicknameDescription')}
        </Typography>
        <TextField
          autoFocus
          valueAtom={revealIdentityUsernameAtom}
          placeholder={t('tradeChecklist.revealIdentity.nicknamePlaceholder')}
          showClear
        />
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default RevealIdentityNicknameScreen
