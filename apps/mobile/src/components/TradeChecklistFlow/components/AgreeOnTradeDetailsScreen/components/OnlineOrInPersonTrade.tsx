import {getTokens, Stack, Text, XStack} from 'tamagui'
import Image from '../../../../Image'
import anonymousAvatarNoBackgroundSvg from '../../../../images/anonymousAvatarNoBackgroundSvg'
import Info from '../../../../Info'
import TradeRule from './TradeRule'
import ChecklistCell from './ChecklistCell'
import eyeSvg from '../../../../images/eyeSvg'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../../../../ChatDetailScreen/atoms'
import {useAtomValue} from 'jotai'
import {type TradeChecklistItem} from '../../../../../state/chat/domain'

const tradeChecklistItems: TradeChecklistItem[] = [
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
]

function OnlineOrInPersonTrade(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const {offerForChatAtom} = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)

  return (
    <Stack f={1} space={'$3'}>
      <Stack als={'center'}>
        <Image
          height={120}
          width={120}
          source={anonymousAvatarNoBackgroundSvg}
        />
      </Stack>
      <Text textAlign={'center'} ff={'$heading'} fos={32}>
        {t('tradeChecklist.agreeOnTradeDetails')}
      </Text>
      {offer?.offerInfo.publicPart.locationState === 'ONLINE' ? (
        <>
          <Info
            actionButtonText={t('tradeChecklist.readMoreInFullArticle')}
            hideCloseButton
            text={t('tradeChecklist.thisDealIsFullyOnline')}
            onActionPress={() => {}}
            variant={'yellow'}
          />
          <Stack my={'$4'} gap={'$2'}>
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
            als={'center'}
            fos={14}
            ff={'$body400'}
            ml={'$2'}
            col={'$greyOnWhite'}
          >
            {t('tradeChecklist.youCanPickWhatYouFill')}
          </Text>
          <Stack my={'$8'} gap={'$2'}>
            {tradeChecklistItems.map((item) => (
              <ChecklistCell
                key={item}
                itemStatus={'unknown'}
                title={t(`tradeChecklist.options.${item}`)}
                subtitle={
                  item === 'REVEAL_IDENTITY'
                    ? t('tradeChecklist.shareRecognitionSignInChat')
                    : undefined
                }
              />
            ))}
          </Stack>
        </>
      )}
      <XStack ai={'center'} jc={'center'}>
        <Image stroke={getTokens().color.greyOnWhite.val} source={eyeSvg} />
        <Text fos={14} ff={'$body400'} ml={'$2'} col={'$greyOnWhite'}>
          {t('tradeChecklist.notVisibleToAnyoneNotice')}
        </Text>
      </XStack>
      <Button
        fullWidth
        size={'medium'}
        onPress={goBack}
        variant={'secondary'}
        text={
          offer?.offerInfo.publicPart.locationState === 'ONLINE'
            ? t('tradeChecklist.acknowledgeAndContinue')
            : t('tradeChecklist.saveAndContinue')
        }
      />
    </Stack>
  )
}

export default OnlineOrInPersonTrade
