import {
  InfoCircle,
  PencilWriteEdit,
  RowCheckbox,
  Typography,
} from '@vexl-next/ui'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, useTheme, XStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {sessionDataOrDummyAtom} from '../../../../state/session'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import UserAvatar from '../../../UserAvatar'
import {
  discardRevealIdentityDraftActionAtom,
  revealIdentityFlowTypeAtom,
  revealIdentityPhoneNumberAtom,
  revealIdentityPreviewImageAtom,
  revealIdentityUsernameAtom,
  saveRevealIdentityDraftActionAtom,
} from '../../atoms/revealIdentityAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'

type Props = TradeChecklistStackScreenProps<'RevealIdentitySummary'>

function RevealIdentitySummaryScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const revealIdentityType = useAtomValue(revealIdentityFlowTypeAtom)
  const revealIdentityPreviewImage = useAtomValue(
    revealIdentityPreviewImageAtom
  )
  const revealIdentityUsername = useAtomValue(revealIdentityUsernameAtom)
  const [revealIdentityPhoneNumber, setRevealIdentityPhoneNumber] = useAtom(
    revealIdentityPhoneNumberAtom
  )
  const {phoneNumber} = useAtomValue(sessionDataOrDummyAtom)
  const discardRevealIdentityDraft = useSetAtom(
    discardRevealIdentityDraftActionAtom
  )
  const saveRevealIdentityDraft = useSetAtom(saveRevealIdentityDraftActionAtom)

  const closeFlow = useCallback(() => {
    discardRevealIdentityDraft()
    navigation.popTo('AgreeOnTradeDetails')
  }, [discardRevealIdentityDraft, navigation])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.revealIdentity.summaryTitle'),
      }}
      bottomButton={{
        disabled: !revealIdentityUsername.trim(),
        text:
          revealIdentityType === 'RESPOND_REVEAL'
            ? t('tradeChecklist.revealIdentity.revealIdentityButton')
            : t('tradeChecklist.revealIdentity.askForRevealButton'),
        onPress: () => {
          const wasSaved = saveRevealIdentityDraft()

          if (wasSaved) {
            navigation.popTo('AgreeOnTradeDetails')
          }
        },
      }}
      footer={
        <Stack px="$5">
          <XStack
            px="$4"
            gap="$3"
            ai="center"
            py="$3"
            borderRadius="$4"
            backgroundColor="$backgroundSecondary"
          >
            <InfoCircle size={23} color={theme.foregroundSecondary.val} />
            <Typography variant="description" color="$foregroundSecondary">
              {t('tradeChecklist.revealIdentity.summaryNote')}
            </Typography>
          </XStack>
        </Stack>
      }
      scrollable={false}
    >
      <Stack f={1} gap="$3" pt="$4">
        <Typography variant="description" color="$foregroundSecondary">
          {revealIdentityType === 'RESPOND_REVEAL'
            ? t('messages.identityRevealRespondModal.text')
            : t('messages.identityRevealRequestModal.text')}
        </Typography>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('RevealIdentityPhoto')
          }}
        >
          <XStack
            ai="center"
            gap="$3"
            px="$4"
            py="$3"
            borderRadius="$4"
            backgroundColor="$backgroundSecondary"
          >
            <UserAvatar
              userImage={revealIdentityPreviewImage}
              width={40}
              height={40}
            />
            <Stack f={1}>
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
              >
                {revealIdentityUsername ||
                  t('tradeChecklist.revealIdentity.nicknamePlaceholder')}
              </Typography>
            </Stack>
            <PencilWriteEdit size={24} color={theme.foregroundPrimary.val} />
          </XStack>
        </TouchableOpacity>
        <RowCheckbox
          label={t('tradeChecklist.revealIdentity.includePhoneNumber')}
          description={getInternationalPhoneNumber(phoneNumber)}
          checked={revealIdentityPhoneNumber}
          onCheckedChange={setRevealIdentityPhoneNumber}
        />
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default RevealIdentitySummaryScreen
