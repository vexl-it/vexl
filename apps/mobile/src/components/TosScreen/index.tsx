import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'
import {useNavigation} from '@react-navigation/native'
import FaqsRedirect from './components/FaqsRedirect'
import Tabs, {type TabType} from './components/Tabs'
import {useTheme} from '@emotion/react'
import {useEffect, useRef, useState} from 'react'
import {ScrollView} from 'react-native'
import Markdown from '../Markdown'
import Spacer from '../Spacer'

function Tos(): JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeTab, setActiveTab] = useState<TabType>('termsOfUse')

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({x: 0, y: 0, animated: false})
    }
  }, [activeTab])

  return (
    <Screen customHorizontalPadding={theme.spacings.small}>
      <ScreenTitle
        onClosePress={navigation.goBack}
        text={t('termsOfUse.termsOfUse')}
      />
      <FaqsRedirect onPress={() => {}} />
      <Spacer y$={4} />
      <Tabs activeTab={activeTab} onTabPress={setActiveTab} />
      <Spacer y$={1} />
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
      >
        {activeTab === 'termsOfUse' ? (
          <Markdown>{t('termsOfUse.termsOfUseText')}</Markdown>
        ) : (
          <Markdown>{t('termsOfUse.privacyPolicyText')}</Markdown>
        )}
      </ScrollView>
    </Screen>
  )
}

export default Tos
