import Button from '../../Button'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export type TabType = 'termsOfUse' | 'privacyPolicy'

interface Props {
  activeTab: TabType
  onTabPress: (_: TabType) => void
}

function Tabs({activeTab, onTabPress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <Stack fd="row" ai="center" br="$4" bg="$grey" p="$1">
      <Button
        fullSize
        variant={activeTab === 'termsOfUse' ? 'primary' : 'blackOnDark'}
        text={t('termsOfUse.termsOfUse')}
        onPress={() => {
          onTabPress('termsOfUse')
        }}
      />
      <Button
        fullSize
        variant={activeTab === 'privacyPolicy' ? 'primary' : 'blackOnDark'}
        text={t('termsOfUse.privacyPolicy')}
        onPress={() => {
          onTabPress('privacyPolicy')
        }}
      />
    </Stack>
  )
}

export default Tabs
