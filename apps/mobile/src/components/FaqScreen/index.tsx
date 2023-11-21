import {useState} from 'react'
import Screen from '../Screen'
import {HeaderProxy} from '../PageWithButtonAndProgressHeader'
import ProgressJourney from '../ProgressJourney'
import useContent from './useContent'
import SvgImage from '../Image'
import {useTranslation} from '../../utils/localization/I18nProvider'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import {Stack, Text, XStack} from 'tamagui'
import useSafeGoBack from '../../utils/useSafeGoBack'
import openUrl from '../../utils/openUrl'
import {type RootStackScreenProps} from '../../navigationTypes'

type Props = RootStackScreenProps<'Faqs'>

function FaqsScreen({navigation}: Props): JSX.Element {
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
        <XStack ai="center" jc="space-between">
          <Text col="$black" ff="$body600">
            {t('faqs.faqs')}
          </Text>
          <IconButton variant="light" icon={closeSvg} onPress={safeGoBack} />
        </XStack>
        <Stack f={1} ai="center" jc="center" w="100%" h="100%">
          {pageContent && (
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
        {content[page]?.withLink ? (
          <Text
            ff={'$body500'}
            col={'$greyOnWhite'}
            onPress={openUrl(content[page]?.url ?? '')}
          >
            <>
              {content[page]?.textBefore}{' '}
              <Text
                textDecorationLine={'underline'}
                ff={'$body700'}
                col={'$greyOnWhite'}
              >
                {content[page]?.linkText}
              </Text>{' '}
              {content[page]?.textAfter}
            </>
          </Text>
        ) : (
          <Text ff={'$body500'} col={'$greyOnWhite'}>
            {content[page]?.text}
          </Text>
        )}
        {content[page]?.type === 'HOW_CAN_YOU_ENSURE' && (
          <Text
            mt={'$2'}
            textDecorationLine={'underline'}
            ff={'$body700'}
            col={'$greyOnWhite'}
            onPress={() => {
              navigation.navigate('TermsAndConditions')
            }}
          >
            {t('faqs.howCanYouEnsureTosAndPP')}
          </Text>
        )}
      </ProgressJourney>
    </Screen>
  )
}

export default FaqsScreen
