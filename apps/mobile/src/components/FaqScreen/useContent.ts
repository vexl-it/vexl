import {useTranslation} from '../../utils/localization/I18nProvider'
import faq1Svg from './images/faq1Svg'
import anonymousCounterpartSvg from '../images/anonymousCounterpartSvg'
import stayAnonymousSvg from '../images/stayAnonymousSvg'
import faq5Svg from './images/faq5Svg'
import faq6Svg from './images/faq6Svg'
import anonymizationNoticeSvg from '../../images/anonymizationNoticeSvg'
import notificationsSvg from '../../images/notificationsSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'

interface Props {
  svg: SvgString
  title: string
  text: string
  width?: string
  height?: string
}
export default function useContent(): Props[] {
  const {t} = useTranslation()

  return [
    {
      svg: faq1Svg,
      title: t('faqs.whatIsVexl'),
      text: t('faqs.vexlIsPlatform'),
    },
    {
      svg: anonymizationNoticeSvg,
      title: t('faqs.whoCanSeeMyContacts'),
      text: t('faqs.peopleWhomYouAllowToSee'),
    },
    {
      svg: stayAnonymousSvg,
      title: t('faqs.howCanIRemainAnonymous'),
      text: t('faqs.byDefaultYouParticipateInTheNetwork'),
    },
    {
      svg: anonymousCounterpartSvg,
      title: t('faqs.howCanIMakeSure'),
      text: t('faqs.oneChallenge'),
    },
    {
      svg: faq5Svg,
      title: t('faqs.howCanIEnsure'),
      text: t('faqs.vexlIsOpensource'),
    },
    {
      svg: faq6Svg,
      title: t('faqs.howCanYouEnsure'),
      text: t('faqs.vexlIsDesigned'),
    },
    {
      svg: notificationsSvg,
      title: t('faqs.howDoIContactVexl'),
      text: t('faqs.youCanAlwaysReachOutToUs'),
      width: '70%',
      height: '70%',
    },
  ]
}
