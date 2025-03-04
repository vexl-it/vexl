import {useEffect, useRef, useState} from 'react'
import {ScrollView} from 'react-native'
import {Stack, XStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import Button from '../Button'
import Info from '../Info'
import Markdown from '../Markdown'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import FaqsRedirect from './components/FaqsRedirect'
import useContent, {type TabType} from './useContent'

const TOS_LINK = 'https://vexl.it/terms-privacy'

type Props = RootStackScreenProps<'TermsAndConditions'>

function TosScreen({navigation}: Props): JSX.Element {
  const {t, isEnglish} = useTranslation()
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
      <ScreenTitle text={t('termsOfUse.termsOfUse')} withBackButton />
      <FaqsRedirect onPress={onFaqsPress} />
      <Stack h={16} />
      <XStack flexWrap="wrap" alignItems="flex-start" gap="$2">
        {content.map((one) => (
          <Button
            key={one.type}
            onPress={() => {
              setActiveTab(one.type)
            }}
            variant={activeTab !== one.type ? 'blackOnDark' : 'secondary'}
            size="small"
            text={one.title}
          ></Button>
        ))}
      </XStack>
      <Stack h={16} />
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
      >
        {!isEnglish() && (
          <Info
            hideCloseButton
            actionButtonText={t('common.continue')}
            text={t('termsOfUse.cautiousNoticeAboutMachineTranslation')}
            onActionPress={openUrl(TOS_LINK)}
          />
        )}
        {activeTab === 'termsOfUse' ? (
          <Markdown>{t('termsOfUseMD')}</Markdown>
        ) : activeTab === 'privacyPolicy' ? (
          <Markdown>{t('privacyPolicyMD')}</Markdown>
        ) : (
          <Markdown>{t('childAbusePrevention')}</Markdown>
        )}
      </ScrollView>
    </Screen>
  )
}

export default TosScreen
