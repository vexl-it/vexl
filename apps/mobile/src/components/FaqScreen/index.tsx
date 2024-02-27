import {useState} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import openUrl from '../../utils/openUrl'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import SvgImage from '../Image'
import {HeaderProxy} from '../PageWithButtonAndProgressHeader'
import ProgressJourney from '../ProgressJourney'
import Screen from '../Screen'
import closeSvg from '../images/closeSvg'
import useContent from './useContent'

type Props = RootStackScreenProps<'Faqs'>

function FaqsScreen({navigation}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useContent()
  const [page, setPage] = useState<number>(0)

  const pageContent = content[page]

  return (
    <Screen>
      <HeaderProxy hidden showBackButton={true} progressNumber={1} />
      <ProgressJourney
        currentPage={page}
        numberOfPages={content.length}
        onPageChange={setPage}
        onFinish={safeGoBack}
        onSkip={safeGoBack}
        withBackButton
      >
        {!pageContent ? (
          <></>
        ) : (
          <>
            <XStack ai="center" jc="space-between">
              <Text col="$black" ff="$body600">
                {t('faqs.faqs')}
              </Text>
              <IconButton
                variant="light"
                icon={closeSvg}
                onPress={safeGoBack}
              />
            </XStack>
            <Stack f={1} ai="center" jc="center" w="100%" h="100%">
              {!!pageContent && (
                <SvgImage
                  height={pageContent.height ?? '100%'}
                  width={pageContent.width ?? '100%'}
                  source={pageContent.svg}
                />
              )}
            </Stack>
            <Text fos={24} ff="$heading" col="$black" mb="$2">
              {pageContent?.title}
            </Text>
            {pageContent.withLink ? (
              <TouchableWithoutFeedback
                onPress={openUrl(pageContent?.url ?? '')}
              >
                <Text ff="$body500" col="$greyOnWhite">
                  <>
                    {pageContent?.textBefore}{' '}
                    <Text
                      textDecorationLine="underline"
                      ff="$body700"
                      col="$greyOnWhite"
                    >
                      {pageContent?.linkText}
                    </Text>{' '}
                    {pageContent?.textAfter}
                  </>
                </Text>
              </TouchableWithoutFeedback>
            ) : (
              <Text ff="$body500" col="$greyOnWhite">
                {pageContent?.text}
              </Text>
            )}
            {pageContent?.type === 'HOW_CAN_YOU_ENSURE' && (
              <TouchableWithoutFeedback
                onPress={() => {
                  navigation.navigate('TermsAndConditions')
                }}
              >
                <Text
                  mt="$2"
                  textDecorationLine="underline"
                  ff="$body700"
                  col="$greyOnWhite"
                >
                  {t('faqs.howCanYouEnsureTosAndPP')}
                </Text>
              </TouchableWithoutFeedback>
            )}
          </>
        )}
      </ProgressJourney>
    </Screen>
  )
}

export default FaqsScreen
