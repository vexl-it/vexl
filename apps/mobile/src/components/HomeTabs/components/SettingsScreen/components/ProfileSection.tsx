import styled from '@emotion/native'
import Text from '../../../../Text'
import {useSessionAssumeLoggedIn} from '../../../../../state/session'
import UserDataDisplay from '../../../../LoginFlow/components/AnonymizationAnimationScreen/components/UserDataDisplay'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import QRIconSVG from '../images/QRIconSVG'
import {Alert, TouchableWithoutFeedback} from 'react-native'
import reachIconSVG from '../images/reachIconSVG'

const RootContainer = styled.View`
  align-items: center;
  margin-left: 16px;
  margin-right: 16px;
`

const TopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-self: stretch;
  margin-bottom: 32px;
`

const GrayBackContainer = styled.View`
  flex-direction: row;
  height: 40px;
  border-radius: 10px;
  background-color: ${({theme}) => theme.colors.grey};
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  align-items: center;
`

const SvgIcon = styled(Image)`
  width: 24px;
  height: 24px;
`

const ReachText = styled(Text)`
  margin-left: 8px;
  font-size: 16px;
`

const PhoneNumber = styled(Text)`
  margin-top: 8px;
  text-align: center;
`

function ProfileSection(): JSX.Element {
  const {t} = useTranslation()
  const session = useSessionAssumeLoggedIn()

  return (
    <RootContainer>
      <TopRow>
        <GrayBackContainer>
          <SvgIcon source={reachIconSVG} />
          <ReachText colorStyle="grayOnBlack">
            {t('settings.yourReach', {number: 1000})}
          </ReachText>
        </GrayBackContainer>
        <TouchableWithoutFeedback
          onPress={() => {
            Alert.alert('todo')
          }}
        >
          <GrayBackContainer>
            <SvgIcon source={QRIconSVG} />
          </GrayBackContainer>
        </TouchableWithoutFeedback>
      </TopRow>
      <UserDataDisplay userNameAndAvatar={session.realUserData} />
      <PhoneNumber colorStyle="grayOnBlack">{session.phoneNumber}</PhoneNumber>
    </RootContainer>
  )
}

export default ProfileSection
