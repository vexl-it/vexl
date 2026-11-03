import {useNavigation} from '@react-navigation/native'
import {
  type ListingType,
  type LocationState,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  Button,
  EditStep,
  InfoBox,
  PlusAdd,
  RowButton,
  SegmentedPicker,
  TrashBin,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {offerLocationLabelsAtom} from '../../../utils/offerLocationLabelsAtom'
import {globalDialogAtom} from '../../GlobalDialog'
import {LocationPickerMolecule} from '../../LocationPicker/molecule'
import {offerLocationToMapValueWithRadius} from '../../LocationPicker/utils'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'

function useLocationStateLabels(
  listingType: ListingType | undefined
): Record<LocationState, string> {
  const {t} = useTranslation()

  if (listingType === 'PRODUCT')
    return {IN_PERSON: t('offerForm.pickup'), ONLINE: t('offerForm.delivery')}
  if (listingType === 'OTHER')
    return {IN_PERSON: t('offerForm.onSite'), ONLINE: t('offerForm.remote')}
  return {IN_PERSON: t('offerForm.inPerson'), ONLINE: t('offerForm.online')}
}

function LocationStep({
  onComplete,
  ctaLabel,
  ...stepProps
}: OfferFormStepProps): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {getFullLabel} = useAtomValue(offerLocationLabelsAtom)
  const {
    listingTypeAtom,
    locationStateAtom,
    locationAtom,
    removeLocationActionAtom,
    updateLocationStateAndPaymentMethodAtom,
  } = useMolecule(offerFormMolecule)
  const {selectedMapValueAtom} = useMolecule(LocationPickerMolecule)

  const listingType = useAtomValue(listingTypeAtom)
  const locationState = useAtomValue(locationStateAtom)
  const location = useAtomValue(locationAtom)
  const removeLocation = useSetAtom(removeLocationActionAtom)
  const setSelectedMapValue = useSetAtom(selectedMapValueAtom)
  const updateLocationState = useAtom(
    updateLocationStateAndPaymentMethodAtom
  )[1]
  const showDialog = useSetAtom(globalDialogAtom)

  const isProduct = listingType === 'PRODUCT'
  const isOnline = locationState.includes('ONLINE')
  const activeTab: LocationState = isOnline ? 'ONLINE' : 'IN_PERSON'
  const locationStateLabels = useLocationStateLabels(listingType)
  const tabs = [
    {label: locationStateLabels.IN_PERSON, value: 'IN_PERSON'},
    {label: locationStateLabels.ONLINE, value: 'ONLINE'},
  ] satisfies ReadonlyArray<{label: string; value: LocationState}>

  const hasLocations = location.length > 0

  const formatLocationWithRadius = (loc: OfferLocation): string => {
    const radiusKm =
      Math.round(longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10) / 10

    return `${getFullLabel(loc)}, ${t('map.locationSelect.radius', {
      radius: formatDecimal(radiusKm, locale),
    })}`
  }

  const formattedLocations = location.map(formatLocationWithRadius)
  const hiddenLocationsCount = formattedLocations.length - 2

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.setLocation')}
      value={
        isOnline
          ? locationStateLabels.ONLINE
          : formattedLocations.slice(0, 2).join('\n')
      }
      valueSuffix={
        !isOnline && hiddenLocationsCount > 0
          ? `+${hiddenLocationsCount}`
          : undefined
      }
    >
      <SegmentedPicker
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={updateLocationState}
      />

      {!isOnline ? (
        <YStack gap="$3">
          {location.map((loc) => {
            const displayText = formatLocationWithRadius(loc)
            return (
              <RowButton
                key={loc.placeId}
                label={displayText}
                onPress={() => {
                  setSelectedMapValue(offerLocationToMapValueWithRadius(loc))
                  navigation.navigate('OfferLocationRadius', {
                    randomizeLocation: true,
                    editingLocationPlaceId: loc.placeId,
                  })
                }}
                trailingAction={{
                  icon: TrashBin,
                  accessibilityLabel: t('common.delete'),
                  onPress: () => {
                    removeLocation(loc.placeId)
                  },
                }}
              />
            )
          })}
          {location.length < 3 ? (
            <RowButton
              label={t('offerForm.addLocation')}
              icon={PlusAdd}
              onPress={() => {
                navigation.navigate('OfferLocationSearch', {
                  randomizeLocation: true,
                })
              }}
            />
          ) : null}
          {hasLocations ? (
            <Button variant="primary" size="large" onPress={onComplete}>
              {ctaLabel ?? t('offerForm.next')}
            </Button>
          ) : null}
        </YStack>
      ) : (
        <YStack gap="$5">
          {isProduct ? (
            <InfoBox>{t('offerForm.location.meetingInPersonSafer')}</InfoBox>
          ) : (
            <InfoBox
              onPress={() => {
                void Effect.runPromise(
                  showDialog({
                    title: t('offerForm.location.receivePaymentsSafely.title'),
                    subtitle: t(
                      'offerForm.location.receivePaymentsSafely.description'
                    ),
                    positiveButtonText: t('common.gotIt'),
                  })
                )
              }}
            >
              {t('offerForm.location.onlineTradeWarning')}
            </InfoBox>
          )}
          <Button variant="primary" size="large" onPress={onComplete}>
            {ctaLabel ?? t('offerForm.next')}
          </Button>
        </YStack>
      )}
    </EditStep>
  )
}

export default LocationStep
