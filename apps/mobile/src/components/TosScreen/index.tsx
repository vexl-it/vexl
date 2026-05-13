import {
  Button,
  FilterTag,
  InfoCircle,
  NavButton,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtom} from 'jotai'
import React, {useEffect, useRef, useState} from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import MarkdownDisplay from 'react-native-markdown-display'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import {showTosSummaryForAlreadyLoggedInUserAtom} from '../../utils/preferences'
import useSafeGoBack from '../../utils/useSafeGoBack'
import FaqsRedirect from './components/FaqsRedirect'
import useContent, {type TabType} from './useContent'

const TOS_LINK = 'https://vexl.it/terms-privacy'

type Props = RootStackScreenProps<'TermsAndConditions'>

interface NoticeProps {
  readonly actionButtonText?: string
  readonly children: React.ReactNode
  readonly onActionPress?: () => void
  readonly onClose?: () => void
  readonly variant?: 'default' | 'yellow'
}

function Notice({
  actionButtonText,
  children,
  onActionPress,
  onClose,
  variant = 'default',
}: NoticeProps): React.ReactElement {
  const theme = useTheme()
  const backgroundColor =
    variant === 'yellow' ? '$accentYellowSecondary' : '$backgroundSecondary'
  const foregroundColor =
    variant === 'yellow'
      ? theme.accentHighlightPrimary.get()
      : theme.foregroundSecondary.get()
  const textColor =
    variant === 'yellow' ? '$accentHighlightPrimary' : '$foregroundSecondary'

  return (
    <YStack backgroundColor={backgroundColor} borderRadius="$4" gap="$4" p="$4">
      <XStack alignItems="center" gap="$4">
        <InfoCircle color={foregroundColor} size={18} />
        <YStack flex={1} gap="$1">
          {typeof children === 'string' ? (
            <Typography color={textColor} variant="description">
              {children}
            </Typography>
          ) : (
            children
          )}
        </YStack>
        {onClose ? (
          <NavButton
            icon={XmarkCancelClose}
            onPress={onClose}
            variant="normal"
            width="$7"
            height="$7"
          />
        ) : null}
      </XStack>
      {onActionPress && actionButtonText ? (
        <Button onPress={onActionPress} size="medium" variant="secondary">
          {actionButtonText}
        </Button>
      ) : null}
    </YStack>
  )
}

function Markdown({children}: {readonly children: string}): React.ReactElement {
  const theme = useTheme()

  return (
    <MarkdownDisplay
      style={{
        body: {
          color: theme.foregroundSecondary.get(),
          fontFamily: 'TTSatoshi500',
          fontSize: 16,
          lineHeight: 22,
        },
        heading2: {
          color: theme.foregroundPrimary.get(),
          fontFamily: 'TTSatoshi600',
          fontSize: 20,
          lineHeight: 28,
          marginTop: 40,
        },
        heading3: {
          color: theme.foregroundPrimary.get(),
          fontFamily: 'TTSatoshi600',
          fontSize: 18,
          lineHeight: 24,
        },
        strong: {
          color: theme.foregroundPrimary.get(),
          fontFamily: 'TTSatoshi600',
          fontSize: 16,
        },
      }}
    >
      {children}
    </MarkdownDisplay>
  )
}

function TosScreen({route: {params}, navigation}: Props): React.ReactElement {
  const {t, isEnglish} = useTranslation()
  const content = useContent()
  const safeGoBack = useSafeGoBack()
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeTab, setActiveTab] = useState<TabType>(
    params?.activeTab ?? 'termsOfUse'
  )
  const [
    showTosSummaryForAlreadyLoggedInUser,
    setShowTosSummaryForAlreadyLoggedInUser,
  ] = useAtom(showTosSummaryForAlreadyLoggedInUserAtom)

  const onFaqsPress = (): void => {
    navigation.navigate('Faqs')
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({x: 0, y: 0, animated: false})
    }
  }, [activeTab])

  useEffect(() => {
    return () => {
      setShowTosSummaryForAlreadyLoggedInUser(false)
    }
  }, [setShowTosSummaryForAlreadyLoggedInUser])

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('termsOfUse.termsOfUse')}
          rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
        />
      }
    >
      <FaqsRedirect onPress={onFaqsPress} />
      <Stack height="$5" />
      <XStack alignItems="flex-start" flexWrap="wrap" gap="$2">
        {content.map((one) => (
          <FilterTag
            key={one.type}
            label={one.title}
            onPress={() => {
              setActiveTab(one.type)
            }}
            selected={activeTab === one.type}
          />
        ))}
      </XStack>
      <Stack height="$5" />
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        {!isEnglish() && (
          <Notice
            actionButtonText={t('common.continue')}
            onActionPress={openUrl(TOS_LINK)}
          >
            {t('termsOfUse.cautiousNoticeAboutMachineTranslation')}
          </Notice>
        )}
        {activeTab === 'termsOfUse' ? (
          <Markdown>{t('termsOfUseMD')}</Markdown>
        ) : activeTab === 'privacyPolicy' ? (
          <Stack mt={showTosSummaryForAlreadyLoggedInUser ? '$4' : '$0'}>
            {!!showTosSummaryForAlreadyLoggedInUser && (
              <Notice
                variant="yellow"
                onClose={() => {
                  setShowTosSummaryForAlreadyLoggedInUser(false)
                }}
              >
                <YStack gap="$1">
                  <Typography
                    color="$accentHighlightPrimary"
                    variant="paragraphDemibold"
                  >
                    {t('privacyPolicy.whatsNew')}
                  </Typography>
                  <Typography
                    color="$accentHighlightPrimary"
                    variant="description"
                  >
                    {t('privacyPolicy.analyticsAdded')}
                  </Typography>
                  <Typography
                    color="$accentHighlightPrimary"
                    variant="description"
                  >
                    {t('privacyPolicy.consentOfFutureCahngesRemoved')}
                  </Typography>
                </YStack>
              </Notice>
            )}
            <Markdown>{t('privacyPolicyMD')}</Markdown>
          </Stack>
        ) : (
          <Markdown>{t('childAbusePrevention')}</Markdown>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
})

export default TosScreen
