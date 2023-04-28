import ScreenTitle from '../ScreenTitle'
import {useTranslation} from '../../utils/localization/I18nProvider'
import Screen from '../Screen'
import FaqsRedirect from './components/FaqsRedirect'
import Tabs from '../Tabs'
import {useEffect, useRef, useState} from 'react'
import {ScrollView} from 'react-native'
import Markdown from '../Markdown'
import {Stack} from 'tamagui'
import useContent, {type TabType} from './useContent'
import closeSvg from '../images/closeSvg'
import IconButton from '../IconButton'
import {type RootStackScreenProps} from '../../navigationTypes'

type Props = RootStackScreenProps<'TermsAndConditions'>

function TosScreen({navigation}: Props): JSX.Element {
  const {t} = useTranslation()
  const content = useContent()
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
      <ScreenTitle text={t('termsOfUse.termsOfUse')}>
        <IconButton
          variant="dark"
          icon={closeSvg}
          onPress={navigation.goBack}
        />
      </ScreenTitle>
      <FaqsRedirect onPress={onFaqsPress} />
      <Stack h={16} />
      <Tabs activeTab={activeTab} tabs={content} onTabPress={setActiveTab} />
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

export default TosScreen
