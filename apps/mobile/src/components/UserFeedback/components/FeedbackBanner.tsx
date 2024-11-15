import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import SvgImage from '../../Image'
import eyeSvg from '../../images/eyeSvg'
import {feedbackMolecule} from '../atoms'
import BannerBackButton from './BannerBackButton'
import BannerCloseButton from './BannerCloseButton'
import FeedbackAvatar from './FeedbackAvatar'
import FeedbackBannerContent from './FeedbackBannerContent'

interface Props {
  autoCloseWhenFinished?: boolean
  hideCloseButton?: boolean
}
function FeedbackBanner({
  autoCloseWhenFinished,
  hideCloseButton,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const {chatFeedbackFinishedAtom} = useMolecule(feedbackMolecule)
  const chatFeedbackFinished = useAtomValue(chatFeedbackFinishedAtom)

  if (chatFeedbackFinished) return null

  return (
    <Stack pos="relative" p="$4" br="$4" bc="$blackAccent1" mb="$8" gap="$4">
      <XStack ai="flex-start" jc="space-between">
        <BannerBackButton />
        <FeedbackAvatar />
        <BannerCloseButton hideCloseButton={hideCloseButton} />
      </XStack>
      <FeedbackBannerContent autoCloseWhenFinished={autoCloseWhenFinished} />
      <XStack ai="center" jc="center">
        <SvgImage stroke={getTokens().color.greyOnWhite.val} source={eyeSvg} />
        <Text fos={14} ff="$body400" ml="$2" col="$greyOnWhite">
          {t('messages.yourAnswerIsAnonymous')}
        </Text>
      </XStack>
    </Stack>
  )
}

export default FeedbackBanner
