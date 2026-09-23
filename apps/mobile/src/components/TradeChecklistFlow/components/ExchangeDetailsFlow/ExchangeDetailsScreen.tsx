import {useNavigation} from '@react-navigation/native'
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
import {TouchableOpacity} from 'react-native'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import anonymizePhoneNumber from '../../../../state/chat/utils/anonymizePhoneNumber'
import {selectImageActionAtom} from '../../../../state/selectImageActionAtom'
import {sessionDataOrDummyAtom} from '../../../../state/session'
import {otherSideDataAtom} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  isAnyDetailSelected,
  selectionsEqual,
  type ExchangeDetailKey,
} from '../../../../state/tradeChecklist/utils/exchangeDetails'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../../utils/resolveLocalUri'
import {AddToContactsButton} from '../../../ChatDetailScreen/components/RevealedInfoCard'
import UserAvatar from '../../../UserAvatar'
import {
  availableDetailKeysAtom,
  canSubmitExchangeDetailsAtom,
  detailsSharedByThemAtom,
  exchangeDetailsModeAtom,
  exchangeDetailsNicknameAtom,
  exchangeDetailsPhotoUriAtom,
  exchangeDetailsSelectionAtom,
  pendingSentDetailsAtom,
  photoRequiresNicknameAtom,
  prepareAskAgainActionAtom,
  requestedDetailsAtom,
  saveExchangeDetailsDraftActionAtom,
  toggleExchangeDetailActionAtom,
} from '../../atoms/exchangeDetailsAtoms'
import {TradeChecklistItemPageLayout} from '../TradeChecklistItemPageLayout'
import {formatSelectedDetails} from './formatSelectedDetails'
import useExchangeDetailsNavigation from './useExchangeDetailsNavigation'

const PHOTO_PREVIEW_SIZE = 56
const SHARED_AVATAR_SIZE = 144

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

function SharedProfile(): React.ReactElement | null {
  const navigation =
    useNavigation<
      TradeChecklistStackScreenProps<'ExchangeDetails'>['navigation']
    >()
  const sharedByThem = useAtomValue(detailsSharedByThemAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideImage = otherSideData.image

  if (!isAnyDetailSelected(sharedByThem)) return null

  const phoneNumber = otherSideData.fullPhoneNumber
    ? getInternationalPhoneNumber(otherSideData.fullPhoneNumber)
    : otherSideData.partialPhoneNumber

  return (
    <YStack ai="center" gap="$4" py="$4">
      <TouchableOpacity
        disabled={otherSideImage.type !== 'imageUri'}
        onPress={() => {
          if (otherSideImage.type !== 'imageUri') return
          navigation.navigate('ChatImagePreview', {
            imageUri: resolveLocalUri(otherSideImage.imageUri),
          })
        }}
      >
        <UserAvatar
          userImage={otherSideImage}
          width={SHARED_AVATAR_SIZE}
          height={SHARED_AVATAR_SIZE}
        />
      </TouchableOpacity>
      <YStack ai="center" gap="$1">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {otherSideData.userName}
        </Typography>
        {phoneNumber ? (
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {phoneNumber}
          </Typography>
        ) : null}
      </YStack>
      <AddToContactsButton
        fullPhoneNumber={otherSideData.fullPhoneNumber}
        userImage={otherSideData.image}
        userName={otherSideData.userName}
      />
    </YStack>
  )
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
  const pendingDetails = useAtomValue(pendingSentDetailsAtom)
  const sharedByThem = useAtomValue(detailsSharedByThemAtom)
  const saveDraft = useSetAtom(saveExchangeDetailsDraftActionAtom)
  const prepareAskAgain = useSetAtom(prepareAskAgainActionAtom)

  const bottomButton = (() => {
    switch (mode) {
      case 'complete':
        return undefined
      case 'pending':
        return {
          disabled: false,
          text: t('tradeChecklist.exchangeDetails.askAgainButton'),
          onPress: () => {
            prepareAskAgain()
            finishFlowWithPendingUpdates()
          },
        }
      case 'respond':
      case 'request':
        return {
          disabled: !canSubmit,
          text:
            mode === 'respond'
              ? t('tradeChecklist.exchangeDetails.acceptButton')
              : t('tradeChecklist.exchangeDetails.sendRequestButton'),
          onPress: () => {
            if (saveDraft()) finishFlowWithPendingUpdates()
          },
        }
    }
  })()

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.exchangeDetails.title'),
        rightActions: [{icon: XmarkCancelClose, onPress: closeFlow}],
      }}
      hideLeftChevron
      bottomButton={bottomButton}
      footer={
        <Typography
          variant="description"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {mode === 'complete'
            ? t('tradeChecklist.exchangeDetails.everythingShared')
            : t('tradeChecklist.exchangeDetails.privacyNote')}
        </Typography>
      }
    >
      <Stack gap="$5" pt="$4">
        <SharedProfile />
        {mode === 'pending' ? (
          <YStack gap="$2">
            <Typography variant="heading3" color="$foregroundPrimary">
              {t('tradeChecklist.exchangeDetails.pendingHeading')}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {t('tradeChecklist.exchangeDetails.pendingDescription', {
                details: formatSelectedDetails(t, pendingDetails),
              })}
            </Typography>
          </YStack>
        ) : null}
        {mode === 'respond' || mode === 'request' ? (
          <>
            <YStack gap="$2">
              <Typography variant="heading3" color="$foregroundPrimary">
                {mode === 'respond'
                  ? t('tradeChecklist.exchangeDetails.respondHeading')
                  : isAnyDetailSelected(sharedByThem)
                    ? t('tradeChecklist.exchangeDetails.requestMoreHeading')
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
          </>
        ) : null}
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default ExchangeDetailsScreen
