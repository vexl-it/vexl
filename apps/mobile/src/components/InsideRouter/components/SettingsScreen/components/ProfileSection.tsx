import {useNavigation} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, styled} from 'tamagui'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../../../state/session'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import SvgImage from '../../../../Image'
import UserDataDisplay from '../../../../LoginFlow/components/AnonymizationAnimationScreen/components/UserDataDisplay'
import cameraSvg from '../../../images/cameraSvg'
import {qrCodeDialogVisibleAtom, qrScannerDialogVisibleAtom} from '../atoms'
import QRIconSVG from '../images/QRIconSVG'
import reachIconSVG from '../images/reachIconSVG'
import QrCode from './QrCode'
import QrScanner from './QrScanner'

const GrayBackContainer = styled(XStack, {
  ai: 'center',
  h: 40,
  br: '$4',
  bg: '$grey',
  pl: '$2',
  pr: '$2',
})

function ProfileSection(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const reachNumber = useAtomValue(reachNumberAtom)
  const setQrCodeDialogVisible = useSetAtom(qrCodeDialogVisibleAtom)
  const setQrScannerDialogVisible = useSetAtom(qrScannerDialogVisibleAtom)

  const userDataRealOrAnonymized = useAtomValue(userDataRealOrAnonymizedAtom)
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)

  return (
    <Stack ai="center" ml="$4" mr="$4">
      <XStack jc="space-between" als="stretch" mb="$7">
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SetContacts', {})
          }}
        >
          <GrayBackContainer>
            <Stack w={24} h={24}>
              <SvgImage source={reachIconSVG} />
            </Stack>
            <Text fos={16} ml="$2" col="$greyOnBlack">
              {t('settings.yourReach', {number: reachNumber})}
            </Text>
          </GrayBackContainer>
        </TouchableOpacity>
        <XStack space="$2">
          <TouchableOpacity
            onPress={() => {
              setQrCodeDialogVisible(true)
            }}
          >
            <GrayBackContainer>
              <Stack w={24} h={24}>
                <SvgImage source={QRIconSVG} />
              </Stack>
            </GrayBackContainer>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setQrScannerDialogVisible(true)
            }}
          >
            <GrayBackContainer>
              <Stack w={24} h={24}>
                <SvgImage source={cameraSvg} />
              </Stack>
            </GrayBackContainer>
          </TouchableOpacity>
        </XStack>
      </XStack>
      <UserDataDisplay realLifeInfo={userDataRealOrAnonymized} />
      <Text ta="center" mt="$2" col="$greyOnBlack">
        {userPhoneNumber}
      </Text>
      <QrCode />
      <QrScanner />
    </Stack>
  )
}

export default ProfileSection
