import {getTokens, Stack, Text, XStack} from 'tamagui'
import BannerBackButton from './BannerBackButton'
import SvgImage from '../../Image'
import anonymousAvatarSvg from '../../images/anonymousAvatarSvg'
import FeedbackBannerContent from './FeedbackBannerContent'
import eyeSvg from '../../images/eyeSvg'
import {type PrimitiveAtom} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import BannerCloseButton from './BannerCloseButton'

interface Props {
  feedbackDoneAtom: PrimitiveAtom<boolean>
}
function FeedbackBanner({feedbackDoneAtom}: Props): JSX.Element {
  const {t} = useTranslation()

  return (
    <Stack
      pos={'relative'}
      p={'$4'}
      br={'$4'}
      bc={'$blackAccent1'}
      mb={'$8'}
      space={'$4'}
    >
      <XStack ai={'flex-start'} jc={'space-between'}>
        <BannerBackButton />
        <SvgImage source={anonymousAvatarSvg} />
        <BannerCloseButton feedbackDoneAtom={feedbackDoneAtom} />
      </XStack>
      <FeedbackBannerContent feedbackDoneAtom={feedbackDoneAtom} />
      <XStack ai={'center'} jc={'center'}>
        <SvgImage stroke={getTokens().color.greyOnWhite.val} source={eyeSvg} />
        <Text fos={14} ff={'$body400'} ml={'$2'} col={'$greyOnWhite'}>
          {t('messages.yourAnswerIsAnonymous')}
        </Text>
      </XStack>
    </Stack>
  )
}

export default FeedbackBanner
