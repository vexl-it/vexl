import styled from '@emotion/native'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import Spacer from '../../Spacer'

export type TabType = 'termsOfUse' | 'privacyPolicy'

interface Props {
  activeTab: TabType
  onTabPress: (_: TabType) => void
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  border-radius: 10px;
  background-color: ${(p) => p.theme.colors.grey};
  padding: 4px;
`

const TabButton = styled(Button)<{active: boolean}>`
  flex: 1;
  background-color: ${(p) => (p.active ? '#322717' : 'transparent')};
`
function Tabs({activeTab, onTabPress}: Props): JSX.Element {
  const {t} = useTranslation()
  return (
    <Container>
      <TabButton
        active={activeTab === 'termsOfUse'}
        variant={activeTab === 'termsOfUse' ? 'primary' : 'blackOnDark'}
        text={t('termsOfUse.termsOfUse')}
        onPress={() => {
          onTabPress('termsOfUse')
        }}
      />
      <Spacer x$={2} />
      <TabButton
        active={activeTab === 'privacyPolicy'}
        variant={activeTab === 'privacyPolicy' ? 'primary' : 'blackOnDark'}
        text={t('termsOfUse.privacyPolicy')}
        onPress={() => {
          onTabPress('privacyPolicy')
        }}
      />
    </Container>
  )
}

export default Tabs
