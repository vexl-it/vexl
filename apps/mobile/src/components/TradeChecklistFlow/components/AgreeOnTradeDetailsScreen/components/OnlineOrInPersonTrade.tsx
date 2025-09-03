import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text} from 'tamagui'
import * as fromChatAtoms from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../utils/openUrl'
import {goldenAvatarTypeAtom} from '../../../../../utils/preferences'
import Image from '../../../../Image'
import Info from '../../../../Info'
import anonymousAvatarHappyGoldenGlassesNoBackgroundSvg from '../../../../images/anonymousAvatarHappyGoldenGlassesNoBackgroundSvg'
import anonymousAvatarHappyNoBackgroundSvg from '../../../../images/anonymousAvatarHappyNoBackgroundSvg'
import AnonymizationNotice from '../../AnonymizationNotice'
import CalculateAmountCell from './CalculateAmountCell'
import DateAndTimeCell from './DateAndTimeCell'
import MeetingLocationCell from './MeetingLocationCell'
import RevealIdentityCell from './RevealIdentityCell'
import RevealPhoneNumberCell from './RevealPhoneNumberCell'
import SetNetworkCell from './SetNetworkCell'
import TradeRule from './TradeRule'

function OnlineOrInPersonTrade(): React.ReactElement {
  const {t} = useTranslation()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const goldenAvatarType = useAtomValue(goldenAvatarTypeAtom)
  const anonymousAvatar =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? anonymousAvatarHappyGoldenGlassesNoBackgroundSvg
      : anonymousAvatarHappyNoBackgroundSvg

  return (
    <>
      <Stack gap="$3">
        <Stack als="center">
          <Image height={90} width={90} source={anonymousAvatar} />
        </Stack>
        <Text textAlign="center" ff="$heading" fos={18}>
          {t('tradeChecklist.agreeOnTradeDetails')}
        </Text>
        <Text als="center" fos={14} ff="$body400" ml="$2" col="$greyOnWhite">
          {t('tradeChecklist.youCanPickWhatYouFill')}
        </Text>
        {!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
          'IN_PERSON'
        ) ? (
          <>
            <Stack mb="$4">
              <CalculateAmountCell />
            </Stack>
            <Info
              actionButtonText={t('tradeChecklist.readMoreInFullArticle')}
              hideCloseButton
              text={t('tradeChecklist.thisDealIsFullyOnline')}
              onActionPress={() => {
                openUrl(t('tradeChecklist.vexlBlogUrl'))()
              }}
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
          <Stack my="$4" gap="$2">
            <DateAndTimeCell />
            <MeetingLocationCell />
            <CalculateAmountCell />
            <SetNetworkCell />
            <RevealIdentityCell />
            <RevealPhoneNumberCell />
          </Stack>
        )}
      </Stack>
      <AnonymizationNotice />
    </>
  )
}

export default OnlineOrInPersonTrade
