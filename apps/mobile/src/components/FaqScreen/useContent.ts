import {
  FaqAnonymizationNotice,
  FaqAnonymousCounterpart,
  FaqDesigned,
  FaqNoRatings,
  FaqNotifications,
  FaqOpenSource,
  FaqStayAnonymous,
  FaqWhatIsVexl,
} from '@vexl-next/ui'
import type React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'

export type FaqType =
  | 'WHAT_IS_VEXL'
  | 'WHO_CAN_SEE_MY_CONTACTS'
  | 'HOW_CAN_I_REMAIN_ANONYMOUS'
  | 'HOW_CAN_I_MAKE_SURE'
  | 'HOW_CAN_I_ENSURE'
  | 'HOW_CAN_YOU_ENSURE'
  | 'WHAT_ARE_VEXL_CLUBS'
  | 'HOW_DO_I_CONTACT_VEXL'

export interface FaqGraphicProps {
  readonly animate?: boolean
  readonly height?: number
  readonly variant?: 'dark' | 'light'
  readonly width?: number
}

export interface FaqContent {
  readonly type: FaqType
  readonly graphic: React.ComponentType<FaqGraphicProps>
  readonly title: string
  readonly text: string
}

export default function useContent(): readonly FaqContent[] {
  const {t} = useTranslation()

  return [
    {
      type: 'WHAT_IS_VEXL',
      graphic: FaqWhatIsVexl,
      title: t('faqs.whatIsVexl'),
      text: t('faqs.vexlIsPlatform'),
    },
    {
      type: 'WHO_CAN_SEE_MY_CONTACTS',
      graphic: FaqAnonymizationNotice,
      title: t('faqs.whoCanSeeMyContacts'),
      text: t('faqs.peopleWhomYouAllowToSee'),
    },
    {
      type: 'HOW_CAN_I_REMAIN_ANONYMOUS',
      graphic: FaqStayAnonymous,
      title: t('faqs.howCanIStayAnonymous'),
      text: t('faqs.byDefaultYouParticipateInTheNetwork'),
    },
    {
      type: 'HOW_CAN_I_MAKE_SURE',
      graphic: FaqAnonymousCounterpart,
      title: t('faqs.howDoIKnowWhoIAmTalkingTo'),
      text: t('faqs.oneChallenge'),
    },
    {
      type: 'HOW_CAN_I_ENSURE',
      graphic: FaqOpenSource,
      title: t('faqs.areMyChatsAndDealsPrivate'),
      text: t('faqs.vexlIsOpensource'),
    },
    {
      type: 'HOW_CAN_YOU_ENSURE',
      graphic: FaqDesigned,
      title: t('faqs.howDoYouProtectMyData'),
      text: t('faqs.vexlIsDesigned'),
    },
    {
      type: 'HOW_DO_I_CONTACT_VEXL',
      graphic: FaqNotifications,
      title: t('faqs.howDoIContactVexl'),
      text: t('faqs.youCanAlwaysReachOutToUs'),
    },
    {
      type: 'WHAT_ARE_VEXL_CLUBS',
      graphic: FaqNoRatings,
      title: t('faqs.whatAreVexlClubsAndWhyShouldIJoin'),
      text: t('faqs.clubsConnectYouWithBroaderNetwork'),
    },
  ]
}
