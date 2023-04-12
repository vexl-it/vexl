import useContent from './useContent'
import Tabs from '../../../Tabs'
import {useState} from 'react'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../../Image'
import infoSvg from '../../images/infoSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {TouchableOpacity, TouchableWithoutFeedback} from 'react-native'
import closeSvg from '../../../images/closeSvg'
import Button from '../../../Button'
import magnifyingGlass from '../../../images/magnifyingGlass'
import Help from '../Help'
import anonymousCounterpartSvg from '../../../images/anonymousCounterpartSvg'
import {useAtom} from 'jotai'
import {locationAtom, locationStateAtom} from '../../state/atom'
import {type LocationState} from '@vexl-next/domain/dist/general/offers'
import LocationSearch from '../LocationSearch'

function Location(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const content = useContent()

  const [location, setLocation] = useAtom(locationAtom)
  const [locationState, setLocationState] = useAtom(locationStateAtom)
  const [onlineMessageHidden, setOnlineMessageHidden] = useState<boolean>(false)
  const [helpVisible, setHelpVisible] = useState<boolean>(false)
  const [locationSearchVisible, setLocationSearchVisible] =
    useState<boolean>(false)

  const onLocationStateChange = (locationState: LocationState): void => {
    setLocationState(locationState)
  }

  const onLocationRemove = (city: string): void => {
    const filteredLocation = location.filter((loc) => loc.city !== city)
    setLocation(filteredLocation)
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
                {t('createOffer.location.addCityOrDistrict')}
              </Text>
            </XStack>
          </TouchableWithoutFeedback>
          {location.map((loc) => (
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
                {t('createOffer.location.meetingInPerson')}
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
            text={t('createOffer.location.checkItOut')}
            onPress={() => {
              setHelpVisible(true)
            }}
            variant="hint"
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
          title={t('createOffer.location.whatToWatchOutForOnline')}
          image={anonymousCounterpartSvg}
        >
          <YStack space="$6">
            <Text fos={18} color="$greyOnWhite">
              {t('createOffer.location.moneySentByRandomPerson')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('createOffer.location.neverSendCrypto')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('createOffer.location.alwaysVerifyTheName')}
            </Text>
            <Text fos={18} color="$greyOnWhite">
              {t('createOffer.location.forwardTheAddress')}
            </Text>
          </YStack>
        </Help>
      )}
    </YStack>
  )
}

export default Location
