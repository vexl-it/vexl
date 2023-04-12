import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ProfileSection from './components/ProfileSection'
import ButtonsSection from './components/ButtonsSection'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {Text} from 'tamagui'

function SettingsScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <ContainerWithTopBorderRadius scrollView withTopPadding>
      <ProfileSection />
      <ButtonsSection />
      <Text fos={14} ta="center" mt="$5" col={'$greyOnBlack'}>
        {t('settings.noLogoutExplanation')}
      </Text>
    </ContainerWithTopBorderRadius>
  )
}

export default SettingsScreen
