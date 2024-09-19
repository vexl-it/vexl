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
import {qrScannerDialogAtom} from '../atoms'
import QRIconSVG from '../images/QRIconSVG'
import reachIconSVG from '../images/reachIconSVG'
import {qrCodeDialogAtom} from './QrCode'

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
  const setQrCodeDialogVisible = useSetAtom(qrCodeDialogAtom)
  const setQrScannerDialogVisible = useSetAtom(qrScannerDialogAtom)

  const userDataRealOrAnonymized = useAtomValue(userDataRealOrAnonymizedAtom)
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)

  return (
    <Stack ai="center" ml="$4" mr="$4">
      <XStack jc="space-between" mb="$7" space="$2">
        <Stack f={3}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SetContacts', {})
            }}
          >
            <GrayBackContainer>
              <Stack w={24} h={24}>
                <SvgImage source={reachIconSVG} />
              </Stack>
              <Text
                fs={1}
                fos={16}
                ml="$2"
                col="$greyOnBlack"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('settings.yourReach', {number: reachNumber})}
              </Text>
            </GrayBackContainer>
          </TouchableOpacity>
        </Stack>
        <XStack f={1} space="$2">
          <TouchableOpacity
            onPress={() => {
              void setQrCodeDialogVisible()
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
              void setQrScannerDialogVisible()
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
    </Stack>
  )
}

export default ProfileSection
