import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import * as fromChatAtoms from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../utils/openUrl'
import Image from '../../../../Image'
import Info from '../../../../Info'
import anonymousAvatarHappyNoBackgroundSvg from '../../../../images/anonymousAvatarHappyNoBackgroundSvg'
import AnonymizationNotice from '../../AnonymizationNotice'
import CalculateAmountCell from './CalculateAmountCell'
import DateAndTimeCell from './DateAndTimeCell'
import MeetingLocationCell from './MeetingLocationCell'
import RevealIdentityCell from './RevealIdentityCell'
import RevealPhoneNumberCell from './RevealPhoneNumberCell'
import SetNetworkCell from './SetNetworkCell'
import TradeRule from './TradeRule'

const VEXL_BLOG_URL =
  'https://blog.vexl.it/how-to-do-peer-to-peer-trading-on-vexl-6745f3954ae9'

function openVexlBlog(): void {
  openUrl(VEXL_BLOG_URL)()
}

function OnlineOrInPersonTrade(): JSX.Element {
  const {t} = useTranslation()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)

  return (
    <>
      <Stack space="$3">
        <Stack als="center">
          <Image
            height={120}
            width={120}
            source={anonymousAvatarHappyNoBackgroundSvg}
          />
        </Stack>
        <Text textAlign="center" ff="$heading" fos={32}>
          {t('tradeChecklist.agreeOnTradeDetails')}
        </Text>
        {offerForTradeChecklist?.offerInfo.publicPart.locationState ===
        'ONLINE' ? (
          <>
            <Info
              actionButtonText={t('tradeChecklist.readMoreInFullArticle')}
              hideCloseButton
              text={t('tradeChecklist.thisDealIsFullyOnline')}
              onActionPress={openVexlBlog}
              variant="yellow"
            />
            <Stack my="$4" gap="$2">
              <TradeRule
                ruleNumber={1}
                title={t('tradeChecklist.tradeOnlyWithPeopleYouKnow')}
              />
              <TradeRule
                ruleNumber={2}
                title={t('tradeChecklist.alwaysMoneyBeforeBtc')}
              />
              <TradeRule
                ruleNumber={3}
                title={t('tradeChecklist.watchOutForSuspiciousBehaviour')}
              />
            </Stack>
          </>
        ) : (
          <>
            <Text
              als="center"
              fos={14}
              ff="$body400"
              ml="$2"
              col="$greyOnWhite"
            >
              {t('tradeChecklist.youCanPickWhatYouFill')}
            </Text>
            <Stack my="$8" gap="$2">
              <DateAndTimeCell />
              <MeetingLocationCell />
              <CalculateAmountCell />
              <SetNetworkCell />
              <RevealIdentityCell />
              <RevealPhoneNumberCell />
            </Stack>
          </>
        )}
      </Stack>
      <AnonymizationNotice />
    </>
  )
}

export default OnlineOrInPersonTrade
