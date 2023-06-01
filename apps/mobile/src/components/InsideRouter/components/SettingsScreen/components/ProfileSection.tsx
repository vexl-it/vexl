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
import {qrCodeDialogVisibleAtom} from '../atoms'
import QrCode from './QrCode'

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
      </XStack>
      <UserDataDisplay userNameAndAvatar={session.realUserData} />
      <Text ta="center" mt="$2" col="$greyOnBlack">
        {session.phoneNumber}
      </Text>
      <QrCode />
    </Stack>
  )
}

export default ProfileSection
