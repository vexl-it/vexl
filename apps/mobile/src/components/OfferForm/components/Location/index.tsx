import {
  type ListingType,
  type LocationState,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useMemo, useState} from 'react'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Help from '../../../Help'
import SvgImage from '../../../Image'
import Info from '../../../Info'
import {
  newLocationSessionId,
  type LocationSessionId,
} from '../../../LocationSearch/molecule'
import Switch from '../../../Switch'
import Tabs from '../../../Tabs'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import locationSvg from '../../../images/locationSvg'
import AddCityOrDistrict from '../AddCityOrDistrict'
import LocationsList from '../LocationsList'
import SelectLocationFlowModal from './components/SelectLocationFlowModal'
import useContent from './useContent'

interface Props {
  inFilter?: boolean
  listingTypeAtom: PrimitiveAtom<ListingType | undefined>
  setOfferLocationActionAtom: WritableAtom<
    null,
    [locationSuggestionAtom: LocationSuggestion],
    void
  >
  locationAtom: PrimitiveAtom<readonly OfferLocation[] | undefined>
  locationStateAtom: PrimitiveAtom<readonly LocationState[] | undefined>
  toggleLocationActiveAtom: PrimitiveAtom<boolean | undefined>
  updateLocationStateAndPaymentMethodAtom: WritableAtom<
    null,
    [locationState: LocationState],
    void
  >
  randomizeLocation: boolean
}

function LocationComponent({
  inFilter,
  listingTypeAtom,
  locationAtom,
  locationStateAtom,
  toggleLocationActiveAtom,
  updateLocationStateAndPaymentMethodAtom,
  randomizeLocation,
}: Props): JSX.Element | null {
  const tokens = getTokens()
  const {t} = useTranslation()
  const content = useContent()

  const listingType = useAtomValue(listingTypeAtom)
  const [location, setLocation] = useAtom(locationAtom)
  const [locationActive, setLocationActive] = useAtom(toggleLocationActiveAtom)
  const locationState = useAtomValue(locationStateAtom)
  const updateLocationStateAndPaymentMethod = useSetAtom(
    updateLocationStateAndPaymentMethodAtom
  )
  const [helpVisible, setHelpVisible] = useState<boolean>(false)

  const [locationSearchVisible, setLocationSearchVisible] =
    useState<LocationSessionId | null>(null)
  const switchIsVisible = useMemo(
    () => listingType === 'OTHER' && !inFilter,
    [inFilter, listingType]
  )

  const onLocationStateChange = (locationState: LocationState): void => {
    updateLocationStateAndPaymentMethod(locationState)
  }

  const onLocationRemove = (locationToRemove: OfferLocation): void => {
    const filteredLocation = location?.filter(
      (loc) => loc.placeId !== locationToRemove.placeId
    )
    if (filteredLocation) setLocation(filteredLocation)
  }

  return (
    <YStack gap="$2" mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack f={1} ai="center" mr="$1">
          <Stack mr="$2">
            <SvgImage
              height={24}
              width={24}
              stroke={
                !switchIsVisible || locationActive
                  ? tokens.color.white.val
                  : tokens.color.greyOnWhite.val
              }
              source={locationSvg}
            />
          </Stack>
          <Stack fs={1}>
            <Text
              numberOfLines={2}
              ff="$body700"
              col={
                !switchIsVisible || locationActive ? '$white' : '$greyOnWhite'
              }
              fos={24}
            >
              {t('offerForm.location.location')}
            </Text>
          </Stack>
        </XStack>
        {!!switchIsVisible && (
          <Switch value={locationActive} onValueChange={setLocationActive} />
        )}
      </XStack>
      {(!listingType || listingType === 'BITCOIN') && (
        <Tabs
          activeTab={locationState ? locationState[0] : undefined}
          onTabPress={onLocationStateChange}
          tabs={content}
        />
      )}
      {!!(
        (listingType === 'OTHER' && !!locationActive) ||
        locationState?.includes('IN_PERSON')
      ) && (
        <YStack gap="$2">
          {!!(!location || (location && location.length < 3)) && (
            <AddCityOrDistrict
              onPress={() => {
                setLocationSearchVisible(newLocationSessionId())
              }}
            />
          )}
          <LocationsList
            locations={location}
            onLocationRemove={onLocationRemove}
          />
        </YStack>
      )}
      {(!listingType || listingType === 'BITCOIN') &&
        !!locationState?.includes('ONLINE') && (
          <Info
            actionButtonText={t('offerForm.location.checkItOut')}
            text={t('offerForm.location.meetingInPerson')}
            onActionPress={() => {
              setHelpVisible(true)
            }}
          />
        )}
      <SelectLocationFlowModal
        randomizeLocation={randomizeLocation}
        locationSessionId={locationSearchVisible ?? newLocationSessionId()}
        locationAtom={locationAtom}
        onSetVisible={(visible) => {
          if (visible) setLocationSearchVisible(newLocationSessionId())
          else setLocationSearchVisible(null)
        }}
        visible={!!locationSearchVisible}
      />

      {!!helpVisible && (
        <Help
          visible={helpVisible}
          onClose={() => {
            setHelpVisible(false)
          }}
          title={t('offerForm.location.whatToWatchOutForOnline')}
          image={anonymousCounterpartSvg}
        >
          <YStack gap="$6">
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.moneySentByRandomPerson')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.neverSendCrypto')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.alwaysVerifyTheName')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('offerForm.location.forwardTheAddress')}
            </Text>
          </YStack>
        </Help>
      )}
    </YStack>
  )
}

export default LocationComponent
