import {
  Button,
  EditRow,
  NavigationBar,
  Screen,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {deepEqual} from 'fast-equals'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useLayoutEffect} from 'react'
import {YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {clubsWithMembersAtomsAtom} from '../../state/clubs/atom/clubsWithMembersAtom'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../utils/localization/I18nProvider'
import usePreventDiscardChangesWithConfirmation from '../../utils/usePreventDiscardChangesWithConfirmation'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {offerFormMolecule} from '../CRUDOfferFlow/atoms/offerFormStateAtoms'
import AmountStep from '../CRUDOfferFlow/components/AmountStep'
import ClubItem from '../CRUDOfferFlow/components/ClubItem'
import DescribeStep from '../CRUDOfferFlow/components/DescribeStep'
import LanguageStep from '../CRUDOfferFlow/components/LanguageStep'
import LocationStep from '../CRUDOfferFlow/components/LocationStep'
import NetworkStep from '../CRUDOfferFlow/components/NetworkStep'
import PriceUpToStep from '../CRUDOfferFlow/components/PriceUpToStep'
import ProductCategoryStep from '../CRUDOfferFlow/components/ProductCategoryStep'
import {type EditableOfferField} from '../CRUDOfferFlow/offerSetupSteps'
import {globalDialogAtom} from '../GlobalDialog'
import FriendLevel from '../OfferForm/components/FriendLevel'

type Props = RootStackScreenProps<'EditOfferField'>

type EditOfferFieldTitleKey =
  | 'editOffer.editAmount'
  | 'editOffer.editLocation'
  | 'editOffer.editPaymentDetails'
  | 'editOffer.editOfferDescription'
  | 'editOffer.editOfferLanguage'
  | 'editOffer.editProductCategory'
  | 'editOffer.editFriendLevel'
  | 'editOffer.editClubs'

const fieldToTitleKey: Record<EditableOfferField, EditOfferFieldTitleKey> = {
  amount: 'editOffer.editAmount',
  location: 'editOffer.editLocation',
  network: 'editOffer.editPaymentDetails',
  describe: 'editOffer.editOfferDescription',
  language: 'editOffer.editOfferLanguage',
  productCategory: 'editOffer.editProductCategory',
  friendLevel: 'editOffer.editFriendLevel',
  clubs: 'editOffer.editClubs',
}

function EditOfferFieldScreen({
  route: {
    params: {field},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const {
    listingTypeAtom,
    locationStateAtom,
    locationAtom,
    amountBottomLimitAtom,
    satsValueAtom,
    productCategoriesAtom,
    updateBtcNetworkAtom,
    offerDescriptionAtom,
    selectedSpokenLanguagesAtom,
    checkAmountExceedsLimitAndShowDialogActionAtom,
    intendedConnectionLevelAtom,
    createSelectClubAtom,
    discardLocationIfNotInPersonActionAtom,
    offerFormDraftSnapshotAtom,
    currentOfferFormDraftSnapshotAtom,
    takeOfferFormDraftSnapshotActionAtom,
    restoreOfferFormDraftSnapshotActionAtom,
  } = useMolecule(offerFormMolecule)
  const listingType = useAtomValue(listingTypeAtom)
  const locationState = useAtomValue(locationStateAtom)
  const location = useAtomValue(locationAtom)
  const amountBottomLimit = useAtomValue(amountBottomLimitAtom)
  const satsValue = useAtomValue(satsValueAtom)
  const productCategories = useAtomValue(productCategoriesAtom)
  const btcNetwork = useAtomValue(updateBtcNetworkAtom)
  const offerDescription = useAtomValue(offerDescriptionAtom)
  const selectedSpokenLanguages = useAtomValue(selectedSpokenLanguagesAtom)
  const initialSnapshot = useAtomValue(offerFormDraftSnapshotAtom)
  const currentSnapshot = useAtomValue(currentOfferFormDraftSnapshotAtom)
  const clubsWithMembersAtoms = useAtomValue(clubsWithMembersAtomsAtom)
  const discardLocationIfNotInPerson = useSetAtom(
    discardLocationIfNotInPersonActionAtom
  )
  const takeOfferFormDraftSnapshot = useSetAtom(
    takeOfferFormDraftSnapshotActionAtom
  )
  const restoreOfferFormDraftSnapshot = useSetAtom(
    restoreOfferFormDraftSnapshotActionAtom
  )
  const checkAmountExceedsLimit = useSetAtom(
    checkAmountExceedsLimitAndShowDialogActionAtom
  )
  const showDialog = useSetAtom(globalDialogAtom)

  useLayoutEffect(() => {
    takeOfferFormDraftSnapshot()
  }, [field, takeOfferFormDraftSnapshot])

  const hasStepUnsavedChanges =
    !!initialSnapshot && !deepEqual(initialSnapshot, currentSnapshot)

  const getLocationValidationError = useCallback((): string | undefined => {
    if (field !== 'location') return undefined
    if (!(locationState?.includes('IN_PERSON') ?? false)) return undefined
    if ((location?.length ?? 0) > 0) return undefined

    if (listingType === 'PRODUCT') {
      return t('offerForm.errorPickupLocationNotFilled')
    }

    if (listingType === 'OTHER') {
      return t('offerForm.errorOtherOfferLocationNotFilled')
    }

    return t('offerForm.errorLocationNotFilled')
  }, [field, listingType, location?.length, locationState, t])

  const getMandatoryFieldValidationError = useCallback(():
    | string
    | undefined => {
    if (field === 'amount' && listingType !== 'BITCOIN') {
      if ((amountBottomLimit ?? 0) <= 0 && satsValue <= 0) {
        return t('offerForm.errorPriceNotFilled')
      }
    }

    if (field === 'location') {
      return getLocationValidationError()
    }

    if (field === 'network' && (btcNetwork?.length ?? 0) === 0) {
      return t('offerForm.selectPaymentDetails')
    }

    if (field === 'describe' && offerDescription.trim() === '') {
      return t('offerForm.errorDescriptionNotFilled')
    }

    if (field === 'language' && (selectedSpokenLanguages?.length ?? 0) === 0) {
      return t('offerForm.chooseOfferLanguage')
    }

    if (
      field === 'productCategory' &&
      listingType === 'PRODUCT' &&
      (productCategories?.length ?? 0) === 0
    ) {
      return t('offerForm.selectTypeOfProduct')
    }

    return undefined
  }, [
    amountBottomLimit,
    btcNetwork?.length,
    field,
    getLocationValidationError,
    listingType,
    offerDescription,
    productCategories?.length,
    satsValue,
    selectedSpokenLanguages?.length,
    t,
  ])

  const confirmLeave = useCallback(async (): Promise<boolean> => {
    const shouldSave = await Effect.runPromise(
      showDialog({
        title: t('editOffer.unsavedStepChangesTitle'),
        subtitle: t('editOffer.unsavedStepChangesDescription'),
        positiveButtonText: t('common.save'),
        negativeButtonText: t('editOffer.discard'),
        disableClose: true,
      })
    )

    if (shouldSave) {
      const validationError = getMandatoryFieldValidationError()
      if (validationError) {
        await Effect.runPromise(
          showDialog({
            title: t('offerForm.errorCreatingOffer'),
            subtitle: validationError,
            positiveButtonText: t('common.close'),
          })
        )
        return false
      }
    }

    if (shouldSave && field === 'amount' && listingType !== 'BITCOIN') {
      const amountValid = await Effect.runPromise(checkAmountExceedsLimit())
      if (!amountValid) return false
    }

    if (shouldSave && field === 'location') {
      discardLocationIfNotInPerson()
    }

    if (!shouldSave) {
      restoreOfferFormDraftSnapshot()
    }

    return true
  }, [
    checkAmountExceedsLimit,
    discardLocationIfNotInPerson,
    field,
    getMandatoryFieldValidationError,
    listingType,
    restoreOfferFormDraftSnapshot,
    showDialog,
    t,
  ])

  const {leaveWithoutConfirmation} = usePreventDiscardChangesWithConfirmation({
    enabled: hasStepUnsavedChanges,
    confirmLeave,
    fallbackLeave: safeGoBack,
  })

  const handleComplete = useCallback((): void => {
    leaveWithoutConfirmation()
  }, [leaveWithoutConfirmation])

  const handleLocationComplete = useCallback((): void => {
    discardLocationIfNotInPerson()
    leaveWithoutConfirmation()
  }, [discardLocationIfNotInPerson, leaveWithoutConfirmation])

  const saveLabel = t('common.save')
  const showInitialIcon = false
  const noop = useCallback(() => {}, [])

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t(fieldToTitleKey[field])}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <YStack>
        {field === 'amount' ? (
          listingType === 'BITCOIN' ? (
            <AmountStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
              showInitialIcon={showInitialIcon}
            />
          ) : (
            <PriceUpToStep
              active
              onEdit={noop}
              onComplete={handleComplete}
              ctaLabel={saveLabel}
              showInitialIcon={showInitialIcon}
            />
          )
        ) : null}
        {field === 'location' ? (
          <LocationStep
            active
            onEdit={noop}
            onComplete={handleLocationComplete}
            ctaLabel={saveLabel}
            showInitialIcon={showInitialIcon}
          />
        ) : null}
        {field === 'network' ? (
          <NetworkStep
            active
            onEdit={noop}
            onComplete={handleComplete}
            ctaLabel={saveLabel}
            showInitialIcon={showInitialIcon}
          />
        ) : null}
        {field === 'describe' ? (
          <DescribeStep
            active
            onEdit={noop}
            onComplete={handleComplete}
            ctaLabel={saveLabel}
            showInitialIcon={showInitialIcon}
          />
        ) : null}
        {field === 'language' ? (
          <LanguageStep
            active
            onEdit={noop}
            onComplete={handleComplete}
            ctaLabel={saveLabel}
            showInitialIcon={showInitialIcon}
          />
        ) : null}
        {field === 'productCategory' ? (
          <ProductCategoryStep
            active
            onEdit={noop}
            onComplete={handleComplete}
            ctaLabel={saveLabel}
            showInitialIcon={showInitialIcon}
          />
        ) : null}
        {field === 'friendLevel' ? (
          <YStack>
            <EditRow
              state="initial"
              headline={t('offerForm.whoCanSeeYourOffer')}
              showInitialIcon={showInitialIcon}
            />
            <YStack gap="$5" paddingVertical="$5">
              <FriendLevel
                hideSubtitle
                intendedConnectionLevelAtom={intendedConnectionLevelAtom}
              />
              <Button variant="primary" size="large" onPress={handleComplete}>
                {t('common.save')}
              </Button>
            </YStack>
          </YStack>
        ) : null}
        {field === 'clubs' ? (
          <YStack>
            <EditRow
              state="initial"
              headline={t('offerForm.publishToVexlClub')}
              showInitialIcon={showInitialIcon}
            />
            <YStack gap="$5" paddingVertical="$5">
              <YStack gap="$3">
                {clubsWithMembersAtoms.map((clubWithMembersAtom) => (
                  <ClubItem
                    key={atomKeyExtractor(clubWithMembersAtom)}
                    clubWithMembersAtom={clubWithMembersAtom}
                    createSelectClubAtom={createSelectClubAtom}
                  />
                ))}
              </YStack>
              <Button variant="primary" size="large" onPress={handleComplete}>
                {t('common.save')}
              </Button>
            </YStack>
          </YStack>
        ) : null}
      </YStack>
    </Screen>
  )
}

export default EditOfferFieldScreen
