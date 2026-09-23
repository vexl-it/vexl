import {
  Button,
  Disclosure,
  Image,
  InfoBox,
  RowCheckbox,
  Stack,
  TextField,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import anonymizePhoneNumber from '../../../../state/chat/utils/anonymizePhoneNumber'
import {selectImageActionAtom} from '../../../../state/selectImageActionAtom'
import {sessionDataOrDummyAtom} from '../../../../state/session'
import {
  selectionsEqual,
  type ExchangeDetailKey,
} from '../../../../state/tradeChecklist/utils/exchangeDetails'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../../utils/resolveLocalUri'
import {
  availableDetailKeysAtom,
  canSubmitExchangeDetailsAtom,
  exchangeDetailsModeAtom,
  exchangeDetailsNicknameAtom,
  exchangeDetailsPhotoUriAtom,
  exchangeDetailsSelectionAtom,
  photoRequiresNicknameAtom,
  requestedDetailsAtom,
  saveExchangeDetailsDraftActionAtom,
  toggleExchangeDetailActionAtom,
} from '../../atoms/exchangeDetailsAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'
import {formatSelectedDetails} from './formatSelectedDetails'
import useExchangeDetailsNavigation from './useExchangeDetailsNavigation'

const PHOTO_PREVIEW_SIZE = 56

function NicknameRow(): React.ReactElement {
  const {t} = useTranslation()
  const {phoneNumber} = useAtomValue(sessionDataOrDummyAtom)
  const selected = useAtomValue(exchangeDetailsSelectionAtom).nickname
  const nickname = useAtomValue(exchangeDetailsNicknameAtom).trim()
  const toggle = useSetAtom(toggleExchangeDetailActionAtom)

  return (
    <YStack gap="$2">
      <RowCheckbox
        label={t('tradeChecklist.exchangeDetails.nickname')}
        description={`${nickname || t('tradeChecklist.exchangeDetails.nicknameNotSet')} · ${anonymizePhoneNumber(phoneNumber)}`}
        checked={selected}
        onCheckedChange={() => {
          toggle('nickname')
        }}
      />
      {selected ? (
        <TextField
          valueAtom={exchangeDetailsNicknameAtom}
          placeholder={t('tradeChecklist.revealIdentity.nicknamePlaceholder')}
          showClear
        />
      ) : null}
    </YStack>
  )
}

function PhoneNumberRow(): React.ReactElement {
  const {t} = useTranslation()
  const {phoneNumber} = useAtomValue(sessionDataOrDummyAtom)
  const selected = useAtomValue(exchangeDetailsSelectionAtom).phoneNumber
  const toggle = useSetAtom(toggleExchangeDetailActionAtom)

  return (
    <RowCheckbox
      label={t('tradeChecklist.exchangeDetails.phoneNumber')}
      description={getInternationalPhoneNumber(phoneNumber)}
      checked={selected}
      onCheckedChange={() => {
        toggle('phoneNumber')
      }}
    />
  )
}

function PhotoRow(): React.ReactElement {
  const {t} = useTranslation()
  const selected = useAtomValue(exchangeDetailsSelectionAtom).photo
  const photoUri = useAtomValue(exchangeDetailsPhotoUriAtom)
  const photoRequiresNickname = useAtomValue(photoRequiresNicknameAtom)
  const toggle = useSetAtom(toggleExchangeDetailActionAtom)
  const selectImage = useSetAtom(selectImageActionAtom)

  return (
    <YStack gap="$2">
      <RowCheckbox
        label={t('tradeChecklist.exchangeDetails.photo')}
        description={
          photoRequiresNickname
            ? t('tradeChecklist.exchangeDetails.photoSharedWithNickname')
            : photoUri
              ? undefined
              : t('tradeChecklist.exchangeDetails.noPhotoYet')
        }
        checked={selected}
        onCheckedChange={() => {
          toggle('photo')
        }}
      />
      {selected ? (
        <XStack ai="center" gap="$3">
          {photoUri ? (
            <Image
              borderRadius="$4"
              width={PHOTO_PREVIEW_SIZE}
              height={PHOTO_PREVIEW_SIZE}
              source={{uri: resolveLocalUri(photoUri)}}
            />
          ) : null}
          <Button
            variant="secondary"
            size="small"
            onPress={() => {
              selectImage(exchangeDetailsPhotoUriAtom)
            }}
          >
            {photoUri
              ? t('tradeChecklist.revealIdentity.changePhoto')
              : t('tradeChecklist.exchangeDetails.choosePhoto')}
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}

const ROWS: Record<ExchangeDetailKey, () => React.ReactElement> = {
  nickname: NicknameRow,
  phoneNumber: PhoneNumberRow,
  photo: PhotoRow,
}

function DiffersFromRequestNotice(): React.ReactElement | null {
  const {t} = useTranslation()
  const requested = useAtomValue(requestedDetailsAtom)
  const selection = useAtomValue(exchangeDetailsSelectionAtom)

  if (selectionsEqual(requested, selection)) return null

  return (
    <InfoBox variant="yellow">
      {t('tradeChecklist.exchangeDetails.differsFromRequest', {
        requested: formatSelectedDetails(t, requested),
      })}
    </InfoBox>
  )
}

function ExchangeDetailsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const {closeFlow, finishFlowWithPendingUpdates} =
    useExchangeDetailsNavigation()
  const mode = useAtomValue(exchangeDetailsModeAtom)
  const availableKeys = useAtomValue(availableDetailKeysAtom)
  const canSubmit = useAtomValue(canSubmitExchangeDetailsAtom)
  const saveDraft = useSetAtom(saveExchangeDetailsDraftActionAtom)

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.exchangeDetails.title'),
        onBackPress: closeFlow,
        rightActions: [{icon: XmarkCancelClose, onPress: closeFlow}],
      }}
      bottomButton={{
        disabled: !canSubmit,
        text:
          mode === 'respond'
            ? t('tradeChecklist.exchangeDetails.acceptButton')
            : t('tradeChecklist.exchangeDetails.sendRequestButton'),
        onPress: () => {
          if (saveDraft()) finishFlowWithPendingUpdates()
        },
      }}
      footer={
        <Typography
          variant="description"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {t('tradeChecklist.exchangeDetails.privacyNote')}
        </Typography>
      }
    >
      <Stack gap="$5" pt="$4">
        <YStack gap="$2">
          <Typography variant="heading3" color="$foregroundPrimary">
            {mode === 'respond'
              ? t('tradeChecklist.exchangeDetails.respondHeading')
              : t('tradeChecklist.exchangeDetails.requestHeading')}
          </Typography>
          {mode === 'respond' ? (
            <Typography variant="description" color="$foregroundSecondary">
              {t('tradeChecklist.exchangeDetails.respondDescription')}
            </Typography>
          ) : null}
        </YStack>
        <YStack gap="$3">
          {availableKeys.map((key) => {
            const Row = ROWS[key]
            return <Row key={key} />
          })}
        </YStack>
        {mode === 'respond' ? <DiffersFromRequestNotice /> : null}
        <Disclosure
          title={t('tradeChecklist.exchangeDetails.howSharingWorksTitle')}
        >
          {t('tradeChecklist.exchangeDetails.howSharingWorksBody')}
        </Disclosure>
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default ExchangeDetailsScreen
