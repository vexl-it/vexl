import {useNavigation} from '@react-navigation/native'
import {type LocationState} from '@vexl-next/domain/src/general/offers'
import {longitudeDeltaToKilometers} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  Button,
  EditRow,
  RowButton,
  SegmentedPicker,
  Typography,
} from '@vexl-next/ui'
import {ChevronRight, InfoCircle, PlusAdd} from '@vexl-next/ui/src/icons'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useTheme, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../GlobalDialog'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import LocationRow from './LocationRow'

function useLocationTabs(isProduct: boolean): ReadonlyArray<{
  readonly label: string
  readonly value: LocationState
}> {
  const {t} = useTranslation()
  return [
    {label: t('offerForm.inPerson'), value: 'IN_PERSON'},
    {
      label: isProduct ? t('offerForm.delivery') : t('offerForm.online'),
      value: 'ONLINE',
    },
  ]
}

interface LocationStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
}

function LocationStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
}: LocationStepProps): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const {
    listingTypeAtom,
    locationStateAtom,
    locationAtom,
    removeLocationActionAtom,
    updateLocationStateAndPaymentMethodAtom,
  } = useMolecule(offerFormMolecule)

  const listingType = useAtomValue(listingTypeAtom)
  const locationState = useAtomValue(locationStateAtom)
  const location = useAtomValue(locationAtom)
  const removeLocation = useSetAtom(removeLocationActionAtom)
  const updateLocationState = useAtom(
    updateLocationStateAndPaymentMethodAtom
  )[1]
  const showDialog = useSetAtom(globalDialogAtom)

  const isProduct = listingType === 'PRODUCT'
  const isOnline = locationState?.includes('ONLINE') ?? false
  const activeTab: LocationState = isOnline ? 'ONLINE' : 'IN_PERSON'
  const tabs = useLocationTabs(isProduct)

  const hasLocations = (location?.length ?? 0) > 0

  if (!active) {
    if (isOnline) {
      return (
        <EditRow
          state="completed"
          icon={icon}
          overline={overline ?? t('offerForm.setLocation')}
          headline={isProduct ? t('offerForm.delivery') : t('offerForm.online')}
          onPress={onEdit}
        />
      )
    }

    const formatted = (location ?? []).map((loc) => {
      const radiusKm =
        Math.round(longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10) /
        10
      return `${loc.shortAddress ?? loc.address}, range ${radiusKm} km`
    })
    const remaining = formatted.length - 2
    const headline = formatted.slice(0, 2).join('\n')

    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.setLocation')}
        headline={headline}
        headlineSuffix={remaining > 0 ? `+${remaining}` : undefined}
        onPress={onEdit}
      />
    )
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <YStack>
        <EditRow state="initial" headline={t('offerForm.setLocation')} />
        <YStack gap="$5" paddingVertical="$5">
          <SegmentedPicker
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={updateLocationState}
          />

          {!isOnline ? (
            <YStack gap="$3">
              {location?.map((loc) => {
                const radiusKm =
                  Math.round(
                    longitudeDeltaToKilometers(loc.radius, loc.latitude) * 10
                  ) / 10
                const displayText = `${loc.shortAddress ?? loc.address}, range ${radiusKm} km`
                return (
                  <LocationRow
                    key={loc.placeId}
                    text={displayText}
                    onRemove={() => {
                      removeLocation(loc.placeId)
                    }}
                  />
                )
              })}
              {!location || location.length < 3 ? (
                <RowButton
                  label={t('offerForm.addLocation')}
                  icon={PlusAdd}
                  onPress={() => {
                    navigation.navigate('SelectLocationSearch', {
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
                <XStack
                  backgroundColor="$backgroundSecondary"
                  borderRadius="$3"
                  padding="$5"
                  gap="$3"
                  alignItems="flex-start"
                >
                  <InfoCircle color={theme.foregroundSecondary.val} size={24} />
                  <Typography
                    variant="description"
                    color="$foregroundSecondary"
                    flex={1}
                  >
                    {t('offerForm.location.meetingInPersonSafer')}
                  </Typography>
                </XStack>
              ) : (
                <XStack
                  backgroundColor="$backgroundSecondary"
                  borderRadius="$3"
                  padding="$5"
                  gap="$5"
                  alignItems="center"
                  onPress={() => {
                    void Effect.runPromise(
                      showDialog({
                        title: t(
                          'offerForm.location.receivePaymentsSafely.title'
                        ),
                        subtitle: t(
                          'offerForm.location.receivePaymentsSafely.description'
                        ),
                        positiveButtonText: t('common.gotIt'),
                      })
                    )
                  }}
                >
                  <XStack flex={1} gap="$3" alignItems="flex-start">
                    <InfoCircle
                      color={theme.foregroundSecondary.val}
                      size={24}
                    />
                    <Typography
                      variant="description"
                      color="$foregroundSecondary"
                      flex={1}
                    >
                      {t('offerForm.location.onlineTradeWarning')}
                    </Typography>
                  </XStack>
                  <ChevronRight
                    color={theme.foregroundSecondary.val}
                    size={24}
                  />
                </XStack>
              )}
              <Button variant="primary" size="large" onPress={onComplete}>
                {ctaLabel ?? t('offerForm.next')}
              </Button>
            </YStack>
          )}
        </YStack>
      </YStack>
    </Animated.View>
  )
}

export default LocationStep
