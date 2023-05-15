import useContent from './useContent'
import Tabs from '../../../Tabs'
import {useState} from 'react'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../../Image'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {TouchableOpacity, TouchableWithoutFeedback} from 'react-native'
import closeSvg from '../../../images/closeSvg'
import Button from '../../../Button'
import magnifyingGlass from '../../../images/magnifyingGlass'
import Help from '../Help'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import {
  type PrimitiveAtom,
  useAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import {
  type Location,
  type LocationState,
} from '@vexl-next/domain/dist/general/offers'
import LocationSearch from '../LocationSearch'
import infoSvg from '../../../images/infoSvg'

interface Props {
  locationAtom: PrimitiveAtom<Location[]>
  locationStateAtom: PrimitiveAtom<LocationState>
  updateLocationStatePaymentMethodAtom: WritableAtom<
    null,
    [
      {
        locationState: LocationState
      }
    ],
    boolean
  >
}

function LocationComponent({
  locationAtom,
  locationStateAtom,
  updateLocationStatePaymentMethodAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const content = useContent()

  const [location, setLocation] = useAtom(locationAtom)
  const locationState = useAtomValue(locationStateAtom)
  const updateLocationStatePaymentMethod = useSetAtom(
    updateLocationStatePaymentMethodAtom
  )
  const [onlineMessageHidden, setOnlineMessageHidden] = useState<boolean>(false)
  const [helpVisible, setHelpVisible] = useState<boolean>(false)
  const [locationSearchVisible, setLocationSearchVisible] =
    useState<boolean>(false)

  const onLocationStateChange = (locationState: LocationState): void => {
    updateLocationStatePaymentMethod({locationState})
  }

  const onLocationRemove = (city: string): void => {
    const filteredLocation = location?.filter((loc) => loc.city !== city)
    if (filteredLocation) setLocation(filteredLocation)
  }

  return (
    <YStack space="$2">
      <Tabs
        activeTab={locationState}
        onTabPress={onLocationStateChange}
        tabs={content}
      />
      {locationState === 'IN_PERSON' && (
        <YStack space="$2">
          <TouchableWithoutFeedback
            onPress={() => {
              setLocationSearchVisible(true)
            }}
          >
            <XStack ai="center" p="$5" bc="$grey" br="$5">
              <Stack h={24} w={24}>
                <SvgImage
                  stroke={tokens.color.white.val}
                  source={magnifyingGlass}
                />
              </Stack>
              <Text ml="$4" ff="$body600" fos={18} col="$greyOnBlack">
                {t('offerForm.location.addCityOrDistrict')}
              </Text>
            </XStack>
          </TouchableWithoutFeedback>
          {location?.map((loc) => (
            <XStack
              key={loc.latitude}
              br="$5"
              bc="$darkBrown"
              p="$4"
              ai="center"
              jc="space-between"
            >
              <Text fos={18} color="$main">
                {loc.city}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onLocationRemove(loc.city)
                }}
              >
                <SvgImage stroke={tokens.color.main.val} source={closeSvg} />
              </TouchableOpacity>
            </XStack>
          ))}
        </YStack>
      )}
      {locationState === 'ONLINE' && !onlineMessageHidden && (
        <Stack jc="center" p="$4" bc="$pinkAccent1" br="$4">
          <XStack justifyContent="space-evenly" mb="$4">
            <SvgImage fill={tokens.color.pink.val} source={infoSvg} />
            <Stack fs={1} px="$2">
              <Text fos={14} col="$pink">
                {t('offerForm.location.meetingInPerson')}
              </Text>
            </Stack>
            <TouchableOpacity
              onPress={() => {
                setOnlineMessageHidden(true)
              }}
            >
              <SvgImage stroke={tokens.color.pink.val} source={closeSvg} />
            </TouchableOpacity>
          </XStack>
          <Button
            text={t('offerForm.location.checkItOut')}
            onPress={() => {
              setHelpVisible(true)
            }}
            variant="hint"
            size="medium"
          />
        </Stack>
      )}
      {locationSearchVisible && (
        <LocationSearch
          locationAtom={locationAtom}
          onClosePress={() => {
            setLocationSearchVisible(false)
          }}
          visible={locationSearchVisible}
        />
      )}
      {helpVisible && (
        <Help
          visible={helpVisible}
          onClose={() => {
            setHelpVisible(false)
          }}
          title={t('offerForm.location.whatToWatchOutForOnline')}
          image={anonymousCounterpartSvg}
        >
          <YStack space="$6">
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
