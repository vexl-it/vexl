import {useSessionAssumeLoggedIn} from '../../../../../state/session'
import UserDataDisplay from '../../../../LoginFlow/components/AnonymizationAnimationScreen/components/UserDataDisplay'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import SvgImage from '../../../../Image'
import QRIconSVG from '../images/QRIconSVG'
import {Alert, TouchableWithoutFeedback} from 'react-native'
import reachIconSVG from '../images/reachIconSVG'
import {Stack, styled, Text, XStack} from 'tamagui'
import {enableHiddenFeatures} from '../../../../../utils/environment'
import {useAtomValue} from 'jotai'
import {reachNumberAtom} from '../../../../../state/connections/atom/connectionStateAtom'

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
        {enableHiddenFeatures ? (
          <TouchableWithoutFeedback
            onPress={() => {
              Alert.alert('todo')
            }}
          >
            <GrayBackContainer>
              <Stack w={24} h={24}>
                <SvgImage source={QRIconSVG} />
              </Stack>
            </GrayBackContainer>
          </TouchableWithoutFeedback>
        ) : (
          <Stack></Stack>
        )}
      </XStack>
      <UserDataDisplay userNameAndAvatar={session.realUserData} />
      <Text ta="center" mt="$2" col="$greyOnBlack">
        {session.phoneNumber}
      </Text>
    </Stack>
  )
}

export default ProfileSection
