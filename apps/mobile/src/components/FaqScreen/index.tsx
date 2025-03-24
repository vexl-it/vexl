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

function FaqsScreen({navigation, route: {params}}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const content = useContent()
  const pageType = params?.pageType
  const pageIndex = pageType ? content.findIndex((c) => c.type === pageType) : 0
  const [page, setPage] = useState<number>(pageIndex)

  const pageContent = content[page]

  return (
    <Screen>
      <Stack f={1} px="$2" pt="$2">
        <HeaderProxy hidden showBackButton={true} progressNumber={1} />
        <ProgressJourney
          currentPage={page}
          numberOfPages={content.length}
          onPageChange={setPage}
          // Links do not work otherwise...
          touchableOverlayDisabled
          onFinish={safeGoBack}
          onSkip={safeGoBack}
          withBackButton
        >
          {!pageContent ? (
            <></>
          ) : (
            <>
              <XStack ai="center" jc="space-between">
                {/* this makes the text to be centered on screen */}
                <Stack width={40} />
                <Stack f={1} ai="center" jc="center">
                  <Text fos={18} col="$black" ff="$body600">
                    {t('faqs.faqs')}
                  </Text>
                </Stack>
                <IconButton
                  width={40}
                  height={40}
                  variant="light"
                  icon={closeSvg}
                  onPress={safeGoBack}
                />
              </XStack>
              <Stack f={1} ai="center" jc="center" w="100%" h="100%">
                <Stack
                  f={1}
                  w="100%"
                  h="100%"
                  maxHeight={300}
                  ai="center"
                  jc="center"
                >
                  {!!pageContent && (
                    <SvgImage
                      height={pageContent.height ?? '100%'}
                      width={pageContent.width ?? '100%'}
                      source={pageContent.svg}
                    />
                  )}
                </Stack>
              </Stack>
              <Text fos={24} ff="$heading" col="$black" mb="$2">
                {pageContent?.title}
              </Text>
              {pageContent.withLink ? (
                <TouchableWithoutFeedback
                  onPress={openUrl(pageContent?.url ?? '')}
                >
                  <Text fos={16} ff="$body500" col="$greyOnWhite">
                    <>
                      {pageContent?.textBefore}{' '}
                      <Text
                        fos={16}
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
                <Text fos={16} ff="$body500" col="$greyOnWhite">
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
      </Stack>
    </Screen>
  )
}

export default FaqsScreen
