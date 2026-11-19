import {useNavigation} from '@react-navigation/native'
import {
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
import {Array} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useState} from 'react'
import {TouchableOpacity} from 'react-native'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import anonymizePhoneNumber from '../../../../state/chat/utils/anonymizePhoneNumber'
import {selectImageActionAtom} from '../../../../state/selectImageActionAtom'
import {userPhoneNumbersAtom} from '../../../../state/session/userDataAtoms'
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
import {EditIconButton} from '../../../EditIconButton'
import {ChangePhoneNumber} from '../../../PhoneNumberPicker'
import UserAvatar from '../../../UserAvatar'
import {
  availableDetailKeysAtom,
  canSubmitExchangeDetailsAtom,
  detailsSharedByThemAtom,
  exchangeDetailsModeAtom,
  exchangeDetailsNicknameAtom,
  exchangeDetailsPhoneNumberAtom,
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

const SHARED_AVATAR_SIZE = 144

// A button inside a card takes its own presses, so it never toggles the
// checkbox.
function RevealedPhoneNumberChoice({
  iconOnly,
  children,
}: {
  readonly iconOnly: boolean
  readonly children: (
    changeButton: React.ReactElement | null
  ) => React.ReactNode
}): React.ReactElement {
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)
  const [phoneNumber, setPhoneNumber] = useAtom(exchangeDetailsPhoneNumberAtom)

  return (
    <ChangePhoneNumber
      iconOnly={iconOnly}
      phoneNumbers={phoneNumbers}
      value={phoneNumber}
      onValueChange={setPhoneNumber}
    >
      {children}
    </ChangePhoneNumber>
  )
}

function NicknameRow(): React.ReactElement {
  const {t} = useTranslation()
  const phoneNumber = useAtomValue(exchangeDetailsPhoneNumberAtom)
  const selected = useAtomValue(exchangeDetailsSelectionAtom).nickname
  const nickname = useAtomValue(exchangeDetailsNicknameAtom).trim()
  const phoneNumberRowShown = Array.contains(
    useAtomValue(availableDetailKeysAtom),
    'phoneNumber'
  )
  const toggle = useSetAtom(toggleExchangeDetailActionAtom)
  const [editing, setEditing] = useState(false)

  // A nickname to reveal has to be set, so the field opens and stays open
  // while the user types the first letters.
  if (selected && nickname === '' && !editing) setEditing(true)

  const checkbox = (
    <RowCheckbox
      label={t('tradeChecklist.exchangeDetails.nickname')}
      description={`${nickname || t('tradeChecklist.exchangeDetails.nicknameNotSet')} · ${anonymizePhoneNumber(phoneNumber)}`}
      checked={selected}
      onCheckedChange={() => {
        if (selected) setEditing(false)
        toggle('nickname')
      }}
      trailing={
        <EditIconButton
          aria-label={t('common.edit')}
          aria-expanded={editing}
          onPress={() => {
            setEditing((prev) => !prev)
          }}
        />
      }
    />
  )

  return (
    <YStack gap="$2">
      {phoneNumberRowShown ? (
        checkbox
      ) : (
        // The nickname carries digits of the number. With the phone number
        // row hidden, the number is changed here.
        <RevealedPhoneNumberChoice iconOnly={false}>
          {(changeButton) => (
            <>
              {checkbox}
              {changeButton ? <XStack>{changeButton}</XStack> : null}
            </>
          )}
        </RevealedPhoneNumberChoice>
      )}
      {editing ? (
        <TextField
          valueAtom={exchangeDetailsNicknameAtom}
          placeholder={t('tradeChecklist.revealIdentity.nicknamePlaceholder')}
          autoFocus
          onCheckmarkPress={() => {
            setEditing(false)
          }}
        />
      ) : null}
    </YStack>
  )
}

function PhoneNumberRow(): React.ReactElement {
  const {t} = useTranslation()
  const phoneNumber = useAtomValue(exchangeDetailsPhoneNumberAtom)
  const selected = useAtomValue(exchangeDetailsSelectionAtom).phoneNumber
  const toggle = useSetAtom(toggleExchangeDetailActionAtom)

  return (
    <YStack gap="$2">
      <RevealedPhoneNumberChoice iconOnly>
        {(changeButton) => (
          <RowCheckbox
            label={t('tradeChecklist.exchangeDetails.phoneNumber')}
            description={getInternationalPhoneNumber(phoneNumber)}
            checked={selected}
            onCheckedChange={() => {
              toggle('phoneNumber')
            }}
            trailing={changeButton}
          />
        )}
      </RevealedPhoneNumberChoice>
    </YStack>
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
      trailing={
        <XStack ai="center" gap="$3">
          {photoUri ? (
            <Image
              borderRadius="$3"
              width="$9"
              height="$9"
              source={{uri: resolveLocalUri(photoUri)}}
            />
          ) : null}
          <EditIconButton
            aria-label={
              photoUri
                ? t('tradeChecklist.revealIdentity.changePhoto')
                : t('tradeChecklist.exchangeDetails.choosePhoto')
            }
            onPress={() => {
              selectImage(exchangeDetailsPhotoUriAtom)
            }}
          />
        </XStack>
      }
    />
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
