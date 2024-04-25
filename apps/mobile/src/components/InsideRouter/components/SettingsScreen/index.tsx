import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ButtonsSection from './components/ButtonsSection'
import ProfileSection from './components/ProfileSection'
import VersionTextWithSecretDoor from './components/VersionTextWithSecretDoor'

function SettingsScreen(): JSX.Element {
  const {t} = useTranslation()
  return (
    <ContainerWithTopBorderRadius scrollView>
      <ProfileSection />
      <ButtonsSection />
      <Text fos={14} ta="center" mt="$5" col="$greyOnBlack">
        {t('settings.noLogoutExplanation')}
      </Text>
      <Stack mt="$5">
        <VersionTextWithSecretDoor />
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default SettingsScreen
