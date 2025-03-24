import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useAtomValue} from 'jotai'
import anonymizationNoticeSvg from '../../images/anonymizationNoticeSvg'
import noRatingsSvg from '../../images/noRatingsSvg'
import notificationsSvg from '../../images/notificationsSvg'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {showClubsFlowAtom} from '../../utils/preferences'
import anonymousCounterpartSvg from '../images/anonymousCounterpartSvg'
import stayAnonymousSvg from '../images/stayAnonymousSvg'
import vexlClubsSvg from '../images/vexlClubsSvg'
import faq1Svg from './images/faq1Svg'
import faq5Svg from './images/faq5Svg'
import faq6Svg from './images/faq6Svg'

export type FaqType =
  | 'WHAT_IS_VEXL'
  | 'WHO_CAN_SEE_MY_CONTACTS'
  | 'HOW_CAN_I_REMAIN_ANONYMOUS'
  | 'HOW_CAN_I_MAKE_SURE'
  | 'HOW_CAN_I_ENSURE'
  | 'HOW_CAN_YOU_ENSURE'
  | 'WHAT_ARE_VEXL_CLUBS'
  | 'HOW_DO_I_CONTACT_VEXL'
  | 'WHY_NO_RATING'

interface CommonProps {
  type: FaqType
  svg: SvgString
  title: string
  width?: string
  height?: string
}

type ConditionalProps =
  | {
      withLink?: false
      text: string
    }
  | {
      withLink: true
      textBefore: string
      textAfter: string
      linkText: string
      url: string
    }

type Props = ConditionalProps & CommonProps

export default function useContent(): Props[] {
  const {t} = useTranslation()
  const showClubsFlow = useAtomValue(showClubsFlowAtom)

  return [
    {
      type: 'WHAT_IS_VEXL',
      svg: faq1Svg,
      title: t('faqs.whatIsVexl'),
      text: t('faqs.vexlIsPlatform'),
    },
    {
      type: 'WHO_CAN_SEE_MY_CONTACTS',
      svg: anonymizationNoticeSvg,
      title: t('faqs.whoCanSeeMyContacts'),
      text: t('faqs.peopleWhomYouAllowToSee'),
    },
    {
      type: 'HOW_CAN_I_REMAIN_ANONYMOUS',
      svg: stayAnonymousSvg,
      title: t('faqs.howCanIRemainAnonymous'),
      text: t('faqs.byDefaultYouParticipateInTheNetwork'),
    },
    {
      type: 'HOW_CAN_I_MAKE_SURE',
      svg: anonymousCounterpartSvg,
      title: t('faqs.howCanIMakeSure'),
      text: t('faqs.oneChallenge'),
    },
    {
      type: 'HOW_CAN_I_ENSURE',
      svg: faq5Svg,
      title: t('faqs.howCanIEnsure'),
      withLink: true,
      textBefore: t('faqs.vexlIsOpensourceTextBeforeLink'),
      textAfter: t('faqs.vexlIsOpensourceTextAfterLink'),
      linkText: t('faqs.vexlIsOpensourceLinkText'),
      url: t('faqs.auditUrl'),
    },
    {
      type: 'HOW_CAN_YOU_ENSURE',
      svg: faq6Svg,
      title: t('faqs.howCanYouEnsure'),
      text: t('faqs.vexlIsDesigned'),
    },
    ...(showClubsFlow
      ? ([
          {
            type: 'WHAT_ARE_VEXL_CLUBS',
            svg: vexlClubsSvg,
            title: t('faqs.whatAreVexlClubsAndWhyShouldIJoin'),
            text: t('faqs.clubsConnectYouWithBroaderNetwork'),
          },
        ] as Props[])
      : []),
    {
      type: 'HOW_DO_I_CONTACT_VEXL',
      svg: notificationsSvg,
      title: t('faqs.howDoIContactVexl'),
      text: t('faqs.youCanAlwaysReachOutToUs'),
      width: '70%',
      height: '70%',
    },
    {
      type: 'WHY_NO_RATING',
      svg: noRatingsSvg,
      title: t('faqs.whyNoRatingTitle'),
      textBefore: t('faqs.whyNoRatingText'),
      textAfter: '',
      linkText: t('faqs.ratingUrlText'),
      withLink: true,
      url: t('faqs.ratingUrlLink'),
      width: '90%',
      height: '90%',
    },
  ]
}
