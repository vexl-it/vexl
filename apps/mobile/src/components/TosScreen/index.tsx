import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'
import {useNavigation} from '@react-navigation/native'
import FaqsRedirect from './components/FaqsRedirect'
import Tabs, {type TabType} from './components/Tabs'
import {useEffect, useRef, useState} from 'react'
import {ScrollView} from 'react-native'
import Markdown from '../Markdown'
import {Stack} from 'tamagui'

function Tos(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeTab, setActiveTab] = useState<TabType>('termsOfUse')

  const onFaqsPress = (): void => {
    navigation.navigate('Faqs')
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({x: 0, y: 0, animated: false})
    }
  }, [activeTab])

  return (
    <Screen customHorizontalPadding={16}>
      <ScreenTitle
        onClosePress={navigation.goBack}
        text={t('termsOfUse.termsOfUse')}
        variant="dark"
      />
      <FaqsRedirect onPress={onFaqsPress} />
      <Stack h={16} />
      <Tabs activeTab={activeTab} onTabPress={setActiveTab} />
      <Stack h={4} />
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
