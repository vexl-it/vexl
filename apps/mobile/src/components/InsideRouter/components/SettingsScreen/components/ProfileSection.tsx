import {useSessionAssumeLoggedIn} from '../../../../../state/session'
import UserDataDisplay from '../../../../LoginFlow/components/AnonymizationAnimationScreen/components/UserDataDisplay'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import SvgImage from '../../../../Image'
import QRIconSVG from '../images/QRIconSVG'
import {TouchableOpacity} from 'react-native'
import reachIconSVG from '../images/reachIconSVG'
import {Stack, styled, Text, XStack} from 'tamagui'
import {useAtomValue, useSetAtom} from 'jotai'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'
import {qrCodeDialogVisibleAtom, qrScannerDialogVisibleAtom} from '../atoms'
import QrCode from './QrCode'
import cameraSvg from '../../../images/cameraSvg'
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
  const session = useSessionAssumeLoggedIn()
  const reachNumber = useAtomValue(reachNumberAtom)
  const setQrCodeDialogVisible = useSetAtom(qrCodeDialogVisibleAtom)
  const setQrScannerDialogVisible = useSetAtom(qrScannerDialogVisibleAtom)

  return (
    <Stack ai="center" ml="$4" mr="$4">
      <XStack jc="space-between" als="stretch" mb="$7">
        <GrayBackContainer>
          <Stack w={24} h={24}>
            <SvgImage source={reachIconSVG} />
          </Stack>
          <Text fos={16} ml="$2" col="$greyOnBlack">
            {t('settings.yourReach', {number: reachNumber})}
          </Text>
        </GrayBackContainer>
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
      <UserDataDisplay
        userNameAndAvatar={{
          userName: session.realUserData.userName,
          image: session.realUserData.image ?? session.anonymizedUserData.image,
        }}
      />
      <Text ta="center" mt="$2" col="$greyOnBlack">
        {session.phoneNumber}
      </Text>
      <QrCode />
      <QrScanner />
    </Stack>
  )
}

export default ProfileSection
