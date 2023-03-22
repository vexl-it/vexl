import Text from '../../../Text'
import styled from '@emotion/native'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ProfileSection from './components/ProfileSection'
import ButtonsSection from './components/ButtonsSection'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

const RootContainer = styled(ContainerWithTopBorderRadius)``
const LogoutText = styled(Text)`
  font-size: 14px;
  text-align: center;
  margin-top: 20px;
`

function SettingsScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <RootContainer scrollView withTopPadding>
      <ProfileSection />
      <ButtonsSection />
      <LogoutText colorStyle={'grayOnBlack'}>
        {t('settings.noLogoutExplanation')}
      </LogoutText>
    </RootContainer>
  )
}

export default SettingsScreen
